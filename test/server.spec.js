import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import net from 'net';
import http from 'http';

function getPort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

function waitForServer(port, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      const req = http.get({ hostname: 'localhost', port, path: '/' }, res => {
        res.resume();
        resolve();
      });
      req.on('error', err => {
        if (Date.now() - start > timeout) {
          reject(err);
        } else {
          setTimeout(check, 100);
        }
      });
    })();
  });
}

test.describe('static server', () => {
  let serverProcess;
  let port;

  test.beforeAll(async () => {
    port = await getPort();
    serverProcess = spawn('node', ['server.js'], {
      env: { ...process.env, PORT: port },
      stdio: 'ignore'
    });
    await waitForServer(port);
  });

  test.afterAll(() => {
    if (serverProcess) serverProcess.kill();
  });

  test('valid path returns 200 and content', async () => {
    const result = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/index.html`, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }).on('error', reject);
    });

    expect(result.status).toBe(200);
    expect(result.body).toContain('<title>Jon Osmond</title>');
  });

  test('invalid path returns 404', async () => {
    const status = await new Promise(resolve => {
      http.get(`http://localhost:${port}/nope`, res => {
        res.resume();
        res.on('end', () => resolve(res.statusCode));
      }).on('error', () => resolve(500));
    });

    expect(status).toBe(404);
  });

  test('includes security headers', async () => {
    const headers = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/index.html`, res => {
        res.resume();
        res.on('end', () =>
          resolve({
            csp: res.headers['content-security-policy'],
            xcto: res.headers['x-content-type-options'],
          })
        );
      }).on('error', reject);
    });

    expect(headers.csp).toContain("default-src 'self'");
    expect(headers.xcto).toBe('nosniff');
  });
});
