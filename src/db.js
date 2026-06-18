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

// ─── Author UID helpers ───
// Stable hash → 8-char hex, deterministic across restarts.

function generateAuthorId(name) {
  if (!name || typeof name !== 'string') return null;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash | 0;
  }
  return 'au' + Math.abs(hash).toString(16).padStart(6, '0');
}

// Extract primary author: split by delimiters, strip (xx)/[xx]/（xx） prefix, trim.
function normalizeAuthorName(rawAuthor) {
  if (!rawAuthor || typeof rawAuthor !== 'string') return '';
  const names = rawAuthor.split(/[,，\/、&]/);
  let name = names[0].trim();
  // Strip nationality / role prefixes: (俄), [法], （日）, (美) etc.
  name = name.replace(/^[\[(（][^\]）)]{1,6}[\])）]\s*/u, '').trim();
  return name;
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
    },
    // Thin wrapper around sql.js exec for raw queries (SELECT only)
    exec(sql) {
      return sqlDb.exec(sql);
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

  // ═══════════════════════════════════════════════════════════════════
  //  INIT — load database file into sql.js
  //  Outer try/catch ONLY guards file I/O; individual table ops are
  //  independently catch-guarded so no single failure cascades.
  // ═══════════════════════════════════════════════════════════════════
  try {
    const SQL = await initSqlJs();
    const fileBuffer = fs.readFileSync(DB_PATH);
    sqlDb = new SQL.Database(fileBuffer);
    db = createWrapper(sqlDb);
  } catch (err) {
    console.error(`[db] Failed to open database: ${err.message}`);
    return null;
  }

  // ─── Helper: run SQL safely (log + continue on error) ───
  function _safeRun(desc, sql) {
    try {
      sqlDb.run(sql);
      return true;
    } catch (e) {
      console.warn(`[db] ${desc}: ${e.message}`);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  CRITICAL TABLES — every table independently, no cascade failures
  // ═══════════════════════════════════════════════════════════════════

  _safeRun('reviews', `CREATE TABLE IF NOT EXISTS reviews (
    review_id TEXT PRIMARY KEY, book_id TEXT NOT NULL,
    content TEXT DEFAULT '', chapter_name TEXT DEFAULT '',
    star INTEGER DEFAULT -1, create_time INTEGER NOT NULL
  )`);
  _safeRun('reviews_idx', 'CREATE INDEX IF NOT EXISTS idx_reviews_book ON reviews(book_id)');

  // Core tables (also created by sync.py/schema.sql — defense in depth)
  _safeRun('books', `CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY, title TEXT NOT NULL,
    author TEXT DEFAULT '', cover TEXT DEFAULT '',
    category TEXT DEFAULT '', finished INTEGER NOT NULL DEFAULT 0,
    update_time INTEGER DEFAULT 0, read_time INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0, last_read_time INTEGER DEFAULT 0,
    intro TEXT DEFAULT '', want_to_read INTEGER DEFAULT 0,
    user_rating INTEGER DEFAULT 0
  )`);
  _safeRun('highlights', `CREATE TABLE IF NOT EXISTS highlights (
    bookmark_id TEXT PRIMARY KEY, book_id TEXT NOT NULL,
    chapter_uid TEXT DEFAULT '', chapter_title TEXT DEFAULT '',
    mark_text TEXT DEFAULT '', color_style TEXT DEFAULT '0',
    type INTEGER DEFAULT 1, create_time INTEGER NOT NULL,
    range_text TEXT DEFAULT ''
  )`);
  _safeRun('h_idx_book', 'CREATE INDEX IF NOT EXISTS idx_highlights_book ON highlights(book_id)');
  _safeRun('h_idx_time', 'CREATE INDEX IF NOT EXISTS idx_highlights_time ON highlights(create_time)');
  _safeRun('notebooks', `CREATE TABLE IF NOT EXISTS notebooks (
    book_id TEXT PRIMARY KEY, review_count INTEGER DEFAULT 0,
    note_count INTEGER DEFAULT 0, bookmark_count INTEGER DEFAULT 0,
    total_notes INTEGER DEFAULT 0, sort INTEGER DEFAULT 0
  )`);

  _safeRun('reading_sessions', `CREATE TABLE IF NOT EXISTS reading_sessions (
    date TEXT PRIMARY KEY, seconds INTEGER NOT NULL DEFAULT 0
  )`);
  _safeRun('reading_trends', `CREATE TABLE IF NOT EXISTS reading_trends (
    year INTEGER NOT NULL, month INTEGER NOT NULL,
    total_seconds INTEGER NOT NULL DEFAULT 0,
    read_days INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (year, month)
  )`);
  _safeRun('summary', `CREATE TABLE IF NOT EXISTS summary (
    id INTEGER PRIMARY KEY CHECK(id=1),
    total_books INTEGER DEFAULT 0, finished_count INTEGER DEFAULT 0,
    total_note_count INTEGER DEFAULT 0, notebook_books_count INTEGER DEFAULT 0,
    categories TEXT DEFAULT '[]', top_authors TEXT DEFAULT '[]',
    archives TEXT DEFAULT '[]'
  )`);
  _safeRun('summary_init', 'INSERT OR IGNORE INTO summary (id) VALUES (1)');
  _safeRun('kv_store', `CREATE TABLE IF NOT EXISTS kv_store (
    name TEXT PRIMARY KEY, value TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now'))
  )`);
  // Add updated_at if missing on older DB
  try { sqlDb.run("ALTER TABLE kv_store ADD COLUMN updated_at TEXT DEFAULT ''"); }
  catch (e) { /* already exists */ }

  // ─── Column migrations (each independently guarded) ───
  const _migrations = [
    ['books', 'intro', "TEXT DEFAULT ''"],
    ['books', 'read_time', 'INTEGER DEFAULT 0'],
    ['books', 'progress', 'INTEGER DEFAULT 0'],
    ['books', 'last_read_time', 'INTEGER DEFAULT 0'],
    ['books', 'want_to_read', 'INTEGER DEFAULT 0'],
    ['books', 'user_rating', 'INTEGER DEFAULT 0'],
    ['reviews', 'abstract', "TEXT DEFAULT ''"],
  ];
  for (const [table, col, type] of _migrations) {
    try {
      sqlDb.run(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
      console.log(`[db] Migration: added ${table}.${col}`);
    } catch (e) { /* already exists */ }
  }

  // ─── Author ID migration: add column + backfill + index ───
  try {
    sqlDb.run('ALTER TABLE books ADD COLUMN author_id TEXT');
    console.log('[db] Migration: added books.author_id');
  } catch (e) { /* already exists */ }
  try {
    sqlDb.run('CREATE INDEX IF NOT EXISTS idx_books_author_id ON books(author_id)');
  } catch (e) { /* ignore */ }

  // Backfill missing author_ids for ALL rows (re-runnable, handles edge cases)
  const missingBooks = sqlDb.exec(`
    SELECT id, author, title FROM books WHERE author_id IS NULL OR author_id = ''
  `);
  if (missingBooks.length > 0 && missingBooks[0].values.length > 0) {
    const rows = missingBooks[0].values;
    const stmt = sqlDb.prepare('UPDATE books SET author_id = ? WHERE id = ?');
    let filled = 0;
    const seen = new Map(); // track collisions for dedup
    for (const [bookId, rawAuthor, title] of rows) {
      // Stage 1: normalize the author field (strip nationality prefix, split)
      let name = normalizeAuthorName(rawAuthor);
      // Stage 2: if normalization failed, try author field as-is
      if (!name && rawAuthor && rawAuthor.trim()) {
        name = rawAuthor.trim();
      }
      // Stage 3: ultimate fallback — use book title hash
      if (!name && title) {
        name = title;
      }
      if (!name) continue; // truly empty, can't do anything
      let uid = seen.get(name);
      if (!uid) {
        uid = generateAuthorId(name);
        seen.set(name, uid);
      }
      stmt.run([uid, bookId]);
      filled++;
    }
    stmt.free();
    console.log(`[db] Author ID backfill: ${filled} books, ${seen.size} unique authors`);
  }

  // ─── Optional tables (advanced SQL features — may fail on old sql.js) ───
  _safeRun('booklists', `CREATE TABLE IF NOT EXISTS booklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  )`);
  _safeRun('booklist_items', `CREATE TABLE IF NOT EXISTS booklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, list_id INTEGER NOT NULL,
    book_id TEXT NOT NULL, note TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0, added_at INTEGER NOT NULL,
    UNIQUE(list_id, book_id)
  )`);
  _safeRun('bl_items_idx', 'CREATE INDEX IF NOT EXISTS idx_bl_items_list ON booklist_items(list_id)');

  _safeRun('tags', `CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366f1', created_at INTEGER NOT NULL
  )`);
  _safeRun('note_tags', `CREATE TABLE IF NOT EXISTS note_tags (
    note_id TEXT NOT NULL, note_type TEXT NOT NULL, tag_id INTEGER NOT NULL,
    PRIMARY KEY (note_id, note_type, tag_id)
  )`);

  // ─── Persist any auto-migrations back to disk ───
  try {
    fs.writeFileSync(DB_PATH, sqlDb.export());
  } catch (e) {
    console.error('[db] Failed to save DB after migrations:', e.message);
  }

  console.log(`[db] Connected to reading-room.db (sql.js, ${(fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(1)} MB)`);
  return db;
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

function getRandomNotes(limit = 20) {
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
    ORDER BY RANDOM()
    LIMIT ?
  `).all(limit);
}

function getHeatmap() {
  const d = getDb();
  // Merge reading_sessions (initial import) + books.last_read_time (real-time)
  const dateMap = new Map();

  // Source 1: reading_sessions
  const sessions = d.prepare('SELECT date, seconds FROM reading_sessions').all();
  for (const s of sessions) {
    dateMap.set(s.date, (dateMap.get(s.date) || 0) + s.seconds);
  }

  // Source 2: books.last_read_time (authoritative, updated every sync)
  // We estimate per-book daily reading based on last_read_time recency
  const bookTimes = d.prepare(
    'SELECT last_read_time, read_time FROM books WHERE last_read_time > 0'
  ).all();
  for (const row of bookTimes) {
    const dt = new Date(row.last_read_time * 1000);
    const ds = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    // Only add if not already in sessions (avoid double counting)
    if (!dateMap.has(ds)) {
      // Estimate: distribute total read_time across its reading days
      dateMap.set(ds, (dateMap.get(ds) || 0) + Math.max(Math.round(row.read_time / 30), 60));
    }
  }

  const result = [];
  for (const [date, seconds] of dateMap) {
    result.push({ date, seconds });
  }
  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

function getTrends() {
  const d = getDb();
  return d.prepare('SELECT year, month, total_seconds AS totalSeconds, read_days AS readDays FROM reading_trends ORDER BY year, month').all();
}

function getWeekdayDistribution() {
  const d = getDb();
  const counts = [0, 0, 0, 0, 0, 0, 0];

  // Source 1: reading_sessions
  const sessions = d.prepare('SELECT date, seconds FROM reading_sessions').all();
  for (const r of sessions) {
    counts[new Date(r.date).getDay()] += r.seconds;
  }

  // Source 2: books.last_read_time (authoritative)
  const bookTimes = d.prepare(
    'SELECT last_read_time, read_time FROM books WHERE last_read_time > 0'
  ).all();
  for (const row of bookTimes) {
    const dt = new Date(row.last_read_time * 1000);
    const ds = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    // Check if this date is already covered by reading_sessions
    const alreadyCovered = sessions.some(s => s.date === ds);
    if (!alreadyCovered) {
      counts[dt.getDay()] += Math.max(Math.round(row.read_time / 30), 60);
    }
  }

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

  // ── Reading days: merge reading_sessions + books.last_read_time ──
  // reading_sessions is from the initial import only; books.last_read_time
  // is updated every sync cycle and is the authoritative real-time source.
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const todayTs = Math.floor(now.getTime() / 1000);

  // Collect all reading dates from both sources
  const combinedDates = new Set();

  // Source 1: reading_sessions table
  const sessions = d.prepare('SELECT date FROM reading_sessions ORDER BY date').all();
  for (const s of sessions) combinedDates.add(s.date);

  // Source 2: books.last_read_time (updated by sync.py every run)
  const bookTimes = d.prepare(
    'SELECT last_read_time FROM books WHERE last_read_time > 0'
  ).all();
  for (const row of bookTimes) {
    const d = new Date(row.last_read_time * 1000);
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    combinedDates.add(ds);
  }

  const dates = [...combinedDates].sort();

  // Month days — count from combined set
  let monthDays = 0;
  for (const d of dates) { if (d >= monthStart) monthDays++; }

  // Longest streak
  let maxStreak = 0, curStreak = 0;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i]) - new Date(dates[i-1])) / 86400000;
    if (diff === 1) curStreak = curStreak > 0 ? curStreak + 1 : 2;
    else { if (curStreak > maxStreak) maxStreak = curStreak; curStreak = 0; }
  }
  if (curStreak > maxStreak) maxStreak = curStreak;

  // Current streak: count backwards from today
  const dateSet = new Set(dates);
  let currentStreak = 0;
  let checkDate = new Date(today);
  while (dateSet.has(`${checkDate.getFullYear()}-${String(checkDate.getMonth()+1).padStart(2,'0')}-${String(checkDate.getDate()).padStart(2,'0')}`)) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  // If today wasn't in set, check from yesterday
  if (currentStreak === 0) {
    checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1);
    while (dateSet.has(`${checkDate.getFullYear()}-${String(checkDate.getMonth()+1).padStart(2,'0')}-${String(checkDate.getDate()).padStart(2,'0')}`)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  return {
    monthDays,
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

// ─── Annual Books (year page) ───

function getAnnualBooks(year) {
  const d = getDb();
  const start = Math.floor(new Date(`${year}-01-01T00:00:00`).getTime() / 1000);
  const end   = Math.floor(new Date(`${year + 1}-01-01T00:00:00`).getTime() / 1000);

  const books = upgradeCovers(d.prepare(`
    SELECT b.*, n.total_notes AS totalNotes, n.note_count AS noteCount, n.review_count AS reviewCount
    FROM books b
    LEFT JOIN notebooks n ON b.id = n.book_id
    WHERE b.update_time >= ? AND b.update_time < ?
    ORDER BY b.update_time ASC
  `).all(start, end));

  const totalReadTime = books.reduce((s, b) => s + (b.read_time || 0), 0);
  const finishedCount = books.filter(b => b.finished).length;
  const totalNotes    = books.reduce((s, b) => s + (b.totalNotes || 0), 0);

  return { books, totalReadTime, finishedCount, totalNotes };
}

function getAnnualYears() {
  const d = getDb();
  const rows = d.prepare(
    'SELECT DISTINCT CAST(strftime(\'%Y\', datetime(update_time, \'unixepoch\')) AS INTEGER) AS yr FROM books WHERE update_time > 0 ORDER BY yr DESC'
  ).all();
  return rows.map(r => r.yr).filter(Boolean);
}

// ─── Authors (authors page) ───

// ─── Runtime author_id auto-fill: catches stragglers from sync.py ───
// Cheap SELECT → only runs UPDATE when there's actually missing data.
function _ensureAuthorIds(d) {
  const stragglers = d.exec(`
    SELECT id, author, title FROM books WHERE author_id IS NULL OR author_id = ''
  `);
  if (!stragglers[0] || stragglers[0].values.length === 0) return;

  const rows = stragglers[0].values;
  const stmt = sqlDb.prepare('UPDATE books SET author_id = ? WHERE id = ?');
  const seen = new Map();
  let filled = 0;
  for (const [bookId, rawAuthor, title] of rows) {
    let name = normalizeAuthorName(rawAuthor);
    if (!name && rawAuthor && rawAuthor.trim()) name = rawAuthor.trim();
    if (!name && title) name = title;
    if (!name) continue;
    let uid = seen.get(name);
    if (!uid) { uid = generateAuthorId(name); seen.set(name, uid); }
    stmt.run([uid, bookId]);
    filled++;
  }
  stmt.free();
  if (filled > 0) console.log(`[db] Auto-filled ${filled} missing author_ids`);
}

// ─── Author list (grouped by UID) ───
function getAuthorsAll() {
  const d = getDb();
  _ensureAuthorIds(d);


  const books = upgradeCovers(d.prepare(`
    SELECT b.id, b.title, b.author, b.cover, b.finished, b.read_time, b.update_time, b.category, b.author_id,
      n.total_notes AS totalNotes
    FROM books b
    LEFT JOIN notebooks n ON b.id = n.book_id
    WHERE b.author_id IS NOT NULL
    ORDER BY b.author_id ASC, b.update_time DESC
  `).all());

  // Group by author_id (stable UID, no string matching)
  const map = new Map();
  for (const book of books) {
    const uid = book.author_id;
    if (!map.has(uid)) {
      map.set(uid, {
        uid,
        author: normalizeAuthorName(book.author), // display name
        books: [],
        totalReadTime: 0,
        finishedCount: 0,
        totalNotes: 0,
      });
    }
    const entry = map.get(uid);
    entry.books.push(book);
    entry.totalReadTime += book.read_time || 0;
    if (book.finished) entry.finishedCount++;
    entry.totalNotes += book.totalNotes || 0;
  }

  // Sort: most books first, then most reading time
  const authors = Array.from(map.values())
    .filter(a => a.books.length > 0)
    .sort((a, b) => (b.books.length - a.books.length) || (b.totalReadTime - a.totalReadTime));

  return authors;
}

function getAuthorDetail(authorId) {
  const d = getDb();

  const authorBooks = upgradeCovers(d.prepare(`
    SELECT b.id, b.title, b.author, b.cover, b.finished, b.read_time,
      b.update_time, b.category, b.intro,
      n.total_notes AS totalNotes
    FROM books b
    LEFT JOIN notebooks n ON b.id = n.book_id
    WHERE b.author_id = ?
    ORDER BY b.finished DESC, b.read_time DESC
  `).all(authorId));

  if (authorBooks.length === 0) return null;

  const displayName = normalizeAuthorName(authorBooks[0].author);
  const totalReadTime = authorBooks.reduce((s, b) => s + (b.read_time || 0), 0);
  const finishedCount = authorBooks.filter(b => b.finished).length;
  const totalNotes = authorBooks.reduce((s, b) => s + (b.totalNotes || 0), 0);

  // Highlights from this author's books
  const bookIds = authorBooks.map(b => b.id);
  let highlights = [];
  if (bookIds.length > 0) {
    const placeholders = bookIds.map(() => '?').join(',');
    highlights = d.prepare(`
      SELECT h.mark_text AS text, h.chapter_title AS chapter,
        h.create_time, h.book_id,
        b.title AS book_title, b.cover AS book_cover, b.id AS bookId
      FROM highlights h
      LEFT JOIN books b ON h.book_id = b.id
      WHERE h.book_id IN (${placeholders})
        AND h.mark_text IS NOT NULL AND h.mark_text != '' AND length(h.mark_text) > 10
      ORDER BY h.create_time DESC
      LIMIT 50
    `).all(...bookIds);
  }

  return {
    uid: authorId,
    author: displayName,
    books: authorBooks,
    highlights,
    totalReadTime,
    finishedCount,
    totalNotes,
    totalBooks: authorBooks.length,
  };
}

// ─── Quotes / Highlights Wall ───

function getHighlightsPaged(limit = 40, offset = 0, bookId = null) {
  const d = getDb();
  const params = [];
  let where = "h.mark_text IS NOT NULL AND h.mark_text != '' AND length(h.mark_text) > 10";
  if (bookId) {
    where += ' AND h.book_id = ?';
    params.push(bookId);
  }
  const rows = d.prepare(`
    SELECT h.bookmark_id AS id, h.mark_text AS text, h.chapter_title AS chapter,
      h.create_time, h.book_id,
      b.title AS book_title, b.author AS book_author, b.cover AS book_cover, b.id AS bookId
    FROM highlights h
    LEFT JOIN books b ON h.book_id = b.id
    WHERE ${where}
    ORDER BY h.create_time DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  return rows.map(r => ({
    id: r.id,
    text: r.text,
    chapter: r.chapter || '',
    bookTitle: r.book_title || '',
    bookAuthor: r.book_author || '',
    bookCover: r.book_cover || '',
    bookId: r.bookId || r.book_id,
    createTime: r.create_time,
  }));
}

function getHighlightsTotal(bookId = null) {
  const d = getDb();
  let where = "mark_text IS NOT NULL AND mark_text != '' AND length(mark_text) > 10";
  const params = [];
  if (bookId) { where += ' AND book_id = ?'; params.push(bookId); }
  const row = d.prepare(`SELECT COUNT(*) AS c FROM highlights WHERE ${where}`).get(...params);
  return row ? row.c : 0;
}

// ─── Book Lists ───

function initBooklistsTable() {
}

function ensureBooklistsTable(sqlDbInst) {
}

function getAllBooklists() {
  const d = getDb();
  const lists = d.prepare(`
    SELECT bl.*, COUNT(bli.id) AS book_count
    FROM booklists bl
    LEFT JOIN booklist_items bli ON bl.id = bli.list_id
    GROUP BY bl.id
    ORDER BY bl.updated_at DESC
  `).all();
  return lists;
}

function getBooklistById(id) {
  const d = getDb();
  const list = d.prepare('SELECT * FROM booklists WHERE id = ?').get(id);
  if (!list) return null;
  const items = upgradeCovers(d.prepare(`
    SELECT bli.*, b.title, b.author, b.cover, b.finished, b.read_time, b.category
    FROM booklist_items bli
    JOIN books b ON bli.book_id = b.id
    WHERE bli.list_id = ?
    ORDER BY bli.sort_order ASC, bli.added_at ASC
  `).all(id));
  return { ...list, items };
}

function createBooklist(name, description) {
  const d = getDb();
  const now = Math.floor(Date.now() / 1000);
  d.prepare('INSERT INTO booklists (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)').all(name, description || '', now, now);
  return d.prepare('SELECT * FROM booklists ORDER BY id DESC LIMIT 1').get();
}

function updateBooklist(id, name, description) {
  const d = getDb();
  const now = Math.floor(Date.now() / 1000);
  d.prepare('UPDATE booklists SET name = ?, description = ?, updated_at = ? WHERE id = ?').all(name, description || '', now, id);
}

function deleteBooklist(id) {
  const d = getDb();
  d.prepare('DELETE FROM booklist_items WHERE list_id = ?').all(id);
  d.prepare('DELETE FROM booklists WHERE id = ?').all(id);
}

function addBookToList(listId, bookId, note) {
  const d = getDb();
  const now = Math.floor(Date.now() / 1000);
  d.prepare('INSERT OR IGNORE INTO booklist_items (list_id, book_id, note, added_at) VALUES (?, ?, ?, ?)').all(listId, bookId, note || '', now);
  d.prepare('UPDATE booklists SET updated_at = ? WHERE id = ?').all(now, listId);
}

function removeBookFromList(listId, bookId) {
  const d = getDb();
  d.prepare('DELETE FROM booklist_items WHERE list_id = ? AND book_id = ?').all(listId, bookId);
  d.prepare('UPDATE booklists SET updated_at = ? WHERE id = ?').all(Math.floor(Date.now() / 1000), listId);
}

function updateBooklistItemNote(listId, bookId, note) {
  const d = getDb();
  d.prepare('UPDATE booklist_items SET note = ? WHERE list_id = ? AND book_id = ?').all(note || '', listId, bookId);
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
  const now = Math.floor(Date.now() / 1000);
  d.prepare('INSERT OR IGNORE INTO tags (name, color, created_at) VALUES (?, ?, ?)').all(name, color || '#6366f1', now);
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
  getRandomNotes,
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
  // tags
  getAllTags,
  createTag,
  deleteTag,
  setNoteTags,
  getNoteTags,
  getNotesByTag,
  // annual page
  getAnnualBooks,
  getAnnualYears,
  // authors page
  getAuthorsAll,
  getAuthorDetail,
  // quotes / highlights wall
  getHighlightsPaged,
  getHighlightsTotal,
  // booklists
  getAllBooklists,
  getBooklistById,
  createBooklist,
  updateBooklist,
  deleteBooklist,
  addBookToList,
  removeBookFromList,
  updateBooklistItemNote,
};
