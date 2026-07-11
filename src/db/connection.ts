import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { DbWrapper, DbStatement } from '../types';

const DB_PATH = path.join(__dirname, '..', '..', 'db', 'reading-room.db');

// ─── better-sqlite3 Wrapper ───
// The native Statement already has .all(), .get(), .run() — we just adapt the types.

function createWrapper(db: Database.Database): DbWrapper {
  return {
    prepare(sql: string): DbStatement {
      const stmt = db.prepare(sql);
      return {
        all(...params: unknown[]): Record<string, unknown>[] {
          return stmt.all(...params) as Record<string, unknown>[];
        },
        get(...params: unknown[]): Record<string, unknown> | undefined {
          return stmt.get(...params) as Record<string, unknown> | undefined;
        },
        run(...params: unknown[]): { changes: number; lastInsertRowid: number } {
          const result = stmt.run(...params);
          return { changes: result.changes, lastInsertRowid: Number(result.lastInsertRowid) };
        },
      };
    },
    exec(sql: string) {
      db.exec(sql);
    },
    transaction<T>(fn: () => T): T {
      return db.transaction(fn)();
    },
    pragma(pragma: string) {
      return db.pragma(pragma);
    },
  };
}

// ─── Singleton ───

let db: DbWrapper | null = null;
let rawDb: Database.Database | null = null;

export function getDb(): DbWrapper | null {
  return db;
}

export function closeDb(): void {
  if (rawDb) {
    rawDb.close();
    rawDb = null;
    db = null;
    console.log('[db] Connection closed');
  }
}

// ─── Schema & Migrations ───

const SCHEMA = {
  reviews: `CREATE TABLE IF NOT EXISTS reviews (
    review_id TEXT PRIMARY KEY, book_id TEXT NOT NULL,
    content TEXT DEFAULT '', chapter_name TEXT DEFAULT '',
    star INTEGER DEFAULT -1, create_time INTEGER NOT NULL
  )`,
  'reviews_idx': 'CREATE INDEX IF NOT EXISTS idx_reviews_book ON reviews(book_id)',

  books: `CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY, title TEXT NOT NULL,
    author TEXT DEFAULT '', cover TEXT DEFAULT '',
    category TEXT DEFAULT '', finished INTEGER NOT NULL DEFAULT 0,
    update_time INTEGER DEFAULT 0, read_time INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0, last_read_time INTEGER DEFAULT 0,
    intro TEXT DEFAULT '', want_to_read INTEGER DEFAULT 0,
    user_rating INTEGER DEFAULT 0
  )`,

  highlights: `CREATE TABLE IF NOT EXISTS highlights (
    bookmark_id TEXT PRIMARY KEY, book_id TEXT NOT NULL,
    chapter_uid TEXT DEFAULT '', chapter_title TEXT DEFAULT '',
    mark_text TEXT DEFAULT '', color_style TEXT DEFAULT '0',
    type INTEGER DEFAULT 1, create_time INTEGER NOT NULL,
    range_text TEXT DEFAULT ''
  )`,
  'h_idx_book': 'CREATE INDEX IF NOT EXISTS idx_highlights_book ON highlights(book_id)',
  'h_idx_time': 'CREATE INDEX IF NOT EXISTS idx_highlights_time ON highlights(create_time)',

  notebooks: `CREATE TABLE IF NOT EXISTS notebooks (
    book_id TEXT PRIMARY KEY, review_count INTEGER DEFAULT 0,
    note_count INTEGER DEFAULT 0, bookmark_count INTEGER DEFAULT 0,
    total_notes INTEGER DEFAULT 0, sort INTEGER DEFAULT 0
  )`,

  reading_sessions: `CREATE TABLE IF NOT EXISTS reading_sessions (
    date TEXT PRIMARY KEY, seconds INTEGER NOT NULL DEFAULT 0
  )`,
  reading_trends: `CREATE TABLE IF NOT EXISTS reading_trends (
    year INTEGER NOT NULL, month INTEGER NOT NULL,
    total_seconds INTEGER NOT NULL DEFAULT 0,
    read_days INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (year, month)
  )`,

  summary: `CREATE TABLE IF NOT EXISTS summary (
    id INTEGER PRIMARY KEY CHECK(id=1),
    total_books INTEGER DEFAULT 0, finished_count INTEGER DEFAULT 0,
    total_note_count INTEGER DEFAULT 0, notebook_books_count INTEGER DEFAULT 0,
    categories TEXT DEFAULT '[]', top_authors TEXT DEFAULT '[]',
    archives TEXT DEFAULT '[]'
  )`,
  'summary_init': 'INSERT OR IGNORE INTO summary (id) VALUES (1)',

  kv_store: `CREATE TABLE IF NOT EXISTS kv_store (
    name TEXT PRIMARY KEY, value TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now'))
  )`,

  booklists: `CREATE TABLE IF NOT EXISTS booklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  )`,
  booklist_items: `CREATE TABLE IF NOT EXISTS booklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, list_id INTEGER NOT NULL,
    book_id TEXT NOT NULL, note TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0, added_at INTEGER NOT NULL,
    UNIQUE(list_id, book_id)
  )`,
  'blItems_idx': 'CREATE INDEX IF NOT EXISTS idx_bl_items_list ON booklist_items(list_id)',

  tags: `CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366f1', created_at INTEGER NOT NULL
  )`,
  note_tags: `CREATE TABLE IF NOT EXISTS note_tags (
    note_id TEXT NOT NULL, note_type TEXT NOT NULL, tag_id INTEGER NOT NULL,
    PRIMARY KEY (note_id, note_type, tag_id)
  )`,
};

