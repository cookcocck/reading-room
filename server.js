const express = require('express'),
      expressLayouts = require('express-ejs-layouts'),
      path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(expressLayouts);
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// ─── DB ───
const db = require('./src/db');

// Middleware: check DB availability before serving pages
app.use((req, res, next) => {
  // Allow static assets through even without DB
  if (req.path.startsWith('/css/') || req.path.startsWith('/js/') || req.path.startsWith('/images/') || req.path === '/favicon.ico') {
    return next();
  }
  if (!db.getDb()) {
    return res.status(503).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>数据库不可用</title>
      <style>body{font-family:system-ui,sans-serif;max-width:600px;margin:80px auto;padding:24px;line-height:1.6;color:#333}
      h1{color:#c00}code{background:#f5f5f5;padding:2px 6px;border-radius:4px;font-size:0.9em}</style></head>
      <body><h1>503 - 数据库不可用</h1>
      <p>数据库文件不存在或无法读取。请在服务器上运行以下命令创建数据库：</p>
      <pre><code>cd /home/admin/reading-site && python scripts/create_db.py</code></pre>
      <p>创建完成后重启服务：<code>pm2 restart reading-room</code></p></body></html>
    `);
  }
  next();
});

// ─── View engine ───
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Static assets ───
app.use(express.static(path.join(__dirname, 'public')));

// ─── Helpers (re-exported from db.js) ───
const { formatTime, formatTimestamp, heatmapLevel } = db;

// ─── Routes ───

// Home page
app.get('/', (req, res) => {
  const { getSummary, getOverall, getHeatmap, getTrends, getCurrentlyReading, getRecentHighlights, getWeekdayDistribution } = db;

  // Same data as old server.js
  const summary = getSummary();
  const overall_kv = getOverall();
  const overall = overall_kv.overall || {};
  const annual = overall_kv.annual || {};
  const annual2026 = overall_kv['annual-2026'] || {};

  // Currently reading (progress > 0, unfinished)
  const currentlyReading = getCurrentlyReading(6);

  // Recent highlights (from DB, random)
  const recentHighlights = getRecentHighlights(8);

  // Year progress
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
  const yearProgress = ((now - yearStart) / (yearEnd - yearStart) * 100);
  const dayOfYear = Math.floor((now - yearStart) / 86400000) + 1;

  // Heatmap data (for 2026)
  const heatmap = getHeatmap().filter(d => d.date.startsWith('2026'));
  const heatmapJson = JSON.stringify(heatmap);

  // Monthly 2025 trends
  const trends = getTrends();
  const monthly2025 = trends.filter(t => t.year === 2025);
  const maxMonthly = Math.max(...monthly2025.map(m => m.totalSeconds), 1);

  // Weekday distribution
  const weekdayCounts = getWeekdayDistribution();

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
  });
});

// Bookshelf page
app.get('/bookshelf', (req, res) => {
  const { getAllBooks, getAllCategories, getSummary } = db;
  const filter = req.query.filter || 'all';
  const category = req.query.category || '';

  const books = getAllBooks(filter, category);
  const allCategories = getAllCategories();
  const summary = getSummary();

  res.render('bookshelf', {
    title: '书架',
    books,
    allCategories,
    filter,
    category,
    summary,
    formatTimestamp,
    helpers: { formatTime, formatTimestamp },
    path: '/bookshelf',
  });
});

// Stats page
app.get('/stats', (req, res) => {
  const { getOverall, getSummary, getTrends } = db;

  const overall_kv = getOverall();
  const overall = overall_kv.overall || {};
  const annual = overall_kv.annual || {};

  const trends = getTrends();

  // Yearly data (from overall.yearlyReadTimes)
  const yearlyReadTimes = overall.yearlyReadTimes || {};
  const years = Object.entries(yearlyReadTimes)
    .map(([ts, secs]) => ({
      year: new Date(parseInt(ts) * 1000).getFullYear(),
      seconds: secs,
      hours: Math.round(secs / 3600 * 10) / 10,
    }))
    .sort((a, b) => a.year - b.year);

  // Monthly from trends
  const monthly = trends.map(t => ({
    month: `${t.year}-${String(t.month).padStart(2,'0')}`,
    label: `${t.month}月`,
    seconds: t.totalSeconds,
    hours: Math.round(t.totalSeconds / 3600 * 10) / 10,
  }));

  const summary = getSummary();

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
  });
});

// Notebooks page
app.get('/notebooks', (req, res) => {
  const { getNotebooks, getSummary } = db;

  const page = parseInt(req.query.page) || 1;
  const perPage = 30;

  const result = getNotebooks(page, perPage);
  const summary = getSummary();

  res.render('notebooks', {
    title: '笔记',
    notebooks: result.notebooks,
    totalNotebooks: result.total,
    currentPage: page,
    totalPages: result.totalPages,
    summary,
    helpers: { formatTime, formatTimestamp },
    path: '/notebooks',
  });
});

// About page
app.get('/about', (req, res) => {
  const { getSummary, getOverall } = db;

  const overall_kv = getOverall();
  const overall = overall_kv.overall || {};
  const annual = overall_kv.annual || {};

  const summary = getSummary();

  res.render('about', {
    title: '关于',
    summary,
    annual,
    overall,
    formatTimestamp,
    helpers: { formatTime, formatTimestamp },
    path: '/about',
  });
});

// API: Full book detail (for modals)
app.get('/api/book/:id', (req, res) => {
  const { getBookById } = db;
  const book = getBookById(req.params.id);
  if (!book) return res.status(404).json({ error: 'Not found' });

  // The old server.js returned { ...book, notebook: ... }
  // But the actual API in the old server.js was:
  // res.json({ ...book, notebook: nb ? { reviewCount, noteCount, bookmarkCount, totalNotes } : null });
  // Which is exactly what getBookById returns.

  res.json(book);
});

// ─── Start ───
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  📚 Reading Room running at http://0.0.0.0:${PORT}\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  db.closeDb();
  server.close(() => process.exit(0));
});
