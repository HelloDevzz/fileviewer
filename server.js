const http = require('http');
const fs = require('fs');
const path = require('path');

const FILES_DIR = path.join(__dirname, 'flie');
const PORT = 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'text/javascript',
  '.json': 'application/json',
};

function getFiles() {
  try {
    return fs.readdirSync(FILES_DIR)
      .filter(name => fs.statSync(path.join(FILES_DIR, name)).isFile())
      .map(name => {
        const stat = fs.statSync(path.join(FILES_DIR, name));
        return { name, size: stat.size, modified: stat.mtime };
      });
  } catch {
    return [];
  }
}

// Watch for changes and update files.json on disk (mirrors build.js)
function updateFilesJson() {
  fs.writeFileSync(path.join(__dirname, 'files.json'), JSON.stringify(getFiles(), null, 2));
}

fs.watch(FILES_DIR, () => updateFilesJson());
updateFilesJson(); // generate on start

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Static frontend files
  const staticMap = {
    '/': 'index.html',
    '/index.html': 'index.html',
    '/styles.css': 'styles.css',
    '/script.js': 'script.js',
    '/files.json': 'files.json',
  };

  if (staticMap[pathname]) {
    return serveStatic(res, staticMap[pathname]);
  }

  // Serve files from flie/ directory
  if (pathname.startsWith('/flie/')) {
    const name = decodeURIComponent(pathname.slice(6));
    if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
      res.writeHead(400);
      return res.end('Invalid filename');
    }
    try {
      const content = fs.readFileSync(path.join(FILES_DIR, name), 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end(content);
    } catch {
      res.writeHead(404);
      return res.end('File not found');
    }
  }

  res.writeHead(404);
  res.end('Not found');
});

function serveStatic(res, filename) {
  try {
    const content = fs.readFileSync(path.join(__dirname, filename));
    const ext = path.extname(filename);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(content);
  } catch {
    res.writeHead(500);
    res.end('Server error');
  }
}

server.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Watching: ${FILES_DIR}`);
});
