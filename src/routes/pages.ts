import { Router, Request, Response } from 'express';
import {
  getSummary, getOverall, getHeatmap, getTrends, getCurrentlyReading,
  getRecentHighlights, getWeekdayDistribution, getHomepageStats,
  getAllBooks, getAllCategories, getBookReadTimes, getBooksSorted,
  getBookById, getBookHighlights, getBookReviews, getBookMonthlyActivity,
  getBookChapterActivity, getBookIntro, getBookAllNotes, getBookRating,
  getAllNotebooks, getRecentNotes, searchAll,
  getDeepThinking, getBookTimeline, getYearlyIntensity, getMilestones,
  getAuthorStats, getReadingStats,
  getAnnualBooks, getAnnualYears,
  getAuthorsAll, getAuthorByName, getAuthorHighlights, getAuthorReviews,
  getHighlightsPaged, getHighlightsTotal,
  getAllBooklists, getBooklistById,
} from '../db/models';
import { formatTime, formatTimestamp } from '../utils/format';
import type { Book } from '../types';
import { getDb } from '../db/connection';

const router = Router();

interface BookWithReadTime extends Book {
  readTimeSec: number;
}

// ─── Home ───
router.get('/', (_req: Request, res: Response) => {
  const summary = getSummary();
  const overall_kv = getOverall();
  const overall = overall_kv.overall || {};
  const annual = overall_kv.annual || {};
  const annual2026 = overall_kv['annual-2026'] || {};

  const currentlyReading = getCurrentlyReading(6);
  const recentHighlights = getRecentHighlights(8);

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
  const yearProgress = ((now.getTime() - yearStart.getTime()) / (yearEnd.getTime() - yearStart.getTime()) * 100);
  const dayOfYear = Math.floor((now.getTime() - yearStart.getTime()) / 86400000) + 1;

  const heatmap = getHeatmap().filter(d => d.date.startsWith('2026'));
  const heatmapJson = JSON.stringify(heatmap);

  const trends = getTrends();
  const monthly2025 = trends.filter(t => t.year === 2025);
  const maxMonthly = Math.max(...monthly2025.map(m => m.totalSeconds), 1);

  const weekdayCounts = getWeekdayDistribution();
  const hps = getHomepageStats();

  res.render('index', {
    title: '阅读书房',
    summary, annual, overall,
    formatTime, formatTimestamp,
    helpers: { formatTime, formatTimestamp },
    path: '/',
    heatmap: heatmapJson,
    monthly2025: JSON.stringify(monthly2025),
    maxMonthly,
    currentlyReading,
    recentHighlights,
    yearProgress: parseFloat(yearProgress.toFixed(1)),
    dayOfYear,
    daysInYear: Math.ceil((yearEnd.getTime() - yearStart.getTime()) / 86400000),
    weekdayCounts,
    weekdayMap: ['日', '一', '二', '三', '四', '五', '六'],
    annual2026,
    hpStats: hps,
    needsHtml2Canvas: true,
  });
});

// ─── Bookshelf ───
router.get('/bookshelf', (req: Request, res: Response) => {
  const filter = (req.query.filter as string) || 'all';
  const sortBy = (req.query.sort as string) || 'readtime';
  const category = (req.query.category as string) || '';

  const allCategories = getAllCategories();

  let books: Book[];
  try {
    books = getBooksSorted(filter, category, sortBy);
  } catch {
    books = getAllBooks(filter, category);
  }

  const summary = getSummary();
  const bookReadTimes = getBookReadTimes();

  const booksWithTime: BookWithReadTime[] = books.map(b => {
    const readTimeSec = (b.read_time || 0) || bookReadTimes[b.title] || 0;
    return { ...b, readTimeSec };
  });

  res.render('bookshelf', {
    title: '书架', books: booksWithTime, allCategories, filter, category, sortBy,
    summary, formatTimestamp,
    helpers: { formatTime, formatTimestamp },
    path: '/bookshelf',
  });
});

