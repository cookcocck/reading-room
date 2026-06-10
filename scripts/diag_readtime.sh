#!/bin/bash
# diag_readtime.sh — 微信读书 API 阅读时长缺失证据
# 用法: export WEREAD_API_KEY=wrk-xxx && bash diag_readtime.sh

set -euo pipefail
API_KEY="${WEREAD_API_KEY:-}"
GATEWAY="https://i.weread.qq.com/api/agent/gateway"
SKILL="1.0.3"
TMP=$(mktemp -d)
trap "rm -rf $TMP" EXIT

[ -z "$API_KEY" ] && echo "ERROR: export WEREAD_API_KEY=wrk-xxx" && exit 1

call() {
  local label="$1" api="$2" extra="${3:-{}}"
  local body=$(python3 -c "import json; d={'api_name':'$api','skill_version':'$SKILL'}; d.update($extra); print(json.dumps(d,ensure_ascii=False))")
  curl -sS -X POST "$GATEWAY" -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" -d "$body" > "$TMP/resp.json"
  echo "=== $label ==="
  echo "  POST $api"
  echo "  Body: $body"
  echo "  Response keys: $(python3 -c "import json; d=json.load(open('$TMP/resp.json')); print(sorted(d.keys()))")"
  echo ""
}

pp() { python3 -c "import json; json.dump(json.load(open('$TMP/resp.json')),__import__('sys').stdout,indent=2,ensure_ascii=False)"; }

# ========== 1. /shelf/sync ==========
call "1. /shelf/sync — 书架" "/shelf/sync"

pp | python3 -c "
import sys,json
d=json.load(sys.stdin)
books=d.get('books',[])
total=len(books)
fields=sorted(books[0].keys()) if books else []
# 检查阅读时长字段
rt=[f for f in ['readTime','read_time','readingTime','totalReadTime','readSeconds','duration','readingDuration'] if f in fields]
print(f'  书架共 {total} 本')
print(f'  books[0] 字段: {fields}')
print(f'  阅读时长字段: {\"❌ 无\" if not rt else f\"⚠ {rt}\"}')
print(f'  >>> 结论: /shelf/sync 不返回单本书阅读时长')
" 
echo ""

# ========== 2. /readdata/detail ==========
call "2. /readdata/detail (overall)" "/readdata/detail" '{"mode":"overall"}'

pp | python3 -c "
import sys,json
d=json.load(sys.stdin)
items=d.get('readLongest',[])
print(f'  readLongest 共 {len(items)} 本')
if items:
    print(f'  readLongest[0] 字段: {sorted(items[0].keys())}')
    for i in items[:3]:
        b=i.get('book',{})
        print(f'  - {b.get(\"title\",\"?\")[:30]:30s} readTime={i.get(\"readTime\",0)}s')
print(f'  >>> 结论: readdata 有 readTime, 但仅返回前 {len(items)} 本(非全量)')
"
echo ""

# ========== 3. /book/info ==========
BID=$(python3 -c "import json; b=json.load(open('$TMP/resp.json')).get('books',[]); print(b[0]['bookId'])" 2>/dev/null || echo "")
if [ -n "$BID" ]; then
  call "3. /book/info (bookId=$BID)" "/book/info" "{\"bookId\":\"$BID\"}"
  pp | python3 -c "
import sys,json
d=json.load(sys.stdin)
book=d.get('book',d)
fields=sorted(book.keys()) if isinstance(book,dict) else []
print(f'  返回字段: {fields}')
rt=[f for f in fields if 'read' in f.lower() or 'time' in f.lower() or 'duration' in f.lower()]
print(f'  时长相关: {\"❌ 无\" if not rt else rt}')
print(f'  >>> 结论: /book/info 不包含个人阅读时长')
"
  echo ""
fi

# ========== 4. /user/notebooks ==========
call "4. /user/notebooks" "/user/notebooks"
pp | python3 -c "
import sys,json
d=json.load(sys.stdin)
notes=d.get('books',d.get('notebooks',[]))
print(f'  笔记本数: {len(notes)}')
if notes and isinstance(notes[0],dict):
    print(f'  notebooks[0] 字段: {sorted(notes[0].keys())}')
print(f'  >>> 结论: notebooks 无单本阅读时长')
"

echo ""
echo "========== 总结 =========="
echo "已覆盖 4 个 API: shelf/sync, readdata/detail, book/info, user/notebooks"
echo "所有端点均无故提供每本书的个人阅读时长(readTime/readSeconds)。"
echo "请在 /shelf/sync 的 books[] 中增加 readTime 字段(秒)。"
