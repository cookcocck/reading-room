import { getDb } from '../connection';
import type {
  HighlightCard, HighlightPaged, ReviewCard, Note,
  MonthlyActivity, ChapterActivity, NotesGrouped,
  SearchResults,
} from '../../types';
import { upgradeCovers } from '../../utils/covers';

// ─── Highlights ───

export function getRecentHighlights(limit = 8): HighlightCard[] {
  const d = getDb()!;
  const rows = d.prepare(`
    SELECT h.*, b.title AS book_title, b.author AS book_author
    FROM highlights h
    LEFT JOIN books b ON h.book_id = b.id
    WHERE h.mark_text IS NOT NULL AND h.mark_text != ''
    ORDER BY RANDOM()
    LIMIT ?
  `).all(limit) as Array<Record<string, unknown>>;

  return rows.map(h => ({
    ...h,
    bookTitle: (h.book_title as string) || '未知',
    bookAuthor: (h.book_author as string) || '',
    markText: (h.mark_text as string) || (h.content as string) || '',
  })) as unknown as HighlightCard[];
}

export function getBookHighlights(bookTitle: string, limitHighlights = 5): Array<{ text: string; chapter: string; time: number }> {
  const d = getDb()!;
  const rows = d.prepare(`
    SELECT h.mark_text, h.chapter_title, h.create_time
    FROM highlights h
    JOIN books b ON h.book_id = b.id
    WHERE b.title = ?
    ORDER BY RANDOM()
    LIMIT ?
  `).all(bookTitle, limitHighlights) as Array<Record<string, unknown>>;

  return rows.map(r => ({
    text: (r.mark_text as string) || '',
    chapter: (r.chapter_title as string) || '',
    time: (r.create_time as number) || 0,
  }));
}

