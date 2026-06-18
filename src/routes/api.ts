import { Router, Request, Response } from 'express';
import {
  getRecentHighlights, getRandomNotes,
  getBookById, getBookHighlights, getBookReviews,
  setWantToRead, setBookRating,
  getAllTags, createTag, deleteTag, setNoteTags,
  getHighlightsPaged, getHighlightsTotal,
  getAllBooklists, getBooklistById,
  createBooklist, updateBooklist, deleteBooklist,
  addBookToList, removeBookFromList, updateBooklistItemNote,
} from '../db/models';

const router = Router();

// ─── API: Homepage highlights shuffle ───
router.get('/home/highlights', (req: Request, res: Response) => {
  const n = parseInt(req.query.n as string) || 8;
  const highlights = getRecentHighlights(n);
  res.json({ highlights });
});

// ─── API: Notebooks random refresh ───
router.get('/notebooks/random', (req: Request, res: Response) => {
  const n = parseInt(req.query.n as string) || 20;
  const notes = getRandomNotes(n);
  res.json({ notes });
});

// ─── API: Hero highlight ───
router.get('/hero-highlight', (_req: Request, res: Response) => {
  const highlights = getRecentHighlights(1);
  if (highlights.length === 0) {
    res.json({ text: '', bookTitle: '' });
  } else {
    res.json({ text: highlights[0].markText, bookTitle: highlights[0].bookTitle });
  }
});

// ─── API: Full book detail (for modals) ───
router.get('/book/:id', (req: Request, res: Response) => {
  const bookId = req.params.id as string;
  const book = getBookById(bookId);
  if (book === null) {
    res.status(404).json({ error: 'Not found' });
  } else {
    const highlights = getBookHighlights(book.title, 5);
    const reviews = getBookReviews(book.title, 5);
    res.json({ ...book, highlights, reviews });
  }
});

// ─── API: Random refresh of highlights/reviews for a book ───
router.get('/book/:id/:section', (req: Request, res: Response) => {
  const bookId = req.params.id as string;
  const book = getBookById(bookId);
  if (!book) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const n = parseInt(req.query.n as string) || 12;
  const section = req.params.section as string;

  if (section === 'highlights') {
    res.json({ highlights: getBookHighlights(book.title, n) });
    return;
  }
  if (section === 'reviews') {
    res.json({ reviews: getBookReviews(book.title, n) });
    return;
  }
  res.status(400).json({ error: 'Invalid section. Use "highlights" or "reviews".' });
});

// ─── API: Want-to-read toggle ───
router.post('/want-to-read', (req: Request, res: Response) => {
  const { bookId, want } = req.body;
  if (!bookId) {
    res.status(400).json({ error: 'bookId required' });
    return;
  }
  setWantToRead(bookId, !!want);
  res.json({ ok: true });
});

// ─── API: Book rating ───
router.post('/rating', (req: Request, res: Response) => {
  const { bookId, rating } = req.body;
  if (!bookId) {
    res.status(400).json({ error: 'bookId required' });
    return;
  }
  setBookRating(bookId, parseInt(rating) || 0);
  res.json({ ok: true });
});

// ─── Tags API ───
router.get('/tags', (_req: Request, res: Response) => {
  res.json(getAllTags());
});

router.post('/tags', (req: Request, res: Response) => {
  const { name, color } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name required' });
    return;
  }
  res.json(createTag(name, color));
});

router.delete('/tags/:id', (req: Request, res: Response) => {
  deleteTag(parseInt(req.params.id as string));
  res.json({ ok: true });
});

router.post('/note-tags', (req: Request, res: Response) => {
  const { noteId, noteType, tagIds } = req.body;
  if (!noteId || !noteType) {
    res.status(400).json({ error: 'noteId and noteType required' });
    return;
  }
  setNoteTags(noteId, noteType, tagIds || []);
  res.json({ ok: true });
});

// ─── API: Load more quotes (pagination) ───
router.get('/quotes', (req: Request, res: Response) => {
  const bookId = (req.query.book as string) || null;
  const offset = parseInt(req.query.offset as string) || 0;
  const limit = parseInt(req.query.limit as string) || 40;

  const highlights = getHighlightsPaged(limit, offset, bookId);
  const total = getHighlightsTotal(bookId);
  res.json({ highlights, total, hasMore: offset + highlights.length < total });
});

// ─── Booklists API ───
router.post('/booklists', (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name required' });
    return;
  }
  res.json(createBooklist(name, description));
});

router.put('/booklists/:id', (req: Request, res: Response) => {
  const { name, description } = req.body;
  updateBooklist(parseInt(req.params.id as string), name, description);
  res.json({ ok: true });
});

router.delete('/booklists/:id', (req: Request, res: Response) => {
  deleteBooklist(parseInt(req.params.id as string));
  res.json({ ok: true });
});

router.post('/booklists/:id/books', (req: Request, res: Response) => {
  const { bookId, note } = req.body;
  if (!bookId) {
    res.status(400).json({ error: 'bookId required' });
    return;
  }
  addBookToList(parseInt(req.params.id as string), bookId, note);
  res.json({ ok: true });
});

router.delete('/booklists/:id/books/:bookId', (req: Request, res: Response) => {
  removeBookFromList(parseInt(req.params.id as string), req.params.bookId as string);
  res.json({ ok: true });
});

router.put('/booklists/:id/books/:bookId', (req: Request, res: Response) => {
  const { note } = req.body;
  updateBooklistItemNote(parseInt(req.params.id as string), req.params.bookId as string, note);
  res.json({ ok: true });
});

export default router;
