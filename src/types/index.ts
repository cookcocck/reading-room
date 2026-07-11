// ─── Core Domain Types ───

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  category: string;
  finished: number;
  update_time: number;
  read_time: number;
  progress: number;
  last_read_time: number;
  intro: string;
  want_to_read: number;
  user_rating: number;
  // Joined fields
  reviewCount?: number;
  noteCount?: number;
  bookmarkCount?: number;
  totalNotes?: number;
}

export interface BookDetail extends Omit<Book, 'finished'> {
  finished: boolean;
  readTime: number;
  notebook: NotebookSummary | null;
}

export interface NotebookSummary {
  reviewCount: number;
  noteCount: number;
  bookmarkCount: number;
  totalNotes: number;
}

export interface Notebook extends NotebookSummary {
  book_id: string;
  sort: number;
  title?: string;
  author?: string;
  cover?: string;
}

export interface Highlight {
  bookmark_id: string;
  book_id: string;
  chapter_uid: string;
  chapter_title: string;
  mark_text: string;
  color_style: string;
  type: number;
  create_time: number;
  range_text: string;
  // Joined
  book_title?: string;
  book_author?: string;
}

export interface HighlightCard {
  bookTitle: string;
  bookAuthor: string;
  markText: string;
  chapter_title?: string;
  create_time?: number;
  bookId?: string;
}

export interface HighlightPaged {
  id: string;
  text: string;
  chapter: string;
  bookTitle: string;
  bookAuthor: string;
  bookCover: string;
  bookId: string;
  createTime: number;
}

export interface Review {
  review_id: string;
  book_id: string;
  content: string;
  chapter_name: string;
  star: number;
  create_time: number;
  abstract: string;
  // Joined
  book_title?: string;
  book_author?: string;
}

export interface ReviewCard {
  content: string;
  chapter: string;
  time: number;
  star: number;
  abstract: string;
}

export interface Note {
  id: string;
  type: 'highlight' | 'review';
  text: string;
  chapter: string;
  create_time: number;
  book_id: string;
  book_title: string;
  book_author: string;
  book_cover: string;
  star?: number;
  abstract?: string;
}

export interface NotesGrouped {
  all: Array<{
    text: string;
    chapter: string;
    create_time: number;
    type: 'highlight' | 'review';
    id: string;
    star?: number;
    abstract?: string;
  }>;
  grouped: Record<string, Array<{
    text: string;
    chapter: string;
    create_time: number;
    type: 'highlight' | 'review';
    id: string;
    star?: number;
    abstract?: string;
  }>>;
}

// ─── Reading Stats ───

export interface ReadingSession {
  date: string;
  seconds: number;
}

export interface ReadingTrend {
  year: number;
  month: number;
  totalSeconds: number;
  readDays: number;
}

export interface HeatmapEntry {
  date: string;
  seconds: number;
}

export interface YearlyIntensity {
  year: number;
  totalSec: number;
  totalDays: number;
}

export interface Milestone {
  label: string;
  detail: string;
  ts: number;
  icon: string;
}

// ─── Summary & Overall ───

export interface Summary {
  totalBooks: number;
  finishedCount: number;
  totalNoteCount: number;
  notebookBooksCount: number;
  categories: Array<{ name: string; count?: number }>;
  topAuthors: Array<{ name: string; count?: number }>;
  archives: Array<{ name: string; count: number }>;
}

export interface OverallData {
  totalReadTimeSec?: number;
  readDays?: number;
  yearlyReadTimes?: Record<string, number>;
  topBooks?: Array<{
    title: string;
    author?: string;
    cover?: string;
    readTime: number;
    tags?: string[];
  }>;
  preferAuthors?: Array<{ name: string; count: number; readTime: string }>;
  preferCategories?: Array<{ title: string; count: number; time: number }>;
  preferTime?: number[];
  preferTimeWord?: string;
}

export interface AnnualData {
  totalReadTimeSec?: number;
  topBooks?: Array<{
    title: string;
    author?: string;
    cover?: string;
    readTime: number;
    tags?: string[];
  }>;
  preferAuthors?: Array<{ name: string; count: number; readTime: string }>;
  preferCategories?: Array<{ title: string; count: number; time: number }>;
  preferTime?: number[];
  preferTimeWord?: string;
}

