const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8085;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');

// Ensure data directory exists for storing submissions
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function saveRecord(filename, record) {
  const filePath = path.join(DATA_DIR, filename);
  let existing = [];
  if (fs.existsSync(filePath)) {
    try {
      existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      existing = [];
    }
  }
  existing.unshift(record);
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf-8');
}

const server = http.createServer((req, res) => {
  // CORS Headers for API calls and external database sync
  const setCorsHeaders = () => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  };

  if (req.method === 'OPTIONS' && req.url.startsWith('/api/')) {
    setCorsHeaders();
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle API Database Sync / Reading
  if (req.method === 'GET' && (req.url === '/api/quotes' || req.url === '/api/quote')) {
    setCorsHeaders();
    const filePath = path.join(DATA_DIR, 'quotes.json');
    const records = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8') || '[]') : [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(records, null, 2));
    return;
  }

  if (req.method === 'GET' && (req.url === '/api/inquiries' || req.url === '/api/contact')) {
    setCorsHeaders();
    const filePath = path.join(DATA_DIR, 'inquiries.json');
    const records = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8') || '[]') : [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(records, null, 2));
    return;
  }

  // Handle API Submissions
  if (req.method === 'POST' && req.url === '/api/quote') {
    setCorsHeaders();
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        data.receivedAt = new Date().toISOString();
        saveRecord('quotes.json', data);
        console.log(`[Quote Received] ${data['Reference Code'] || data.refCode} from ${data.name || data.email}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Quote logged successfully' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/contact') {
    setCorsHeaders();
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        data.receivedAt = new Date().toISOString();
        saveRecord('inquiries.json', data);
        console.log(`[Contact Inquiry Received] from ${data.name || data.email}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Inquiry logged successfully' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // Handle Static Files
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Support Range requests for media (video/audio)
    const range = req.headers.range;
    if (range && (ext === '.webm' || ext === '.mp4')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10) || 0;
      let end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      if (end >= stats.size) end = stats.size - 1;

      if (start >= stats.size || end < start) {
        res.writeHead(416, {
          'Content-Range': `bytes */${stats.size}`
        });
        res.end();
        return;
      }

      const chunksize = (end - start) + 1;
      const stream = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType
      });
      stream.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Length': stats.size,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Seven Stars Logistics dev server running at http://127.0.0.1:${PORT}/`);
});
