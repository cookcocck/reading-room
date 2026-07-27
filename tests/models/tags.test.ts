import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, destroyTestDb, seedAll } from '../helpers/test-db';
import type { DbWrapper } from '../../src/types';
import {
  getAllTags, createTag, deleteTag, setNoteTags, getNoteTags,
  getAuthorsAll, getAuthorByName, getAuthorStats,
} from '../../src/db/models/tags';

let db: DbWrapper;

beforeAll(async () => {
  db = await createTestDb();
  seedAll(db);
});

afterAll(() => {
  destroyTestDb();
});

describe('tags - CRUD', () => {
  it('创建标签', () => {
    const tag = createTag('哲学', '#ff0000');
    expect(tag).toBeDefined();
    expect(tag!.name).toBe('哲学');
    expect(tag!.color).toBe('#ff0000');
  });

  it('获取全部标签', () => {
    const tags = getAllTags();
    expect(tags.length).toBeGreaterThanOrEqual(1);
  });

  it('创建重名标签被忽略 (INSERT OR IGNORE)', () => {
    const tag1 = createTag('哲学', '#ff0000');
    const tagsBefore = getAllTags().length;
    createTag('哲学', '#00ff00'); // 同名
    const tagsAfter = getAllTags().length;
    expect(tagsAfter).toBe(tagsBefore);
  });

  it('删除标签', () => {
    const tag = createTag('待删除', '#000000');
    const id = tag!.id;
    deleteTag(id);
    const tags = getAllTags();
    expect(tags.find(t => t.id === id)).toBeUndefined();
  });
});

describe('tags - setNoteTags / getNoteTags', () => {
  it('给笔记添加标签并查询', () => {
    const tag = createTag('重要', '#6366f1');
    setNoteTags('h1', 'highlight', [tag!.id]);
    const noteTags = getNoteTags('h1', 'highlight');
    expect(noteTags.length).toBe(1);
    expect(noteTags[0].name).toBe('重要');
  });

  it('替换笔记标签', () => {
    const tag1 = createTag('标签1', '#111');
    const tag2 = createTag('标签2', '#222');
    setNoteTags('h2', 'highlight', [tag1!.id]);
    setNoteTags('h2', 'highlight', [tag2!.id]); // 替换
    const noteTags = getNoteTags('h2', 'highlight');
    expect(noteTags.length).toBe(1);
    expect(noteTags[0].name).toBe('标签2');
  });
});

describe('tags - authors', () => {
  it('getAuthorsAll 返回作者列表', () => {
    const authors = getAuthorsAll();
    expect(authors.length).toBeGreaterThanOrEqual(1);
    authors.forEach(a => {
      expect(a.author).toBeTruthy();
      expect(a.books.length).toBeGreaterThan(0);
    });
  });

  it('getAuthorByName 查找特定作者', () => {
    const author = getAuthorByName('刘慈欣');
    expect(author).toBeDefined();
    expect(author!.books.length).toBeGreaterThanOrEqual(1);
  });

  it('getAuthorByName 不存在返回 undefined', () => {
    expect(getAuthorByName('不存在')).toBeUndefined();
  });

  it('getAuthorStats 返回统计', () => {
    const stats = getAuthorStats();
    expect(Array.isArray(stats)).toBe(true);
    expect(stats.length).toBeGreaterThanOrEqual(1);
  });
});
