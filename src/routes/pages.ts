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
import { upgradeCoverURL, upgradeCovers } from '../utils/covers';
import type { Book } from '../types';

const router = Router();

interface BookWithReadTime extends Book {
  readTimeSec: number;
}

// ─── Home ───
router.get('/', (_req: Request, res: Response) => {
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
    books = upgradeCovers(getAllBooks(filter, category));
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
    month: `${t.year}-${String(t.month).padStart(2, '0')}`,
    label: `${t.month}月`,
    year: t.year,
    seconds: t.totalSeconds,
    hours: Math.round(t.totalSeconds / 3600 * 10) / 10,
    readDays: t.readDays || 0,
  }));

  const summary = getSummary();
  const deepThinking = getDeepThinking(10);
  const bookTimeline = upgradeCovers(getBookTimeline());
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
  const notebooks = upgradeCovers(getAllNotebooks());
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
    book: upgradeCovers(book),
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

// ─── Author Detail ───
router.get('/author/:name', (req: Request, res: Response) => {
  const authorName = decodeURIComponent(req.params.name as string);
  const entry = getAuthorByName(authorName);
  if (!entry) {
    res.status(404).send('未找到该作者');
    return;
  }

  // Sort books by read_time descending, then finished first
  const books = [...entry.books];
  books.sort((a, b) => {
    if ((a.finished ? 1 : 0) !== (b.finished ? 1 : 0)) return (b.finished ? 1 : 0) - (a.finished ? 1 : 0);
    return (b.read_time || 0) - (a.read_time || 0);
  });

  // Category distribution
  const catMap = new Map<string, number>();
  for (const b of books) {
    const cat = b.category || '未分类';
    catMap.set(cat, (catMap.get(cat) || 0) + 1);
  }
  const categories = Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  // Max read time for relative bar
  const maxReadTime = Math.max(...books.map(b => b.read_time || 0), 1);

  // Author's highlights & reviews from all books
  const highlights = getAuthorHighlights(authorName);
  const reviews = getAuthorReviews(authorName);

  // Reading timeline across months
  const allTimestamps = books
    .filter(b => b.last_read_time > 0)
    .map(b => b.last_read_time)
    .sort();
  const firstRead = allTimestamps.length > 0
    ? allTimestamps[0]
    : (books.length > 0 ? books[books.length - 1].update_time : 0);
  const lastRead = allTimestamps.length > 0
    ? allTimestamps[allTimestamps.length - 1]
    : (books.length > 0 ? books[0].update_time : 0);

  res.render('author-detail', {
    title: entry.author,
    author: entry,
    books: upgradeCovers(books),
    categories,
    maxReadTime,
    totalBooks: books.length,
    totalFinished: entry.finishedCount,
    totalReadTime: entry.totalReadTime,
    totalNotes: entry.totalNotes,
    highlights,
    reviews,
    formatTime, formatTimestamp,
    helpers: { formatTime, formatTimestamp },
    path: '/authors',
    firstRead, lastRead,
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
  const allBooks = upgradeCovers(getAllBooks()).map((b: Book) => ({
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

  const allBooks = upgradeCovers(getAllBooks()).map((b: Book) => ({
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

export default router;
