import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, destroyTestDb, seedAll } from './helpers/test-db';
import { getDb } from '../src/db/connection';
import type { DbWrapper } from '../src/types';

let db: DbWrapper;

beforeAll(async () => {
  db = await createTestDb();
});

afterAll(() => {
  destroyTestDb();
});

describe('DbWrapper - prepare().all()', () => {
  it('SELECT 查询返回多行', () => {
    seedAll(db);
    const rows = db.prepare('SELECT * FROM books ORDER BY title').all();
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(rows[0].title).toBe('三体');
  });

  it('带参数的 SELECT 查询', () => {
    const rows = db.prepare('SELECT * FROM books WHERE category = ?').all('科幻');
    expect(rows.length).toBe(1);
    expect(rows[0].title).toBe('三体');
  });

  it('INSERT/UPDATE/DELETE 的 all() 返回空数组', () => {
    const result = db.prepare("UPDATE books SET intro = 'test' WHERE id = 'b1'").all();
    expect(result).toEqual([]);
  });
});

describe('DbWrapper - prepare().get()', () => {
  it('返回单行', () => {
    const row = db.prepare('SELECT * FROM books WHERE id = ?').get('b1');
    expect(row).toBeDefined();
    expect(row!.title).toBe('三体');
  });

  it('无匹配时返回 undefined', () => {
    const row = db.prepare('SELECT * FROM books WHERE id = ?').get('nonexist');
    expect(row).toBeUndefined();
  });

  it('INSERT/UPDATE 的 get() 返回 undefined', () => {
    const result = db.prepare("UPDATE books SET intro = 'x' WHERE id = 'b1'").get();
    expect(result).toBeUndefined();
  });
});

describe('DbWrapper - prepare().run()', () => {
  it('返回 changes 和 lastInsertRowid', () => {
    const now = Math.floor(Date.now() / 1000);
    const result = db.prepare(
      "INSERT INTO books (id, title, author, finished, update_time) VALUES (?, ?, ?, ?, ?)"
    ).run('b_new', '新书', '新作者', 0, now);
    expect(result.changes).toBe(1);
    expect(result.lastInsertRowid).toBeGreaterThan(0);
  });

  it('UPDATE 返回正确的 changes 数', () => {
    const result = db.prepare("UPDATE books SET user_rating = 3 WHERE category = '科幻'").run();
    expect(result.changes).toBe(1);
  });
});

describe('DbWrapper - exec()', () => {
  it('执行 DDL 语句', () => {
    expect(() => db.exec("CREATE TABLE IF NOT EXISTS test_exec (id INTEGER PRIMARY KEY)")).not.toThrow();
  });
});

describe('DbWrapper - transaction()', () => {
  it('事务成功提交', () => {
    const result = db.transaction(() => {
      db.prepare("UPDATE books SET user_rating = 10 WHERE id = 'b1'").all();
      return 'ok';
    });
    expect(result).toBe('ok');
    const row = db.prepare('SELECT user_rating FROM books WHERE id = ?').get('b1');
    expect(row!.user_rating).toBe(10);
  });

  it('事务回滚时数据不变', () => {
    const rowBefore = db.prepare('SELECT user_rating FROM books WHERE id = ?').get('b1');
    const ratingBefore = rowBefore!.user_rating;

    expect(() => db.transaction(() => {
      db.prepare("UPDATE books SET user_rating = 999 WHERE id = 'b1'").all();
      throw new Error('force rollback');
    })).toThrow('force rollback');

    const rowAfter = db.prepare('SELECT user_rating FROM books WHERE id = ?').get('b1');
    expect(rowAfter!.user_rating).toBe(ratingBefore);
  });
});

describe('DbWrapper - pragma()', () => {
  it('返回 pragma 结果', () => {
    const result = db.pragma('table_info(books)');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('getDb()', () => {
  it('返回已初始化的实例', () => {
    expect(getDb()).not.toBeNull();
    expect(getDb()).toBe(db);
  });
});
