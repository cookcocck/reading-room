/**
 * 作者详情页数据库诊断脚本
 * 用法：在服务器上执行  node scripts/diagnose.js
 * 
 * 检查清单：
 *  1. books 表是否有数据？author_id 列是否存在并回填？
 *  2. 原始 author 字段长什么样？（决定归一化能否工作）
 *  3. notebooks / highlights 表是否有数据？
 *  4. 模拟 getAuthorDetail 查询——能否找到陀思妥耶夫斯基？
 */

const path = require('path');
const fs = require('fs');

// ─── 查找数据库文件 ───
const projectRoot = path.resolve(__dirname, '..');
const dbDir = path.join(projectRoot, 'db');
const files = fs.readdirSync(dbDir).filter(f => f.endsWith('.db'));
if (files.length === 0) {
  console.log('❌  db/ 目录下没有 .db 文件！');
  console.log('   数据库文件在服务器上，请 SSH 到服务器执行本脚本。');
  process.exit(1);
}

const dbFile = path.join(dbDir, files[0]);
console.log(`📂 数据库文件: ${dbFile}  (${(fs.statSync(dbFile).size / 1024 / 1024).toFixed(1)} MB)`);

// ─── 加载 sql.js ───
let initSqlJs;
try {
  initSqlJs = require('sql.js');
} catch {
  console.log('❌  sql.js 未安装。请先运行: npm install');
  process.exit(1);
}