const COLUMN_MIGRATIONS: Array<[string, string, string]> = [
  ['books', 'intro', "TEXT DEFAULT ''"],
  ['books', 'read_time', 'INTEGER DEFAULT 0'],
  ['books', 'progress', 'INTEGER DEFAULT 0'],
  ['books', 'last_read_time', 'INTEGER DEFAULT 0'],
  ['books', 'want_to_read', 'INTEGER DEFAULT 0'],
  ['books', 'user_rating', 'INTEGER DEFAULT 0'],
  ['reviews', 'abstract', "TEXT DEFAULT ''"],
  ['kv_store', 'version', "TEXT DEFAULT '1'"],
  ['kv_store', 'fetched_at', 'INTEGER DEFAULT 0'],
];

// ─── Init ───

export function initDb(): DbWrapper | null {
  if (db) return db;

  if (!fs.existsSync(DB_PATH)) {
    console.error(`[db] WARNING: Database not found at ${DB_PATH}`);
    console.error('[db] Run "python scripts/sync.py" to create it.');
    return null;
  }

  // Open database with WAL mode for concurrent read/write with Python sync
  try {
    rawDb = new Database(DB_PATH);
    rawDb.pragma('journal_mode = WAL');
    rawDb.pragma('busy_timeout = 10000');
    db = createWrapper(rawDb);
  } catch (err) {
    console.error(`[db] Failed to open database: ${(err as Error).message}`);
    return null;
  }

  // Safe run: log and continue on error
  function safeRun(desc: string, sql: string): boolean {
    try {
      rawDb!.exec(sql);
      return true;
    } catch (e) {
      console.warn(`[db] ${desc}: ${(e as Error).message}`);
      return false;
    }
  }

  // Create all tables
  for (const [desc, sql] of Object.entries(SCHEMA)) {
    safeRun(desc, sql);
  }

  // Add updated_at to kv_store if missing (older DB)
  try {
    rawDb.exec("ALTER TABLE kv_store ADD COLUMN updated_at TEXT DEFAULT ''");
  } catch { /* already exists */ }

  // Column migrations
  for (const [table, col, type] of COLUMN_MIGRATIONS) {
    try {
      rawDb.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
      console.log(`[db] Migration: added ${table}.${col}`);
    } catch { /* already exists */ }
  }

  // Cleanup: drop obsolete author_id column
  try {
    rawDb.exec('DROP INDEX IF EXISTS idx_books_author_id');
    const cols = rawDb.pragma('table_info(books)') as Array<{ name: string }>;
    const hasAuthorId = cols.some(r => r.name === 'author_id');
    if (hasAuthorId) {
      rawDb.exec('ALTER TABLE books DROP COLUMN author_id');
      console.log('[db] Cleanup: dropped books.author_id');
    }
  } catch { /* DROP COLUMN may fail on older SQLite */ }

  const sizeMB = (fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(1);
  console.log(`[db] Connected to reading-room.db (better-sqlite3, WAL, ${sizeMB} MB)`);
  return db;
}
