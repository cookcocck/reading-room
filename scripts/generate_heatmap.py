#!/usr/bin/env python3
"""
Phase 2: 用 monthly 模式获取 2026 年逐日阅读数据，生成热力图
"""

import json
import os
import requests
from pathlib import Path
from datetime import datetime, timezone

API_KEY = os.environ.get("WEREAD_API_KEY", "")
if not API_KEY:
    print("ERROR: Set WEREAD_API_KEY environment variable first")
    print("  export WEREAD_API_KEY=wrk-xxxxxxxx")
    exit(1)
GATEWAY = "https://i.weread.qq.com/api/agent/gateway"
SKILL_VERSION = "1.0.3"
DATA_DIR = Path(__file__).parent.parent / "src" / "data"

session = requests.Session()
session.headers.update({
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
})


def call_api(api_name: str, params: dict) -> dict:
    body = {"api_name": api_name, "skill_version": SKILL_VERSION}
    body.update(params)
    resp = session.post(GATEWAY, json=body, timeout=30)
    resp.raise_for_status()
    result = resp.json()
    if result.get("errcode", 0) != 0:
        raise RuntimeError(f"API error: {result.get('errmsg', '')}")
    return result


def main():
    # ─── 获取 2026 年 1-6 月 monthly 数据，提取 readTimes（按天分桶） ───
    all_daily = {}

    for month in range(1, 7):
        # 取每个月 15 日的时间戳（确保落到该月）
        ts = int(datetime(2026, month, 15).timestamp())
        print(f"[*] Fetching 2026-{month:02d}...")
        result = call_api("/readdata/detail", {"mode": "monthly", "baseTime": ts})
        read_times = result.get("readTimes", {})
        print(f"    Got {len(read_times)} daily buckets")
        for day_ts, secs in read_times.items():
            dt = datetime.fromtimestamp(int(day_ts), tz=timezone.utc)
            date_str = dt.strftime("%Y-%m-%d")
            all_daily[date_str] = all_daily.get(date_str, 0) + secs

    # 生成热力图数组
    heatmap_data = []
    for date_str, secs in sorted(all_daily.items()):
        heatmap_data.append({"date": date_str, "seconds": secs})

    heatmap_file = DATA_DIR / "reading-heatmap.json"
    with open(heatmap_file, "w", encoding="utf-8") as f:
        json.dump(heatmap_data, f, ensure_ascii=False, indent=2)

    total_secs = sum(d["seconds"] for d in heatmap_data)
    print(f"[+] Saved: {heatmap_file}")
    print(f"[*] {len(heatmap_data)} days, total: {total_secs}s = {total_secs/3600:.1f}h")

    # ─── 同时检查 2026 年度 summary ───
    annual_file = DATA_DIR / "annual-2026.json"
    if annual_file.exists():
        with open(annual_file, "r", encoding="utf-8") as f:
            a26 = json.load(f)
        print(f"[*] 2026 annual summary: {a26['totalReadTimeSec']}s = {a26['totalReadTimeSec']/3600:.1f}h, {a26['readDays']} days")

    print("\n[*] All done!")


if __name__ == "__main__":
    main()
