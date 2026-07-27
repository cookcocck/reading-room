import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import type { DbWrapper, DbStatement } from '../types';

type SqliteDatabase = initSqlJs.Database;
type SqlJsStatic = initSqlJs.SqlJsStatic;

const DB_PATH = path.join(__dirname, '..', '..', 'db', 'reading-room.db');

type BindParams = (string | number | null | Uint8Array)[];

function isSelectLike(sql: string): boolean {
  return /^\s*(SELECT|PRAGMA|EXPLAIN|WITH)\b/i.test(sql);
}

function execRows(db: SqliteDatabase, sql: string, params?: BindParams): Record<string, unknown>[] {
  const r = db.exec(sql);
  if (!r.length) return [];
  const columns: string[] = r[0].columns;
  return r[0].values.map((row: unknown[]) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col: string, i: number) => { obj[col] = row[i]; });
    return obj;
  });
}

function execOne(db: SqliteDatabase, sql: string, params?: BindParams): Record<string, unknown> | undefined {
  const rows = execRows(db, sql, params);
  return rows.length > 0 ? rows[0] : undefined;
}

// ─── SQL.js Wrapper ───

class SqljsWrapper implements DbWrapper {
  private db: SqliteDatabase;

  constructor(db: SqliteDatabase) {
    this.db = db;
  }

  export(): Uint8Array {
    return this.db.export();
  }

  prepare(sql: string): DbStatement {
    const trimmed = sql.trim();
    const stmt = this.db.prepare(trimmed);
    const query = isSelectLike(trimmed);
    const sqlDb = this.db;

    return {
      all(...params: unknown[]): Record<string, unknown>[] {
        const bindParams = params as BindParams;
        if (query) {
          stmt.bind(bindParams);
          const results: Record<string, unknown>[] = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject() as Record<string, unknown>);
          }
          stmt.free();
          return results;
        } else {
          stmt.bind(bindParams);
          stmt.step();
          stmt.free();
          scheduleSave();
          return [];
        }
      },

      get(...params: unknown[]): Record<string, unknown> | undefined {
        const bindParams = params as BindParams;
        if (query) {
          stmt.bind(bindParams);
          const row = stmt.step()
            ? (stmt.getAsObject() as Record<string, unknown>)
            : undefined;
          stmt.free();
          return row;
        } else {
          stmt.bind(bindParams);
          stmt.step();
          stmt.free();
          scheduleSave();
          return undefined;
        }
      },

      run(...params: unknown[]): { changes: number; lastInsertRowid: number } {
        const bindParams = params as BindParams;
        stmt.bind(bindParams);
        stmt.step();
        stmt.free();

        const info = execRows(
          sqlDb,
          'SELECT last_insert_rowid() AS id, changes() AS cnt'
        );
        const row = info[0];
        scheduleSave();
        return {
          changes: row ? Number(row.cnt) : 0,
          lastInsertRowid: row ? Number(row.id) : 0,
        };
      },
    };
  }

  exec(sql: string): void {
    this.db.run(sql);
    scheduleSave();
  }

  transaction<T>(fn: () => T): T {
    this.db.run('BEGIN');
    try {
      const result = fn();
      this.db.run('COMMIT');
      scheduleSave();
      return result;
    } catch (e) {
      this.db.run('ROLLBACK');
      throw e;
    }
  }

  pragma(pragma: string): unknown {
    const rows = execRows(this.db, `PRAGMA ${pragma}`);
    return rows;
  }
}

// ─── Singleton ───

let db: SqljsWrapper | null = null;
let SQL: SqlJsStatic | null = null;

// ─── Debounced File Save ───

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    forceSave();
  }, 300);
}

function forceSave(): void {
  if (!db) return;
  try {
    const data = db.export();
    const buf = Buffer.from(data);
    const tmpPath = DB_PATH + '.tmp';
    fs.writeFileSync(tmpPath, buf);
    fs.renameSync(tmpPath, DB_PATH);
  } catch (e) {
    console.error('[db] Failed to save to disk:', (e as Error).message);
  }
}

// ─── Schema ───

