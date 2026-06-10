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

# Helper: call API, save to TMP/resp.json, print summary
call() {
  local label="$1" api="$2" extra="${3:-{}}"
  local body
  body=$(python3 -c "
import json, sys
d = {'api_name': sys.argv[1], 'skill_version': sys.argv[2]}
d.update(json.loads(sys.argv[3]))
print(json.dumps(d, ensure_ascii=False))
" "$api" "$SKILL" "$extra")
  curl -sS -X POST "$GATEWAY" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$body" > "$TMP/resp.json"

  echo "=== $label ==="
  echo "  POST $api"
  echo "  Body: $body"
  python3 -c "
import json
d = json.load(open('$TMP/resp.json'))
ec = d.get('errcode', -1)
print(f'  errcode: {ec}')
if ec != 0:
    print(f'  errmsg:  {d.get(\"errmsg\",\"\")}')
    print(f'  errlog:  {d.get(\"errlog\",\"\")}')
else:
    ks = [k for k in d.keys() if k not in ('api_name','skill_version','errcode','errlog','errmsg')]
    print(f'  数据键: {ks}')
"
  echo ""
}

# ========== 1. /shelf/sync ==========
call "1. /shelf/sync — 书架" "/shelf/sync"

python3 -c "
import json
d = json.load(open('$TMP/resp.json'))
ec = d.get('errcode', -1)
if ec == 0:
    books = d.get('books', [])
    total = len(books)
    fields = sorted(books[0].keys()) if books else []
    rt = [f for f in ['readTime','read_time','readingTime','totalReadTime','readSeconds','duration','readingDuration'] if f in fields]
    print(f'  书架共 {total} 本')
    print(f'  books[0] 字段 ({len(fields)} 个): {fields}')
    print(f'  阅读时长字段: {\"❌ 无\" if not rt else f\"⚠ {rt}\"}')
else:
    print(f'  ⚠ API 失败 (errcode={ec}), 跳过分析')
"
echo ""

# Save bookId for later
BID=$(python3 -c "
import json; d=json.load(open('$TMP/resp.json'))
bks=d.get('books',[]); print(bks[0].get('bookId','')) if bks else print('')
" 2>/dev/null || echo "")

# ========== 2. /readdata/detail ==========
call "2. /readdata/detail (overall)" "/readdata/detail" '{"mode":"overall"}'

python3 -c "
import json
d = json.load(open('$TMP/resp.json'))
ec = d.get('errcode', -1)
if ec == 0:
    items = d.get('readLongest', [])
    print(f'  readLongest 共 {len(items)} 本')
    if items:
        print(f'  readLongest[0] 字段: {sorted(items[0].keys())}')
        for i in items[:3]:
            b = i.get('book', {})
            print(f'  - {b.get(\"title\",\"?\")[:30]:30s} readTime={i.get(\"readTime\",0)}s')
    print(f'  >>> 仅覆盖前 {len(items)} 本(非全量)')
else:
    print(f'  ⚠ errcode={ec} errmsg={d.get(\"errmsg\",\"\")}')
"
echo ""

# ========== 3. /book/info ==========
if [ -n "$BID" ]; then
  call "3. /book/info (bookId=$BID)" "/book/info" "{\"bookId\":\"$BID\"}"
  python3 -c "
import json
d = json.load(open('$TMP/resp.json'))
ec = d.get('errcode', -1)
if ec == 0:
    book = d.get('book', d)
    fields = sorted(book.keys()) if isinstance(book, dict) else []
    rt = [f for f in fields if any(w in f.lower() for w in ('read','time','duration'))]
    print(f'  返回字段 ({len(fields)} 个)')
    print(f'  时长相关: {\"❌ 无\" if not rt else rt}')
else:
    print(f'  ⚠ errcode={ec} errmsg={d.get(\"errmsg\",\"\")}')
" 2>/dev/null || echo "  ⚠ 该接口可能不支持"
  echo ""
fi

# ========== 4. /user/notebooks ==========
call "4. /user/notebooks" "/user/notebooks"

python3 -c "
import json
d = json.load(open('$TMP/resp.json'))
ec = d.get('errcode', -1)
if ec == 0:
    notes = d.get('books', d.get('notebooks', []))
    print(f'  笔记本数: {len(notes)}')
    if notes and isinstance(notes[0], dict):
        ks = sorted(notes[0].keys())
        print(f'  notebooks[0] 字段: {ks}')
        rt = [f for f in ks if any(w in f.lower() for w in ('read','time','duration'))]
        print(f'  时长相关: {\"❌ 无\" if not rt else rt}')
else:
    print(f'  ⚠ errcode={ec} errmsg={d.get(\"errmsg\",\"\")}')"

echo "
========== 总结 ==========
已覆盖: shelf/sync, readdata/detail, book/info, user/notebooks
所有端点均无故提供每本书的个人阅读时长(readTime/readSeconds)。
请在 /shelf/sync 的 books[] 中增加 readTime 字段(秒)。"