// ─── Stats ───
router.get('/stats', (_req: Request, res: Response) => {
  const overall_kv = getOverall();
  const overall = overall_kv.overall || {};
  const annual = overall_kv.annual || {};

  const trends = getTrends();

  const yearlyReadTimes = overall.yearlyReadTimes || {};
  const years = Object.entries(yearlyReadTimes)
    .map(([ts, secs]) => ({
      year: new Date(parseInt(ts) * 1000).getFullYear(),
      seconds: secs,
      hours: Math.round(secs / 3600 * 10) / 10,
    }))
    .sort((a, b) => a.year - b.year);

  const monthly = trends.map(t => ({
    month: `${t.year}-${String(t.month).padStart(2, '0')}`,
    label: `${t.month}月`,
    year: t.year,
    seconds: t.totalSeconds,
    hours: Math.round(t.totalSeconds / 3600 * 10) / 10,
    readDays: t.readDays || 0,
  }));

  const summary = getSummary();
  const deepThinking = getDeepThinking(10);
  const bookTimeline = getBookTimeline();
  const yearlyIntensity = getYearlyIntensity();
  const milestones = getMilestones();
  const authorStats = getAuthorStats();
  const heatmapData = getHeatmap();
  const weekdayDist = getWeekdayDistribution();
  const readingStatsRaw = getReadingStats();
  const homepageStats = getHomepageStats();

  const nowYr = new Date().getFullYear();
  const thisYearTrend = trends.filter(t => t.year === nowYr);
  const lastYearTrend = trends.filter(t => t.year === nowYr - 1);
  const thisYearTotal = thisYearTrend.reduce((s, t) => s + t.totalSeconds, 0);
  const lastYearTotal = lastYearTrend.reduce((s, t) => s + t.totalSeconds, 0);
  const yoyChange = lastYearTotal > 0
    ? Math.round(((thisYearTotal - lastYearTotal) / lastYearTotal) * 100)
    : null;

  res.render('stats', {
    title: '阅读统计',
    annual, overall, years: yearlyReadTimes, yearsData: years,
    monthly, summary, formatTime, formatTimestamp,
    helpers: { formatTime, formatTimestamp },
    path: '/stats',
    trends: JSON.stringify(trends),
    deepThinking, bookTimeline, yearlyIntensity, milestones,
    timelineJson: JSON.stringify(bookTimeline).replace(/</g, '\\u003c'),
    intensityJson: JSON.stringify(yearlyIntensity),
    authorStats: JSON.stringify(authorStats),
    heatmapData: JSON.stringify(heatmapData),
    weekdayDist: JSON.stringify(weekdayDist),
    readingStatsRaw: JSON.stringify(readingStatsRaw),
    homepageStats: JSON.stringify(homepageStats),
    yoyChange,
  });
});

// ─── Notebooks ───
router.get('/notebooks', (_req: Request, res: Response) => {
  const notebooks = getAllNotebooks();
  const recentNotes = getRecentNotes(30);
  const summary = getSummary();

  res.render('notebooks', {
    title: '笔记', notebooks, recentNotes, summary,
    helpers: { formatTime, formatTimestamp },
    path: '/notebooks',
  });
});

// ─── Search ───
router.get('/search', (req: Request, res: Response) => {
  const q = ((req.query.q as string) || '').trim();
  if (!q) {
    res.render('search', {
      title: '搜索', query: '', results: null,
      helpers: { formatTime, formatTimestamp },
      path: '/search',
    });
    return;
  }

  const results = searchAll(q);
  const summary = getSummary();

  res.render('search', {
    title: `搜索：${q}`,
    query: q,
    results,
    totalResults: results.books.length + results.highlights.length + results.reviews.length,
    summary, formatTimestamp,
    helpers: { formatTime, formatTimestamp },
    path: '/search',
  });
});

