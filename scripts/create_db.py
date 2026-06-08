"""create_db.py — Build SQLite database from JSON data files."""
import json
import sqlite3
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(ROOT_DIR, 'src', 'data')
DB_PATH = os.path.join(ROOT_DIR, 'db', 'reading-room.db')


def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def create_schema(conn):
    conn.executescript('''
        -- Books
        CREATE TABLE IF NOT EXISTS books (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            author TEXT DEFAULT '',
            cover TEXT DEFAULT '',
            category TEXT DEFAULT '',
            finished INTEGER NOT NULL DEFAULT 0,
            update_time INTEGER DEFAULT 0
        );

        -- Highlights from notes_detail.json
        -- NOTE: book_id is a reference but NOT a FK — notes_detail.json uses
        -- different id formats than books.json (e.g. CB_xxx vs numeric).
        CREATE TABLE IF NOT EXISTS highlights (
            bookmark_id TEXT PRIMARY KEY,
            book_id TEXT NOT NULL,
            chapter_uid TEXT DEFAULT '',
            chapter_title TEXT DEFAULT '',
            mark_text TEXT DEFAULT '',
            color_style TEXT DEFAULT '0',
            type INTEGER DEFAULT 1,
            create_time INTEGER NOT NULL,
            range_text TEXT DEFAULT ''
        );
        CREATE INDEX IF NOT EXISTS idx_highlights_book ON highlights(book_id);
        CREATE INDEX IF NOT EXISTS idx_highlights_time ON highlights(create_time);

        -- Reviews (想法/点评) from notes_detail.json
        CREATE TABLE IF NOT EXISTS reviews (
            review_id TEXT PRIMARY KEY,
            book_id TEXT NOT NULL,
            content TEXT DEFAULT '',
            chapter_name TEXT DEFAULT '',
            star INTEGER DEFAULT -1,
            create_time INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_reviews_book ON reviews(book_id);

        -- Daily reading seconds
        CREATE TABLE IF NOT EXISTS reading_sessions (
            date TEXT PRIMARY KEY,
            seconds INTEGER NOT NULL DEFAULT 0
        );

        -- Monthly trends
        CREATE TABLE IF NOT EXISTS reading_trends (
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            total_seconds INTEGER NOT NULL DEFAULT 0,
            read_days INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (year, month)
        );

        -- Notebook stats per book (same id mismatch issue, no FK)
        CREATE TABLE IF NOT EXISTS notebooks (
            book_id TEXT PRIMARY KEY,
            review_count INTEGER DEFAULT 0,
            note_count INTEGER DEFAULT 0,
            bookmark_count INTEGER DEFAULT 0,
            total_notes INTEGER DEFAULT 0,
            sort INTEGER DEFAULT 0
        );

        -- Summary (single row)
        CREATE TABLE IF NOT EXISTS summary (
            id INTEGER PRIMARY KEY CHECK(id=1),
            total_books INTEGER DEFAULT 0,
            finished_count INTEGER DEFAULT 0,
            total_note_count INTEGER DEFAULT 0,
            notebook_books_count INTEGER DEFAULT 0,
            categories TEXT DEFAULT '[]',
            top_authors TEXT DEFAULT '[]',
            archives TEXT DEFAULT '[]'
        );

        -- Sync log
        CREATE TABLE IF NOT EXISTS sync_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at TEXT NOT NULL,
            finished_at TEXT,
            status TEXT DEFAULT 'running',
            books_updated INTEGER DEFAULT 0,
            highlights_updated INTEGER DEFAULT 0,
            error TEXT
        );

        -- Key-value store for aggregate JSON data
        CREATE TABLE IF NOT EXISTS kv_store (
            name TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT DEFAULT (datetime('now'))
        );

        -- FTS index for full-text search on highlights
        CREATE VIRTUAL TABLE IF NOT EXISTS highlights_fts USING fts5(
            mark_text,
            chapter_title,
            book_title,
            content=highlights,
            content_rowid=rowid
        );

        -- Triggers to keep FTS in sync
        CREATE TRIGGER IF NOT EXISTS highlights_ai AFTER INSERT ON highlights BEGIN
            INSERT INTO highlights_fts(rowid, mark_text, chapter_title, book_title)
            VALUES (new.rowid, new.mark_text, new.chapter_title,
                    (SELECT title FROM books WHERE id = new.book_id));
        END;

        CREATE TRIGGER IF NOT EXISTS highlights_ad AFTER DELETE ON highlights BEGIN
            INSERT INTO highlights_fts(highlights_fts, rowid, mark_text, chapter_title, book_title)
            VALUES ('delete', old.rowid, old.mark_text, old.chapter_title, '');
        END;

        CREATE TRIGGER IF NOT EXISTS highlights_au AFTER UPDATE ON highlights BEGIN
            INSERT INTO highlights_fts(highlights_fts, rowid, mark_text, chapter_title, book_title)
            VALUES ('delete', old.rowid, old.mark_text, old.chapter_title, '');
            INSERT INTO highlights_fts(rowid, mark_text, chapter_title, book_title)
            VALUES (new.rowid, new.mark_text, new.chapter_title,
                    (SELECT title FROM books WHERE id = new.book_id));
        END;
    ''')
    conn.commit()


