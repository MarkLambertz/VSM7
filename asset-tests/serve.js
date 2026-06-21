// Minimal zero-dependency static server, rooted at the repo root (one level up),
// so Playwright can load /e2e-robustness-check.html etc. over http (needed for the
// same-origin iframe bridge test). Used only by playwright.config.js's webServer.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 7799;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.md': 'text/markdown' };

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  let fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
  if (!path.extname(fp)) fp += '.html';   // extensionless → .html (so /vsm serves vsm.html, matching the Vite dev server)
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(fp)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`asset-tests static server: ${ROOT} on http://127.0.0.1:${PORT}`));
