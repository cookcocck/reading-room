/** db.js — SQLite database interface for Reading Room
 *
 *  Uses sql.js (pure JS / WASM SQLite) — zero native dependencies.
 *  Works on all platforms including servers with old glibc.
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'db', 'reading-room.db');

// ─── Helpers ───

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTimestamp(ts) {
  if (!ts || ts <= 0) return '';
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function heatmapLevel(seconds) {
  if (!seconds || seconds <= 0) return 0;
  if (seconds < 1800) return 1;
  if (seconds < 3600) return 2;
  if (seconds < 7200) return 3;
  if (seconds < 10800) return 4;
  return 5;
}

function upgradeCoverURL(url) {
  if (!url || typeof url !== 'string') return url;
  return url.replace(/\/[st]\d*_/g, '/t7_');
}

function upgradeCovers(obj) {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    obj.forEach(item => upgradeCovers(item));
  } else if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key === 'cover' && typeof obj[key] === 'string') {
        obj[key] = upgradeCoverURL(obj[key]);
      } else if (typeof obj[key] === 'object') {
        upgradeCovers(obj[key]);
      }
    }
  }
  return obj;
}

// ─── sql.js wrapper — mimics better-sqlite3 API ───

/**
 * Wrap a sql.js Database to expose .prepare(sql).all(...) / .get(...) API.
 */
function createWrapper(sqlDb) {
  return {
    prepare(sql) {
      return {
        all(...params) {
          const stmt = sqlDb.prepare(sql);
          try {
            if (params.length > 0) stmt.bind(params);
            const results = [];
            while (stmt.step()) results.push(stmt.getAsObject());
            return results;
          } finally {
            stmt.free();
          }
        },
        get(...params) {
          const stmt = sqlDb.prepare(sql);
          try {
            if (params.length > 0) stmt.bind(params);
            if (stmt.step()) return stmt.getAsObject();
            return undefined;
          } finally {
            stmt.free();
          }
        }
      };
    }
  };
}

// ─── Database connection ───

let db = null;
let sqlDb = null;

async function initDb() {
  if (db) return db;

  if (!fs.existsSync(DB_PATH)) {
    console.error(`[db] WARNING: Database not found at ${DB_PATH}`);
    console.error('[db] Run "python scripts/create_db.py" to create it.');
    return null;
  }

  try {
    const SQL = await initSqlJs();
    const fileBuffer = fs.readFileSync(DB_PATH);
    sqlDb = new SQL.Database(fileBuffer);
    db = createWrapper(sqlDb);

    // ─── Auto-migration: ensure new tables exist ───
    sqlDb.run(`
      CREATE TABLE IF NOT EXISTS reviews (
          review_id TEXT PRIMARY KEY,
          book_id TEXT NOT NULL,
          content TEXT DEFAULT '',
          chapter_name TEXT DEFAULT '',
          star INTEGER DEFAULT -1,
          create_time INTEGER NOT NULL
      )
    `);
    sqlDb.run('CREATE INDEX IF NOT EXISTS idx_reviews_book ON reviews(book_id)');

    // ─── Schema migration: add intro column to books table ───
    try {
      sqlDb.run('ALTER TABLE books ADD COLUMN intro TEXT DEFAULT \'\'');
      console.log('[db] Migration: added books.intro column');
    } catch (e) {
      // Column already exists — ignore
    }

    // ─── Schema migration: add read_time column to books table ───
    try {
      sqlDb.run('ALTER TABLE books ADD COLUMN read_time INTEGER DEFAULT 0');
      console.log('[db] Migration: added books.read_time column');
    } catch (e) {
      // Column already exists — ignore
    }

    // ─── Schema migration: add progress column to books table ───
    try {
      sqlDb.run('ALTER TABLE books ADD COLUMN progress INTEGER DEFAULT 0');
      console.log('[db] Migration: added books.progress column');
    } catch (e) {
      // Column already exists — ignore
    }

    // ─── Schema migration: add last_read_time column to books table ───
    try {
      sqlDb.run('ALTER TABLE books ADD COLUMN last_read_time INTEGER DEFAULT 0');
      console.log('[db] Migration: added books.last_read_time column');
    } catch (e) {
      // Column already exists — ignore
    }

    // ─── Schema migration: add abstract column to reviews table ───
    try {
      sqlDb.run('ALTER TABLE reviews ADD COLUMN abstract TEXT DEFAULT \'\'');
      console.log('[db] Migration: added reviews.abstract column');
    } catch (e) {
      // Column already exists — ignore
    }

    // ─── Schema migration: add want_to_read column to books table ───
    try {
      sqlDb.run('ALTER TABLE books ADD COLUMN want_to_read INTEGER DEFAULT 0');
      console.log('[db] Migration: added books.want_to_read column');
    } catch (e) { /* ignore */ }

    // ─── Schema migration: add user_rating column to books table ───
    try {
      sqlDb.run('ALTER TABLE books ADD COLUMN user_rating INTEGER DEFAULT 0');
      console.log('[db] Migration: added books.user_rating column');
    } catch (e) { /* ignore */ }

    // ─── Schema migration: tags table ───
    sqlDb.run(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#6366f1',
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);
    sqlDb.run(`
      CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT NOT NULL,
        note_type TEXT NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (note_id, note_type, tag_id)
      )
    `);

    console.log(`[db] Connected to reading-room.db (sql.js, ${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB)`);
    return db;
  } catch (err) {
    console.error(`[db] Failed to open database: ${err.message}`);
    return null;
  }
}

