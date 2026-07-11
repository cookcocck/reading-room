import { getDb } from '../connection';
import type { Tag, AuthorEntry } from '../../types';
import type { Book } from '../../types';

// ─── Tags ───

export function getAllTags(): Tag[] {
  const d = getDb()!;
  return d.prepare('SELECT * FROM tags ORDER BY name').all() as unknown as Tag[];
}

export function getTagById(id: number): Tag | undefined {
  const d = getDb()!;
  return d.prepare('SELECT * FROM tags WHERE id = ?').get(id) as unknown as Tag | undefined;
}

export function createTag(name: string, color?: string): Tag | undefined {
  const d = getDb()!;
  const now = Math.floor(Date.now() / 1000);
  d.prepare(
    'INSERT OR IGNORE INTO tags (name, color, created_at) VALUES (?, ?, ?)'
  ).all(name, color || '#6366f1', now);
  return d.prepare('SELECT * FROM tags WHERE name = ?').get(name) as unknown as Tag | undefined;
}

export function deleteTag(id: number): void {
  const d = getDb()!;
  d.prepare('DELETE FROM note_tags WHERE tag_id = ?').all(id);
  d.prepare('DELETE FROM tags WHERE id = ?').all(id);
}

export function setNoteTags(noteId: string, noteType: string, tagIds: number[]): void {
  const d = getDb()!;
  d.prepare('DELETE FROM note_tags WHERE note_id = ? AND note_type = ?').all(noteId, noteType);
  for (const tid of tagIds) {
    d.prepare(
      'INSERT OR IGNORE INTO note_tags (note_id, note_type, tag_id) VALUES (?, ?, ?)'
    ).all(noteId, noteType, tid);
  }
}

export function getNoteTags(noteId: string, noteType: string): Tag[] {
  const d = getDb()!;
  return d.prepare(`
    SELECT t.* FROM tags t
    JOIN note_tags nt ON t.id = nt.tag_id
    WHERE nt.note_id = ? AND nt.note_type = ?
  `).all(noteId, noteType) as unknown as Tag[];
}

export function getNotesByTag(tagId: number, limit = 50): Array<Record<string, unknown>> {
  const d = getDb()!;
  const items: Array<Record<string, unknown>> = [];

  const hRows = d.prepare(`
    SELECT h.bookmark_id AS id, h.mark_text AS text, h.chapter_title AS chapter,
      h.create_time, b.title AS book_title, b.id AS book_id
    FROM highlights h
    JOIN note_tags nt ON nt.note_id = h.bookmark_id AND nt.note_type = 'highlight'
    JOIN books b ON h.book_id = b.id
    WHERE nt.tag_id = ? ORDER BY h.create_time DESC LIMIT ?
  `).all(tagId, limit) as Array<Record<string, unknown>>;

  const rRows = d.prepare(`
    SELECT r.review_id AS id, r.content AS text, r.chapter_name AS chapter,
      r.create_time, b.title AS book_title, b.id AS book_id
    FROM reviews r
    JOIN note_tags nt ON nt.note_id = r.review_id AND nt.note_type = 'review'
    JOIN books b ON r.book_id = b.id
    WHERE nt.tag_id = ? ORDER BY r.create_time DESC LIMIT ?
  `).all(tagId, limit) as Array<Record<string, unknown>>;

  for (const r of hRows) items.push({ ...r, type: 'highlight' });
  for (const r of rRows) items.push({ ...r, type: 'review' });
  items.sort((a, b) => (b.create_time as number) - (a.create_time as number));
  return items.slice(0, limit);
}

// ─── Authors ───

export function getAuthorsAll(): AuthorEntry[] {
  const d = getDb()!;

  const books = d.prepare(`
    SELECT b.id, b.title, b.author, b.cover, b.finished, b.read_time, b.update_time, b.category,
      n.total_notes AS totalNotes
    FROM books b
    LEFT JOIN notebooks n ON b.id = n.book_id
    WHERE b.author IS NOT NULL AND b.author != ''
    ORDER BY b.author ASC, b.update_time DESC
  `).all() as unknown as Book[];

  const map = new Map<string, AuthorEntry>();
  for (const book of books) {
    const authors = book.author.split(/[,，\/、&]/);
    for (const rawAuthor of authors) {
      const author = rawAuthor.trim();
      if (!author) continue;
      if (!map.has(author)) {
        map.set(author, { author, books: [], totalReadTime: 0, finishedCount: 0, totalNotes: 0 });
      }
      const entry = map.get(author)!;
      if (!entry.books.find(b => b.id === book.id)) {
        entry.books.push(book);
        entry.totalReadTime += book.read_time || 0;
        if (book.finished) entry.finishedCount++;
        entry.totalNotes += book.totalNotes || 0;
      }
    }
  }

  return Array.from(map.values())
    .filter(a => a.books.length > 0)
    .sort((a, b) => (b.books.length - a.books.length) || (b.totalReadTime - a.totalReadTime));
}

export function getAuthorByName(name: string): AuthorEntry | undefined {
  const all = getAuthorsAll();
  return all.find(a => a.author === name);
}

export function getAuthorHighlights(author: string): Array<{
  mark_text: string; chapter_title: string; create_time: number;
  book_title: string; book_id: string; color_style: string;
}> {
  const d = getDb()!;
  return d.prepare(`
    SELECT h.mark_text, h.chapter_title, h.create_time, h.color_style,
      b.title AS book_title, b.id AS book_id
    FROM highlights h
    JOIN books b ON h.book_id = b.id
    WHERE b.author LIKE ?
    ORDER BY h.create_time DESC LIMIT 20
  `).all(`%${author}%`) as unknown as Array<{
    mark_text: string; chapter_title: string; create_time: number;
    book_title: string; book_id: string; color_style: string;
  }>;
}

export function getAuthorReviews(author: string): Array<{
  content: string; chapter_name: string; create_time: number; star: number;
  book_title: string; book_id: string;
}> {
  const d = getDb()!;
  return d.prepare(`
    SELECT r.content, r.chapter_name, r.create_time, r.star,
      b.title AS book_title, b.id AS book_id
    FROM reviews r
    JOIN books b ON r.book_id = b.id
    WHERE b.author LIKE ?
    ORDER BY r.create_time DESC LIMIT 20
  `).all(`%${author}%`) as unknown as Array<{
    content: string; chapter_name: string; create_time: number; star: number;
    book_title: string; book_id: string;
  }>;
}

export function getAuthorStats() {
  const d = getDb()!;
  return d.prepare(`
    SELECT author, COUNT(*) AS bookCount, SUM(read_time) AS totalTime
    FROM books WHERE author != '' AND author IS NOT NULL
    GROUP BY author ORDER BY totalTime DESC LIMIT 15
  `).all();
}