def load_all_json():
    """Read all JSON files."""
    data = {}
    data['books'] = load_json('books.json')
    data['notes_detail'] = load_json('notes_detail.json')
    data['notebooks'] = load_json('notebooks.json')
    data['heatmap'] = load_json('reading-heatmap.json')
    data['trends'] = load_json('reading-trends.json')
    data['summary'] = load_json('summary.json')
    print(f"Loaded: {len(data['books'])} books, {len(data['notes_detail'])} note-detail groups, "
          f"{len(data['notebooks'])} notebooks, {len(data['heatmap'])} heatmap days, "
          f"{len(data['trends'])} trend months")
    return data


def migrate_books(conn, books):
    """Insert books row by row."""
    cur = conn.cursor()
    cur.execute("DELETE FROM books")
    count = 0
    for b in books:
        try:
            cur.execute(
                'INSERT INTO books (id, title, author, cover, category, finished, update_time) '
                'VALUES (?, ?, ?, ?, ?, ?, ?)',
                (
                    b.get('id', ''),
                    b.get('title', '') or '',
                    b.get('author', '') or '',
                    b.get('cover', '') or '',
                    b.get('category', '') or '',
                    1 if b.get('finished') else 0,
                    int(b.get('updateTime', 0)) if b.get('updateTime') else 0
                )
            )
            count += 1
        except Exception as e:
            print(f"  skip book {b.get('title', '?')}: {e}")
    conn.commit()
    print(f"  {count} books inserted from books.json")
    return count


def add_books_from_notes(conn, notes_detail):
    """Add books from notes_detail.json that are missing from books table."""
    cur = conn.cursor()
    # Get existing book IDs
    existing = set(row[0] for row in cur.execute("SELECT id FROM books"))
    added = 0
    for book_id, detail in notes_detail.items():
        if book_id in existing:
            continue
        try:
            cur.execute(
                'INSERT OR IGNORE INTO books (id, title, author, cover, category, finished, update_time) '
                'VALUES (?, ?, ?, ?, ?, ?, ?)',
                (
                    book_id,
                    detail.get('title', '') or '',
                    detail.get('author', '') or '',
                    detail.get('cover', '') or '',
                    '',  # category unknown
                    0,  # finished? assume no
                    0   # update_time unknown
                )
            )
            if cur.rowcount > 0:
                added += 1
        except Exception as e:
            print(f"  skip adding book {book_id}: {e}")
    conn.commit()
    if added:
        print(f"  {added} additional books added from notes_detail")
    return added


def migrate_highlights(conn, notes_detail):
    """Insert all highlights from notes_detail.json."""
    cur = conn.cursor()
    cur.execute("DELETE FROM highlights")
    total = 0
    for book_id, detail in notes_detail.items():
        highlights = detail.get('highlights', [])
        for h in highlights:
            try:
                cur.execute(
                    'INSERT INTO highlights (bookmark_id, book_id, chapter_uid, chapter_title, '
                    'mark_text, color_style, type, create_time, range_text) '
                    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    (
                        h.get('bookmarkId', '') or f"{book_id}_{h.get('createTime', 0)}",
                        book_id,
                        str(h.get('chapterUid', '') or ''),
                        h.get('chapterTitle', '') or '',
                        h.get('markText', '') or '',
                        str(h.get('colorStyle', '0') or '0'),
                        int(h.get('type', 1) or 1),
                        int(h.get('createTime', 0) or 0),
                        h.get('range', '') or ''
                    )
                )
                total += 1
            except Exception as e:
                print(f"  skip highlight {h.get('bookmarkId', '?')}: {e}")
    conn.commit()
    print(f"  {total} highlights inserted")
    return total


def migrate_reviews(conn, notes_detail):
    """Insert all reviews (想法/点评) from notes_detail.json."""
    cur = conn.cursor()
    cur.execute("DELETE FROM reviews")
    total = 0
    for book_id, detail in notes_detail.items():
        reviews = detail.get('reviews', [])
        for r in reviews:
            try:
                cur.execute(
                    'INSERT INTO reviews (review_id, book_id, content, chapter_name, star, create_time) '
                    'VALUES (?, ?, ?, ?, ?, ?)',
                    (
                        r.get('reviewId', '') or f"{book_id}_rv_{r.get('createTime', 0)}",
                        book_id,
                        r.get('content', '') or '',
                        r.get('chapterName', '') or '',
                        int(r.get('star', -1) or -1),
                        int(r.get('createTime', 0) or 0),
                    )
                )
                total += 1
            except Exception as e:
                print(f"  skip review {r.get('reviewId', '?')}: {e}")
    conn.commit()
    print(f"  {total} reviews inserted")
    return total


def migrate_reading_sessions(conn, heatmap):
    """Insert daily reading data."""
    cur = conn.cursor()
    cur.execute("DELETE FROM reading_sessions")
    count = 0
    for d in heatmap:
        try:
            cur.execute(
                'INSERT INTO reading_sessions (date, seconds) VALUES (?, ?)',
                (d.get('date', ''), int(d.get('seconds', 0)))
            )
            count += 1
        except Exception as e:
            print(f"  skip session {d.get('date')}: {e}")
    conn.commit()
    print(f"  {count} reading sessions inserted")
    return count


