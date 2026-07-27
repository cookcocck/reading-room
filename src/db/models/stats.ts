import { getDb } from '../connection';
import type {
  Summary, OverallKV, HeatmapEntry, ReadingTrend,
  YearlyIntensity, Milestone, HomepageStats,
  DeepThinkingItem, BookTimelineItem,
} from '../../types';

// ─── Summary ───

export function getSummary(): Summary {
  const d = getDb()!;
  const row = d.prepare('SELECT * FROM summary WHERE id = 1').get();
  if (!row) return { totalBooks: 0, finishedCount: 0, totalNoteCount: 0, notebookBooksCount: 0, categories: [], topAuthors: [], archives: [] };

  // Normalize: handle both old (string array) and new ({name} object) formats
  let categories: Array<{ name: string; count?: number }> = [];
  try {
    const raw = JSON.parse((row.categories as string) || '[]');
    if (raw.length > 0 && typeof raw[0] === 'string') {
      categories = (raw as string[]).map(name => ({ name }));
    } else {
      categories = raw as Array<{ name: string; count?: number }>;
    }
  } catch { /* ignore */ }

  let archives: Array<{ name: string; count: number }> = [];
  try {
    const raw = JSON.parse((row.archives as string) || '[]');
    if (raw.length > 0 && typeof raw[0] === 'object' && !('name' in raw[0])) {
      archives = (raw as Array<Record<string, unknown>>).map(a => ({
        name: (a.title as string) || (a.name as string) || '未知',
        count: (a.notes as number) ?? (a.count as number) ?? 0,
      }));
    } else {
      archives = raw as Array<{ name: string; count: number }>;
    }
  } catch { /* ignore */ }

  return {
    totalBooks: row.total_books as number,
    finishedCount: row.finished_count as number,
    totalNoteCount: row.total_note_count as number,
    notebookBooksCount: row.notebook_books_count as number,
    categories,
    topAuthors: JSON.parse((row.top_authors as string) || '[]'),
    archives,
  };
}

// ─── Overall KV ───

/** Stale threshold: 8 hours (sync runs every 4h, give 2x buffer) */
const KV_STALE_MS = 8 * 3600 * 1000;

export function getOverall(): OverallKV {
  const d = getDb()!;
  const rows = d.prepare(
    "SELECT name, value, fetched_at FROM kv_store WHERE name IN ('overall', 'annual')"
  ).all();

  const result: Record<string, unknown> = {};
  const now = Date.now();

  rows.forEach((r: Record<string, unknown>) => {
    try {
      const parsed = JSON.parse(r.value as string);
      // Check freshness — log warning if stale (but still return data)
      const fetchedAt = (r.fetched_at as number) || 0;
      if (fetchedAt > 0 && now - fetchedAt * 1000 > KV_STALE_MS) {
        const ageH = Math.floor((now - fetchedAt * 1000) / 3600000);
        console.warn(`[kv_store] '${r.name}' is ${ageH}h old (stale threshold: ${KV_STALE_MS / 3600000}h)`);
      }
      result[r.name as string] = parsed;
    } catch { /* invalid JSON — skip */ }
  });
  return result as unknown as OverallKV;
}

// ─── Reading Sessions & Trends ───

