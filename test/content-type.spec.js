import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';

const PORT = 3100;
let server;

test.beforeAll(async () => {
  server = spawn('node', ['server.js'], {
    env: { ...process.env, PORT },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  await new Promise((resolve, reject) => {
    const onData = (data) => {
      if (data.toString().includes(`http://localhost:${PORT}`)) {
        server.stdout.off('data', onData);
        resolve();
      }
    };
    server.stdout.on('data', onData);
    server.on('error', reject);
  });
});

test.afterAll(() => {
  server.kill();
});

test('serves ICO with correct content type', async () => {
  const res = await fetch(`http://localhost:${PORT}/assets/test.ico`);
  expect(res.headers.get('content-type')).toBe('image/x-icon');
});

test('serves WEBP with correct content type', async () => {
  const res = await fetch(`http://localhost:${PORT}/assets/test.webp`);
  expect(res.headers.get('content-type')).toBe('image/webp');
});
