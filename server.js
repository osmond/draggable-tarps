import { createServer } from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const suggestionsFile = path.join(__dirname, 'suggestions.json');

async function readSuggestions() {
  try {
    const data = await fs.readFile(suggestionsFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeSuggestions(list) {
  await fs.writeFile(suggestionsFile, JSON.stringify(list, null, 2));
}

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
  const { pathname, query } = parse(req.url, true);

  if (pathname === '/api/suggestions') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const { text, time } = JSON.parse(body || '{}');
          if (typeof text === 'string' && text.trim()) {
            const suggestions = await readSuggestions();
            const ts = typeof time === 'number' ? time : Date.now();
            suggestions.push({ text, time: ts });
            await writeSuggestions(suggestions);
          }
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('OK');
        } catch {
          res.writeHead(400);
          res.end('Bad Request');
        }
      });
      return;
    } else if (req.method === 'DELETE') {
      const time = parseInt(query.time, 10);
      if (!Number.isNaN(time)) {
        const suggestions = await readSuggestions();
        const idx = suggestions.findIndex((s) => s.time === time);
        if (idx !== -1) {
          suggestions.splice(idx, 1);
          await writeSuggestions(suggestions);
        }
      }
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
      return;
    } else if (req.method === 'GET') {
      const suggestions = await readSuggestions();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(suggestions));
      return;
    }
  }

  let filePath = path.join(__dirname, pathname);
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
