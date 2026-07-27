import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, destroyTestDb, seedAll } from '../helpers/test-db';
import type { DbWrapper } from '../../src/types';
import {
  getAllBooklists, getBooklistById, createBooklist, updateBooklist,
  deleteBooklist, addBookToList, removeBookFromList, updateBooklistItemNote,
  getAnnualBooks, getAnnualYears,
} from '../../src/db/models/booklists';

let db: DbWrapper;

beforeAll(async () => {
  db = await createTestDb();
  seedAll(db);
});

afterAll(() => {
  destroyTestDb();
});

describe('booklists - CRUD', () => {
  it('创建书单', () => {
    const list = createBooklist('我的书单', '一本好书单');
    expect(list).toBeDefined();
    expect(list!.name).toBe('我的书单');
    expect(list!.description).toBe('一本好书单');
  });

  it('获取全部书单', () => {
    const lists = getAllBooklists();
    expect(lists.length).toBeGreaterThanOrEqual(1);
  });

  it('更新书单', () => {
    const list = createBooklist('待更新', '');
    updateBooklist(list!.id, '更新后', '新描述');
    const updated = getBooklistById(list!.id);
    expect(updated!.name).toBe('更新后');
    expect(updated!.description).toBe('新描述');
  });

  it('删除书单', () => {
    const list = createBooklist('待删除', '');
    deleteBooklist(list!.id);
    expect(getBooklistById(list!.id)).toBeNull();
  });
});

describe('booklists - 书单内书籍', () => {
  it('添加书籍到书单', () => {
    const list = createBooklist('加书测试', '');
    addBookToList(list!.id, 'b1', '推荐阅读');
    const detail = getBooklistById(list!.id);
    expect(detail!.items!.length).toBe(1);
    expect(detail!.items![0].book_id).toBe('b1');
  });

  it('从书单移除书籍', () => {
    const list = createBooklist('移除测试', '');
    addBookToList(list!.id, 'b1');
    addBookToList(list!.id, 'b2');
    removeBookFromList(list!.id, 'b1');
    const detail = getBooklistById(list!.id);
    expect(detail!.items!.length).toBe(1);
    expect(detail!.items![0].book_id).toBe('b2');
  });

  it('更新书单内书籍备注', () => {
    const list = createBooklist('备注测试', '');
    addBookToList(list!.id, 'b1', '旧备注');
    updateBooklistItemNote(list!.id, 'b1', '新备注');
    const detail = getBooklistById(list!.id);
    expect(detail!.items![0].note).toBe('新备注');
  });

  it('重复添加同一本书被忽略', () => {
    const list = createBooklist('去重测试', '');
    addBookToList(list!.id, 'b1');
    addBookToList(list!.id, 'b1'); // 重复
    const detail = getBooklistById(list!.id);
    expect(detail!.items!.length).toBe(1);
  });
});

describe('booklists - getBooklistById', () => {
  it('不存在的书单返回 null', () => {
    expect(getBooklistById(99999)).toBeNull();
  });
});

describe('booklists - getAnnualBooks / getAnnualYears', () => {
  it('获取年度书籍', () => {
    const result = getAnnualBooks(2026);
    expect(result.books.length).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalReadTime).toBe('number');
    expect(typeof result.finishedCount).toBe('number');
    expect(typeof result.totalNotes).toBe('number');
  });

  it('获取年度列表', () => {
    const years = getAnnualYears();
    expect(Array.isArray(years)).toBe(true);
    years.forEach(y => expect(y).toBeGreaterThan(0));
  });
});
