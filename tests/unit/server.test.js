import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { startServer, createRequestHandler, MIME_TYPES, parseArgs } = require('../../server.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_ROOT = path.join(__dirname, '..', 'fixtures', 'server-test');

function request(server, urlPath) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const options = {
      hostname: 'localhost',
      port: addr.port,
      path: urlPath,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

describe('Server', () => {
  let server;

  beforeAll(() => {
    // Create test fixture directory
    fs.mkdirSync(path.join(TEST_ROOT, 'subdir'), { recursive: true });
    fs.writeFileSync(path.join(TEST_ROOT, 'index.html'), '<html><body>Hello</body></html>');
    fs.writeFileSync(path.join(TEST_ROOT, 'style.css'), 'body { color: red; }');
    fs.writeFileSync(path.join(TEST_ROOT, 'app.js'), 'console.log("hi");');
    fs.writeFileSync(path.join(TEST_ROOT, 'data.json'), '{"key":"value"}');
    fs.writeFileSync(path.join(TEST_ROOT, 'image.png'), Buffer.from([0x89, 0x50, 0x4E, 0x47]));
    fs.writeFileSync(path.join(TEST_ROOT, 'icon.svg'), '<svg></svg>');
    fs.writeFileSync(path.join(TEST_ROOT, 'photo.webp'), Buffer.from([0x52, 0x49, 0x46, 0x46]));
    fs.writeFileSync(path.join(TEST_ROOT, 'subdir', 'nested.html'), '<p>nested</p>');

    return new Promise((resolve) => {
      server = startServer({ root: TEST_ROOT, port: 0 });
      server.on('listening', resolve);
    });
  });

  afterAll(() => {
    return new Promise((resolve) => {
      server.close(() => {
        fs.rmSync(TEST_ROOT, { recursive: true, force: true });
        resolve();
      });
    });
  });

  describe('MIME type mapping', () => {
    it('should serve HTML with correct Content-Type', async () => {
      const res = await request(server, '/index.html');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/html');
      expect(res.body).toContain('<html>');
    });

    it('should serve CSS with correct Content-Type', async () => {
      const res = await request(server, '/style.css');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/css');
    });

    it('should serve JS with correct Content-Type', async () => {
      const res = await request(server, '/app.js');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('application/javascript');
    });

    it('should serve JSON with correct Content-Type', async () => {
      const res = await request(server, '/data.json');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('application/json');
    });

    it('should serve PNG with correct Content-Type', async () => {
      const res = await request(server, '/image.png');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('image/png');
    });

    it('should serve SVG with correct Content-Type', async () => {
      const res = await request(server, '/icon.svg');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('image/svg+xml');
    });

    it('should serve WebP with correct Content-Type', async () => {
      const res = await request(server, '/photo.webp');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('image/webp');
    });
  });

  describe('SPA fallback', () => {
    it('should serve index.html for root path /', async () => {
      const res = await request(server, '/');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/html');
      expect(res.body).toContain('<html>');
    });

    it('should serve index.html for extensionless paths', async () => {
      const res = await request(server, '/about');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/html');
      expect(res.body).toContain('<html>');
    });

    it('should serve index.html for deep extensionless paths', async () => {
      const res = await request(server, '/modules/memory-helper');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/html');
      expect(res.body).toContain('<html>');
    });
  });

  describe('404 handling', () => {
    it('should return 404 for non-existent file with extension', async () => {
      const res = await request(server, '/nonexistent.css');
      expect(res.statusCode).toBe(404);
      expect(res.body).toBe('Not Found');
    });

    it('should return 404 for non-existent nested file with extension', async () => {
      const res = await request(server, '/subdir/missing.js');
      expect(res.statusCode).toBe(404);
      expect(res.body).toBe('Not Found');
    });
  });

  describe('nested files', () => {
    it('should serve files in subdirectories', async () => {
      const res = await request(server, '/subdir/nested.html');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/html');
      expect(res.body).toContain('nested');
    });
  });
});

describe('MIME_TYPES constant', () => {
  it('should have all required extensions', () => {
    expect(MIME_TYPES['.html']).toBe('text/html');
    expect(MIME_TYPES['.css']).toBe('text/css');
    expect(MIME_TYPES['.js']).toBe('application/javascript');
    expect(MIME_TYPES['.png']).toBe('image/png');
    expect(MIME_TYPES['.svg']).toBe('image/svg+xml');
    expect(MIME_TYPES['.webp']).toBe('image/webp');
    expect(MIME_TYPES['.json']).toBe('application/json');
  });
});

describe('parseArgs', () => {
  it('should return defaults when no args provided', () => {
    // parseArgs checks if root exists, so we need to use existing dir
    const result = parseArgs([]);
    expect(result.root).toBe('./public');
    expect(result.port).toBe(8080);
  });

  it('should accept --root flag', () => {
    const result = parseArgs(['--root', './public']);
    expect(result.root).toBe('./public');
  });

  it('should accept --port flag', () => {
    const result = parseArgs(['--port', '3000']);
    expect(result.port).toBe(3000);
  });

  it('should accept -r shorthand', () => {
    const result = parseArgs(['-r', './public']);
    expect(result.root).toBe('./public');
  });

  it('should accept -p shorthand', () => {
    const result = parseArgs(['-p', '9000']);
    expect(result.port).toBe(9000);
  });
});
