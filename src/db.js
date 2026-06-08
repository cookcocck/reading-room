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
  }));
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
  // helpers
  formatTime,
  formatTimestamp,
  heatmapLevel,
};
