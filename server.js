const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Layout engine ───
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// ─── Load data at startup ───
const dataDir = path.join(__dirname, 'src', 'data');
const loadJSON = (filename) => {
  try {
    const raw = fs.readFileSync(path.join(dataDir, filename), 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to load ${filename}:`, e.message);
    return null;
  }
};

const books = loadJSON('books.json') || [];
const annual = loadJSON('annual.json') || {};
const overall = loadJSON('overall.json') || {};
const notebooks = loadJSON('notebooks.json') || [];
const summary = loadJSON('summary.json') || {};
const heatmap = loadJSON('reading-heatmap.json') || [];
const trends = loadJSON('reading-trends.json') || [];
const annual2026 = loadJSON('annual-2026.json') || {};
const notesDetail = loadJSON('notes_detail.json') || {};

// ─── View engine ───
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Static assets ───
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(dataDir));

// ─── Helpers ───
const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatTimestamp = (ts) => {
  if (!ts || ts <= 0) return '';
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const heatmapLevel = (seconds) => {
  if (!seconds || seconds <= 0) return 0;
  if (seconds < 1800) return 1;       // < 30min
  if (seconds < 3600) return 2;       // 30-60min
  if (seconds < 7200) return 3;       // 1-2h
  if (seconds < 10800) return 4;      // 2-3h
  return 5;                            // > 3h
};

// ─── Routes ───

// Home page
app.get('/', (req, res) => {
  // Currently reading books (progress > 0 and unfinished)
  const currentlyReading = books
    .filter(b => b.progress > 0 && !b.finished)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 6);

  // Recent highlights (from notes_detail.json)
  const recentHighlights = [];
  for (const [bookId, detail] of Object.entries(notesDetail)) {
    if (!detail.highlights || detail.highlights.length === 0) continue;
    // Take the 3 most recent highlights per book (assuming they're in order)
    const latest = detail.highlights.slice(-3).map(h => ({
      ...h,
      bookTitle: detail.title,
      bookCover: detail.cover || '',
      bookId,
    }));
    recentHighlights.push(...latest);
  }
  // Shuffle and take 8
  const shuffled = recentHighlights.sort(() => Math.random() - 0.5).slice(0, 8);

  // Year progress
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
  const yearProgress = ((now - yearStart) / (yearEnd - yearStart) * 100).toFixed(1);
  const daysInYear = ((yearEnd - yearStart) / 86400000);
  const dayOfYear = Math.floor((now - yearStart) / 86400000) + 1;

  // Monthly trend data for sparklines
  const monthlyLabels = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const monthly2025 = trends.filter(t => t.year === 2025).sort((a,b) => a.month - b.month);
  const maxMonthly = Math.max(...monthly2025.map(m => m.totalSeconds), 1);

  // Weekday distribution (from heatmap data)
  const weekdayMap = ['日','一','二','三','四','五','六'];
  const weekdayCounts = [0,0,0,0,0,0,0];
  heatmap.forEach(d => {
    const date = new Date(d.date);
    weekdayCounts[date.getDay()] += d.seconds;
  });

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
    heatmap: JSON.stringify(heatmap),
    monthly2025: JSON.stringify(monthly2025),
    maxMonthly,
    currentlyReading,
    recentHighlights,
    yearProgress,
    dayOfYear,
    daysInYear,
    weekdayCounts,
    weekdayMap,
  });
});

// Bookshelf page
app.get('/bookshelf', (req, res) => {
  const filter = req.query.filter || 'all';
  const sort = req.query.sort || 'recent';
  const category = req.query.category || '';

  let filtered = [...books];

  if (filter === 'finished') {
    filtered = filtered.filter(b => b.finished);
  } else if (filter === 'reading') {
    filtered = filtered.filter(b => !b.finished);
  }

  if (category) {
    filtered = filtered.filter(b => b.category === category);
  }

  const allCategories = [...new Set(books.map(b => b.category).filter(Boolean))].sort();

  res.render('bookshelf', {
    title: '书架',
    books: filtered,
    allCategories,
    filter,
    sort,
    category,
    summary,
    formatTimestamp,
    helpers: { formatTime, formatTimestamp },
    path: '/bookshelf',
  });
});

// Stats page
app.get('/stats', (req, res) => {
  const yearlyTimes = overall.yearlyReadTimes || {};
  const years = Object.entries(yearlyTimes)
    .map(([ts, secs]) => ({
      year: new Date(parseInt(ts) * 1000).getFullYear(),
      seconds: secs,
      hours: Math.round(secs / 3600 * 10) / 10,
    }))
    .sort((a, b) => a.year - b.year);

  const monthly = Object.entries(annual.readTimes || {})
    .map(([ts, secs]) => {
      const d = new Date(parseInt(ts) * 1000);
      return {
        month: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
        label: `${d.getMonth()+1}月`,
        seconds: secs,
        hours: Math.round(secs / 3600 * 10) / 10,
      };
    });

  res.render('stats', {
    title: '阅读统计',
    annual,
    overall,
    years: yearlyTimes,
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
  const page = parseInt(req.query.page) || 1;
  const perPage = 30;
  const totalPages = Math.ceil(notebooks.length / perPage);
  const paged = notebooks.slice((page - 1) * perPage, page * perPage);

  res.render('notebooks', {
    title: '笔记',
    notebooks: paged,
    totalNotebooks: notebooks.length,
    currentPage: page,
    totalPages,
    summary,
    helpers: { formatTime, formatTimestamp },
    path: '/notebooks',
  });
});

// About page
app.get('/about', (req, res) => {
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
  const book = books.find(b => b.id === req.params.id);
  if (!book) return res.status(404).json({ error: 'Not found' });

  const nb = notebooks.find(n => n.id === req.params.id) || null;

  res.json({ ...book, notebook: nb ? {
    reviewCount: nb.reviewCount,
    noteCount: nb.noteCount,
    bookmarkCount: nb.bookmarkCount,
    totalNotes: nb.totalNotes,
  } : null });
});

// ─── Start ───
app.listen(PORT, () => {
  console.log(`\n  📚 Reading Room running at http://localhost:${PORT}\n`);
});
