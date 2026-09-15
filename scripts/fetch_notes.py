#!/usr/bin/env python3
"""
鎵归噺鑾峰彇寰俊璇讳功绗旇姝ｆ枃锛堝垝绾?+ 鎯虫硶锛?
API: POST https://i.weread.qq.com/api/agent/gateway
閴存潈: Header Authorization: Bearer <API_KEY>
"""

import json
import os
import time
import requests
from pathlib import Path

# 鈹€鈹€鈹€ 閰嶇疆 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
API_KEY = os.environ.get("WEREAD_API_KEY", "")
if not API_KEY:
    print("ERROR: Set WEREAD_API_KEY environment variable first")
    print("  export WEREAD_API_KEY=wrk-xxxxxxxx")
    exit(1)
GATEWAY = "https://i.weread.qq.com/api/agent/gateway"
SKILL_VERSION = "1.0.4"
DATA_DIR = Path(__file__).parent.parent / "src" / "data"
NOTEBOOKS_FILE = DATA_DIR / "notebooks.json"
OUTPUT_FILE = DATA_DIR / "notes_detail.json"
PROGRESS_FILE = DATA_DIR / "notes_progress.json"
DELAY = 0.8  # 姣忔 API 璋冪敤鍚庡欢杩燂紙绉掞級锛岄伩鍏嶉鐜囬檺鍒?

# 鈹€鈹€鈹€ API 璋冪敤 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
session = requests.Session()
session.headers.update({
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
})


def call_api(api_name: str, params: dict) -> dict:
    """璋冪敤寰俊璇讳功 Agent API Gateway"""
    body = {"api_name": api_name, "skill_version": SKILL_VERSION}
    body.update(params)
    resp = session.post(GATEWAY, json=body, timeout=30)
    resp.raise_for_status()
    result = resp.json()
    if result.get("errcode", 0) != 0:
        raise RuntimeError(f"API error {result.get('errcode')}: {result.get('errmsg', '')}")
    return result


def fetch_bookmarklist(book_id: str) -> list:
    """鑾峰彇鍗曟湰涔︾殑鍒掔嚎鍐呭"""
    result = call_api("/book/bookmarklist", {"bookId": book_id})
    # 杩斿洖鏍煎紡: { "updated": [...], "chapters": [...] }
    highlights = result.get("updated", [])
    chapters = result.get("chapters", [])
    # 寤虹珛 chapterUid -> title 鏄犲皠
    chap_map = {c["chapterUid"]: c["title"] for c in chapters}
    for h in highlights:
        uid = h.get("chapterUid")
        h["chapterTitle"] = chap_map.get(uid, "")
    return highlights


def fetch_reviews(book_id: str) -> list:
    """鑾峰彇鍗曟湰涔︾殑鎯虫硶/鐐硅瘎锛堟敮鎸佸垎椤碉級"""
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
    """鍔犺浇宸插鐞嗙殑 bookId 闆嗗悎锛堟柇鐐圭画浼狅級"""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return set(json.load(f))
    return set()


def save_progress(done_ids: set):
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(list(done_ids), f, ensure_ascii=False)


def main():
    # 1. 鍔犺浇 notebooks.json
    with open(NOTEBOOKS_FILE, "r", encoding="utf-8") as f:
        notebooks = json.load(f)

    # 2. 鍔犺浇宸叉湁杈撳嚭锛堟柇鐐圭画浼狅級
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            output = json.load(f)
    else:
        output = {}

    done_ids = load_progress()
    total = len(notebooks)
    print(f"[*] 鍏?{total} 鏈功锛屽凡澶勭悊 {len(done_ids)} 鏈紝鍓╀綑 {total - len(done_ids)} 鏈?)

    for i, book in enumerate(notebooks):
        book_id = str(book["id"])
        if book_id in done_ids:
            print(f"    [*] [{i+1}/{total}] SKIP: {book['title']}")
            continue

        title = book.get("title", book_id)
        print(f"    [>] [{i+1}/{total}] FETCH: {title} (id={book_id})")

        try:
            # 鑾峰彇鍒掔嚎
            highlights = fetch_bookmarklist(book_id)
            time.sleep(DELAY)

            # 鑾峰彇鎯虫硶
            reviews = fetch_reviews(book_id)
            time.sleep(DELAY)

            output[book_id] = {
                "bookId": book_id,
                "title": title,
                "author": book.get("author", ""),
                "highlights": highlights,   # 鍒掔嚎鍘熸枃
                "reviews": reviews,         # 鎯虫硶/鐐硅瘎
                "noteCount": book.get("noteCount", 0),
                "reviewCount": book.get("reviewCount", 0),
            }

            # 淇濆瓨杩涘害
            done_ids.add(book_id)
            save_progress(done_ids)
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(output, f, ensure_ascii=False, indent=2)

            print(f"    [+] DONE: {len(highlights)} highlights, {len(reviews)} reviews")

        except Exception as e:
            print(f"    [!] FAIL: {e}")
            # 澶辫触鏃朵篃淇濆瓨杩涘害锛屼絾涓嶆爣璁板畬鎴愶紝涓嬫閲嶈瘯
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(output, f, ensure_ascii=False, indent=2)
            time.sleep(DELAY * 2)  # 澶辫触鍚庡绛変竴浼?

    print(f"\n[*] ALL DONE! Processed {len(done_ids)} books")
    print(f"[*] Output: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
