/** db.js — SQLite database interface for Reading Room
 *
 *  Replaces all src/data/*.json loading with direct DB queries.
 *  Uses better-sqlite3 (sync) for compatibility with EJS.
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'db', 'reading-room.db');

// ─── Helpers (same as old server.js helpers) ───

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

// ─── Database connection ───

let db = null;

function getDb() {
  if (db) return db;
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Database not found at ${DB_PATH}. Run "python scripts/create_db.py" first.`);
  }
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  console.log('[db] Connected to reading-room.db');
  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
    console.log('[db] Connection closed');
  }
}

// ─── Query Functions ───

/**
 * Get all books joined with notebook stats.
 * Returns array of objects: { id, title, author, cover, category, finished, update_time, reviewCount, ... }
 */
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

/**
 * Get a single book with notebook stats.
 */
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

  // Format as the old API expected
  return {
    ...book,
    finished: !!book.finished,  // convert int to bool
    notebook: book.noteCount != null ? {
      reviewCount: book.reviewCount || 0,
      noteCount: book.noteCount || 0,
      bookmarkCount: book.bookmarkCount || 0,
      totalNotes: book.totalNotes || 0,
    } : null,
  };
}

/**
 * Get notebook list with pagination.
 */
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

/**
 * Get random recent highlights with book title.
 */
function getRecentHighlights(limit = 8) {
  const d = getDb();
  // Get highlights ordered randomly, limited
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
  }));
}

/**
 * Get reading heatmap data for a year.
 */
function getHeatmap() {
  const d = getDb();
  return d.prepare('SELECT date, seconds FROM reading_sessions ORDER BY date').all();
}

/**
 * Get monthly reading trends for a year.
 */
function getTrends() {
  const d = getDb();
  return d.prepare('SELECT year, month, total_seconds AS totalSeconds, read_days AS readDays FROM reading_trends ORDER BY year, month').all();
}

/**
 * Get weekday distribution from heatmap data.
 */
function getWeekdayDistribution() {
  const d = getDb();
  const rows = d.prepare("SELECT date, seconds FROM reading_sessions WHERE date >= '2026-01-01'").all();

  const counts = [0, 0, 0, 0, 0, 0, 0]; // Mon=0 ... Sun=6 in JS getDay()
  rows.forEach(r => {
    const date = new Date(r.date);
    counts[date.getDay()] += r.seconds;
  });
  return counts;
}

/**
 * Get summary stats.
 */
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

/**
 * Get overall stats. Falls back to JSON file if not in DB.
 */
function getOverall() {
  const d = getDb();
  const row = d.prepare("SELECT name, value FROM kv_store WHERE name IN ('overall', 'annual')").all();

  const result = {};
  row.forEach(r => {
    try { result[r.name] = JSON.parse(r.value); } catch(e) {}
  });
  return result;
}

/**
 * Get currently reading books (progress > 0, unfinished).
 * Note: Since books.json doesn't have progress field, we use update_time
 * to identify recently active books that aren't finished.
 */
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

/**
 * Get all unique categories.
 */
function getAllCategories() {
  const d = getDb();
  return d.prepare("SELECT DISTINCT category FROM books WHERE category != '' ORDER BY category")
    .all()
    .map(r => r.category);
}

/**
 * Get total reading time and reading days.
 */
function getReadingStats() {
  const d = getDb();
  const row = d.prepare('SELECT COALESCE(SUM(seconds), 0) AS total_sec, COUNT(*) AS days FROM reading_sessions').get();
  return {
    totalReadTimeSec: row.total_sec,
    readDays: row.days,
  };
}

// ─── Exports ───

module.exports = {
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
  // helpers
  formatTime,
  formatTimestamp,
  heatmapLevel,
};
