import fs from 'fs';
import path from 'path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm'
};

function safeJoin(base, segments) {
  const full = path.resolve(path.join(base, ...segments));
  if (!full.startsWith(path.resolve(base))) return null;
  return full;
}

export function createStatic(rootDir) {
  const exists = fs.existsSync(rootDir);

  function candidates(pathname) {
    let rel = decodeURIComponent(pathname);
    if (rel === '/' || rel === '') rel = '/index.html';
    if (rel.endsWith('/')) rel += 'index.html';

    const segments = rel.split('/').filter(Boolean);
    if (segments.some(s => s === '..')) return [];

    const out = [];
    const direct = safeJoin(rootDir, segments);
    if (direct) out.push(direct);

    const last = segments[segments.length - 1] || '';
    if (!path.extname(last)) {
      const html = safeJoin(rootDir, [...segments.slice(0, -1), last + '.html']);
      if (html) out.push(html);
      const idx = safeJoin(rootDir, [...segments, 'index.html']);
      if (idx) out.push(idx);
    }
    return out;
  }

  function serveFile(res, file, status = 200) {
    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const stat = fs.statSync(file);
    res.writeHead(status, { 'Content-Type': type, 'Content-Length': stat.size });
    fs.createReadStream(file).pipe(res);
  }

  return {
    available: exists,
    tryServe(res, pathname) {
      if (!exists) return false;
      for (const file of candidates(pathname)) {
        if (!fs.existsSync(file)) continue;
        const stat = fs.statSync(file);
        if (stat.isDirectory()) {
          const idx = path.join(file, 'index.html');
          if (fs.existsSync(idx)) { serveFile(res, idx); return true; }
          continue;
        }
        serveFile(res, file);
        return true;
      }
      return false;
    },
    serve404(res) {
      if (exists) {
        const custom = path.join(rootDir, '404.html');
        if (fs.existsSync(custom)) return serveFile(res, custom, 404);
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  };
}