export function getHeatmap(): HeatmapEntry[] {
  const d = getDb()!;
  const dateMap = new Map<string, number>();

  // Source 1: reading_sessions
  const sessions = d.prepare('SELECT date, seconds FROM reading_sessions').all();
  sessions.forEach((s: Record<string, unknown>) => {
    dateMap.set(s.date as string, (dateMap.get(s.date as string) || 0) + (s.seconds as number));
  });

  // Source 2: books.last_read_time
  const bookTimes = d.prepare(
    'SELECT last_read_time, read_time FROM books WHERE last_read_time > 0'
  ).all();
  bookTimes.forEach((row: Record<string, unknown>) => {
    const dt = new Date((row.last_read_time as number) * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const ds = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
    if (!dateMap.has(ds)) {
      dateMap.set(ds, (dateMap.get(ds) || 0) + Math.max(Math.round((row.read_time as number) / 30), 60));
    }
  });

  const result: HeatmapEntry[] = [];
  dateMap.forEach((seconds: number, date: string) => {
    result.push({ date, seconds });
  });
  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

export function getTrends(): ReadingTrend[] {
  const d = getDb()!;
  return d.prepare(
    'SELECT year, month, total_seconds AS totalSeconds, read_days AS readDays FROM reading_trends ORDER BY year, month'
  ).all() as unknown as ReadingTrend[];
}

export function getWeekdayDistribution(): number[] {
  const d = getDb()!;
  const counts = [0, 0, 0, 0, 0, 0, 0];

  const sessions = d.prepare('SELECT date, seconds FROM reading_sessions').all();
  const sessionData = sessions as Array<{ date: string; seconds: number }>;
  sessionData.forEach((r: { date: string; seconds: number }) => {
    counts[new Date(r.date).getDay()] += r.seconds;
  });

  const bookTimes = d.prepare(
    'SELECT last_read_time, read_time FROM books WHERE last_read_time > 0'
  ).all();
  const btData = bookTimes as Array<{ last_read_time: number; read_time: number }>;
  btData.forEach((row: { last_read_time: number; read_time: number }) => {
    const dt = new Date(row.last_read_time * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const ds = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
    const alreadyCovered = sessionData.some(s => s.date === ds);
    if (!alreadyCovered) {
      counts[dt.getDay()] += Math.max(Math.round(row.read_time / 30), 60);
    }
  });

  return counts;
}

export function getReadingStats() {
  const d = getDb()!;
  const row = d.prepare('SELECT COALESCE(SUM(seconds), 0) AS total_sec, COUNT(*) AS days FROM reading_sessions').get();
  return {
    totalReadTimeSec: (row as Record<string, unknown>).total_sec as number,
    readDays: (row as Record<string, unknown>).days as number,
  };
}

// ─── Stats Page Helpers ───

export function getDeepThinking(limit = 10): DeepThinkingItem[] {
  const d = getDb()!;
  return d.prepare(`
    SELECT b.id, b.title, b.author, b.cover, b.category,
      COALESCE(n.note_count, 0) AS noteCount,
      COALESCE(n.review_count, 0) AS reviewCount,
      COALESCE(n.bookmark_count, 0) AS bookmarkCount,
      COALESCE(n.total_notes, 0) AS totalNotes
    FROM books b LEFT JOIN notebooks n ON b.id = n.book_id
    WHERE COALESCE(n.total_notes, 0) > 0
    ORDER BY n.total_notes DESC LIMIT ?
  `).all(limit) as unknown as DeepThinkingItem[];
}

export function getBookTimeline(): BookTimelineItem[] {
  const d = getDb()!;
  return d.prepare(`
    SELECT id, title, author, category, update_time AS addedAt
    FROM books WHERE update_time > 0 ORDER BY update_time
  `).all() as unknown as BookTimelineItem[];
}

export function getYearlyIntensity(): YearlyIntensity[] {
  const d = getDb()!;
  return d.prepare(`
    SELECT year, SUM(total_seconds) AS totalSec, SUM(read_days) AS totalDays
    FROM reading_trends GROUP BY year ORDER BY year
  `).all() as unknown as YearlyIntensity[];
}

export function getMilestones(): Milestone[] {
  const d = getDb()!;
  const milestones: Milestone[] = [];

  // First book
  const fb = d.prepare(
    'SELECT title, author, update_time FROM books WHERE update_time > 0 ORDER BY update_time LIMIT 1'
  ).get();
  if (fb) {
    const fbr = fb as Record<string, unknown>;
    milestones.push({
      label: '阅读起点',
      detail: `收藏《${fbr.title || '?'}》`,
      ts: fbr.update_time as number,
      icon: '📖',
    });
  }

  // Nth book milestones
  const total = (d.prepare('SELECT COUNT(*) AS c FROM books').get() as Record<string, unknown>).c as number;
  [10, 50, 100, 150, 200].forEach(n => {
    if (total < n) return;
    const b = d.prepare(
      'SELECT title, update_time FROM books WHERE update_time > 0 ORDER BY update_time LIMIT 1 OFFSET ?'
    ).get(n - 1);
    if (b) {
      const br = b as Record<string, unknown>;
      milestones.push({
        label: `第 ${n} 本书`,
        detail: `《${br.title}》`,
        ts: br.update_time as number,
        icon: '📚',
      });
    }
  });

  // Cumulative hours
  const sessions = d.prepare('SELECT date, seconds FROM reading_sessions ORDER BY date').all();
  const sessionData = sessions as Array<{ date: string; seconds: number }>;
  [100, 500, 1000, 2000, 3000, 5000].forEach(h => {
    let cum = 0;
    const hit = sessionData.find(s => { cum += s.seconds; return cum >= h * 3600; });
    if (hit) {
      milestones.push({
        label: `累计 ${h} 小时`,
        detail: '阅读时长里程碑',
        ts: Math.floor(new Date(hit.date + 'T00:00:00').getTime() / 1000),
        icon: '⏱️',
      });
    }
  });

  // First highlight
  const fh = d.prepare(`
    SELECT h.mark_text, h.create_time, b.title
    FROM highlights h LEFT JOIN books b ON h.book_id = b.id
    WHERE h.create_time > 0 ORDER BY h.create_time LIMIT 1
  `).get();
  if (fh) {
    const fhr = fh as Record<string, unknown>;
    milestones.push({
      label: '第一条划线',
      detail: `《${fhr.title || '?'}》：${((fhr.mark_text as string) || '').substring(0, 24)}…`,
      ts: fhr.create_time as number,
      icon: '✍️',
    });
  }

  // First review
  const fr = d.prepare(`
    SELECT r.content, r.create_time, b.title
    FROM reviews r LEFT JOIN books b ON r.book_id = b.id
    WHERE r.create_time > 0 ORDER BY r.create_time LIMIT 1
  `).get();
  if (fr) {
    const frr = fr as Record<string, unknown>;
    milestones.push({
      label: '第一条想法',
      detail: `《${frr.title || '?'}》：${((frr.content as string) || '').substring(0, 24)}…`,
      ts: frr.create_time as number,
      icon: '💭',
    });
  }

  // Longest streak
  const dates = [...new Set(sessionData.map(s => s.date))].sort();
  if (dates.length > 0) {
    let maxStreak = 1, curStreak = 1;
    let maxStart = dates[0], maxEnd = dates[0], curStart = dates[0];
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000;
      if (diff === 1) {
        curStreak++;
        if (curStreak > maxStreak) {
          maxStreak = curStreak;
          maxStart = curStart;
          maxEnd = dates[i];
        }
      } else {
        curStreak = 1;
        curStart = dates[i];
      }
    }
    if (maxStreak > 1) {
      milestones.push({
        label: `最长连续 ${maxStreak} 天`,
        detail: `${maxStart} → ${maxEnd}`,
        ts: Math.floor(new Date(maxEnd + 'T00:00:00').getTime() / 1000),
        icon: '🔥',
      });
    }
  }

  milestones.sort((a, b) => a.ts - b.ts);
  return milestones;
}

// ─── Homepage Stats ───

export function getHomepageStats(): HomepageStats {
  const d = getDb()!;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = `${weekAgo.getFullYear()}-${pad(weekAgo.getMonth() + 1)}-${pad(weekAgo.getDate())}`;

  const rc = d.prepare("SELECT COUNT(*) AS c FROM books WHERE finished = 0").get() as Record<string, unknown>;
  const readingCount = rc.c as number;

  const weekAgoTs = Math.floor(new Date(weekAgoStr).getTime() / 1000);
  const nh = d.prepare("SELECT COUNT(*) AS c FROM highlights WHERE create_time >= ?").get(weekAgoTs) as Record<string, unknown>;
  const nr = d.prepare("SELECT COUNT(*) AS c FROM reviews WHERE create_time >= ?").get(weekAgoTs) as Record<string, unknown>;
  const newHighlights = nh.c as number;
  const newReviews = nr.c as number;

  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const combinedDates = new Set<string>();

  const sessions = d.prepare('SELECT date FROM reading_sessions ORDER BY date').all();
  (sessions as Array<{ date: string }>).forEach(s => combinedDates.add(s.date));

  const bookTimes = d.prepare(
    'SELECT last_read_time FROM books WHERE last_read_time > 0'
  ).all();
  (bookTimes as Array<{ last_read_time: number }>).forEach(row => {
    const dt = new Date(row.last_read_time * 1000);
    combinedDates.add(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`);
  });

  const datesArr = [...combinedDates].sort();

  let monthDays = 0;
  datesArr.forEach(d => { if (d >= monthStart) monthDays++; });

  let maxStreak = 0, curStreak = 0;
  for (let i = 1; i < datesArr.length; i++) {
    const diff = (new Date(datesArr[i]).getTime() - new Date(datesArr[i - 1]).getTime()) / 86400000;
    if (diff === 1) curStreak = curStreak > 0 ? curStreak + 1 : 2;
    else { if (curStreak > maxStreak) maxStreak = curStreak; curStreak = 0; }
  }
  if (curStreak > maxStreak) maxStreak = curStreak;

  const dateSet = new Set(datesArr);
  let currentStreak = 0;
  let checkDate = new Date(today);
  while (dateSet.has(`${checkDate.getFullYear()}-${pad(checkDate.getMonth() + 1)}-${pad(checkDate.getDate())}`)) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  if (currentStreak === 0) {
    checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1);
    while (dateSet.has(`${checkDate.getFullYear()}-${pad(checkDate.getMonth() + 1)}-${pad(checkDate.getDate())}`)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  return {
    monthDays,
    readingCount,
    newNotes: newHighlights + newReviews,
    maxStreak,
    currentStreak,
    todayRead: dateSet.has(today),
  };
}
