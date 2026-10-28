// Strict test-only static hosting: no SPA fallback, extensionless aliases, or API.
// A subpath deployment serves nothing outside its mount, exposing root URL leaks.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const argumentsByName = Object.fromEntries(process.argv.slice(2).reduce((pairs, item, index, args) => {
  if (index % 2 === 0) pairs.push([item, args[index + 1]]);
  return pairs;
}, []));
const root = path.resolve(__dirname, '..', argumentsByName['--root'] || 'dist');
const mount = argumentsByName['--mount'] || '/vsm7/';
const port = Number(argumentsByName['--port'] || 7807);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'
};

http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://static.test').pathname);
    if (!['GET', 'HEAD'].includes(request.method) || !pathname.startsWith(mount)) {
      response.writeHead(404).end('Not found');
      return;
    }
    const relative = pathname.slice(mount.length) || 'index.html';
    const filename = path.resolve(root, relative);
    if (!filename.startsWith(`${root}${path.sep}`)) {
      response.writeHead(404).end('Not found');
      return;
    }
    const stat = await fs.stat(filename);
    if (!stat.isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': types[path.extname(filename)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    response.end(request.method === 'HEAD' ? undefined : await fs.readFile(filename));
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Strict static host: ${root} at http://127.0.0.1:${port}${mount}`);
});
