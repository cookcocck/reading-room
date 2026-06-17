const express = require('express'),
      expressLayouts = require('express-ejs-layouts'),
      compression = require('compression'),
      path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Compression (gzip/brotli) — reduce text responses by ~70% ───
app.use(compression());

app.use(expressLayouts);
app.use(express.json());  // for POST /api/* endpoints
app.set('layout', 'layout');

// ─── DB (async init) ───
const db = require('./src/db');

// Middleware: check DB availability before serving pages
app.use((req, res, next) => {
  if (req.path.startsWith('/css/') || req.path.startsWith('/js/') || req.path.startsWith('/images/') || req.path === '/favicon.ico') {
    return next();
  }
  if (!db.getDb()) {
    return res.status(503).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>数据库不可用</title>
      <style>body{font-family:system-ui,sans-serif;max-width:600px;margin:80px auto;padding:24px;line-height:1.6;color:#333}
      h1{color:#c00}code{background:#f5f5f5;padding:2px 6px;border-radius:4px;font-size:.9em}
      pre{background:#f5f5f5;padding:12px;border-radius:6px;overflow-x:auto}</style></head>
      <body><h1>503 - 数据库不可用</h1>
      <p>数据库文件不存在或无法读取。请在服务器上运行：</p>
      <pre><code>cd /home/admin/reading-site && python scripts/create_db.py</code></pre>
      <p>然后重启服务：<code>pm2 restart reading-room</code></p></body></html>
    `);
  }
  next();
});

// ─── View engine ───
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Static assets ───
// Cache immutable versioned assets for 1 year, others for 1 day
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true,
  setHeaders(res, filePath) {
    // Versioned assets (main.css?v=24, main.js?v=5) cache aggressively
    if (filePath.match(/\.(css|js)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    }
  }
}));

// ─── Helpers ───
const { formatTime, formatTimestamp, heatmapLevel } = db;

/** Replace WeRead t<N>_ or s_ thumbnail URLs with t7_ (~400px) for sharp rendering. */
function upgradeCoverURL(url) {
  if (!url || typeof url !== 'string') return url;
  return url.replace(/\/[st]\d*_/g, '/t7_');
}

/** Recursively upgrade all `cover` properties in objects/arrays. */
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

// ─── Routes ───

// Home page
app.get('/', (req, res) => {
  const { getSummary, getOverall, getHeatmap, getTrends, getCurrentlyReading, getRecentHighlights, getWeekdayDistribution, getHomepageStats } = db;

  const summary = getSummary();
  const overall_kv = getOverall();
  const overall = overall_kv.overall || {};
  const annual = upgradeCovers(overall_kv.annual || {});
  const annual2026 = upgradeCovers(overall_kv['annual-2026'] || {});

  const currentlyReading = upgradeCovers(getCurrentlyReading(6));
  const recentHighlights = getRecentHighlights(8);

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
  const yearProgress = ((now - yearStart) / (yearEnd - yearStart) * 100);
  const dayOfYear = Math.floor((now - yearStart) / 86400000) + 1;

  const heatmap = getHeatmap().filter(d => d.date.startsWith('2026'));
  const heatmapJson = JSON.stringify(heatmap);

  const trends = getTrends();
  const monthly2025 = trends.filter(t => t.year === 2025);
  const maxMonthly = Math.max(...monthly2025.map(m => m.totalSeconds), 1);

  const weekdayCounts = getWeekdayDistribution();

  // Homepage quick stats
  const hps = getHomepageStats();

  res.render('index', {
    title: '阅读书房',
    summary,
    annual,
    overall,
    formatTime,
    formatTimestamp,
    heatmapLevel,
    helpers: { formatTime, formatTimestamp, heatmapLevel },
    path: '/',
    heatmap: heatmapJson,
    monthly2025: JSON.stringify(monthly2025),
    maxMonthly,
    currentlyReading,
    recentHighlights,
    yearProgress: parseFloat(yearProgress.toFixed(1)),
    dayOfYear,
    daysInYear: Math.ceil((yearEnd - yearStart) / 86400000),
    weekdayCounts,
    weekdayMap: ['日','一','二','三','四','五','六'],
    annual2026,
    hpStats: hps,
    needsHtml2Canvas: true,
  });
});

// API: Random highlights for homepage shuffle
app.get('/api/home/highlights', (req, res) => {
  const { getRecentHighlights } = db;
  const n = parseInt(req.query.n) || 8;
  const highlights = getRecentHighlights(n);
  res.json({ highlights });
});

// Bookshelf page
app.get('/bookshelf', (req, res) => {
  const { getAllBooks, getAllCategories, getSummary, getBookReadTimes, getBooksSorted } = db;
  const filter = req.query.filter || 'all';
  const sortBy = req.query.sort || 'readtime';
  const allCategories = getAllCategories();

  const category = req.query.category || '';

  // Use sorted query if available
  let books;
  try {
    books = getBooksSorted(filter, category, sortBy);
  } catch (e) {
    books = upgradeCovers(getAllBooks(filter, category));
  }
  const summary = getSummary();
  const bookReadTimes = getBookReadTimes();

  // Merge readTime into each book
  books.forEach(b => {
    b.readTimeSec = (b.read_time || 0);
    if (!b.readTimeSec) {
      b.readTimeSec = bookReadTimes[b.title] || 0;
    }
  });

  res.render('bookshelf', {
    title: '书架',
    books,
    allCategories,
    filter,
    category,
    sortBy,
    summary,
    formatTimestamp,
    helpers: { formatTime, formatTimestamp },
    path: '/bookshelf',
  });
});

// Stats page
app.get('/stats', (req, res) => {
  const { getOverall, getSummary, getTrends, getDeepThinking, getBookTimeline, getYearlyIntensity, getMilestones, getAuthorStats, getHeatmap, getWeekdayDistribution, getReadingStats, getHomepageStats } = db;

  const overall_kv = getOverall();
  const overall = overall_kv.overall || {};
  const annual = upgradeCovers(overall_kv.annual || {});

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
    month: `${t.year}-${String(t.month).padStart(2,'0')}`,
    label: `${t.month}月`,
    year: t.year,
    seconds: t.totalSeconds,
    hours: Math.round(t.totalSeconds / 3600 * 10) / 10,
    readDays: t.readDays || 0,
  }));

  const summary = getSummary();

  // New sections
  const deepThinking = getDeepThinking(10);
  const bookTimeline = upgradeCovers(getBookTimeline());
  const yearlyIntensity = getYearlyIntensity();
  const milestones = getMilestones();
  const authorStats = getAuthorStats();

  // New graphical data
  const heatmapData = getHeatmap();
  const weekdayDist = getWeekdayDistribution();
  const readingStatsRaw = getReadingStats();
  const homepageStats = getHomepageStats();

  // Year-over-year comparison
  const nowYr = new Date().getFullYear();
  const thisYearTrend = trends.filter(t => t.year === nowYr);
  const lastYearTrend = trends.filter(t => t.year === nowYr - 1);
  const thisYearTotal = thisYearTrend.reduce((s, t) => s + t.totalSeconds, 0);
  const lastYearTotal = lastYearTrend.reduce((s, t) => s + t.totalSeconds, 0);
  const yoyChange = lastYearTotal > 0 ? Math.round(((thisYearTotal - lastYearTotal) / lastYearTotal) * 100) : null;

  res.render('stats', {
    title: '阅读统计',
    annual,
    overall,
    years: yearlyReadTimes,
    yearsData: years,
    monthly,
    summary,
    formatTime,
    formatTimestamp,
    helpers: { formatTime, formatTimestamp },
    path: '/stats',
    trends: JSON.stringify(trends),
    deepThinking,
    bookTimeline,
    yearlyIntensity,
    milestones,
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

// Notebooks page
app.get('/notebooks', (req, res) => {
  const { getAllNotebooks, getRecentNotes, getSummary } = db;

  const notebooks = upgradeCovers(getAllNotebooks());
  const recentNotes = getRecentNotes(30);
  const summary = getSummary();

  res.render('notebooks', {
    title: '笔记',
    notebooks,
    recentNotes,
    summary,
    helpers: { formatTime, formatTimestamp },
    path: '/notebooks',
  });
});

// API: Random notes for notebooks page shuffle
app.get('/api/notebooks/random', (req, res) => {
  const { getRandomNotes } = db;
  const n = parseInt(req.query.n) || 20;
  const notes = getRandomNotes(n);
  res.json({ notes });
});

// ─── Search ───
app.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.render('search', {
      title: '搜索',
      query: '',
      results: null,
      helpers: { formatTime, formatTimestamp },
      path: '/search',
    });
  }

  const { searchAll, getSummary } = db;
  const results = searchAll(q);
  const summary = getSummary();

  res.render('search', {
    title: `搜索：${q}`,
    query: q,
    results,
    totalResults: results.books.length + results.highlights.length + results.reviews.length,
    summary,
    formatTimestamp,
    helpers: { formatTime, formatTimestamp },
    path: '/search',
  });
});

// ─── API: Want-to-read toggle ───
app.post('/api/want-to-read', (req, res) => {
  const { setWantToRead } = db;
  const { bookId, want } = req.body;
  if (!bookId) return res.status(400).json({ error: 'bookId required' });
  setWantToRead(bookId, !!want);
  res.json({ ok: true });
});

// ─── API: Book rating ───
app.post('/api/rating', (req, res) => {
  const { setBookRating } = db;
  const { bookId, rating } = req.body;
  if (!bookId) return res.status(400).json({ error: 'bookId required' });
  setBookRating(bookId, parseInt(rating) || 0);
  res.json({ ok: true });
});

// ─── Tags API ───
app.get('/api/tags', (req, res) => {
  const { getAllTags } = db;
  res.json(getAllTags());
});

app.post('/api/tags', (req, res) => {
  const { createTag } = db;
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  res.json(createTag(name, color));
});

app.delete('/api/tags/:id', (req, res) => {
  const { deleteTag } = db;
  deleteTag(parseInt(req.params.id));
  res.json({ ok: true });
});

app.post('/api/note-tags', (req, res) => {
  const { setNoteTags } = db;
  const { noteId, noteType, tagIds } = req.body;
  if (!noteId || !noteType) return res.status(400).json({ error: 'noteId and noteType required' });
  setNoteTags(noteId, noteType, tagIds || []);
  res.json({ ok: true });
});

// API: Random highlight for hero section
app.get('/api/hero-highlight', (req, res) => {
  const { getRecentHighlights } = db;
  const highlights = getRecentHighlights(1);
  if (highlights.length === 0) return res.json({ text: '', bookTitle: '' });
  res.json({ text: highlights[0].markText, bookTitle: highlights[0].bookTitle });
});

// API: Full book detail (for modals) — single request with highlights + reviews
app.get('/api/book/:id', (req, res) => {
  const { getBookById, getBookHighlights, getBookReviews } = db;
  const book = getBookById(req.params.id);
  if (!book) return res.status(404).json({ error: 'Not found' });

  // Bundle highlights + reviews in same response to save 2 RTTs
  const highlights = getBookHighlights(book.title, 5);
  const reviews = getBookReviews(book.title, 5);
  res.json({ ...book, highlights, reviews });
});

// API: Random refresh of highlights or reviews for a book
app.get('/api/book/:id/:section', (req, res) => {
  const { getBookById, getBookHighlights, getBookReviews } = db;
  const book = getBookById(req.params.id);
  if (!book) return res.status(404).json({ error: 'Not found' });

  const n = parseInt(req.query.n) || 12;
  const section = req.params.section;

  if (section === 'highlights') {
    const highlights = getBookHighlights(book.title, n);
    return res.json({ highlights });
  } else if (section === 'reviews') {
    const reviews = getBookReviews(book.title, n);
    return res.json({ reviews });
  } else {
    return res.status(400).json({ error: 'Invalid section. Use "highlights" or "reviews".' });
  }
});

// Book detail page
app.get('/book/:id', (req, res) => {
  const { getBookById, getBookHighlights, getBookReviews, getBookReadTimes, getSummary, getBookMonthlyActivity, getBookChapterActivity, getBookIntro, getBookAllNotes, getBookRating } = db;
  const book = getBookById(req.params.id);
  if (!book) return res.status(404).send('未找到此书');

  const highlights = getBookHighlights(book.title, 12);
  const reviews = getBookReviews(book.title, 12);

  // Prefer per-book read_time from database (populated by sync_read_times.py)
  // Fall back to getBookReadTimes() title match (legacy, only covers top N books)
  let readTimeSec = book.readTime || 0;
  if (!readTimeSec) {
    const bookReadTimes = getBookReadTimes();
    readTimeSec = bookReadTimes[book.title] || 0;
  }

  // Monthly reading activity bars
  const { months: monthlyActivity, totalItems } = getBookMonthlyActivity(req.params.id);
  // Estimate monthly reading time by distributing total read time
  // proportionally across months based on highlight+review activity
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
    return {
      year: m.year,
      month: m.month,
      label: monthLabel,
      timeLabel,
      estimatedSec,
      highlights: m.highlights,
      reviews: m.reviews,
    };
  });
  const maxMonthlySec = Math.max(...monthlyBars.map(m => m.estimatedSec), 1);

  // Book intro
  const intro = getBookIntro(req.params.id);

  // Chapter engagement
  const chapterActivity = getBookChapterActivity(book.title);
  const maxChapterTotal = Math.max(...chapterActivity.map(c => c.total), 1);

  // All notes + rating
  const { all: allNotes, grouped: notesByChapter } = getBookAllNotes(book.title);
  const userRating = getBookRating(req.params.id);

  res.render('book', {
    title: book.title,
    book: upgradeCovers(book),
    highlights,
    reviews,
    readTimeSec,
    formatTimestamp,
    helpers: { formatTime, formatTimestamp },
    path: '/bookshelf',
    summary: getSummary(),
    monthlyBars,
    maxMonthlySec,
    intro,
    chapterActivity: chapterActivity.slice(0, 8),
    maxChapterTotal,
    needsHtml2Canvas: true,
    allNotes: allNotes.slice(0, 50),
    notesByChapter: Object.entries(notesByChapter).slice(0, 8).map(([ch, notes]) => ({ chapter: ch, count: notes.length })),
    userRating,
  });
});

// ─── Start (async: await DB init) ───
let server;

async function start() {
  await db.initDb();

  server = app.listen(PORT, '0.0.0.0', () => {
    const dbStatus = db.getDb() ? 'connected' : 'MISSING';
    console.log(`\n  \u{1F4DA} Reading Room running at http://0.0.0.0:${PORT}  [db: ${dbStatus}]\n`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    db.closeDb();
    server.close(() => process.exit(0));
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
