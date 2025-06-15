import { createServer } from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return (
    {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpeg': 'image/jpeg',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.json': 'application/json',
      '.mp3': 'audio/mpeg',
    }[ext] || 'application/octet-stream'
  );
}

const server = createServer(async (req, res) => {
  let { pathname } = parse(req.url, true);

  // Normalize and sanitize the requested path
  pathname = path.normalize(decodeURIComponent(pathname));

  // Strip any leading ".." segments or reject absolute paths
  if (pathname.startsWith('..') || path.isAbsolute(pathname)) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  // Construct the full file path
  let filePath = path.join(__dirname, pathname);
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  if (pathname === '/' || !path.extname(pathname)) {
    filePath = path.join(__dirname, pathname === '/' ? 'index.html' : `${pathname}.html`);
  }

  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