function getDb() {
  return db;
}

function closeDb() {
  if (sqlDb) {
    sqlDb.close();
    sqlDb = null;
    db = null;
    console.log('[db] Connection closed');
  }
}

// ─── Query Functions (unchanged API, now backed by sql.js) ───

function getAllBooks(filter, category) {
  const d = getDb();
  let query = `
    SELECT b.*, 
      n.review_count AS reviewCount, n.note_count AS noteCount,
      n.bookmark_count AS bookmarkCount, n.total_notes AS totalNotes
    FROM books b
    LEFT JOIN notebooks n ON b.id = n.book_id
    WHERE 1=1
  `;
  const params = [];

  if (filter === 'finished') {
    query += ' AND b.finished = 1';
  } else if (filter === 'reading') {
    query += ' AND b.finished = 0';
  }

  if (category) {
    query += ' AND b.category = ?';
    params.push(category);
  }

  query += ' ORDER BY b.update_time DESC';
  return d.prepare(query).all(...params);
}

function getBookById(bookId) {
  const d = getDb();
  const book = d.prepare(`
    SELECT b.*, 
      n.review_count AS reviewCount, n.note_count AS noteCount,
      n.bookmark_count AS bookmarkCount, n.total_notes AS totalNotes
    FROM books b
    LEFT JOIN notebooks n ON b.id = n.book_id
    WHERE b.id = ?
  `).get(bookId);

  if (!book) return null;

  return {
    ...book,
    finished: !!book.finished,
    readTime: book.read_time || 0,
    notebook: book.noteCount != null ? {
      reviewCount: book.reviewCount || 0,
      noteCount: book.noteCount || 0,
      bookmarkCount: book.bookmarkCount || 0,
      totalNotes: book.totalNotes || 0,
    } : null,
  };
}

