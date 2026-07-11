import express, { Request, Response, NextFunction } from 'express';
import expressLayouts from 'express-ejs-layouts';
import compression from 'compression';
import path from 'path';
import pagesRouter from './routes/pages';
import apiRouter from './routes/api';
import { getDb, initDb, closeDb } from './db/connection';
// initDb is now synchronous (better-sqlite3), no longer async (sql.js WASM)

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;

// ─── Compression ───
app.use(compression());

// ─── EJS Layout ───
app.use(expressLayouts);
app.use(express.json());
app.set('layout', 'layout');

// ─── DB Middleware ───
app.use((req: Request, res: Response, next: NextFunction) => {
  const staticPrefixes = ['/css/', '/js/', '/images/'];
  if (staticPrefixes.some(p => req.path.startsWith(p)) || req.path === '/favicon.ico') {
    return next();
  }
  if (!getDb()) {
    return res.status(503).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>数据库不可用</title>
      <style>body{font-family:system-ui,sans-serif;max-width:600px;margin:80px auto;padding:24px;line-height:1.6;color:#333}
      h1{color:#c00}code{background:#f5f5f5;padding:2px 6px;border-radius:4px;font-size:.9em}
      pre{background:#f5f5f5;padding:12px;border-radius:6px;overflow-x:auto}</style></head>
      <body><h1>503 - 数据库不可用</h1>
      <p>数据库文件不存在或无法读取。请在服务器上运行：</p>
      <pre><code>cd ~/reading-room && python scripts/sync.py</code></pre>
      <p>然后重启服务：<code>pm2 restart reading-room</code></p></body></html>
    `);
  }
  next();
});

// ─── View Engine ───
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// ─── Static Assets ───
app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: '1d',
  etag: true,
  setHeaders(res: Response, filePath: string) {
    if (filePath.match(/\.(css|js)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    }
  },
}));

// ─── Routes ───
app.use('/api', apiRouter);
app.use('/', pagesRouter);

// ─── Start ───
let server: ReturnType<typeof app.listen>;

export async function start(): Promise<void> {
  initDb();

  server = app.listen(PORT, '0.0.0.0', () => {
    const dbStatus = getDb() ? 'connected' : 'MISSING';
    console.log(`\n  📚 Reading Room running at http://0.0.0.0:${PORT}  [db: ${dbStatus}]\n`);
  });

  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    closeDb();
    if (server) server.close(() => process.exit(0));
  });
}

export default app;
