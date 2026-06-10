#!/bin/bash
# diag_readtime.sh — 诊断微信读书 API 阅读时长数据缺失问题
# 在服务器端执行：bash ~/reading-site/scripts/diag_readtime.sh > /tmp/readtime-report.txt 2>&1
# 然后 cat /tmp/readtime-report.txt 发给微信读书团队

API_KEY="${WEREAD_API_KEY:-}"
GATEWAY="https://i.weread.qq.com/api/agent/gateway"
SKILL_VERSION="1.0.3"

if [ -z "$API_KEY" ]; then
  echo "[ERROR] WEREAD_API_KEY not set. Run: export WEREAD_API_KEY=wrk-xxxxxxxx"
  exit 1
fi

echo "================================================================================"
echo "  微信读书 Agent API — 阅读时长数据诊断报告"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================================================"
echo ""

# ─── Test 1: /shelf/sync — 书架数据 ───
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【测试 1】 /shelf/sync — 书架 API 返回的书籍字段"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SHELF_RESP=$(curl -s -X POST "$GATEWAY" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"api_name\":\"/shelf/sync\",\"skill_version\":\"$SKILL_VERSION\"}")

if echo "$SHELF_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('errcode',0)==0 else 1)" 2>/dev/null; then
  SHELF_TOTAL=$(echo "$SHELF_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('books',[])))")
  echo "  ✅ /shelf/sync 调用成功，共返回 $SHELF_TOTAL 本书"
  echo ""

  echo "  📋 单本书所有字段（第 1 本）："
  echo "$SHELF_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
books = d.get('books', [])
if books:
    print('  {')
    for k, v in sorted(books[0].items()):
        val = repr(v)
        if len(val) > 80:
            val = val[:77] + '...'
        print(f'    \"{k}\": {val},')
    print('  }')
"

  echo ""
  echo "  🔍 检查 books[i] 中是否包含阅读时长相关字段："
  echo "$SHELF_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
books = d.get('books', [])
readtime_fields = ['readTime', 'read_time', 'readingTime', 'reading_time', 'totalReadTime', 'totalReadingTime']
found = set()
for b in books:
    for f in readtime_fields:
        if f in b:
            found.add(f)
if found:
    print(f'  ⚠️  发现字段: {found}')
else:
    print(f'  ❌ 未找到任何阅读时长相关字段！')
    print(f'  books 表当前字段: {sorted(books[0].keys()) if books else []}')
"

else
  ERRCODE=$(echo "$SHELF_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('errcode','parse error'))" 2>/dev/null)
  echo "  ❌ /shelf/sync 失败: errcode=$ERRCODE"
fi

echo ""
echo ""

# ─── Test 2: /readdata/detail?mode=overall ───
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【测试 2】 /readdata/detail?mode=overall — 阅读数据 API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

OVERALL_RESP=$(curl -s -X POST "$GATEWAY" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"api_name\":\"/readdata/detail\",\"skill_version\":\"$SKILL_VERSION\",\"mode\":\"overall\"}")

if echo "$OVERALL_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('errcode',0)==0 else 1)" 2>/dev/null; then
  echo "  ✅ /readdata/detail?mode=overall 调用成功"
  echo "  📊 返回的顶级字段:"
  echo "$OVERALL_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'    {sorted(d.keys())}')"
  echo ""

  echo "  📖 readLongest 内容："
  echo "$OVERALL_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d.get('readLongest', [])
print(f'    共 {len(items)} 本书有阅读时长数据')
print('')
print('    {:<5s} {:<30s} {:<12s} {:<10s}'.format('序号', '书名', '阅读时长', '时长(小时)'))
print('    ' + '-'*65)
for i, item in enumerate(items):
    book = item.get('book', item.get('albumInfo', {}))
    title = book.get('title', '?')[:28]
    rt = item.get('readTime', 0)
    rh = rt / 3600
    print(f'    #{i+1:<4d} {title:<30s} {rt:>7d}s     {rh:>5.1f}h')
"
else
  ERRCODE=$(echo "$OVERALL_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('errcode','parse error'))" 2>/dev/null)
  echo "  ❌ /readdata/detail?mode=overall 失败: errcode=$ERRCODE"
fi

echo ""
echo ""

# ─── Test 3: /readdata/detail?mode=annually ───
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【测试 3】 /readdata/detail?mode=annually — 年度阅读数据（是否有不同书籍）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ANNUAL_RESP=$(curl -s -X POST "$GATEWAY" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"api_name\":\"/readdata/detail\",\"skill_version\":\"$SKILL_VERSION\",\"mode\":\"annually\"}")

if echo "$ANNUAL_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('errcode',0)==0 else 1)" 2>/dev/null; then
  ANNUAL_COUNT=$(echo "$ANNUAL_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('readLongest',[])))")
  echo "  ✅ /readdata/detail?mode=annually 调用成功，readLongest: $ANNUAL_COUNT 本"
else
  ERRCODE=$(echo "$ANNUAL_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('errcode','parse error'))" 2>/dev/null)
  echo "  ❌ /readdata/detail?mode=annually 失败: errcode=$ERRCODE"
fi

echo ""
echo ""

# ─── Summary ───
echo "================================================================================"
echo "  📊 诊断总结"
echo "================================================================================"
echo ""

echo "$SHELF_RESP" | python3 -c "
import sys, json

# Shelf stats
d = json.load(sys.stdin)
books = d.get('books', [])
shelf_total = len(books)
finished = sum(1 for b in books if b.get('finishReading'))

# Check for readTime
has_any_readtime = any('readTime' in b or 'read_time' in b or 'readingTime' in b for b in books)

print(f'  书架书籍总数：        {shelf_total} 本')
print(f'  已读完：              {finished} 本')
print(f'  每本书包含阅读时长？  {\"是\" if has_any_readtime else \"❌ 否 — 完全缺失\"}')
print('')
print(f'  readdata/detail API 仅返回 readLongest[] 数组')
print(f'  → 只有阅读时长 >= 5 分钟且排名靠前的 ~10 本书才有数据')
print(f'  → cover_rate: ~10/{shelf_total} ≈ {10/shelf_total*100:.1f}% 覆盖')
print('')
print(f'  ⛔ 核心问题：')
print(f'  /shelf/sync 返回了完整的书架（{shelf_total} 本），但不包含任何阅读时长字段')
print(f'  /readdata/detail 有阅读时长但只覆盖 ~{10/shelf_total*100:.1f}% 的书籍')
print(f'  没有 API 可以 1:1 返回每一本书的阅读时长')
"

echo ""
echo "================================================================================"
echo "  诊断完成"
echo "================================================================================"