function getNotebooks(page = 1, perPage = 30) {
  const d = getDb();
  const offset = (page - 1) * perPage;

  const total = d.prepare('SELECT COUNT(*) AS count FROM notebooks').get().count;
  const notebooks = d.prepare(`
    SELECT n.*, b.title, b.author, b.cover
    FROM notebooks n
    LEFT JOIN books b ON n.book_id = b.id
    ORDER BY n.sort DESC
    LIMIT ? OFFSET ?
  `).all(perPage, offset);

  return { notebooks, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

function getRecentHighlights(limit = 8) {
  const d = getDb();
  const highlights = d.prepare(`
    SELECT h.*, b.title AS book_title, b.author AS book_author
    FROM highlights h
    LEFT JOIN books b ON h.book_id = b.id
    WHERE h.mark_text IS NOT NULL AND h.mark_text != ''
    ORDER BY RANDOM()
    LIMIT ?
  `).all(limit);

  return highlights.map(h => ({
    ...h,
    bookTitle: h.book_title || '未知',
    bookAuthor: h.book_author || '',
    markText: h.mark_text || h.content || '',
  }));
}

function getAllNotebooks() {
  const d = getDb();
  return d.prepare(`
    SELECT n.*, b.title, b.author, b.cover
    FROM notebooks n
    LEFT JOIN books b ON n.book_id = b.id
    ORDER BY n.sort DESC
  `).all();
}

function getRecentNotes(limit = 30) {
  const d = getDb();
  return d.prepare(`
    SELECT * FROM (
      SELECT
        h.bookmark_id AS id,
        'highlight' AS type,
        h.mark_text AS text,
        h.chapter_title AS chapter,
        h.create_time,
        h.book_id,
        b.title AS book_title,
        b.author AS book_author,
        b.cover AS book_cover
      FROM highlights h
      LEFT JOIN books b ON h.book_id = b.id
      WHERE h.mark_text IS NOT NULL AND h.mark_text != ''

      UNION ALL

      SELECT
        r.review_id AS id,
        'review' AS type,
        r.content AS text,
        r.chapter_name AS chapter,
        r.create_time,
        r.book_id,
        b.title AS book_title,
        b.author AS book_author,
        b.cover AS book_cover
      FROM reviews r
      LEFT JOIN books b ON r.book_id = b.id
      WHERE r.content IS NOT NULL AND r.content != ''
    )
    ORDER BY create_time DESC
    LIMIT ?
  `).all(limit);
}

function getHeatmap() {
  const d = getDb();
  return d.prepare('SELECT date, seconds FROM reading_sessions ORDER BY date').all();
}

function getTrends() {
  const d = getDb();
  return d.prepare('SELECT year, month, total_seconds AS totalSeconds, read_days AS readDays FROM reading_trends ORDER BY year, month').all();
}

function getWeekdayDistribution() {
  const d = getDb();
  const rows = d.prepare("SELECT date, seconds FROM reading_sessions WHERE date >= '2026-01-01'").all();

  const counts = [0, 0, 0, 0, 0, 0, 0];
  rows.forEach(r => {
    const date = new Date(r.date);
    counts[date.getDay()] += r.seconds;
  });
  return counts;
}

function getSummary() {
  const d = getDb();
  const row = d.prepare('SELECT * FROM summary WHERE id = 1').get();
  if (!row) return {};
  return {
    totalBooks: row.total_books,
    finishedCount: row.finished_count,
    totalNoteCount: row.total_note_count,
    notebookBooksCount: row.notebook_books_count,
    categories: JSON.parse(row.categories || '[]'),
    topAuthors: JSON.parse(row.top_authors || '[]'),
    archives: JSON.parse(row.archives || '[]'),
  };
}

function getOverall() {
  const d = getDb();
  const rows = d.prepare("SELECT name, value FROM kv_store WHERE name IN ('overall', 'annual')").all();

  const result = {};
  rows.forEach(r => {
    try { result[r.name] = JSON.parse(r.value); } catch(e) {}
  });
  return result;
}

function getCurrentlyReading(limit = 6) {
  const d = getDb();
  return d.prepare(`
    SELECT b.*, n.total_notes AS totalNotes
    FROM books b
    LEFT JOIN notebooks n ON b.id = n.book_id
    WHERE b.finished = 0 AND n.book_id IS NOT NULL
    ORDER BY b.update_time DESC
    LIMIT ?
  `).all(limit);
}

function getAllCategories() {
  const d = getDb();
  return d.prepare("SELECT DISTINCT category FROM books WHERE category != '' ORDER BY category")
    .all()
    .map(r => r.category);
}

function getReadingStats() {
  const d = getDb();
  const row = d.prepare('SELECT COALESCE(SUM(seconds), 0) AS total_sec, COUNT(*) AS days FROM reading_sessions').get();
  return {
    totalReadTimeSec: row.total_sec,
    readDays: row.days,
  };
}

function getBookReadTimes() {
  const d = getDb();
  const map = {};
  ['overall', 'annual'].forEach(name => {
    const row = d.prepare("SELECT value FROM kv_store WHERE name = ?").get(name);
    if (!row) return;
    try {
      const v = JSON.parse(row.value);
      if (v.topBooks && Array.isArray(v.topBooks)) {
        v.topBooks.forEach(b => {
          if (b.title && b.readTime) {
            map[b.title] = Math.max(map[b.title] || 0, b.readTime);
          }
        });
      }
    } catch (e) {}
  });
  return map;
}

// ─── Book Detail — Monthly Reading Activity ───
function getBookMonthlyActivity(bookId) {
  const d = getDb();

  // Get monthly highlight counts
  const hRows = d.prepare(`
    SELECT
      CAST(strftime('%Y', datetime(create_time, 'unixepoch')) AS INTEGER) AS year,
      CAST(strftime('%m', datetime(create_time, 'unixepoch')) AS INTEGER) AS month,
      COUNT(*) AS cnt
    FROM highlights
    WHERE book_id = ? AND create_time > 0
    GROUP BY year, month
    ORDER BY year DESC, month DESC
  `).all(bookId);

  // Get monthly review counts
  const rRows = d.prepare(`
    SELECT
      CAST(strftime('%Y', datetime(create_time, 'unixepoch')) AS INTEGER) AS year,
      CAST(strftime('%m', datetime(create_time, 'unixepoch')) AS INTEGER) AS month,
      COUNT(*) AS cnt
    FROM reviews
    WHERE book_id = ? AND create_time > 0
    GROUP BY year, month
    ORDER BY year DESC, month DESC
  `).all(bookId);

  // Merge into a map
  const monthMap = new Map();
  hRows.forEach(r => {
    const key = `${r.year}-${String(r.month).padStart(2, '0')}`;
    monthMap.set(key, { year: r.year, month: r.month, highlights: r.cnt, reviews: 0 });
  });
  rRows.forEach(r => {
    const key = `${r.year}-${String(r.month).padStart(2, '0')}`;
    if (monthMap.has(key)) {
      monthMap.get(key).reviews = r.cnt;
    } else {
      monthMap.set(key, { year: r.year, month: r.month, highlights: 0, reviews: r.cnt });
    }
  });

  // Convert to array and sort descending (newest first)
  const months = Array.from(monthMap.values())
    .sort((a, b) => (b.year - a.year) || (b.month - a.month));

  // Calculate total activity items for proportional time estimation
  const totalItems = months.reduce((sum, m) => sum + m.highlights + m.reviews, 0);

  return { months, totalItems };
}

function getBookHighlights(bookTitle, limitHighlights = 5) {
  const d = getDb();
  // Match highlights to book by joining on book_id = books.id (works for ~160 books)
  const rows = d.prepare(`
    SELECT h.mark_text, h.chapter_title, h.create_time
    FROM highlights h
    JOIN books b ON h.book_id = b.id
    WHERE b.title = ?
    ORDER BY RANDOM()
    LIMIT ?
  `).all(bookTitle, limitHighlights);

  return rows.map(r => ({
    text: r.mark_text || '',
    chapter: r.chapter_title || '',
    time: r.create_time || 0,
  }));
}

function getBookReviews(bookTitle, limitReviews = 5) {
  const d = getDb();
  // Match reviews to book by joining on book_id = books.id
  const rows = d.prepare(`
    SELECT r.content, r.chapter_name, r.create_time, r.star, r.abstract
    FROM reviews r
    JOIN books b ON r.book_id = b.id
    WHERE b.title = ?
    ORDER BY RANDOM()
    LIMIT ?
  `).all(bookTitle, limitReviews);

  return rows.map(r => ({
    content: r.content || '',
    chapter: r.chapter_name || '',
    time: r.create_time || 0,
    star: r.star != null ? r.star : -1,
    abstract: r.abstract || '',
  }));
}

// ─── Chapter Engagement (aggregate highlights + reviews by chapter) ───

function getBookChapterActivity(bookTitle) {
  const d = getDb();

  const hRows = d.prepare(`
    SELECT h.chapter_title AS chapter, COUNT(*) AS cnt
    FROM highlights h
    JOIN books b ON h.book_id = b.id
    WHERE b.title = ? AND h.chapter_title != ''
    GROUP BY h.chapter_title
  `).all(bookTitle);

  const rRows = d.prepare(`
    SELECT r.chapter_name AS chapter, COUNT(*) AS cnt
    FROM reviews r
    JOIN books b ON r.book_id = b.id
    WHERE b.title = ? AND r.chapter_name != ''
    GROUP BY r.chapter_name
  `).all(bookTitle);

  // Merge by chapter name
  const map = new Map();
  for (const row of hRows) {
    map.set(row.chapter, { chapter: row.chapter, highlights: row.cnt, reviews: 0 });
  }
  for (const row of rRows) {
    if (map.has(row.chapter)) {
      map.get(row.chapter).reviews = row.cnt;
    } else {
      map.set(row.chapter, { chapter: row.chapter, highlights: 0, reviews: row.cnt });
    }
  }

  return Array.from(map.values())
    .map(c => ({ ...c, total: c.highlights + c.reviews }))
    .sort((a, b) => b.total - a.total);
}

// ─── Book Intro (cached from WeRead API) ───

function getBookIntro(bookId) {
  const d = getDb();
  const row = d.prepare('SELECT intro FROM books WHERE id = ?').get(bookId);
  return row ? row.intro || '' : '';
}

function saveBookIntro(bookId, intro) {
  const d = getDb();
  d.prepare('UPDATE books SET intro = ? WHERE id = ?').all(intro, bookId);
}

// ─── Book Read Time (from /book/getprogress API) ───

function setBookReadTime(bookId, readTimeSec) {
  const d = getDb();
  d.prepare('UPDATE books SET read_time = ? WHERE id = ?').all(readTimeSec, bookId);
}

function getBookReadTimeFromDB(bookId) {
  const d = getDb();
  const row = d.prepare('SELECT read_time FROM books WHERE id = ?').get(bookId);
  return row ? row.read_time || 0 : 0;
}

// ─── Stats Page — Deep Thinking Ranking ───
function getDeepThinking(limit = 10) {
  const d = getDb();
  return d.prepare(`
    SELECT b.id, b.title, b.author, b.cover, b.category,
      COALESCE(n.note_count, 0) AS noteCount,
      COALESCE(n.review_count, 0) AS reviewCount,
      COALESCE(n.bookmark_count, 0) AS bookmarkCount,
      COALESCE(n.total_notes, 0) AS totalNotes
    FROM books b
    LEFT JOIN notebooks n ON b.id = n.book_id
    WHERE COALESCE(n.total_notes, 0) > 0
    ORDER BY n.total_notes DESC
    LIMIT ?
  `).all(limit);
}

// ─── Stats Page — Book Timeline (when each book entered the shelf) ───
function getBookTimeline() {
  const d = getDb();
  return d.prepare(`
    SELECT id, title, author, category, update_time AS addedAt
    FROM books WHERE update_time > 0
    ORDER BY update_time
  `).all();
}

// ─── Stats Page — Yearly Reading Intensity ───
function getYearlyIntensity() {
  const d = getDb();
  return d.prepare(`
    SELECT year,
      SUM(total_seconds) AS totalSec,
      SUM(read_days) AS totalDays
    FROM reading_trends
    GROUP BY year
    ORDER BY year
  `).all();
}

// ─── Stats Page — Reading Milestones ───
function getMilestones() {
  const d = getDb();
  const milestones = [];

  // First book
  const fb = d.prepare(
    'SELECT title, author, update_time FROM books WHERE update_time > 0 ORDER BY update_time LIMIT 1'
  ).get();
  if (fb) milestones.push({
    label: '阅读起点', detail: `收藏《${fb.title}》`,
    ts: fb.update_time, icon: '📖'
  });

  // Nth book milestones
  const total = d.prepare('SELECT COUNT(*) AS c FROM books').get().c;
  [10, 50, 100, 150, 200].forEach(n => {
    if (total < n) return;
    const b = d.prepare(
      'SELECT title, update_time FROM books WHERE update_time > 0 ORDER BY update_time LIMIT 1 OFFSET ?'
    ).get(n - 1);
    if (b) milestones.push({
      label: `第 ${n} 本书`, detail: `《${b.title}》`,
      ts: b.update_time, icon: '📚'
    });
  });

  // Cumulative reading hour milestones
  const sessions = d.prepare('SELECT date, seconds FROM reading_sessions ORDER BY date').all();
  [100, 500, 1000, 2000, 3000, 5000].forEach(h => {
    let cum = 0;
    const hit = sessions.find(s => { cum += s.seconds; return cum >= h * 3600; });
    if (hit) milestones.push({
      label: `累计 ${h} 小时`, detail: '阅读时长里程碑',
      ts: Math.floor(new Date(hit.date + 'T00:00:00').getTime() / 1000),
      icon: '⏱️'
    });
  });

  // First highlight
  const fh = d.prepare(`
    SELECT h.mark_text, h.create_time, b.title
    FROM highlights h LEFT JOIN books b ON h.book_id = b.id
    WHERE h.create_time > 0 ORDER BY h.create_time LIMIT 1
  `).get();
  if (fh) milestones.push({
    label: '第一条划线', detail: `《${fh.title || '?'}》：${(fh.mark_text || '').substring(0, 24)}…`,
    ts: fh.create_time, icon: '✍️'
  });

  // First review
  const fr = d.prepare(`
    SELECT r.content, r.create_time, b.title
    FROM reviews r LEFT JOIN books b ON r.book_id = b.id
    WHERE r.create_time > 0 ORDER BY r.create_time LIMIT 1
  `).get();
  if (fr) milestones.push({
    label: '第一条想法', detail: `《${fr.title || '?'}》：${(fr.content || '').substring(0, 24)}…`,
    ts: fr.create_time, icon: '💭'
  });

  // Longest consecutive reading streak
  const dates = [...new Set(sessions.map(s => s.date))].sort();
  if (dates.length > 0) {
    let maxStreak = 1, curStreak = 1;
    let maxStart = dates[0], maxEnd = dates[0], curStart = dates[0];
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i]) - new Date(dates[i - 1])) / 86400000;
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
    if (maxStreak > 1) milestones.push({
      label: `最长连续 ${maxStreak} 天`, detail: `${maxStart} → ${maxEnd}`,
      ts: Math.floor(new Date(maxEnd + 'T00:00:00').getTime() / 1000),
      icon: '🔥'
    });
  }

  milestones.sort((a, b) => a.ts - b.ts);
  return milestones;
}

