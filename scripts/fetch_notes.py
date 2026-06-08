#!/usr/bin/env python3
"""
批量获取微信读书笔记正文（划线 + 想法）
API: POST https://i.weread.qq.com/api/agent/gateway
鉴权: Header Authorization: Bearer <API_KEY>
"""

import json
import os
import time
import requests
from pathlib import Path

# ─── 配置 ───────────────────────────────────────────────────────────────────
API_KEY = os.environ.get("WEREAD_API_KEY", "")
if not API_KEY:
    print("ERROR: Set WEREAD_API_KEY environment variable first")
    print("  export WEREAD_API_KEY=wrk-xxxxxxxx")
    exit(1)
GATEWAY = "https://i.weread.qq.com/api/agent/gateway"
SKILL_VERSION = "1.0.3"
DATA_DIR = Path(__file__).parent.parent / "src" / "data"
NOTEBOOKS_FILE = DATA_DIR / "notebooks.json"
OUTPUT_FILE = DATA_DIR / "notes_detail.json"
PROGRESS_FILE = DATA_DIR / "notes_progress.json"
DELAY = 0.8  # 每次 API 调用后延迟（秒），避免频率限制

# ─── API 调用 ─────────────────────────────────────────────────────────────────
session = requests.Session()
session.headers.update({
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
})


def call_api(api_name: str, params: dict) -> dict:
    """调用微信读书 Agent API Gateway"""
    body = {"api_name": api_name, "skill_version": SKILL_VERSION}
    body.update(params)
    resp = session.post(GATEWAY, json=body, timeout=30)
    resp.raise_for_status()
    result = resp.json()
    if result.get("errcode", 0) != 0:
        raise RuntimeError(f"API error {result.get('errcode')}: {result.get('errmsg', '')}")
    return result


def fetch_bookmarklist(book_id: str) -> list:
    """获取单本书的划线内容"""
    result = call_api("/book/bookmarklist", {"bookId": book_id})
    # 返回格式: { "updated": [...], "chapters": [...] }
    highlights = result.get("updated", [])
    chapters = result.get("chapters", [])
    # 建立 chapterUid -> title 映射
    chap_map = {c["chapterUid"]: c["title"] for c in chapters}
    for h in highlights:
        uid = h.get("chapterUid")
        h["chapterTitle"] = chap_map.get(uid, "")
    return highlights


def fetch_reviews(book_id: str) -> list:
    """获取单本书的想法/点评（支持分页）"""
    all_reviews = []
    synckey = 0
    while True:
        result = call_api("/review/list/mine", {"bookid": book_id, "synckey": synckey, "count": 20})
        reviews = result.get("reviews", [])
        if not reviews:
            break
        for r in reviews:
            rv = r.get("review", {})
            all_reviews.append({
                "reviewId": rv.get("reviewId"),
                "content": rv.get("content", ""),
                "createTime": rv.get("createTime"),
                "chapterName": rv.get("chapterName", ""),
                "star": rv.get("star", -1),
            })
        if result.get("hasMore", 0) == 0:
            break
        synckey = result.get("synckey", 0)
        if synckey == 0:
            break
        time.sleep(DELAY)
    return all_reviews


def load_progress() -> set:
    """加载已处理的 bookId 集合（断点续传）"""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return set(json.load(f))
    return set()


def save_progress(done_ids: set):
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(list(done_ids), f, ensure_ascii=False)


def main():
    # 1. 加载 notebooks.json
    with open(NOTEBOOKS_FILE, "r", encoding="utf-8") as f:
        notebooks = json.load(f)

    # 2. 加载已有输出（断点续传）
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            output = json.load(f)
    else:
        output = {}

    done_ids = load_progress()
    total = len(notebooks)
    print(f"[*] 共 {total} 本书，已处理 {len(done_ids)} 本，剩余 {total - len(done_ids)} 本")

    for i, book in enumerate(notebooks):
        book_id = str(book["id"])
        if book_id in done_ids:
            print(f"    [*] [{i+1}/{total}] SKIP: {book['title']}")
            continue

        title = book.get("title", book_id)
        print(f"    [>] [{i+1}/{total}] FETCH: {title} (id={book_id})")

        try:
            # 获取划线
            highlights = fetch_bookmarklist(book_id)
            time.sleep(DELAY)

            # 获取想法
            reviews = fetch_reviews(book_id)
            time.sleep(DELAY)

            output[book_id] = {
                "bookId": book_id,
                "title": title,
                "author": book.get("author", ""),
                "highlights": highlights,   # 划线原文
                "reviews": reviews,         # 想法/点评
                "noteCount": book.get("noteCount", 0),
                "reviewCount": book.get("reviewCount", 0),
            }

            # 保存进度
            done_ids.add(book_id)
            save_progress(done_ids)
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(output, f, ensure_ascii=False, indent=2)

            print(f"    [+] DONE: {len(highlights)} highlights, {len(reviews)} reviews")

        except Exception as e:
            print(f"    [!] FAIL: {e}")
            # 失败时也保存进度，但不标记完成，下次重试
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(output, f, ensure_ascii=False, indent=2)
            time.sleep(DELAY * 2)  # 失败后多等一会

    print(f"\n[*] ALL DONE! Processed {len(done_ids)} books")
    print(f"[*] Output: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
