import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, destroyTestDb, seedAll, seedBooks, seedNotebooks } from '../helpers/test-db';
import type { DbWrapper } from '../../src/types';
import {
  getAllBooks, getBookById, getCurrentlyReading, getAllCategories,
  getBooksSorted, setWantToRead, getWantToReadBooks,
  setBookRating, getBookRating, getBookIntro, saveBookIntro,
  setBookReadTime, getBookReadTimeFromDB, getBookReadTimes,
} from '../../src/db/models/books';

let db: DbWrapper;

beforeAll(async () => {
  db = await createTestDb();
  seedAll(db);
});

afterAll(() => {
  destroyTestDb();
});

describe('books - getAllBooks()', () => {
  it('返回全部书籍', () => {
    const books = getAllBooks();
    expect(books.length).toBeGreaterThanOrEqual(3);
  });

  it('按 finished 过滤', () => {
    const finished = getAllBooks('finished');
    expect(finished.every(b => b.finished === 1)).toBe(true);
    expect(finished.length).toBe(2); // 三体 + 活着
  });

  it('按 reading 过滤', () => {
    const reading = getAllBooks('reading');
    expect(reading.every(b => b.finished === 0)).toBe(true);
  });

  it('按 category 过滤', () => {
    const scifi = getAllBooks(undefined, '科幻');
    expect(scifi.length).toBe(1);
    expect(scifi[0].title).toBe('三体');
  });
});

describe('books - getBookById()', () => {
  it('返回书籍详情', () => {
    const book = getBookById('b1');
    expect(book).not.toBeNull();
    expect(book!.title).toBe('三体');
    expect(book!.finished).toBe(true);
    expect(book!.notebook).not.toBeNull();
    expect(book!.notebook!.totalNotes).toBe(17);
  });

  it('不存在的书返回 null', () => {
    expect(getBookById('nonexist')).toBeNull();
  });
});

describe('books - getCurrentlyReading()', () => {
  it('只返回在读且有笔记的书', () => {
    const reading = getCurrentlyReading();
    // b3 在读但没有 notebook，所以可能不在结果中
    // b1 和 b2 已读完，不在结果中
    reading.forEach(b => expect(b.finished).toBe(0));
  });
});

describe('books - getAllCategories()', () => {
  it('返回去重分类列表', () => {
    const cats = getAllCategories();
    expect(cats).toContain('科幻');
    expect(cats).toContain('文学');
    expect(cats).toContain('历史');
  });
});

describe('books - getBooksSorted()', () => {
  it('按标题排序', () => {
    const books = getBooksSorted('all', '', 'title');
    const titles = books.map(b => b.title);
    for (let i = 1; i < titles.length; i++) {
      expect(titles[i]! >= titles[i - 1]!).toBe(true);
    }
  });

  it('want_to_read 过滤', () => {
    const books = getBooksSorted('want_to_read', '', 'recent');
    expect(books.every(b => b.want_to_read === 1)).toBe(true);
  });
});

describe('books - setWantToRead / getWantToReadBooks', () => {
  it('切换想读状态', () => {
    setWantToRead('b1', true);
    const wantList = getWantToReadBooks();
    expect(wantList.some(b => b.id === 'b1')).toBe(true);

    setWantToRead('b1', false);
    const wantList2 = getWantToReadBooks();
    expect(wantList2.some(b => b.id === 'b1')).toBe(false);
  });
});

describe('books - setBookRating / getBookRating', () => {
  it('设置和获取评分', () => {
    setBookRating('b2', 5);
    expect(getBookRating('b2')).toBe(5);
  });

  it('不存在的书返回 0', () => {
    expect(getBookRating('nonexist')).toBe(0);
  });
});

describe('books - saveBookIntro / getBookIntro', () => {
  it('保存和获取简介', () => {
    saveBookIntro('b1', '这是三体的简介');
    expect(getBookIntro('b1')).toBe('这是三体的简介');
  });
});

describe('books - setBookReadTime / getBookReadTimeFromDB', () => {
  it('设置和获取阅读时长', () => {
    setBookReadTime('b2', 99999);
    expect(getBookReadTimeFromDB('b2')).toBe(99999);
  });
});

describe('books - getBookReadTimes()', () => {
  it('从 kv_store 提取 topBooks 阅读时长', () => {
    const times = getBookReadTimes();
    expect(times['三体']).toBe(36000);
    expect(times['活着']).toBe(18000);
  });
});