(async () => {
  const SQL = await initSqlJs();
  const buf = fs.readFileSync(dbFile);
  const d = new SQL.Database(buf);

  // 帮我写查询的小工具
  function q(sql, ...params) {
    try {
      if (params.length > 0 && params[0] !== undefined) {
        return d.prepare(sql).bind(params).all();
      }
      return d.exec(sql);
    } catch (e) {
      return { error: e.message };
    }
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('  作者详情页 数据库诊断');
  console.log('═══════════════════════════════════════════════════\n');

  // ─── 1. 检查 books 表 ───
  console.log('━━━ 1. books 表 ━━━');

  // 检查表是否存在
  const tables = d.exec("SELECT name FROM sqlite_master WHERE type='table'");
  const tableNames = tables[0]?.values?.map(r => r[0]) || [];
  console.log(`  已有表: ${tableNames.join(', ')}`);

  if (!tableNames.includes('books')) {
    console.log('  ❌ books 表不存在！');
    d.close();
    process.exit(1);
  }

  // 检查列
  const cols = d.exec('PRAGMA table_info(books)');
  const colNames = cols[0]?.values?.map(r => r[1]) || [];
  console.log(`  books 列: ${colNames.join(', ')}`);

  const hasAuthorId = colNames.includes('author_id');
  console.log(`  author_id 列: ${hasAuthorId ? '✅ 存在' : '❌ 不存在（迁移未执行！）'}`);

  // 行数
  const [{ values: [[bookCount]] }] = d.exec('SELECT COUNT(*) FROM books');
  console.log(`  书籍总数: ${bookCount}`);

  // author_id 为空的数量（提升到外层作用域，供总结部分使用）
  let nullCount = 0;
  if (hasAuthorId) {
    const [{ values: [[nc]] }] = d.exec("SELECT COUNT(*) FROM books WHERE author_id IS NULL OR author_id = ''");
    nullCount = nc;
    console.log(`  author_id 为空: ${nullCount} 本${nullCount > 0 ? ' ❌ 回填未完成！' : ' ✅ 全部回填完成'}`);

    // 打印 author_id 为空的书，帮助定位
    if (nullCount > 0) {
      const nullBooks = d.exec("SELECT id, title, author FROM books WHERE author_id IS NULL OR author_id = '' LIMIT 5");
      console.log('  作者UID为空的书：');
      for (const [id, title, author] of nullBooks[0]?.values || []) {
        console.log(`    ${id} | ${title || '(无标题)'} | 作者: "${author || '(空)'}"`);
      }
    }
  }

  // ─── 2. 检查 author 字段样本 ───
  console.log('\n━━━ 2. author 字段样本（前15条不同作者） ━━━');

  const authorSample = d.exec(`
    SELECT DISTINCT author FROM books
    WHERE author IS NOT NULL AND author != ''
    ORDER BY author
    LIMIT 15
  `);
  if (authorSample[0]?.values) {
    for (const [author] of authorSample[0].values) {
      console.log(`  "${author}"`);
    }
  }

  // ─── 3. 检查 author_id 样本 ───
  if (hasAuthorId) {
    console.log('\n━━━ 3. author_id 样本（前15条不同UID） ━━━');
    const uidSample = d.exec(`
      SELECT DISTINCT author_id, author FROM books
      WHERE author_id IS NOT NULL AND author_id != ''
      LIMIT 15
    `);
    if (uidSample[0]?.values) {
      for (const [uid, rawAuthor] of uidSample[0].values) {
        console.log(`  ${uid}  ←  "${rawAuthor}"`);
      }
    } else {
      console.log('  ⚠️  所有 author_id 都为空');
    }
  }

  // ─── 4. 检查 notebooks ───
  console.log('\n━━━ 4. notebooks 表 ━━━');
  if (tableNames.includes('notebooks')) {
    const [{ values: [[nbCount]] }] = d.exec('SELECT COUNT(*) FROM notebooks');
    console.log(`  笔记本记录数: ${nbCount}`);
    
    // 关联检查
    const [{ values: [[linkedCount]] }] = d.exec(`
      SELECT COUNT(*) FROM books b
      INNER JOIN notebooks n ON b.id = n.book_id
    `);
    console.log(`  books ⟷ notebooks 关联成功: ${linkedCount} 本`);
  } else {
    console.log('  ❌ notebooks 表不存在');
  }

  // ─── 5. 检查 highlights ───
  console.log('\n━━━ 5. highlights 表 ━━━');
  if (tableNames.includes('highlights')) {
    const [{ values: [[hlCount]] }] = d.exec('SELECT COUNT(*) FROM highlights');
    console.log(`  划线总数: ${hlCount}`);

    const [{ values: [[longCount]] }] = d.exec(
      "SELECT COUNT(*) FROM highlights WHERE mark_text IS NOT NULL AND mark_text != '' AND length(mark_text) > 10"
    );
    console.log(`  长划线(>10字): ${longCount} 条`);
  } else {
    console.log('  ❌ highlights 表不存在');
  }

  // ─── 6. 模拟 getAuthorDetail（核心诊断） ───
  console.log('\n━━━ 6. 模拟 getAuthorDetail 查询 ━━━');

  // 用 LIKE 先找到"陀思妥耶夫斯基"相关的书
  const dosto = d.exec(`
    SELECT id, title, author, author_id, finished, read_time
    FROM books
    WHERE author LIKE '%陀思妥耶夫斯基%' OR author LIKE '%Dostoevsky%' OR author LIKE '%dostoyevsky%'
    ORDER BY finished DESC, read_time DESC
  `);

  if (!dosto[0] || dosto[0].values.length === 0) {
    console.log('  ❌ 数据库中根本没有陀思妥耶夫斯基的书！');
    console.log('     → sync.py 同步时可能排除了这些书（检查 BLOCKED_BOOK_IDS）');
    console.log('     → 或者你的微信读书书架里确实没有这位作者的书');
  } else {
    console.log(`  找到 ${dosto[0].values.length} 本陀思妥耶夫斯基的书：`);
    for (const [id, title, author, authorId, finished, readTime] of dosto[0].values) {
      const done = finished ? '✅读完' : '📖在读';
      const time = readTime ? `${Math.floor(readTime/60)}分钟` : '0分钟';
      console.log(`    ${done}  ${title}  |  author_id=${authorId || '(空)'}  |  ${time}`);

      // 检查这本是否有笔记本
      try {
        const nb = d.exec('SELECT total_notes FROM notebooks WHERE book_id = ' + JSON.stringify(id));
        const nbVal = nb[0]?.values?.[0]?.[0];
        console.log(`      └─ 笔记本: ${nbVal || 0} 条笔记`);
      } catch { console.log(`      └─ 笔记本: (查不到)`); }
      // 检查这本是否有长划线
      try {
        const hl = d.exec("SELECT COUNT(*) AS cnt FROM highlights WHERE book_id = " + JSON.stringify(id) + " AND mark_text != '' AND length(mark_text) > 10");
        console.log(`      └─ 长划线: ${hl[0]?.values?.[0]?.[0] || 0} 条`);
      } catch { console.log(`      └─ 长划线: (查不到)`); }
    }

    // 如果 author_id 全为空，说明回填失败
    const allNull = dosto[0].values.every(r => !r[3]);
    if (allNull && hasAuthorId) {
      console.log('\n  ⚠️  author_id 全为空 → 回填脚本未执行或执行失败');
      console.log('     → 检查服务器启动日志中是否有 "[db] Author ID backfill: ..."');
    }
  }

  // ─── 7. 检查 getAuthorsAll 能否返回数据 ───
  console.log('\n━━━ 7. getAuthorsAll 模拟 ━━━');
  const authorsResult = d.exec(`
    SELECT author_id, COUNT(*) as cnt
    FROM books
    WHERE author_id IS NOT NULL AND author_id != ''
    GROUP BY author_id
    ORDER BY cnt DESC
    LIMIT 10
  `);
  if (authorsResult[0]?.values && authorsResult[0].values.length > 0) {
    console.log('  ✅ author_id 分组正常，Top 10 作者：');
    for (const [uid, count] of authorsResult[0].values) {
      // 取该 UID 的显示名
      const nameRow = d.exec('SELECT author FROM books WHERE author_id = ' + JSON.stringify(uid) + ' LIMIT 1');
      const displayName = nameRow[0]?.values?.[0]?.[0] || '(未知)';
      console.log(`    ${uid}  "${displayName}"  →  ${count} 本书`);
    }
  } else {
    console.log('  ❌ author_id 分组返回空 → 作者列表页也会是空的');
  }

  // ─── 总结 ───
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  诊断总结');
  console.log('═══════════════════════════════════════════════════');

  const issues = [];

  if (!hasAuthorId) issues.push('books 表缺少 author_id 列 → initDb 迁移未执行');
  if (hasAuthorId && nullCount > 0) issues.push(`author_id 有 ${nullCount} 条为空 → 回填未完成`);
  if (bookCount === 0) issues.push('books 表为空 → sync.py 从未运行或数据库文件不对');
  if (!tableNames.includes('notebooks')) issues.push('notebooks 表不存在');
  if (!tableNames.includes('highlights')) issues.push('highlights 表不存在');
  
  const dostoCount = dosto[0]?.values?.length || 0;
  if (dostoCount === 0) issues.push('数据库中没有陀思妥耶夫斯基的书（书架里没有，或被黑名单排除）');

  if (issues.length === 0) {
    console.log('✅ 所有检查通过！如果页面还是空的，问题可能在渲染层（EJS 模板 / CSS）');
  } else {
    for (const issue of issues) console.log(`❌ ${issue}`);
  }

  d.close();
})();
