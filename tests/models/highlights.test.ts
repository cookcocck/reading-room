import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, destroyTestDb, seedAll } from '../helpers/test-db';
import type { DbWrapper } from '../../src/types';
import {
  getRecentHighlights, getBookHighlights, getHighlightsPaged,
  getHighlightsTotal, getBookReviews, getRecentNotes,
  getRandomNotes, getAllNotebooks, getNotebooks,
  searchAll,
} from '../../src/db/models/highlights';

let db: DbWrapper;

beforeAll(async () => {
  db = await createTestDb();
  seedAll(db);
});

afterAll(() => {
  destroyTestDb();
});

describe('highlights - getRecentHighlights()', () => {
  it('返回划线列表', () => {
    const highlights = getRecentHighlights(10);
    expect(highlights.length).toBeLessThanOrEqual(10);
    highlights.forEach(h => {
      expect(h.markText).toBeTruthy();
      expect(h.bookTitle).toBeTruthy();
    });
  });
});

describe('highlights - getBookHighlights()', () => {
  it('按书名获取划线', () => {
    const highlights = getBookHighlights('三体', 5);
    expect(highlights.length).toBeLessThanOrEqual(5);
    highlights.forEach(h => {
      expect(h.text).toBeTruthy();
    });
  });
});

describe('highlights - getHighlightsPaged()', () => {
  it('分页获取划线', () => {
    const page1 = getHighlightsPaged(2, 0);
    expect(page1.length).toBeLessThanOrEqual(2);
    page1.forEach(h => {
      expect(h.id).toBeTruthy();
      expect(h.text.length).toBeGreaterThan(10);
    });
  });

  it('按 bookId 过滤', () => {
    const filtered = getHighlightsPaged(10, 0, 'b1');
    filtered.forEach(h => {
      expect(h.bookId).toBe('b1');
    });
  });
});

describe('highlights - getHighlightsTotal()', () => {
  it('返回总数（length > 10 过滤短划线）', () => {
    const total = getHighlightsTotal();
    expect(total).toBeGreaterThanOrEqual(2); // h1 和 h3 满足 >10 条件
  });

  it('按 bookId 过滤总数', () => {
    const total = getHighlightsTotal('b1');
    expect(total).toBeGreaterThanOrEqual(1); // h1 满足 >10
  });
});

describe('highlights - getBookReviews()', () => {
  it('按书名获取书评', () => {
    const reviews = getBookReviews('三体', 5);
    expect(reviews.length).toBe(1);
    expect(reviews[0].content).toContain('伟大');
  });
});

describe('highlights - getRecentNotes() / getRandomNotes()', () => {
  it('获取最近的笔记（划线+书评）', () => {
    const notes = getRecentNotes(10);
    expect(notes.length).toBeGreaterThanOrEqual(3);
    const types = new Set(notes.map(n => n.type));
    expect(types.has('highlight') || types.has('review')).toBe(true);
  });

  it('获取随机笔记', () => {
    const notes = getRandomNotes(5);
    expect(notes.length).toBeLessThanOrEqual(5);
  });
});

describe('highlights - getAllNotebooks() / getNotebooks()', () => {
  it('获取全部笔记本', () => {
    const notebooks = getAllNotebooks();
    expect(notebooks.length).toBeGreaterThanOrEqual(2);
  });

  it('分页获取笔记本', () => {
    const result = getNotebooks(1, 10);
    expect(result.total).toBeGreaterThanOrEqual(2);
    expect(result.notebooks.length).toBeLessThanOrEqual(10);
    expect(result.page).toBe(1);
  });
});

describe('highlights - searchAll()', () => {
  it('搜索书籍', () => {
    const results = searchAll('三体');
    expect(results.books.length).toBeGreaterThanOrEqual(1);
    expect(results.books[0].title).toBe('三体');
  });

  it('搜索划线', () => {
    const results = searchAll('划线');
    expect(results.highlights.length).toBeGreaterThanOrEqual(1);
  });

  it('搜索书评', () => {
    const results = searchAll('伟大');
    expect(results.reviews.length).toBeGreaterThanOrEqual(1);
  });

  it('无匹配时返回空结果', () => {
    const results = searchAll('完全不存在的关键词xyz');
    expect(results.books.length).toBe(0);
    expect(results.highlights.length).toBe(0);
    expect(results.reviews.length).toBe(0);
  });
});