export interface OverallKV {
  overall?: OverallData;
  annual?: AnnualData;
  'annual-2026'?: AnnualData;
}

// ─── Homepage Stats ───

export interface HomepageStats {
  monthDays: number;
  readingCount: number;
  newNotes: number;
  maxStreak: number;
  currentStreak: number;
  todayRead: boolean;
}

// ─── Book Detail ───

export interface MonthlyActivity {
  year: number;
  month: number;
  highlights: number;
  reviews: number;
}

export interface MonthlyBar extends MonthlyActivity {
  label: string;
  timeLabel: string;
  estimatedSec: number;
}

export interface ChapterActivity {
  chapter: string;
  highlights: number;
  reviews: number;
  total: number;
}

export interface BookIntro {
  intro: string;
}

// ─── Tags ───

export interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: number;
}

// ─── Booklists ───

export interface Booklist {
  id: number;
  name: string;
  description: string;
  created_at: number;
  updated_at: number;
  book_count?: number;
  items?: BooklistItem[];
}

export interface BooklistItem {
  id: number;
  list_id: number;
  book_id: string;
  note: string;
  sort_order: number;
  added_at: number;
  // Joined
  title?: string;
  author?: string;
  cover?: string;
  finished?: number;
  read_time?: number;
  category?: string;
}

// ─── Authors ───

export interface AuthorEntry {
  author: string;
  books: Book[];
  totalReadTime: number;
  finishedCount: number;
  totalNotes: number;
}

// ─── Search ───

export interface SearchResults {
  books: Book[];
  highlights: Array<{
    id: string;
    text: string;
    chapter: string;
    book_id: string;
    create_time: number;
    book_title: string;
    book_author: string;
  }>;
  reviews: Array<{
    id: string;
    text: string;
    chapter: string;
    book_id: string;
    create_time: number;
    book_title: string;
    book_author: string;
  }>;
}

// ─── Stats Page ───

export interface DeepThinkingItem {
  id: string;
  title: string;
  author: string;
  cover: string;
  category: string;
  noteCount: number;
  reviewCount: number;
  bookmarkCount: number;
  totalNotes: number;
}

export interface BookTimelineItem {
  id: string;
  title: string;
  author: string;
  category: string;
  addedAt: number;
}

// ─── Bookshelf Sort ───

export type BookshelfFilter = 'all' | 'finished' | 'reading' | 'want_to_read';
export type BookshelfSort = 'readtime' | 'recent' | 'title' | 'author';

// ─── Paginated ───

export interface PaginatedNotebooks {
  notebooks: Notebook[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface PaginatedHighlights {
  highlights: HighlightPaged[];
  total: number;
  hasMore: boolean;
}

// ─── DB Wrapper (better-sqlite3) ───

export interface DbStatement {
  all(...params: unknown[]): Record<string, unknown>[];
  get(...params: unknown[]): Record<string, unknown> | undefined;
  run(...params: unknown[]): { changes: number; lastInsertRowid: number };
}

export interface DbWrapper {
  prepare(sql: string): DbStatement;
  exec(sql: string): void;
  transaction<T>(fn: () => T): T;
  pragma(pragma: string): unknown;
}

// ─── View Context ───

export interface LayoutContext {
  title: string;
  summary?: Summary;
  path: string;
  needsHtml2Canvas?: boolean;
  heatmap?: string;
  helpers?: Record<string, (...args: unknown[]) => string>;
}

export interface IndexContext extends LayoutContext {
  annual: AnnualData;
  overall: OverallData;
  formatTime: (s: number) => string;
  formatTimestamp: (ts: number) => string;
  heatmapLevel: (s: number) => number;
  heatmap: string;
  monthly2025: string;
  maxMonthly: number;
  currentlyReading: Book[];
  recentHighlights: HighlightCard[];
  yearProgress: number;
  dayOfYear: number;
  daysInYear: number;
  weekdayCounts: number[];
  weekdayMap: string[];
  annual2026: AnnualData;
  hpStats: HomepageStats;
}
