const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 8898;
const DIR = __dirname;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  // CORS for cross-origin requests from main site
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  // POST /save-data — persist data.json from frontend
  if (req.method === 'POST' && req.url === '/save-data') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const d = JSON.parse(body);
        if (d.lastWash) {
          fs.writeFileSync(path.join(DIR, 'data.json'), JSON.stringify(d.lastWash, null, 2), 'utf-8');
        }
        if (d.washHistory) {
          fs.writeFileSync(path.join(DIR, 'history.json'), JSON.stringify(d.washHistory, null, 2), 'utf-8');
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  let file = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const fp = path.join(DIR, file);
  const ext = path.extname(fp).toLowerCase();
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {
      'Content-Type': mime[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.end(data);
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log(`bedding-tracker running on http://0.0.0.0:${PORT}`);
});
