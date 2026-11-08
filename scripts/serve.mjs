import http from 'node:http';
import {createReadStream, existsSync, statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const directory = fileURLToPath(new URL('../dist/', import.meta.url));
const prefix = '/toolbar-focus-repro/';
const port = Number(process.env.PORT || 4397);
if (!existsSync(path.join(directory, 'index.html'))) throw new Error('Run npm run build first');

http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400).end(); return; }
  if (pathname === '/') { response.writeHead(302, {Location: prefix}).end(); return; }
  if (!pathname.startsWith(prefix)) { response.writeHead(404).end(); return; }
  const file = path.resolve(directory, pathname.slice(prefix.length), pathname.endsWith('/') ? 'index.html' : '');
  if (!file.startsWith(directory) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end(); return;
  }
  const type = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.map': 'application/json'}[path.extname(file)] || 'text/plain';
  response.writeHead(200, {'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store'});
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}${prefix}`));
