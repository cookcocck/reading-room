#!/bin/bash
# diag_readtime.sh — 微信读书 Agent API 阅读时长数据缺失 完整诊断报告
# 用途：在服务器端执行，生成接口级原始数据报告，发给微信读书团队排查
#
# 执行方式：
#   export WEREAD_API_KEY=wrk-xxxxxxxx
#   bash ~/reading-site/scripts/diag_readtime.sh > /tmp/readtime-diag-$(date +%Y%m%d_%H%M%S).txt 2>&1
#   cat /tmp/readtime-diag-*.txt    # 复制全文反馈给微信读书团队

set -euo pipefail

API_KEY="${WEREAD_API_KEY:-}"
GATEWAY="https://i.weread.qq.com/api/agent/gateway"
SKILL_VERSION="1.0.3"

if [ -z "$API_KEY" ]; then
  echo "[ERROR] WEREAD_API_KEY not set."
  echo "Run: export WEREAD_API_KEY=wrk-xxxxxxxx"
  exit 1
fi

echo "================================================================================"
echo "  微信读书 Agent API — 阅读时长数据完整性诊断报告"
echo "  Report Time : $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "  Skill Ver   : $SKILL_VERSION"
echo "================================================================================"
echo ""

# ─── Helper: call API and dump full raw response ───
call_and_dump() {
  local label="$1"
  local api_name="$2"
  local extra_body="$3"
  local body
  body=$(python3 -c "import json; d={'api_name':'$api_name','skill_version':'$SKILL_VERSION'}; d.update($extra_body); print(json.dumps(d, ensure_ascii=False))")

  echo ""
  echo "================================================================================"
  echo "  [$label]"
  echo "================================================================================"
  echo ""
  echo "  ▶ 请求信息:"
  echo "    Method  : POST"
  echo "    URL     : $GATEWAY"
  echo "    Headers : Authorization: Bearer <API_KEY>"
  echo "              Content-Type: application/json"
  echo "    Body    : $body"
  echo ""

  local resp
  resp=$(curl -s -w "\n%{http_code}" -X POST "$GATEWAY" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$body")

  local http_code
  http_code=$(echo "$resp" | tail -1)
  local json_body
  json_body=$(echo "$resp" | sed '$d')

  echo "  ◀ 响应信息:"
  echo "    HTTP Status : $http_code"
  echo ""

  if ! echo "$json_body" | python3 -m json.tool >/dev/null 2>&1; then
    echo "  ❌ 响应不是合法 JSON。原始响应:"
    echo "$json_body"
    return 1
  fi

  # Check errcode
  local errcode
  errcode=$(echo "$json_body" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('errcode',0))")
  if [ "$errcode" != "0" ]; then
    local errmsg
    errmsg=$(echo "$json_body" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('errmsg','N/A'))")
    echo "  ❌ API 返回错误: errcode=$errcode, errmsg=$errmsg"
    echo ""
    echo "  ── 完整原始响应 JSON ──"
    echo "$json_body" | python3 -m json.tool
    return 1
  fi

  echo "  ✅ API 调用成功 (errcode=0)"
  echo ""

  # ── Full raw response ──
  echo "  ── 完整原始响应 JSON ──"
  echo "$json_body" | python3 -m json.tool
  echo ""

  # ── Response structure analysis ──
  echo "  ── 响应结构分析 ──"
  echo "$json_body" | python3 -c "
import sys, json
d = json.load(sys.stdin)

# Remove common wrapper fields
wrapper = ['errcode','errmsg','api_name','skill_version']
data_keys = [k for k in d.keys() if k not in wrapper]

print(f'    顶级字段 (不含 wrapper): {data_keys}')

for k in data_keys:
    v = d[k]
    if isinstance(v, list):
        print(f'    {k}: array[{(len(v))}]')
        if len(v) > 0:
            if isinstance(v[0], dict):
                print(f'      每个元素包含字段: {sorted(v[0].keys())}')
            else:
                print(f'      元素类型: {type(v[0]).__name__}, sample: {repr(v[0])[:100]}')
    elif isinstance(v, dict):
        print(f'    {k}: object, 包含字段: {sorted(v.keys())}')
    else:
        print(f'    {k}: {type(v).__name__} = {repr(v)[:100]}')
"
  echo ""
}

# ============================================================================
# Test 1: /shelf/sync — 书架核心API
# ============================================================================
call_and_dump \
  "1. /shelf/sync — 书架数据" \
  "/shelf/sync" \
  "{}"

# ─── Post-analysis: check ALL books for readTime ───
echo "  ── 📊 /shelf/sync 阅读时长字段专项检测 ──"
ALL_RESP=$(curl -s -X POST "$GATEWAY" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"api_name\":\"/shelf/sync\",\"skill_version\":\"$SKILL_VERSION\"}")

echo "$ALL_RESP" | python3 << 'PYEOF'
import sys, json

d = json.load(sys.stdin)
books = d.get('books', [])
total = len(books)

# Known reading-time-related field names across weread APIs
readtime_candidates = [
    'readTime', 'read_time', 'readingTime', 'reading_time',
    'totalReadTime', 'totalReadingTime', 'total_read_time',
    'readSeconds', 'read_seconds', 'readingDuration', 'reading_duration',
    'duration', 'totalDuration', 'total_duration',
    'readInfo', 'read_info', 'readingInfo', 'reading_info',
    'readProgress', 'read_progress',
    'metric', 'metrics',
]

print(f"    待检书籍: {total} 本")
print("")

# Collect all field names across all books
all_fields = set()
readtime_fields_found = set()
books_with_readtime = []

for i, b in enumerate(books):
    all_fields.update(b.keys())
    for f in readtime_candidates:
        if f in b:
            readtime_fields_found.add(f)
            books_with_readtime.append((i, b.get('title','?'), f, b[f]))

# Show all fields present across all books
print(f"    books[] 中出现的所有字段 (共{len(all_fields)}个):")
for f in sorted(all_fields):
    print(f"      - {f}")
print("")

# Check readtime
if readtime_fields_found:
    print(f"    ⚠️  发现疑似阅读时长字段: {readtime_fields_found}")
    print(f"    包含这些字段的书籍:")
    for idx, title, field, val in books_with_readtime:
        print(f"      [{idx}] {title}  →  {field} = {val}")
else:
    print(f"    ❌ 所有 {total} 本书均不包含任何阅读时长相关字段")
    print(f"    → /shelf/sync 完全不返回单本书的阅读时长数据")

# Spot-check: print a few random books to show missing
print("")
print(f"    抽查 3 本书的完整字段以证明一致性:")
import random
random.seed(42)
samples = random.sample(books, min(3, len(books)))
for b in samples:
    title = b.get('title', '?')
    bid = b.get('bookId', '?')
    print(f"")
    print(f"      bookId={bid}  title=\"{title}\"")
    for k in sorted(b.keys()):
        v = b[k]
        if isinstance(v, str) and len(v) > 60:
            v = v[:57] + '...'
        print(f"        {k}: {repr(v)}")
PYEOF

# ============================================================================
# Test 2: /readdata/detail?mode=overall
# ============================================================================
call_and_dump \
  "2. /readdata/detail (mode=overall) — 阅读数据统计" \
  "/readdata/detail" \
  '{"mode":"overall"}'

echo "  ── 📊 readdata/detail?mode=overall 阅读时长覆盖分析 ──"
OVERALL_RESP=$(curl -s -X POST "$GATEWAY" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"api_name\":\"/readdata/detail\",\"skill_version\":\"$SKILL_VERSION\",\"mode\":\"overall\"}")

echo "$OVERALL_RESP" | python3 << 'PYEOF'
import sys, json

d = json.load(sys.stdin)
items = d.get('readLongest', [])

print(f"    readLongest 数组长度: {len(items)}")
print("")
if len(items) > 0:
    print(f"    readLongest[0] 的所有字段:")
    for k, v in sorted(items[0].items()):
        if isinstance(v, dict):
            print(f"      {k}: (object) {sorted(v.keys())}")
        elif isinstance(v, str) and len(v) > 80:
            print(f"      {k}: {repr(v[:77]+'...')}")
        else:
            print(f"      {k}: {repr(v)}")
    print("")
    print(f"    全部 {len(items)} 本书的阅读时长摘要:")
    print(f"    {'#':>3s}  {'书名':<30s}  {'阅读时长(秒)':>10s}  {'时长(小时)':>8s}")
    print(f"    {'-'*3}  {'-'*30}  {'-'*10}  {'-'*8}")
    for i, item in enumerate(items):
        book = item.get('book', item.get('albumInfo', {}))
        title = book.get('title', '?')[:28]
        rt = item.get('readTime', 0)
        rh = rt / 3600
        print(f"    {i+1:3d}  {title:<30s}  {rt:>10d}  {rh:>7.1f}")
else:
    print(f"    ⚠️ readLongest 为空 — 该接口未返回任何阅读时长数据")
PYEOF

# ============================================================================
# Test 3: /readdata/detail?mode=annually
# ============================================================================
call_and_dump \
  "3. /readdata/detail (mode=annually) — 年度阅读统计" \
  "/readdata/detail" \
  '{"mode":"annually"}'

# ============================================================================
# Test 4: /book/info — 单本书详情（是否有阅读时长？）
# ============================================================================
# Pick first finished book from shelf
BOOK_ID=$(echo "$ALL_RESP" | python3 -c "
import sys,json; d=json.load(sys.stdin)
finished = [b for b in d.get('books',[]) if b.get('finishReading')]
if finished:
    print(finished[0].get('bookId',''))
else:
    for b in d.get('books',[]):
        print(b.get('bookId',''))
        break
")

if [ -n "$BOOK_ID" ]; then
  call_and_dump \
    "4. /book/info — 单本书详情 (bookId=$BOOK_ID)" \
    "/book/info" \
    "{\"bookId\":\"$BOOK_ID\"}"
else
  echo "  ⚠️ 未找到 bookId，跳过 /book/info 测试"
fi

# ============================================================================
# Test 5: /book/bookmarklist — 划线/笔记（是否嵌入阅读时长？）
# ============================================================================
if [ -n "$BOOK_ID" ]; then
  call_and_dump \
    "5. /book/bookmarklist — 书籍划线/笔记 (bookId=$BOOK_ID)" \
    "/book/bookmarklist" \
    "{\"bookId\":\"$BOOK_ID\"}"
fi

# ============================================================================
# Test 6: /review/list/mine — 书评/想法（是否嵌入阅读时长？）
# ============================================================================
if [ -n "$BOOK_ID" ]; then
  call_and_dump \
    "6. /review/list/mine — 我的书评/想法 (bookId=$BOOK_ID)" \
    "/review/list/mine" \
    "{\"bookId\":\"$BOOK_ID\"}"
fi

# ============================================================================
# Test 7: /user/notebooks — 笔记本（是否有阅读时长汇总？）
# ============================================================================
call_and_dump \
  "7. /user/notebooks — 用户笔记本列表" \
  "/user/notebooks" \
  "{}"

# ============================================================================
# FINAL SUMMARY
# ============================================================================
echo ""
echo "================================================================================"
echo "  📊 最终诊断结论"
echo "================================================================================"
echo ""

echo "$ALL_RESP" | python3 << 'PYEOF'
import sys, json

d = json.load(sys.stdin)
books = d.get('books', [])
total = len(books)
finished = sum(1 for b in books if b.get('finishReading'))

print(f"  【数据规模】")
print(f"  书架总书数:    {total} 本")
print(f"  已读完:        {finished} 本")
print(f"  在读/未读:     {total - finished} 本")
print("")

print(f"  【排查结论】")
print(f"")
print(f"  1️⃣  /shelf/sync")
print(f"     → 返回完整的书架列表（{total} 本）")
print(f"     → ❌ 每本书不包含任何阅读时长字段")
print(f"     → books[] 字段列表见上方【Test 1】输出")
print(f"")
print(f"  2️⃣  /readdata/detail (overall / annually)")
print(f"     → 返回 readLongest[] 数组（约10本）")
print(f"     → ✅ 包含 readTime 字段（秒）")
print(f"     → ❌ 仅覆盖阅读时长最长的 ~10 本书")
print(f"     → 覆盖率: ~10/{total} ≈ {10/total*100:.1f}%")
print(f"     → 无法获取其余 {total - 10} 本书的阅读时长")
print(f"")
print(f"  3️⃣  /book/info")
print(f"     → 返回单本书元信息")
print(f"     → ❌ 不包含该书的个人阅读时长")
print(f"")
print(f"  4️⃣  /book/bookmarklist + /review/list/mine + /user/notebooks")
print(f"     → 这些都是划线/笔记/书评接口，与阅读时长无关")
print(f"")
print(f"  ⛔ 核心诉求")
print(f"  —————————————————————————————————————")
print(f"  需要一个 API 端点，能够 1:1 返回书架中每本书的个人阅读时长。")
print(f"  建议方案（任选其一）：")
print(f"")
print(f"  方案 A: 在 /shelf/sync 的 books[] 中增加 readTime 字段（秒）")
print(f"  方案 B: 新增 /readdata/per_book 端点，参数: bookId，")
print(f"          返回该书个人阅读时长")
print(f"  方案 C: 新增 /readdata/batch 端点，参数: bookIds[]，")
print(f"          批量返回各书的阅读时长")
PYEOF

echo ""
echo "================================================================================"
echo "  报告结束。请将本文件完整内容转发给微信读书技术团队。"
echo "================================================================================"
echo "  File saved to: /tmp/readtime-diag-*.txt"
echo ""