export function getHighlightsPaged(limit = 40, offset = 0, bookId: string | null = null): HighlightPaged[] {
  const d = getDb()!;
  const params: (string | number)[] = [];
  let where = "h.mark_text IS NOT NULL AND h.mark_text != '' AND length(h.mark_text) > 10";
  if (bookId) {
    where += ' AND h.book_id = ?';
    params.push(bookId);
  }
  const rows = d.prepare(`
    SELECT h.bookmark_id AS id, h.mark_text AS text, h.chapter_title AS chapter,
      h.create_time, h.book_id,
      b.title AS book_title, b.author AS book_author, b.cover AS book_cover, b.id AS bookId
    FROM highlights h
    LEFT JOIN books b ON h.book_id = b.id
    WHERE ${where}
    ORDER BY h.create_time DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as Array<Record<string, unknown>>;

  return rows.map(r => ({
    id: r.id as string,
    text: r.text as string,
    chapter: (r.chapter as string) || '',
    bookTitle: (r.book_title as string) || '',
    bookAuthor: (r.book_author as string) || '',
    bookCover: (r.book_cover as string) || '',
    bookId: (r.bookId as string) || (r.book_id as string),
    createTime: r.create_time as number,
  }));
}

export function getHighlightsTotal(bookId: string | null = null): number {
  const d = getDb()!;
  let where = "mark_text IS NOT NULL AND mark_text != '' AND length(mark_text) > 10";
  const params: string[] = [];
  if (bookId) {
    where += ' AND book_id = ?';
    params.push(bookId);
  }
  const row = d.prepare(`SELECT COUNT(*) AS c FROM highlights WHERE ${where}`).get(...params) as Record<string, unknown> | undefined;
  return row ? (row.c as number) : 0;
}

// ─── Reviews ───

export function getBookReviews(bookTitle: string, limitReviews = 5): ReviewCard[] {
  const d = getDb()!;
  const rows = d.prepare(`
    SELECT r.content, r.chapter_name, r.create_time, r.star, r.abstract
    FROM reviews r
    JOIN books b ON r.book_id = b.id
    WHERE b.title = ?
    ORDER BY RANDOM()
    LIMIT ?
  `).all(bookTitle, limitReviews) as Array<Record<string, unknown>>;

  return rows.map(r => ({
    content: (r.content as string) || '',
    chapter: (r.chapter_name as string) || '',
    time: (r.create_time as number) || 0,
    star: r.star != null ? (r.star as number) : -1,
    abstract: (r.abstract as string) || '',
  }));
}

// ─── Notes (Highlights + Reviews unified) ───

export function getRecentNotes(limit = 30): Note[] {
  const d = getDb()!;
  return d.prepare(`
    SELECT * FROM (
      SELECT
        h.bookmark_id AS id, 'highlight' AS type,
        h.mark_text AS text, h.chapter_title AS chapter,
        h.create_time, h.book_id,
        b.title AS book_title, b.author AS book_author, b.cover AS book_cover
      FROM highlights h LEFT JOIN books b ON h.book_id = b.id
      WHERE h.mark_text IS NOT NULL AND h.mark_text != ''
      UNION ALL
      SELECT
        r.review_id AS id, 'review' AS type,
        r.content AS text, r.chapter_name AS chapter,
        r.create_time, r.book_id,
        b.title AS book_title, b.author AS book_author, b.cover AS book_cover
      FROM reviews r LEFT JOIN books b ON r.book_id = b.id
      WHERE r.content IS NOT NULL AND r.content != ''
    )
    ORDER BY create_time DESC LIMIT ?
  `).all(limit) as unknown as Note[];
}

export function getRandomNotes(limit = 20): Note[] {
  const d = getDb()!;
  return d.prepare(`
    SELECT * FROM (
      SELECT
        h.bookmark_id AS id, 'highlight' AS type,
        h.mark_text AS text, h.chapter_title AS chapter,
        h.create_time, h.book_id,
        b.title AS book_title, b.author AS book_author, b.cover AS book_cover
      FROM highlights h LEFT JOIN books b ON h.book_id = b.id
      WHERE h.mark_text IS NOT NULL AND h.mark_text != ''
      UNION ALL
      SELECT
        r.review_id AS id, 'review' AS type,
        r.content AS text, r.chapter_name AS chapter,
        r.create_time, r.book_id,
        b.title AS book_title, b.author AS book_author, b.cover AS book_cover
      FROM reviews r LEFT JOIN books b ON r.book_id = b.id
      WHERE r.content IS NOT NULL AND r.content != ''
    )
    ORDER BY RANDOM() LIMIT ?
  `).all(limit) as unknown as Note[];
}

// ─── Notebooks ───

export function getAllNotebooks() {
  const d = getDb()!;
  return d.prepare(`
    SELECT n.*, b.title, b.author, b.cover
    FROM notebooks n
    LEFT JOIN books b ON n.book_id = b.id
    ORDER BY n.sort DESC
  `).all();
}

export function getNotebooks(page = 1, perPage = 30) {
  const d = getDb()!;
  const offset = (page - 1) * perPage;
  const total = (d.prepare('SELECT COUNT(*) AS count FROM notebooks').get() as Record<string, unknown>).count as number;
  const notebooks = d.prepare(`
    SELECT n.*, b.title, b.author, b.cover
    FROM notebooks n LEFT JOIN books b ON n.book_id = b.id
    ORDER BY n.sort DESC LIMIT ? OFFSET ?
  `).all(perPage, offset);

  return { notebooks, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

// ─── Book Detail Helpers ───

export function getBookMonthlyActivity(bookId: string): { months: MonthlyActivity[]; totalItems: number } {
  const d = getDb()!;

  const hRows = d.prepare(`
    SELECT
      CAST(strftime('%Y', datetime(create_time, 'unixepoch')) AS INTEGER) AS year,
      CAST(strftime('%m', datetime(create_time, 'unixepoch')) AS INTEGER) AS month,
      COUNT(*) AS cnt
    FROM highlights
    WHERE book_id = ? AND create_time > 0
    GROUP BY year, month ORDER BY year DESC, month DESC
  `).all(bookId) as Array<Record<string, unknown>>;

  const rRows = d.prepare(`
    SELECT
      CAST(strftime('%Y', datetime(create_time, 'unixepoch')) AS INTEGER) AS year,
      CAST(strftime('%m', datetime(create_time, 'unixepoch')) AS INTEGER) AS month,
      COUNT(*) AS cnt
    FROM reviews
    WHERE book_id = ? AND create_time > 0
    GROUP BY year, month ORDER BY year DESC, month DESC
  `).all(bookId) as Array<Record<string, unknown>>;

  const monthMap = new Map<string, MonthlyActivity>();
  for (const r of hRows) {
    const key = `${r.year}-${String(r.month).padStart(2, '0')}`;
    monthMap.set(key, { year: r.year as number, month: r.month as number, highlights: r.cnt as number, reviews: 0 });
  }
  for (const r of rRows) {
    const key = `${r.year}-${String(r.month).padStart(2, '0')}`;
    const existing = monthMap.get(key);
    if (existing) existing.reviews = r.cnt as number;
    else monthMap.set(key, { year: r.year as number, month: r.month as number, highlights: 0, reviews: r.cnt as number });
  }

  const months = Array.from(monthMap.values()).sort((a, b) => (b.year - a.year) || (b.month - a.month));
  const totalItems = months.reduce((sum, m) => sum + m.highlights + m.reviews, 0);
  return { months, totalItems };
}

export function getBookChapterActivity(bookTitle: string): ChapterActivity[] {
  const d = getDb()!;

  const hRows = d.prepare(`
    SELECT h.chapter_title AS chapter, COUNT(*) AS cnt
    FROM highlights h JOIN books b ON h.book_id = b.id
    WHERE b.title = ? AND h.chapter_title != ''
    GROUP BY h.chapter_title
  `).all(bookTitle) as Array<Record<string, unknown>>;

  const rRows = d.prepare(`
    SELECT r.chapter_name AS chapter, COUNT(*) AS cnt
    FROM reviews r JOIN books b ON r.book_id = b.id
    WHERE b.title = ? AND r.chapter_name != ''
    GROUP BY r.chapter_name
  `).all(bookTitle) as Array<Record<string, unknown>>;

  const map = new Map<string, ChapterActivity>();
  for (const row of hRows) {
    map.set(row.chapter as string, { chapter: row.chapter as string, highlights: row.cnt as number, reviews: 0, total: 0 });
  }
  for (const row of rRows) {
    const existing = map.get(row.chapter as string);
    if (existing) existing.reviews = row.cnt as number;
    else map.set(row.chapter as string, { chapter: row.chapter as string, highlights: 0, reviews: row.cnt as number, total: 0 });
  }

  return Array.from(map.values())
    .map(c => ({ ...c, total: c.highlights + c.reviews }))
    .sort((a, b) => b.total - a.total);
}

export function getBookAllNotes(bookTitle: string): NotesGrouped {
  const d = getDb()!;

  const hRows = d.prepare(`
    SELECT h.mark_text AS text, h.chapter_title AS chapter, h.create_time,
      'highlight' AS type, h.bookmark_id AS id
    FROM highlights h JOIN books b ON h.book_id = b.id
    WHERE b.title = ? AND h.mark_text != ''
  `).all(bookTitle) as Array<Record<string, unknown>>;

  const rRows = d.prepare(`
    SELECT r.content AS text, r.chapter_name AS chapter, r.create_time,
      'review' AS type, r.review_id AS id, r.star, r.abstract
    FROM reviews r JOIN books b ON r.book_id = b.id
    WHERE b.title = ? AND r.content != ''
  `).all(bookTitle) as Array<Record<string, unknown>>;

  type NoteItem = {
    text: string;
    chapter: string;
    create_time: number;
    type: 'highlight' | 'review';
    id: string;
    star?: number;
    abstract?: string;
  };

  const all: NoteItem[] = [
    ...hRows.map(r => ({ ...r, chapter: (r.chapter as string) || '未知章节' }) as NoteItem),
    ...rRows.map(r => ({ ...r, chapter: (r.chapter as string) || '未知章节' }) as NoteItem),
  ];
  all.sort((a, b) => a.create_time - b.create_time);

  const grouped: Record<string, NoteItem[]> = {};
  for (const note of all) {
    if (!grouped[note.chapter]) grouped[note.chapter] = [];
    grouped[note.chapter].push(note);
  }

  return { all, grouped };
}

// ─── Search ───

export function searchAll(query: string, limit = 30): SearchResults {
  const d = getDb()!;
  const like = `%${query}%`;

  const books = d.prepare(`
    SELECT id, title, author, cover, category, finished
    FROM books WHERE title LIKE ? OR author LIKE ?
    ORDER BY update_time DESC LIMIT ?
  `).all(like, like, limit) as unknown as SearchResults['books'];

  const highlights = d.prepare(`
    SELECT h.bookmark_id AS id, h.mark_text AS text, h.chapter_title AS chapter,
      h.book_id, h.create_time,
      b.title AS book_title, b.author AS book_author
    FROM highlights h JOIN books b ON h.book_id = b.id
    WHERE h.mark_text LIKE ? AND h.mark_text != ''
    ORDER BY h.create_time DESC LIMIT ?
  `).all(like, limit) as Array<Record<string, unknown>>;

  const reviews = d.prepare(`
    SELECT r.review_id AS id, r.content AS text, r.chapter_name AS chapter,
      r.book_id, r.create_time,
      b.title AS book_title, b.author AS book_author
    FROM reviews r JOIN books b ON r.book_id = b.id
    WHERE r.content LIKE ? AND r.content != ''
    ORDER BY r.create_time DESC LIMIT ?
  `).all(like, limit) as Array<Record<string, unknown>>;

  return {
    books: upgradeCovers(books),
    highlights: highlights as unknown as SearchResults['highlights'],
    reviews: reviews as unknown as SearchResults['reviews'],
  };
}