def migrate_trends(conn, trends):
    """Insert monthly trends."""
    cur = conn.cursor()
    cur.execute("DELETE FROM reading_trends")
    count = 0
    for t in trends:
        try:
            cur.execute(
                'INSERT INTO reading_trends (year, month, total_seconds, read_days) '
                'VALUES (?, ?, ?, ?)',
                (
                    int(t.get('year', 0)),
                    int(t.get('month', 0)),
                    int(t.get('totalSeconds', 0)),
                    int(t.get('readDays', 0))
                )
            )
            count += 1
        except Exception as e:
            print(f"  skip trend {t.get('year')}-{t.get('month')}: {e}")
    conn.commit()
    print(f"  {count} trend rows inserted")
    return count


def migrate_notebooks(conn, notebooks):
    """Insert notebook stats."""
    cur = conn.cursor()
    cur.execute("DELETE FROM notebooks")
    count = 0
    for nb in notebooks:
        try:
            cur.execute(
                'INSERT INTO notebooks (book_id, review_count, note_count, '
                'bookmark_count, total_notes, sort) VALUES (?, ?, ?, ?, ?, ?)',
                (
                    nb.get('id', '') or nb.get('bookId', ''),
                    int(nb.get('reviewCount', 0) or 0),
                    int(nb.get('noteCount', 0) or 0),
                    int(nb.get('bookmarkCount', 0) or 0),
                    int(nb.get('totalNotes', 0) or 0),
                    int(nb.get('sort', 0) or 0)
                )
            )
            count += 1
        except Exception as e:
            print(f"  skip notebook {nb.get('id', '?')}: {e}")
    conn.commit()
    print(f"  {count} notebook records inserted")
    return count


def migrate_summary(conn, summary):
    """Insert summary stats."""
    cur = conn.cursor()
    cur.execute("DELETE FROM summary")
    try:
        cur.execute(
            'INSERT INTO summary (id, total_books, finished_count, total_note_count, '
            'notebook_books_count, categories, top_authors, archives) '
            'VALUES (1, ?, ?, ?, ?, ?, ?, ?)',
            (
                int(summary.get('totalBooks', 0)),
                int(summary.get('finishedCount', 0)),
                int(summary.get('totalNoteCount', 0)),
                int(summary.get('notebookBooksCount', 0) or 0),
                json.dumps(summary.get('categories', []), ensure_ascii=False),
                json.dumps(summary.get('topAuthors', []), ensure_ascii=False),
                json.dumps(summary.get('archives', []), ensure_ascii=False)
            )
        )
    except Exception as e:
        print(f"  skip summary: {e}")
    conn.commit()
    print("  summary saved")


def migrate_kv_store(conn):
    """Store overall.json, annual.json, annual-2026.json as key-value pairs."""
    cur = conn.cursor()
    cur.execute("DELETE FROM kv_store")
    
    files = {
        'overall': 'overall.json',
        'annual': 'annual.json',
        'annual-2026': 'annual-2026.json',
    }
    
    for name, filename in files.items():
        try:
            data = load_json(filename)
            cur.execute(
                "INSERT INTO kv_store (name, value) VALUES (?, ?)",
                (name, json.dumps(data, ensure_ascii=False))
            )
            print(f"  kv_store: {name} ({filename}) saved")
        except Exception as e:
            print(f"  skip kv_store {name}: {e}")
    
    conn.commit()


def main():
    print("=== Building SQLite database from JSON ===")
    print(f"Data dir: {DATA_DIR}")
    print(f"DB path:  {DB_PATH}")

    # Remove old DB if exists
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print("Removed old database")

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")

    create_schema(conn)
    print("Schema created")

    data = load_all_json()

    n_books = migrate_books(conn, data['books'])
    n_extra_books = add_books_from_notes(conn, data['notes_detail'])
    n_highlights = migrate_highlights(conn, data['notes_detail'])
    n_reviews = migrate_reviews(conn, data['notes_detail'])
    n_sessions = migrate_reading_sessions(conn, data['heatmap'])
    n_trends = migrate_trends(conn, data['trends'])
    n_notebooks = migrate_notebooks(conn, data['notebooks'])
    migrate_summary(conn, data['summary'])
    migrate_kv_store(conn)

    conn.close()

    db_size = os.path.getsize(DB_PATH)
    print(f"\n=== Done ===")
    print(f"  Books:      {n_books} (+{n_extra_books} from notes)")
    print(f"  Highlights: {n_highlights}")
    print(f"  Reviews:    {n_reviews}")
    print(f"  Sessions:   {n_sessions}")
    print(f"  Trends:     {n_trends}")
    print(f"  Notebooks:  {n_notebooks}")
    print(f"  DB size:    {db_size / 1024 / 1024:.2f} MB")

    return 0


if __name__ == '__main__':
    sys.exit(main())
