import http from 'http';
import { parse } from 'querystring';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const port = process.env.PORT || 3000;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function sendIndex(res) {
  const file = path.join(process.cwd(), 'index.html');
  fs.createReadStream(file)
    .on('error', () => {
      res.writeHead(500);
      res.end('Server Error');
    })
    .pipe(res);
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/suggest') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      const data = parse(body);
      const suggestion = data.suggestion || '';
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: process.env.TARGET_EMAIL || process.env.SMTP_USER,
          subject: 'New Shirt Suggestion',
          text: suggestion,
        });
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
      } catch (err) {
        console.error('Email send failed', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error');
      }
    });
  } else if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    sendIndex(res);
  } else {
    const filePath = path.join(process.cwd(), req.url);
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      fs.createReadStream(filePath).pipe(res);
    });
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
