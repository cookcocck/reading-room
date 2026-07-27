import initSqlJs from 'sql.js';
import { CREATE_TABLES, CREATE_INDEXES, COLUMN_MIGRATIONS, _setDbForTesting } from '../../src/db/connection';
import type { DbWrapper } from '../../src/types';

type SqlJsStatic = Awaited<ReturnType<typeof initSqlJs>>;

let SQL: SqlJsStatic | null = null;

async function getSQL(): Promise<SqlJsStatic> {
  if (!SQL) SQL = await initSqlJs();
  return SQL;
}

/** 创建内存 DB，执行全部 schema，注入到 connection 单例 */
export async function createTestDb(): Promise<DbWrapper> {
  const sql = await getSQL();
  const raw = new sql.Database();

  // 执行建表
  for (const ddl of CREATE_TABLES) raw.run(ddl);
  for (const ddl of CREATE_INDEXES) raw.run(ddl);
  for (const [table, col, type] of COLUMN_MIGRATIONS) {
    try { raw.run(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`); } catch { /* already exists */ }
  }
  raw.run('INSERT OR IGNORE INTO summary (id) VALUES (1)');

  // 使用和 connection.ts 相同的 SqljsWrapper
  // 先 initDb（会创建空 db），然后注入我们构造的内存 DB
  const { initDb } = await import('../../src/db/connection');
  await initDb();
  // 需要手动创建 SqljsWrapper，但它是 class 且不导出
  // 改用另一个策略：直接把 raw db 的数据 dump 出来写到 tmp 文件再 load
  // 其实更简单的做法：用 _setDbForTesting 注入一个手工构造的 wrapper

  // 动态导入 connection 模块的内部来构造 wrapper
  // 由于 SqljsWrapper 未导出，这里用一个等价的简单实现
  type BindParams = (string | number | null | Uint8Array)[];

  function isSelectLike(s: string): boolean {
    return /^\s*(SELECT|PRAGMA|EXPLAIN|WITH)\b/i.test(s);
  }

  function execRows(db: typeof raw, sql: string): Record<string, unknown>[] {
    const r = db.exec(sql);
    if (!r.length) return [];
    const columns: string[] = r[0].columns;
    return r[0].values.map((row: unknown[]) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col: string, i: number) => { obj[col] = row[i]; });
      return obj;
    });
  }

  const dbWrapper: DbWrapper = {
    prepare(sql: string) {
      const trimmed = sql.trim();
      const stmt = raw.prepare(trimmed);
      const query = isSelectLike(trimmed);
      return {
        all(...params: unknown[]): Record<string, unknown>[] {
          const bp = params as BindParams;
          if (query) {
            stmt.bind(bp);
            const results: Record<string, unknown>[] = [];
            while (stmt.step()) results.push(stmt.getAsObject() as Record<string, unknown>);
            stmt.free();
            return results;
          } else {
            stmt.bind(bp);
            stmt.step();
            stmt.free();
            return [];
          }
        },
        get(...params: unknown[]): Record<string, unknown> | undefined {
          const bp = params as BindParams;
          if (query) {
            stmt.bind(bp);
            const row = stmt.step() ? (stmt.getAsObject() as Record<string, unknown>) : undefined;
            stmt.free();
            return row;
          } else {
            stmt.bind(bp);
            stmt.step();
            stmt.free();
            return undefined;
          }
        },
        run(...params: unknown[]): { changes: number; lastInsertRowid: number } {
          const bp = params as BindParams;
          stmt.bind(bp);
          stmt.step();
          stmt.free();
          const info = execRows(raw, 'SELECT last_insert_rowid() AS id, changes() AS cnt');
          const row = info[0];
          return {
            changes: row ? Number(row.cnt) : 0,
            lastInsertRowid: row ? Number(row.id) : 0,
          };
        },
      };
    },
    exec(sql: string): void { raw.run(sql); },
    transaction<T>(fn: () => T): T {
      raw.run('BEGIN');
      try { const r = fn(); raw.run('COMMIT'); return r; }
      catch (e) { raw.run('ROLLBACK'); throw e; }
    },
    pragma(p: string): unknown { return execRows(raw, `PRAGMA ${p}`); },
  };

  _setDbForTesting(dbWrapper);
  return dbWrapper;
}

/** 清除测试 DB */
export function destroyTestDb(): void {
  _setDbForTesting(null);
}

// ─── 种子数据 ───

export function seedBooks(db: DbWrapper): void {
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    "INSERT INTO books (id, title, author, cover, category, finished, update_time, read_time, progress, last_read_time, want_to_read, user_rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).all('b1', '三体', '刘慈欣', 'cover1.jpg', '科幻', 1, now, 36000, 100, now - 86400, 0, 5);
  db.prepare(
    "INSERT INTO books (id, title, author, cover, category, finished, update_time, read_time, progress, last_read_time, want_to_read, user_rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).all('b2', '活着', '余华', 'cover2.jpg', '文学', 1, now - 100, 18000, 100, now - 172800, 0, 4);
  db.prepare(
    "INSERT INTO books (id, title, author, cover, category, finished, update_time, read_time, progress, last_read_time, want_to_read, user_rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).all('b3', '人类简史', '尤瓦尔·赫拉利', 'cover3.jpg', '历史', 0, now - 200, 5000, 30, 0, 1, 0);
}

export function seedNotebooks(db: DbWrapper): void {
  db.prepare("INSERT INTO notebooks (book_id, review_count, note_count, bookmark_count, total_notes, sort) VALUES (?, ?, ?, ?, ?, ?)")
    .all('b1', 2, 5, 10, 17, 100);
  db.prepare("INSERT INTO notebooks (book_id, review_count, note_count, bookmark_count, total_notes, sort) VALUES (?, ?, ?, ?, ?, ?)")
    .all('b2', 1, 3, 5, 9, 50);
}

export function seedHighlights(db: DbWrapper): void {
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    "INSERT INTO highlights (bookmark_id, book_id, chapter_uid, chapter_title, mark_text, color_style, type, create_time, range_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).all('h1', 'b1', 'ch1', '第一章', '这是三体的一段划线，非常精彩的内容', '0', 1, now - 3600, '');
  db.prepare(
    "INSERT INTO highlights (bookmark_id, book_id, chapter_uid, chapter_title, mark_text, color_style, type, create_time, range_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).all('h2', 'b1', 'ch2', '第二章', '这是三体的另一段划线', '0', 1, now - 7200, '');
  db.prepare(
    "INSERT INTO highlights (bookmark_id, book_id, chapter_uid, chapter_title, mark_text, color_style, type, create_time, range_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).all('h3', 'b2', 'ch1', '第一章', '活着的划线内容，感人至深的一段文字', '0', 1, now - 10800, '');
}

export function seedReviews(db: DbWrapper): void {
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    "INSERT INTO reviews (review_id, book_id, content, chapter_name, star, create_time, abstract) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).all('r1', 'b1', '三体真是一部伟大的作品', '第一章', 5, now - 1800, '');
  db.prepare(
    "INSERT INTO reviews (review_id, book_id, content, chapter_name, star, create_time, abstract) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).all('r2', 'b2', '余华的文字太有力量了', '第二章', 4, now - 5400, '');
}

export function seedReadingSessions(db: DbWrapper): void {
  db.prepare("INSERT INTO reading_sessions (date, seconds) VALUES (?, ?)").all('2026-07-25', 3600);
  db.prepare("INSERT INTO reading_sessions (date, seconds) VALUES (?, ?)").all('2026-07-26', 5400);
  db.prepare("INSERT INTO reading_sessions (date, seconds) VALUES (?, ?)").all('2026-07-27', 2700);
}

export function seedReadingTrends(db: DbWrapper): void {
  db.prepare("INSERT INTO reading_trends (year, month, total_seconds, read_days) VALUES (?, ?, ?, ?)")
    .all(2026, 7, 30000, 20);
  db.prepare("INSERT INTO reading_trends (year, month, total_seconds, read_days) VALUES (?, ?, ?, ?)")
    .all(2026, 6, 25000, 18);
}

export function seedKvStore(db: DbWrapper): void {
  const overallData = JSON.stringify({
    totalReadTimeSec: 59000,
    topBooks: [
      { title: '三体', readTime: 36000 },
      { title: '活着', readTime: 18000 },
    ],
    preferAuthors: [{ name: '刘慈欣', count: 1, readTime: '10h' }],
  });
  db.prepare("INSERT INTO kv_store (name, value, fetched_at) VALUES (?, ?, ?)")
    .all('overall', overallData, Math.floor(Date.now() / 1000));

  const annualData = JSON.stringify({
    totalReadTimeSec: 30000,
    topBooks: [{ title: '三体', readTime: 36000 }],
  });
  db.prepare("INSERT INTO kv_store (name, value, fetched_at) VALUES (?, ?, ?)")
    .all('annual', annualData, Math.floor(Date.now() / 1000));
}

/** 一键填充全部种子数据 */
export function seedAll(db: DbWrapper): void {
  seedBooks(db);
  seedNotebooks(db);
  seedHighlights(db);
  seedReviews(db);
  seedReadingSessions(db);
  seedReadingTrends(db);
  seedKvStore(db);
}
