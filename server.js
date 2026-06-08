const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

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

// ─── Routes ───

// Home page
app.get('/', (req, res) => {
  res.render('index', {
    title: '阅读书房',
    summary,
    annual,
    overall,
    formatTime,
    formatTimestamp,
    helpers: { formatTime, formatTimestamp },
    path: '/',
  });
});

// Bookshelf page
app.get('/bookshelf', (req, res) => {
  const filter = req.query.filter || 'all'; // all | finished | reading
  const sort = req.query.sort || 'recent'; // recent | title | author
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
  // Yearly reading data
  const yearlyTimes = overall.yearlyReadTimes || {};
  const years = Object.entries(yearlyTimes)
    .map(([ts, secs]) => ({
      year: new Date(parseInt(ts) * 1000).getFullYear(),
      seconds: secs,
      hours: Math.round(secs / 3600 * 10) / 10,
    }))
    .sort((a, b) => a.year - b.year);

  // Monthly data from annual
  const monthlyRaw = annual.monthlyReadTimes || {};
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