// ─── Homepage Stats ───

function getHomepageStats() {
  const d = getDb();
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
  const weekAgo = (() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();

  // Days read this month
  const monthDays = d.prepare(
    "SELECT COUNT(*) AS c FROM reading_sessions WHERE date >= ?"
  ).get(monthStart);

  // Currently reading count
  const readingCount = d.prepare(
    "SELECT COUNT(*) AS c FROM books WHERE finished = 0"
  ).get();

  // New notes this week (highlights + reviews since weekAgo)
  const weekAgoTs = Math.floor(new Date(weekAgo).getTime() / 1000);
  const newHighlights = d.prepare(
    "SELECT COUNT(*) AS c FROM highlights WHERE create_time >= ?"
  ).get(weekAgoTs).c;
  const newReviews = d.prepare(
    "SELECT COUNT(*) AS c FROM reviews WHERE create_time >= ?"
  ).get(weekAgoTs).c;

  // Reading streak — longest & current
  const sessions = d.prepare('SELECT date, seconds FROM reading_sessions ORDER BY date').all();
  const dates = [...new Set(sessions.map(s => s.date))].sort();
  let maxStreak = 0, curStreak = 0, curIdx = -1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i]) - new Date(dates[i-1])) / 86400000;
    if (diff === 1) curStreak = curStreak > 0 ? curStreak + 1 : 2;
    else { if (curStreak > maxStreak) maxStreak = curStreak; curStreak = 0; }
  }
  if (curStreak > maxStreak) maxStreak = curStreak;

  // Current streak: count backwards from today
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const dateSet = new Set(dates);
  let currentStreak = 0;
  let checkDate = new Date(today);
  while (dateSet.has(`${checkDate.getFullYear()}-${String(checkDate.getMonth()+1).padStart(2,'0')}-${String(checkDate.getDate()).padStart(2,'0')}`)) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  // Also check: if today wasn't read, did we read yesterday?
  if (currentStreak === 0) {
    checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1);
    while (dateSet.has(`${checkDate.getFullYear()}-${String(checkDate.getMonth()+1).padStart(2,'0')}-${String(checkDate.getDate()).padStart(2,'0')}`)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  return {
    monthDays: monthDays.c,
    readingCount: readingCount.c,
    newNotes: newHighlights + newReviews,
    maxStreak,
    currentStreak,
    todayRead: dateSet.has(today),
  };
}

