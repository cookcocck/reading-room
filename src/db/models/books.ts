import { getDb } from '../connection';
import type { Book, BookDetail, NotebookSummary, BookshelfFilter, BookshelfSort } from '../../types';

export function getAllBooks(filter?: string, category?: string): Book[] {
  const d = getDb()!;
  let query = `
    SELECT b.*,
      n.review_count AS reviewCount, n.note_count AS noteCount,
      n.bookmark_count AS bookmarkCount, n.total_notes AS totalNotes
    FROM books b
    LEFT JOIN notebooks n ON b.id = n.book_id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (filter === 'finished') query += ' AND b.finished = 1';
  else if (filter === 'reading') query += ' AND b.finished = 0';

  if (category) {
    query += ' AND b.category = ?';
    params.push(category);
  }

  query += ' ORDER BY b.update_time DESC';
  return d.prepare(query).all(...params) as unknown as Book[];
}

export function getBookById(bookId: string): BookDetail | null {
  const d = getDb()!;
  const row = d.prepare(`
    SELECT b.*,
      n.review_count AS reviewCount, n.note_count AS noteCount,
      n.bookmark_count AS bookmarkCount, n.total_notes AS totalNotes
    FROM books b
    LEFT JOIN notebooks n ON b.id = n.book_id
    WHERE b.id = ?
  `).get(bookId) as Record<string, unknown> | undefined;

  if (!row) return null;

  const notebook: NotebookSummary | null =
    row.noteCount != null
      ? {
          reviewCount: (row.reviewCount as number) || 0,
          noteCount: (row.noteCount as number) || 0,
          bookmarkCount: (row.bookmarkCount as number) || 0,
          totalNotes: (row.totalNotes as number) || 0,
        }
      : null;

  return {
    ...(row as unknown as Book),
    finished: !!(row.finished),
    readTime: (row.read_time as number) || 0,
    notebook,
  };
}

export function getCurrentlyReading(limit = 6): Book[] {
  const d = getDb()!;
  return d.prepare(`
    SELECT b.*, n.total_notes AS totalNotes
    FROM books b
    LEFT JOIN notebooks n ON b.id = n.book_id
    WHERE b.finished = 0 AND n.book_id IS NOT NULL
    ORDER BY b.update_time DESC
    LIMIT ?
  `).all(limit) as unknown as Book[];
}

export function getAllCategories(): string[] {
  const d = getDb()!;
  return d.prepare("SELECT DISTINCT category FROM books WHERE category != '' ORDER BY category")
    .all()
    .map((r: Record<string, unknown>) => r.category as string);
}

export function getBooksSorted(
  filter: string,
  category: string,
  sortBy: string
): Book[] {
  const d = getDb()!;
  let query = `
    SELECT b.*, n.review_count AS reviewCount, n.note_count AS noteCount,
      n.bookmark_count AS bookmarkCount, n.total_notes AS totalNotes
    FROM books b
    LEFT JOIN notebooks n ON b.id = n.book_id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (filter === 'finished') query += ' AND b.finished = 1';
  else if (filter === 'reading') query += ' AND b.finished = 0';
  else if (filter === 'want_to_read') query += ' AND b.want_to_read = 1';

  if (category) {
    query += ' AND b.category = ?';
    params.push(category);
  }

  switch (sortBy) {
    case 'title': query += ' ORDER BY b.title ASC'; break;
    case 'author': query += ' ORDER BY b.author ASC, b.title ASC'; break;
    case 'recent': query += ' ORDER BY b.update_time DESC'; break;
    case 'readtime':
    default: query += ' ORDER BY b.read_time DESC'; break;
  }

  return d.prepare(query).all(...params) as unknown as Book[];
}

export function setWantToRead(bookId: string, want: boolean): void {
  const d = getDb()!;
  d.prepare('UPDATE books SET want_to_read = ? WHERE id = ?').all(want ? 1 : 0, bookId);
}

export function getWantToReadBooks(): Book[] {
  const d = getDb()!;
  return d.prepare('SELECT * FROM books WHERE want_to_read = 1 ORDER BY update_time DESC').all() as unknown as Book[];
}

export function setBookRating(bookId: string, rating: number): void {
  const d = getDb()!;
  d.prepare('UPDATE books SET user_rating = ? WHERE id = ?').all(rating, bookId);
}

export function getBookRating(bookId: string): number {
  const d = getDb()!;
  const row = d.prepare('SELECT user_rating FROM books WHERE id = ?').get(bookId) as Record<string, unknown> | undefined;
  return row ? (row.user_rating as number) || 0 : 0;
}

export function getBookIntro(bookId: string): string {
  const d = getDb()!;
  const row = d.prepare('SELECT intro FROM books WHERE id = ?').get(bookId) as Record<string, unknown> | undefined;
  return row ? (row.intro as string) || '' : '';
}

export function saveBookIntro(bookId: string, intro: string): void {
  const d = getDb()!;
  d.prepare('UPDATE books SET intro = ? WHERE id = ?').all(intro, bookId);
}

export function setBookReadTime(bookId: string, readTimeSec: number): void {
  const d = getDb()!;
  d.prepare('UPDATE books SET read_time = ? WHERE id = ?').all(readTimeSec, bookId);
}

export function getBookReadTimeFromDB(bookId: string): number {
  const d = getDb()!;
  const row = d.prepare('SELECT read_time FROM books WHERE id = ?').get(bookId) as Record<string, unknown> | undefined;
  return row ? (row.read_time as number) || 0 : 0;
}

export function getBookReadTimes(): Record<string, number> {
  const d = getDb()!;
  const map: Record<string, number> = {};
  for (const name of ['overall', 'annual']) {
    const row = d.prepare("SELECT value FROM kv_store WHERE name = ?").get(name) as Record<string, unknown> | undefined;
    if (!row) continue;
    try {
      const v = JSON.parse(row.value as string);
      if (v.topBooks && Array.isArray(v.topBooks)) {
        for (const b of v.topBooks) {
          if (b.title && b.readTime) {
            map[b.title] = Math.max(map[b.title] || 0, b.readTime);
          }
        }
      }
    } catch { /* invalid JSON */ }
  }
  return map;
}