// ─── Book Detail ───
router.get('/book/:id', (req: Request, res: Response) => {
  const bookId = req.params.id as string;
  const book = getBookById(bookId);
  if (!book) {
    res.status(404).send('未找到此书');
    return;
  }

  const highlights = getBookHighlights(book.title, 12);
  const reviews = getBookReviews(book.title, 12);

  let readTimeSec = book.readTime || 0;
  if (!readTimeSec) {
    const bookReadTimes = getBookReadTimes();
    readTimeSec = bookReadTimes[book.title] || 0;
  }

  const { months: monthlyActivity, totalItems } = getBookMonthlyActivity(bookId);
  const monthlyBars = monthlyActivity.map(m => {
    const items = m.highlights + m.reviews;
    const estimatedSec = totalItems > 0 ? Math.round(readTimeSec * (items / totalItems)) : 0;
    const h = Math.floor(estimatedSec / 3600);
    const min = Math.floor((estimatedSec % 3600) / 60);
    let timeLabel = '';
    if (h > 0) timeLabel += `${h}小时`;
    if (min > 0) timeLabel += `${min}分钟`;
    if (!timeLabel) timeLabel = '不足1分钟';
    const now = new Date();
    const isCurrentMonth = m.year === now.getFullYear() && m.month === now.getMonth() + 1;
    const monthLabel = isCurrentMonth ? `${m.month}月` : `${m.year}年${m.month}月`;
    return { ...m, label: monthLabel, timeLabel, estimatedSec };
  });
  const maxMonthlySec = Math.max(...monthlyBars.map(m => m.estimatedSec), 1);

  const intro = getBookIntro(bookId);
  const chapterActivity = getBookChapterActivity(book.title);
  const maxChapterTotal = Math.max(...chapterActivity.map(c => c.total), 1);

  const { all: allNotes, grouped: notesByChapter } = getBookAllNotes(book.title);
  const userRating = getBookRating(bookId);

  res.render('book', {
    title: book.title,
    book: book,
    highlights, reviews, readTimeSec, formatTimestamp,
    helpers: { formatTime, formatTimestamp },
    path: '/bookshelf',
    summary: getSummary(),
    monthlyBars, maxMonthlySec, intro,
    chapterActivity: chapterActivity.slice(0, 8),
    maxChapterTotal, needsHtml2Canvas: true,
    allNotes: allNotes.slice(0, 50),
    notesByChapter: Object.entries(notesByChapter).slice(0, 8).map(
      ([ch, notes]) => ({ chapter: ch, count: notes.length })
    ),
    userRating,
  });
});

// ─── Annual ───
router.get('/annual', (req: Request, res: Response) => {
  const years = getAnnualYears();
  const currentYear = years[0] || new Date().getFullYear();
  const year = parseInt(req.query.year as string) || currentYear;
  const { books, totalReadTime, finishedCount, totalNotes } = getAnnualBooks(year);

  res.render('annual', {
    title: `${year} 年度书单`,
    years, year, books, totalReadTime, finishedCount, totalNotes,
    formatTime, formatTimestamp,
    helpers: { formatTime, formatTimestamp },
    path: '/annual',
  });
});

// ─── Authors ───
router.get('/authors', (_req: Request, res: Response) => {
  const authors = getAuthorsAll();
  const totalBooks = authors.reduce((s, a) => s + a.books.length, 0);
  const totalTime = authors.reduce((s, a) => s + a.totalReadTime, 0);

  res.render('authors', {
    title: '作者图谱',
    authors, totalAuthors: authors.length, totalBooks, totalTime,
    formatTime,
    helpers: { formatTime, formatTimestamp },
    path: '/authors',
  });
});
// ─── Quotes ───
router.get('/quotes', (req: Request, res: Response) => {
  const bookId = (req.query.book as string) || null;
  const PAGE = 40;

  const total = getHighlightsTotal(bookId);
  const highlights = getHighlightsPaged(PAGE, 0, bookId);
  const allBooks = getAllBooks().map((b: Book) => ({ id: b.id, title: b.title }));

  res.render('quotes', {
    title: '金句墙',
    highlights, total, page: 1, perPage: PAGE,
    bookId: bookId || '', allBooks,
    helpers: { formatTime, formatTimestamp },
    path: '/quotes',
  });
});

// ─── Booklists ───
router.get('/booklists', (_req: Request, res: Response) => {
  const lists = getAllBooklists();
  const allBooks = getAllBooks().map((b: Book) => ({
    id: b.id, title: b.title, author: b.author, cover: b.cover,
  }));

  res.render('booklists', {
    title: '书单推荐',
    lists, allBooks: JSON.stringify(allBooks),
    helpers: { formatTime, formatTimestamp },
    path: '/booklists',
  });
});

router.get('/booklists/:id', (req: Request, res: Response) => {
  const list = getBooklistById(parseInt(req.params.id as string));
  if (!list) {
    res.status(404).send('书单不存在');
    return;
  }

  const allBooks = getAllBooks().map((b: Book) => ({
    id: b.id, title: b.title, author: b.author, cover: b.cover,
  }));

  res.render('booklist-detail', {
    title: list.name,
    list, allBooks: JSON.stringify(allBooks),
    formatTime, formatTimestamp,
    helpers: { formatTime, formatTimestamp },
    path: '/booklists',
  });
});