// ─── Author Stats ───

function getAuthorStats() {
  const d = getDb();

  // Per-author: book count, total read time
  const authors = d.prepare(`
    SELECT author, COUNT(*) AS bookCount, SUM(read_time) AS totalTime
    FROM books WHERE author != '' AND author IS NOT NULL
    GROUP BY author
    ORDER BY totalTime DESC
    LIMIT 15
  `).all();

  return authors;
}

// ─── Bookshelf Sort ───

function getBooksSorted(filter, category, sortBy) {
  const d = getDb();
  let query = `
    SELECT b.*, n.review_count AS reviewCount, n.note_count AS noteCount,
      n.bookmark_count AS bookmarkCount, n.total_notes AS totalNotes
    FROM books b
    LEFT JOIN notebooks n ON b.id = n.book_id
    WHERE 1=1
  `;
  const params = [];

  if (filter === 'finished') { query += ' AND b.finished = 1'; }
  else if (filter === 'reading') { query += ' AND b.finished = 0'; }
  else if (filter === 'want_to_read') { query += ' AND b.want_to_read = 1'; }

  if (category) { query += ' AND b.category = ?'; params.push(category); }

  switch (sortBy) {
    case 'title': query += ' ORDER BY b.title ASC'; break;
    case 'author': query += ' ORDER BY b.author ASC, b.title ASC'; break;
    case 'recent': query += ' ORDER BY b.update_time DESC'; break;
    case 'readtime':
    default: query += ' ORDER BY b.read_time DESC'; break;
  }

  return upgradeCovers(d.prepare(query).all(...params));
}

