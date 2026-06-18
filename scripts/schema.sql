-- ============================================================================
-- 黄氏书房 — 数据库 Schema 单一真相源
-- ============================================================================
-- 所有建表脚本 (create_db.py / sync.py / db.js) 均应从此文件读取 DDL。
-- 修改表结构时，只需改这一个文件。
-- ============================================================================

-- Books: 书架书籍
CREATE TABLE IF NOT EXISTS books (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    author          TEXT DEFAULT '',
    cover           TEXT DEFAULT '',
    category        TEXT DEFAULT '',
    finished        INTEGER NOT NULL DEFAULT 0,
    update_time     INTEGER DEFAULT 0,
    read_time       INTEGER DEFAULT 0,       -- 阅读时长(秒)
    progress        INTEGER DEFAULT 0,       -- 阅读进度(百分比)
    last_read_time  INTEGER DEFAULT 0,       -- 最后阅读时间戳
    intro           TEXT DEFAULT '',          -- 书籍简介
    want_to_read    INTEGER DEFAULT 0,        -- 想读标记
    user_rating     INTEGER DEFAULT 0         -- 用户评分(1-5)
);

-- Highlights: 划线笔记
CREATE TABLE IF NOT EXISTS highlights (
    bookmark_id     TEXT PRIMARY KEY,
    book_id         TEXT NOT NULL,
    chapter_uid     TEXT DEFAULT '',
    chapter_title   TEXT DEFAULT '',
    mark_text       TEXT DEFAULT '',
    color_style     TEXT DEFAULT '0',
    type            INTEGER DEFAULT 1,
    create_time     INTEGER NOT NULL,
    range_text      TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_highlights_book ON highlights(book_id);
CREATE INDEX IF NOT EXISTS idx_highlights_time ON highlights(create_time);

-- Reviews: 想法/点评
CREATE TABLE IF NOT EXISTS reviews (
    review_id       TEXT PRIMARY KEY,
    book_id         TEXT NOT NULL,
    content         TEXT DEFAULT '',
    chapter_name    TEXT DEFAULT '',
    star            INTEGER DEFAULT -1,
    create_time     INTEGER NOT NULL,
    abstract        TEXT DEFAULT ''           -- 摘要
);
CREATE INDEX IF NOT EXISTS idx_reviews_book ON reviews(book_id);

-- Notebooks: 每本书的笔记统计
CREATE TABLE IF NOT EXISTS notebooks (
    book_id         TEXT PRIMARY KEY,
    review_count    INTEGER DEFAULT 0,
    note_count      INTEGER DEFAULT 0,
    bookmark_count  INTEGER DEFAULT 0,
    total_notes     INTEGER DEFAULT 0,
    sort            INTEGER DEFAULT 0
);

-- Reading Sessions: 每日阅读秒数 (热力图数据)
CREATE TABLE IF NOT EXISTS reading_sessions (
    date            TEXT PRIMARY KEY,
    seconds         INTEGER NOT NULL DEFAULT 0
);

-- Reading Trends: 月度阅读趋势
CREATE TABLE IF NOT EXISTS reading_trends (
    year            INTEGER NOT NULL,
    month           INTEGER NOT NULL,
    total_seconds   INTEGER NOT NULL DEFAULT 0,
    read_days       INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (year, month)
);

-- Summary: 汇总统计(单行)
CREATE TABLE IF NOT EXISTS summary (
    id                  INTEGER PRIMARY KEY CHECK(id=1),
    total_books         INTEGER DEFAULT 0,
    finished_count      INTEGER DEFAULT 0,
    total_note_count    INTEGER DEFAULT 0,
    notebook_books_count INTEGER DEFAULT 0,
    categories          TEXT DEFAULT '[]',
    top_authors         TEXT DEFAULT '[]',
    archives            TEXT DEFAULT '[]'
);
INSERT OR IGNORE INTO summary (id) VALUES (1);

-- Sync Log: 数据同步运行记录
CREATE TABLE IF NOT EXISTS sync_log (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at          TEXT NOT NULL,
    finished_at         TEXT,
    status              TEXT DEFAULT 'running',
    books_updated       INTEGER DEFAULT 0,
    highlights_updated  INTEGER DEFAULT 0,
    reviews_updated     INTEGER DEFAULT 0,
    errors              TEXT
);

-- KV Store: 聚合数据键值存储 (overall, annual, annual-2026 等)
CREATE TABLE IF NOT EXISTS kv_store (
    name        TEXT PRIMARY KEY,
    value       TEXT DEFAULT '',
    updated_at  TEXT DEFAULT (datetime('now'))
);

-- Tags: 用户标签
CREATE TABLE IF NOT EXISTS tags (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    color       TEXT DEFAULT '#6366f1',
    created_at  INTEGER NOT NULL
);

-- Note Tags: 笔记-标签关联
CREATE TABLE IF NOT EXISTS note_tags (
    note_id     TEXT NOT NULL,
    note_type   TEXT NOT NULL,                -- 'highlight' or 'review'
    tag_id      INTEGER NOT NULL,
    PRIMARY KEY (note_id, note_type, tag_id)
);

-- FTS5: 全文搜索索引
CREATE VIRTUAL TABLE IF NOT EXISTS highlights_fts USING fts5(
    mark_text,
    chapter_title,
    book_title,
    content=highlights,
    content_rowid=rowid
);

-- FTS 同步触发器
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