// ═══════════════════════════════════════════
// NEW FEATURES: Covers / Badges / Timeline / Report
// ═══════════════════════════════════════════

// ─── Book Cover Wall ───
router.get('/covers', (_req: Request, res: Response) => {
  const allBooks = getAllBooks();
  const books = allBooks
    .filter(b => b.cover)
    .sort((a, b) => (b.last_read_time || 0) - (a.last_read_time || 0));
  const finished = books.filter(b => b.finished).length;

  res.render('covers', {
    title: '封面墙',
    books,
    total: books.length,
    finished,
    helpers: { formatTime, formatTimestamp },
    path: '/covers',
  });
});

// ─── Reading Badges ───
router.get('/badges', (_req: Request, res: Response) => {
  const d = getDb()!;
  const allBooks = getAllBooks();
  const finishedCount = allBooks.filter(b => b.finished).length;
  const totalBooks = allBooks.length;
  const totalReadTime = allBooks.reduce((s, b) => s + (b.read_time || 0), 0);

  // 划线统计
  const hlCount = (d.prepare("SELECT COUNT(*) as c FROM highlights").get() as any)?.c || 0;
  const rvCount = (d.prepare("SELECT COUNT(*) as c FROM reviews").get() as any)?.c || 0;

  // 单本书最大划线数
  const maxHlPerBook = (d.prepare(`
    SELECT book_id, COUNT(*) as c FROM highlights GROUP BY book_id ORDER BY c DESC LIMIT 1
  `).get() as any)?.c || 0;

  // 单本书最长阅读时间
  const maxReadTime = Math.max(...allBooks.map(b => b.read_time || 0), 0);

  // 时段分布（从划线时间推断）
  const hourStats = d.prepare(`
    SELECT strftime('%H', datetime(create_time, 'unixepoch', 'localtime')) as hour, COUNT(*) as cnt
    FROM highlights GROUP BY hour
  `).all() as {hour: string, cnt: number}[];
  const nightHl = hourStats.filter(h => parseInt(h.hour) < 6).reduce((s, h) => s + h.cnt, 0);
  const morningHl = hourStats.filter(h => parseInt(h.hour) >= 6 && parseInt(h.hour) < 9).reduce((s, h) => s + h.cnt, 0);

  // 连续阅读天数
  const readDays = d.prepare(`
    SELECT DISTINCT date(create_time, 'unixepoch', 'localtime') as d
    FROM highlights ORDER BY d
  `).all() as {d: string}[];
  let maxStreak = 0, curStreak = 0, prevDate: Date | null = null;
  for (const row of readDays) {
    const dt = new Date(row.d);
    if (prevDate && (dt.getTime() - prevDate.getTime()) === 86400000) {
      curStreak++;
    } else {
      curStreak = 1;
    }
    maxStreak = Math.max(maxStreak, curStreak);
    prevDate = dt;
  }

  // 本年度读完数
  const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;
  const yearFinished = allBooks.filter(b => b.finished && (b.last_read_time || 0) >= yearStart).length;

  const badges = [
    { id: 'first-book', icon: '📖', name: '初读者', desc: '读完第一本书', earned: finishedCount >= 1, progress: Math.min(finishedCount, 1), target: 1 },
    { id: 'bookworm', icon: '🐛', name: '书虫', desc: '读完 10 本书', earned: finishedCount >= 10, progress: Math.min(finishedCount, 10), target: 10 },
    { id: 'reader', icon: '📚', name: '阅读达人', desc: '读完 30 本书', earned: finishedCount >= 30, progress: Math.min(finishedCount, 30), target: 30 },
    { id: 'scholar', icon: '🎓', name: '博览群书', desc: '读完 50 本书', earned: finishedCount >= 50, progress: Math.min(finishedCount, 50), target: 50 },
    { id: 'master', icon: '🏆', name: '学富五车', desc: '读完 80 本书', earned: finishedCount >= 80, progress: Math.min(finishedCount, 80), target: 80 },
    { id: 'collector', icon: '📦', name: '藏书家', desc: '藏书超过 100 本', earned: totalBooks >= 100, progress: Math.min(totalBooks, 100), target: 100 },
    { id: 'deep-reader', icon: '✍️', name: '深度读者', desc: '单本书划线超 30 条', earned: maxHlPerBook >= 30, progress: Math.min(maxHlPerBook, 30), target: 30 },
    { id: 'thinker', icon: '💭', name: '思想家', desc: '发表 30 条想法', earned: rvCount >= 30, progress: Math.min(rvCount, 30), target: 30 },
    { id: 'highlight-hoarder', icon: '🔖', name: '金句收藏家', desc: '划线超过 1000 条', earned: hlCount >= 1000, progress: Math.min(hlCount, 1000), target: 1000 },
    { id: 'streak', icon: '🔥', name: '坚持不懈', desc: '连续阅读 7 天', earned: maxStreak >= 7, progress: Math.min(maxStreak, 7), target: 7 },
    { id: 'streak-30', icon: '⚡', name: '持之以恒', desc: '连续阅读 30 天', earned: maxStreak >= 30, progress: Math.min(maxStreak, 30), target: 30 },
    { id: 'marathon', icon: '🏃', name: '阅读马拉松', desc: '单本书阅读超 20 小时', earned: maxReadTime >= 72000, progress: Math.min(Math.round(maxReadTime / 3600), 20), target: 20, unit: 'h' },
    { id: 'night-owl', icon: '🦉', name: '夜猫子', desc: '凌晨划线超 50 条', earned: nightHl >= 50, progress: Math.min(nightHl, 50), target: 50 },
    { id: 'early-bird', icon: '🐦', name: '早起鸟', desc: '清晨划线超 100 条', earned: morningHl >= 100, progress: Math.min(morningHl, 100), target: 100 },
    { id: 'year-star', icon: '⭐', name: '年度之星', desc: '本年度读完 10 本', earned: yearFinished >= 10, progress: Math.min(yearFinished, 10), target: 10 },
    { id: 'time-lord', icon: '⏰', name: '时间领主', desc: '累计阅读超 500 小时', earned: totalReadTime >= 1800000, progress: Math.min(Math.round(totalReadTime / 3600), 500), target: 500, unit: 'h' },
  ];

  const earnedCount = badges.filter(b => b.earned).length;

  res.render('badges', {
    title: '阅读勋章',
    badges,
    earnedCount,
    totalBadges: badges.length,
    stats: { finishedCount, totalBooks, hlCount, rvCount, maxStreak, totalReadTime },
    helpers: { formatTime, formatTimestamp },
    path: '/badges',
  });
});