// ─── TBR (Want to Read) ───

function setWantToRead(bookId, want) {
  const d = getDb();
  d.prepare('UPDATE books SET want_to_read = ? WHERE id = ?').all(want ? 1 : 0, bookId);
}

function getWantToReadBooks() {
  const d = getDb();
  return upgradeCovers(d.prepare(
    'SELECT * FROM books WHERE want_to_read = 1 ORDER BY update_time DESC'
  ).all());
}

// ─── Book Rating ───

function setBookRating(bookId, rating) {
  const d = getDb();
  d.prepare('UPDATE books SET user_rating = ? WHERE id = ?').all(rating, bookId);
}

function getBookRating(bookId) {
  const d = getDb();
  const row = d.prepare('SELECT user_rating FROM books WHERE id = ?').get(bookId);
  return row ? row.user_rating || 0 : 0;
}

// ─── Book All Notes ───

function getBookAllNotes(bookTitle) {
  const d = getDb();
  const hRows = d.prepare(`
    SELECT h.mark_text AS text, h.chapter_title AS chapter, h.create_time,
      'highlight' AS type, h.bookmark_id AS id
    FROM highlights h JOIN books b ON h.book_id = b.id
    WHERE b.title = ? AND h.mark_text != ''
  `).all(bookTitle);

  const rRows = d.prepare(`
    SELECT r.content AS text, r.chapter_name AS chapter, r.create_time,
      'review' AS type, r.review_id AS id, r.star, r.abstract
    FROM reviews r JOIN books b ON r.book_id = b.id
    WHERE b.title = ? AND r.content != ''
  `).all(bookTitle);

  const all = [...hRows.map(r => ({ ...r, chapter: r.chapter || '未知章节' })),
               ...rRows.map(r => ({ ...r, chapter: r.chapter || '未知章节' }))];
  all.sort((a, b) => a.create_time - b.create_time);

  // Group by chapter
  const grouped = {};
  all.forEach(note => {
    if (!grouped[note.chapter]) grouped[note.chapter] = [];
    grouped[note.chapter].push(note);
  });

  return { all, grouped };
}

