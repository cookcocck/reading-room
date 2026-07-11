import { getDb } from '../connection';
import type { Booklist, BooklistItem, Book } from '../../types';

export function getAllBooklists(): Booklist[] {
  const d = getDb()!;
  return d.prepare(`
    SELECT bl.*, COUNT(bli.id) AS book_count
    FROM booklists bl
    LEFT JOIN booklist_items bli ON bl.id = bli.list_id
    GROUP BY bl.id
    ORDER BY bl.updated_at DESC
  `).all() as unknown as Booklist[];
}

export function getBooklistById(id: number): Booklist | null {
  const d = getDb()!;
  const list = d.prepare('SELECT * FROM booklists WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!list) return null;

  const items = d.prepare(`
      SELECT bli.*, b.title, b.author, b.cover, b.finished, b.read_time, b.category
      FROM booklist_items bli
      JOIN books b ON bli.book_id = b.id
      WHERE bli.list_id = ?
      ORDER BY bli.sort_order ASC, bli.added_at ASC
    `).all(id) as unknown as BooklistItem[];

  return { ...(list as unknown as Booklist), items };
}

export function createBooklist(name: string, description?: string): Booklist | undefined {
  const d = getDb()!;
  const now = Math.floor(Date.now() / 1000);
  d.prepare(
    'INSERT INTO booklists (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)'
  ).all(name, description || '', now, now);
  return d.prepare('SELECT * FROM booklists ORDER BY id DESC LIMIT 1').get() as unknown as Booklist;
}

export function updateBooklist(id: number, name: string, description?: string): void {
  const d = getDb()!;
  const now = Math.floor(Date.now() / 1000);
  d.prepare(
    'UPDATE booklists SET name = ?, description = ?, updated_at = ? WHERE id = ?'
  ).all(name, description || '', now, id);
}

export function deleteBooklist(id: number): void {
  const d = getDb()!;
  d.prepare('DELETE FROM booklist_items WHERE list_id = ?').all(id);
  d.prepare('DELETE FROM booklists WHERE id = ?').all(id);
}

export function addBookToList(listId: number, bookId: string, note?: string): void {
  const d = getDb()!;
  const now = Math.floor(Date.now() / 1000);
  d.prepare(
    'INSERT OR IGNORE INTO booklist_items (list_id, book_id, note, added_at) VALUES (?, ?, ?, ?)'
  ).all(listId, bookId, note || '', now);
  d.prepare('UPDATE booklists SET updated_at = ? WHERE id = ?').all(now, listId);
}

export function removeBookFromList(listId: number, bookId: string): void {
  const d = getDb()!;
  d.prepare('DELETE FROM booklist_items WHERE list_id = ? AND book_id = ?').all(listId, bookId);
  d.prepare('UPDATE booklists SET updated_at = ? WHERE id = ?').all(Math.floor(Date.now() / 1000), listId);
}

export function updateBooklistItemNote(listId: number, bookId: string, note: string): void {
  const d = getDb()!;
  d.prepare(
    'UPDATE booklist_items SET note = ? WHERE list_id = ? AND book_id = ?'
  ).all(note || '', listId, bookId);
}

// ─── Annual Books ───

export function getAnnualBooks(year: number) {
  const d = getDb()!;
  const start = Math.floor(new Date(`${year}-01-01T00:00:00`).getTime() / 1000);
  const end = Math.floor(new Date(`${year + 1}-01-01T00:00:00`).getTime() / 1000);

  const books = d.prepare(`
    SELECT b.*, n.total_notes AS totalNotes, n.note_count AS noteCount, n.review_count AS reviewCount
    FROM books b LEFT JOIN notebooks n ON b.id = n.book_id
    WHERE b.update_time >= ? AND b.update_time < ?
    ORDER BY b.update_time ASC
  `).all(start, end) as unknown as Book[];

  const totalReadTime = books.reduce((s, b) => s + (b.read_time || 0), 0);
  const finishedCount = books.filter(b => b.finished).length;
  const totalNotes = books.reduce((s, b) => s + (b.totalNotes || 0), 0);

  return { books, totalReadTime, finishedCount, totalNotes };
}

export function getAnnualYears(): number[] {
  const d = getDb()!;
  const rows = d.prepare(
    "SELECT DISTINCT CAST(strftime('%Y', datetime(update_time, 'unixepoch')) AS INTEGER) AS yr FROM books WHERE update_time > 0 ORDER BY yr DESC"
  ).all() as Array<{ yr: number }>;
  return rows.map(r => r.yr).filter(Boolean);
}