// ─── Reading Timeline ───
router.get('/timeline', (_req: Request, res: Response) => {
  const allBooks = getAllBooks();
  const finished = allBooks
    .filter(b => b.finished && b.last_read_time > 0)
    .sort((a, b) => b.last_read_time - a.last_read_time);

  // 按年份分组
  const byYear: Record<number, typeof finished> = {};
  for (const b of finished) {
    const y = new Date(b.last_read_time * 1000).getFullYear();
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(b);
  }
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  res.render('timeline', {
    title: '阅读时间线',
    byYear,
    years,
    total: finished.length,
    helpers: { formatTime, formatTimestamp },
    path: '/timeline',
  });
});

// ─── Annual Reading Report ───
router.get('/report', (req: Request, res: Response) => {
  const year = parseInt((req.query.year as string) || String(new Date().getFullYear()));
  const d = getDb()!;
  const yearStart = new Date(year, 0, 1).getTime() / 1000;
  const yearEnd = new Date(year + 1, 0, 1).getTime() / 1000;

  // 本年度读完的书
  const yearBooks = getAllBooks().filter(b =>
    b.finished && b.last_read_time >= yearStart && b.last_read_time < yearEnd
  );
  const yearReadTime = yearBooks.reduce((s, b) => s + (b.read_time || 0), 0);

  // 本年度划线和想法
  const yearHl = (d.prepare(`
    SELECT COUNT(*) as c FROM highlights WHERE create_time >= ? AND create_time < ?
  `).get(yearStart, yearEnd) as any)?.c || 0;
  const yearRv = (d.prepare(`
    SELECT COUNT(*) as c FROM reviews WHERE create_time >= ? AND create_time < ?
  `).get(yearStart, yearEnd) as any)?.c || 0;

  // 阅读天数
  const readDays = (d.prepare(`
    SELECT COUNT(DISTINCT date(create_time, 'unixepoch', 'localtime')) as c
    FROM highlights WHERE create_time >= ? AND create_time < ?
  `).get(yearStart, yearEnd) as any)?.c || 0;

  // 月度趋势
  const monthly = d.prepare(`
    SELECT strftime('%m', datetime(create_time, 'unixepoch', 'localtime')) as month, COUNT(*) as cnt
    FROM highlights WHERE create_time >= ? AND create_time < ?
    GROUP BY month ORDER BY month
  `).all(yearStart, yearEnd) as {month: string, cnt: number}[];
  const monthlyData = Array.from({length: 12}, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    const found = monthly.find(x => x.month === m);
    return { month: i + 1, count: found?.cnt || 0 };
  });
  const maxMonthly = Math.max(...monthlyData.map(m => m.count), 1);

  // 分类分布
  const catMap: Record<string, number> = {};
  for (const b of yearBooks) {
    const cat = b.category || '未分类';
    catMap[cat] = (catMap[cat] || 0) + 1;
  }
  const categories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));

  // 最爱作者
  const authorMap: Record<string, {count: number, time: number}> = {};
  for (const b of yearBooks) {
    if (!authorMap[b.author]) authorMap[b.author] = { count: 0, time: 0 };
    authorMap[b.author].count++;
    authorMap[b.author].time += b.read_time || 0;
  }
  const topAuthors = Object.entries(authorMap)
    .sort((a, b) => b[1].time - a[1].time)
    .slice(0, 5)
    .map(([name, data]) => ({ name, ...data }));

  // 时段分布
  const hourStats = d.prepare(`
    SELECT strftime('%H', datetime(create_time, 'unixepoch', 'localtime')) as hour, COUNT(*) as cnt
    FROM highlights WHERE create_time >= ? AND create_time < ?
    GROUP BY hour
  `).all(yearStart, yearEnd) as {hour: string, cnt: number}[];
  const hourData = Array.from({length: 24}, (_, i) => {
    const h = String(i).padStart(2, '0');
    const found = hourStats.find(x => x.hour === h);
    return found?.cnt || 0;
  });
  const maxHour = Math.max(...hourData, 1);

  // 星期分布
  const weekdayStats = d.prepare(`
    SELECT strftime('%w', datetime(create_time, 'unixepoch', 'localtime')) as wd, COUNT(*) as cnt
    FROM highlights WHERE create_time >= ? AND create_time < ?
    GROUP BY wd
  `).all(yearStart, yearEnd) as {wd: string, cnt: number}[];
  const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
  const weekdayData = weekdayNames.map((name, i) => {
    const found = weekdayStats.find(x => x.wd === String(i));
    return { name, count: found?.cnt || 0 };
  });

  // 最长单日阅读
  const dailyStats = d.prepare(`
    SELECT date(create_time, 'unixepoch', 'localtime') as d, COUNT(*) as cnt
    FROM highlights WHERE create_time >= ? AND create_time < ?
    GROUP BY d ORDER BY cnt DESC LIMIT 1
  `).get(yearStart, yearEnd) as {d: string, cnt: number} | undefined;

  // 最长的一本书
  const longestBook = yearBooks.length > 0
    ? yearBooks.reduce((a, b) => (a.read_time || 0) > (b.read_time || 0) ? a : b)
    : null;

  const availableYears = [...new Set(getAllBooks()
    .filter(b => b.finished && b.last_read_time > 0)
    .map(b => new Date(b.last_read_time * 1000).getFullYear()))].sort((a, b) => b - a);

  res.render('report', {
    title: year + ' 年度阅读报告',
    year,
    availableYears,
    stats: {
      bookCount: yearBooks.length,
      readTime: yearReadTime,
      readDays,
      highlightCount: yearHl,
      reviewCount: yearRv,
    },
    monthlyData,
    maxMonthly,
    categories,
    topAuthors,
    hourData,
    maxHour,
    weekdayData,
    longestDay: dailyStats,
    longestBook,
    books: yearBooks.slice(0, 12),
    helpers: { formatTime, formatTimestamp },
    path: '/report',
  });
});

export default router;