// ─── Calendar Data ───

function getCalendarData(year) {
  const d = getDb();
  const sessions = d.prepare(
    "SELECT date, seconds FROM reading_sessions WHERE date LIKE ? ORDER BY date"
  ).all(`${year}-%`);

  return sessions.map(s => ({
    date: s.date,
    seconds: s.seconds,
    hours: Math.round(s.seconds / 3600 * 10) / 10,
    level: heatmapLevel(s.seconds),
  }));
}

// ─── Annual Report ───

function getReportData(year) {
  const d = getDb();

  // Books finished this year
  const yearStart = Math.floor(new Date(`${year}-01-01`).getTime() / 1000);
  const yearEnd = Math.floor(new Date(`${year+1}-01-01`).getTime() / 1000);
  const finished = d.prepare(
    'SELECT COUNT(*) AS c FROM books WHERE finished = 1 AND update_time >= ? AND update_time < ?'
  ).get(yearStart, yearEnd).c;

  // Total books on shelf this year
  const totalBooks = d.prepare(
    'SELECT COUNT(*) AS c FROM books WHERE update_time >= ? AND update_time < ?'
  ).get(yearStart, yearEnd).c;

  // Reading time this year
  const sessions = d.prepare(
    "SELECT date, seconds FROM reading_sessions WHERE date LIKE ?"
  ).all(`${year}-%`);
  const totalSec = sessions.reduce((sum, s) => sum + s.seconds, 0);
  const totalHours = Math.round(totalSec / 3600 * 10) / 10;
  const readDays = [...new Set(sessions.map(s => s.date))].length;

  // Top book this year (by notes)
  const topBook = d.prepare(`
    SELECT b.title, b.author, b.cover, b.category,
      COALESCE(n.total_notes, 0) AS totalNotes
    FROM books b
    LEFT JOIN notebooks n ON b.id = n.book_id
    ORDER BY n.total_notes DESC
    LIMIT 1
  `).get();

  // Category distribution
  const categories = d.prepare(`
    SELECT category, COUNT(*) AS cnt
    FROM books WHERE category != '' AND category IS NOT NULL
    GROUP BY category ORDER BY cnt DESC
  `).all();

  // Monthly trend
  const trends = d.prepare(`
    SELECT month, total_seconds AS totalSec, read_days AS readDays
    FROM reading_trends WHERE year = ?
    ORDER BY month
  `).all(year);

  // Longest book by read time
  const longest = d.prepare(`
    SELECT title, author, read_time FROM books
    WHERE read_time > 0 ORDER BY read_time DESC LIMIT 1
  `).get();

  // Total highlights this year
  const totalHighlights = d.prepare(
    'SELECT COUNT(*) AS c FROM highlights WHERE create_time >= ? AND create_time < ?'
  ).get(yearStart, yearEnd).c;

  // Total reviews this year
  const totalReviews = d.prepare(
    'SELECT COUNT(*) AS c FROM reviews WHERE create_time >= ? AND create_time < ?'
  ).get(yearStart, yearEnd).c;

  // Comparison with previous year
  const prevSessions = d.prepare(
    "SELECT date, seconds FROM reading_sessions WHERE date LIKE ?"
  ).all(`${year-1}-%`);
  const prevSec = prevSessions.reduce((sum, s) => sum + s.seconds, 0);
  const prevHours = Math.round(prevSec / 3600 * 10) / 10;

  return {
    year,
    finished,
    totalBooks,
    totalHours,
    readDays,
    topBook: topBook || null,
    categories,
    trends: trends.map(t => ({
      ...t,
      hours: Math.round(t.totalSec / 3600 * 10) / 10,
    })),
    longest,
    totalHighlights,
    totalReviews,
    prevYearHours: prevHours,
    yoyChange: prevHours > 0 ? Math.round(((totalHours - prevHours) / prevHours) * 100) : null,
  };
}

// ─── Tags ───

function getAllTags() {
  const d = getDb();
  return d.prepare('SELECT * FROM tags ORDER BY name').all();
}

function getTagById(id) {
  const d = getDb();
  return d.prepare('SELECT * FROM tags WHERE id = ?').get(id);
}

function createTag(name, color) {
  const d = getDb();
  d.prepare('INSERT OR IGNORE INTO tags (name, color) VALUES (?, ?)').all(name, color || '#6366f1');
  return d.prepare('SELECT * FROM tags WHERE name = ?').get(name);
}

function deleteTag(id) {
  const d = getDb();
  d.prepare('DELETE FROM note_tags WHERE tag_id = ?').all(id);
  d.prepare('DELETE FROM tags WHERE id = ?').all(id);
}