const CREATE_TABLES = [
  `CREATE TABLE IF NOT EXISTS reviews (
    review_id TEXT PRIMARY KEY, book_id TEXT NOT NULL,
    content TEXT DEFAULT '', chapter_name TEXT DEFAULT '',
    star INTEGER DEFAULT -1, create_time INTEGER NOT NULL,
    abstract TEXT DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY, title TEXT NOT NULL,
    author TEXT DEFAULT '', cover TEXT DEFAULT '',
    category TEXT DEFAULT '', finished INTEGER NOT NULL DEFAULT 0,
    update_time INTEGER DEFAULT 0, read_time INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0, last_read_time INTEGER DEFAULT 0,
    intro TEXT DEFAULT '', want_to_read INTEGER DEFAULT 0,
    user_rating INTEGER DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS highlights (
    bookmark_id TEXT PRIMARY KEY, book_id TEXT NOT NULL,
    chapter_uid TEXT DEFAULT '', chapter_title TEXT DEFAULT '',
    mark_text TEXT DEFAULT '', color_style TEXT DEFAULT '0',
    type INTEGER DEFAULT 1, create_time INTEGER NOT NULL,
    range_text TEXT DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS notebooks (
    book_id TEXT PRIMARY KEY, review_count INTEGER DEFAULT 0,
    note_count INTEGER DEFAULT 0, bookmark_count INTEGER DEFAULT 0,
    total_notes INTEGER DEFAULT 0, sort INTEGER DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS reading_sessions (
    date TEXT PRIMARY KEY, seconds INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS reading_trends (
    year INTEGER NOT NULL, month INTEGER NOT NULL,
    total_seconds INTEGER NOT NULL DEFAULT 0,
    read_days INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (year, month)
  )`,
  `CREATE TABLE IF NOT EXISTS summary (
    id INTEGER PRIMARY KEY CHECK(id=1),
    total_books INTEGER DEFAULT 0, finished_count INTEGER DEFAULT 0,
    total_note_count INTEGER DEFAULT 0, notebook_books_count INTEGER DEFAULT 0,
    categories TEXT DEFAULT '[]', top_authors TEXT DEFAULT '[]',
    archives TEXT DEFAULT '[]'
  )`,
  `CREATE TABLE IF NOT EXISTS kv_store (
    name TEXT PRIMARY KEY, value TEXT DEFAULT '',
    version TEXT DEFAULT '1', fetched_at INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL, finished_at TEXT,
    status TEXT DEFAULT 'running',
    books_updated INTEGER DEFAULT 0,
    highlights_updated INTEGER DEFAULT 0,
    reviews_updated INTEGER DEFAULT 0,
    errors TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366f1', created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS note_tags (
    note_id TEXT NOT NULL, note_type TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (note_id, note_type, tag_id)
  )`,
  `CREATE TABLE IF NOT EXISTS booklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS booklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, list_id INTEGER NOT NULL,
    book_id TEXT NOT NULL, note TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0, added_at INTEGER NOT NULL,
    UNIQUE(list_id, book_id)
  )`,
];

const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_reviews_book ON reviews(book_id)',
  'CREATE INDEX IF NOT EXISTS idx_highlights_book ON highlights(book_id)',
  'CREATE INDEX IF NOT EXISTS idx_highlights_time ON highlights(create_time)',
  'CREATE INDEX IF NOT EXISTS idx_bl_items_list ON booklist_items(list_id)',
];

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

// ─── Public API ───

export function getDb(): DbWrapper | null {
  return db;
}

export function closeDb(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  forceSave();
  if (db) {
    db = null;
    console.log('[db] Connection closed');
  }
}

// ─── Init (async) ───

export async function initDb(): Promise<DbWrapper | null> {
  if (db) return db;

  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (!SQL) {
    SQL = await initSqlJs();
  }

  let sqlDb: SqliteDatabase;

  if (fs.existsSync(DB_PATH)) {
    try {
      const data = fs.readFileSync(DB_PATH);
      sqlDb = new SQL.Database(data);
    } catch (err) {
      console.warn(
        `[db] Failed to load database: ${(err as Error).message} — creating empty one`
      );
      sqlDb = new SQL.Database();
    }
  } else {
    console.warn(
      `[db] Database not found at ${DB_PATH} — creating empty database`
    );
    console.warn('[db] Run "python scripts/sync.py" to populate data from WeRead API');
    sqlDb = new SQL.Database();
  }

  db = new SqljsWrapper(sqlDb);

  function safeExec(sql: string): void {
    try {
      sqlDb.run(sql);
    } catch (e) {
      console.warn(`[db] Schema: ${(e as Error).message}`);
    }
  }

  for (const sql of CREATE_TABLES) safeExec(sql);
  for (const sql of CREATE_INDEXES) safeExec(sql);

  for (const [table, col, type] of COLUMN_MIGRATIONS) {
    try {
      sqlDb.run(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
    } catch {
      /* column already exists */
    }
  }

  try {
    sqlDb.run('INSERT OR IGNORE INTO summary (id) VALUES (1)');
  } catch { /* ignore */ }

  const sizeMB = (db.export().length / 1024 / 1024).toFixed(1);
  console.log(`[db] Connected to reading-room.db (sql.js, ${sizeMB} MB)`);

  forceSave();

  return db;
}