function setNoteTags(noteId, noteType, tagIds) {
  const d = getDb();
  d.prepare('DELETE FROM note_tags WHERE note_id = ? AND note_type = ?').all(noteId, noteType);
  for (const tid of tagIds) {
    d.prepare('INSERT OR IGNORE INTO note_tags (note_id, note_type, tag_id) VALUES (?, ?, ?)').all(noteId, noteType, tid);
  }
}

function getNoteTags(noteId, noteType) {
  const d = getDb();
  return d.prepare(`
    SELECT t.* FROM tags t
    JOIN note_tags nt ON t.id = nt.tag_id
    WHERE nt.note_id = ? AND nt.note_type = ?
  `).all(noteId, noteType);
}

function getNotesByTag(tagId, limit = 50) {
  const d = getDb();
  const items = [];

  const hRows = d.prepare(`
    SELECT h.bookmark_id AS id, h.mark_text AS text, h.chapter_title AS chapter,
      h.create_time, b.title AS book_title, b.id AS book_id
    FROM highlights h
    JOIN note_tags nt ON nt.note_id = h.bookmark_id AND nt.note_type = 'highlight'
    JOIN books b ON h.book_id = b.id
    WHERE nt.tag_id = ?
    ORDER BY h.create_time DESC LIMIT ?
  `).all(tagId, limit);

  const rRows = d.prepare(`
    SELECT r.review_id AS id, r.content AS text, r.chapter_name AS chapter,
      r.create_time, b.title AS book_title, b.id AS book_id
    FROM reviews r
    JOIN note_tags nt ON nt.note_id = r.review_id AND nt.note_type = 'review'
    JOIN books b ON r.book_id = b.id
    WHERE nt.tag_id = ?
    ORDER BY r.create_time DESC LIMIT ?
  `).all(tagId, limit);

  hRows.forEach(r => items.push({ ...r, type: 'highlight' }));
  rRows.forEach(r => items.push({ ...r, type: 'review' }));
  items.sort((a, b) => b.create_time - a.create_time);
  return items.slice(0, limit);
}

// ─── Search ───

function searchAll(query, limit = 30) {
  const d = getDb();
  const like = `%${query}%`;

  const books = d.prepare(`
    SELECT id, title, author, cover, category, finished
    FROM books
    WHERE title LIKE ? OR author LIKE ?
    ORDER BY update_time DESC
    LIMIT ?
  `).all(like, like, limit);

  const highlights = d.prepare(`
    SELECT h.bookmark_id AS id, h.mark_text AS text, h.chapter_title AS chapter,
      h.book_id, h.create_time,
      b.title AS book_title, b.author AS book_author
    FROM highlights h
    JOIN books b ON h.book_id = b.id
    WHERE h.mark_text LIKE ? AND h.mark_text != ''
    ORDER BY h.create_time DESC
    LIMIT ?
  `).all(like, limit);

  const reviews = d.prepare(`
    SELECT r.review_id AS id, r.content AS text, r.chapter_name AS chapter,
      r.book_id, r.create_time,
      b.title AS book_title, b.author AS book_author
    FROM reviews r
    JOIN books b ON r.book_id = b.id
    WHERE r.content LIKE ? AND r.content != ''
    ORDER BY r.create_time DESC
    LIMIT ?
  `).all(like, limit);

  return { books: upgradeCovers(books), highlights, reviews };
}

// ─── Exports ───

module.exports = {
  initDb,
  getDb,
  closeDb,
  getAllBooks,
  getBookById,
  getNotebooks,
  getRecentHighlights,
  getHeatmap,
  getTrends,
  getWeekdayDistribution,
  getSummary,
  getOverall,
  getCurrentlyReading,
  getAllCategories,
  getReadingStats,
  getBookReadTimes,
  getBookHighlights,
  getBookReviews,
  getBookIntro,
  saveBookIntro,
  setBookReadTime,
  getBookReadTimeFromDB,
  getBookMonthlyActivity,
  getBookChapterActivity,
  // stats page additions
  getDeepThinking,
  getBookTimeline,
  getYearlyIntensity,
  getMilestones,
  // notebooks page
  getAllNotebooks,
  getRecentNotes,
  // helpers
  formatTime,
  formatTimestamp,
  heatmapLevel,
  // search
  searchAll,
  // homepage stats
  getHomepageStats,
  // stats page
  getAuthorStats,
  // bookshelf
  getBooksSorted,
  setWantToRead,
  getWantToReadBooks,
  // book detail
  setBookRating,
  getBookRating,
  getBookAllNotes,
  // calendar
  getCalendarData,
  // report
  getReportData,
  // tags
  getAllTags,
  createTag,
  deleteTag,
  setNoteTags,
  getNoteTags,
  getNotesByTag,
};
