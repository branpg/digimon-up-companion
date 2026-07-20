// Feature: sidebar-multi-utility-app, Property 4: Server MIME type mapping correctness
// Feature: sidebar-multi-utility-app, Property 5: Server SPA fallback for extensionless paths
// Feature: sidebar-multi-utility-app, Property 6: Server 404 for non-existent files with extension
// Validates: Requirements 4.1, 4.4, 4.5

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import * as fc from 'fast-check';

const require = createRequire(import.meta.url);
const { startServer, MIME_TYPES } = require('../../server.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_ROOT = path.join(__dirname, '..', 'fixtures', 'server-property-test');

/**
 * Helper to make HTTP requests to the test server.
 */
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

describe('Server Property Tests', () => {
  let server;

  // Known extensions from MIME_TYPES (without the dot prefix)
  const knownExtensions = Object.keys(MIME_TYPES).map((ext) => ext.slice(1));

  beforeAll(() => {
    // Create test fixture directory with files for each known extension
    fs.mkdirSync(TEST_ROOT, { recursive: true });
    fs.writeFileSync(path.join(TEST_ROOT, 'index.html'), '<html><body>SPA Fallback</body></html>');
    fs.writeFileSync(path.join(TEST_ROOT, 'test.html'), '<html><body>Test</body></html>');
    fs.writeFileSync(path.join(TEST_ROOT, 'test.css'), 'body { margin: 0; }');
    fs.writeFileSync(path.join(TEST_ROOT, 'test.js'), 'console.log("test");');
    fs.writeFileSync(path.join(TEST_ROOT, 'test.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    fs.writeFileSync(path.join(TEST_ROOT, 'test.svg'), '<svg></svg>');
    fs.writeFileSync(path.join(TEST_ROOT, 'test.webp'), Buffer.from([0x52, 0x49, 0x46, 0x46]));
    fs.writeFileSync(path.join(TEST_ROOT, 'test.json'), '{"ok":true}');
    fs.writeFileSync(path.join(TEST_ROOT, 'test.md'), '# Test markdown');

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

  // ─── Property 4: Server MIME type mapping correctness ───────────────────────
  // For any file request where the file exists and has a known extension,
  // the server responds with the corresponding Content-Type.
  describe('Property 4: Server MIME type mapping correctness', () => {
    it('responds with correct Content-Type for any known extension', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...knownExtensions),
          async (ext) => {
            const res = await request(server, `/test.${ext}`);
            const expectedMime = MIME_TYPES[`.${ext}`];
            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toBe(expectedMime);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ─── Property 5: Server SPA fallback for extensionless paths ───────────────
  // For any request path without a file extension, server responds with
  // index.html and 200.
  describe('Property 5: Server SPA fallback for extensionless paths', () => {
    // Generate valid URL path segments (alphanumeric, hyphens, underscores)
    const pathSegmentArb = fc.stringMatching(/^[a-z0-9_-]{1,20}$/);

    it('responds with index.html and 200 for any extensionless path', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(pathSegmentArb, { minLength: 1, maxLength: 4 }),
          async (segments) => {
            const urlPath = '/' + segments.join('/');
            const res = await request(server, urlPath);
            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toBe('text/html');
            expect(res.body).toContain('SPA Fallback');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ─── Property 6: Server 404 for non-existent files with extension ──────────
  // For any request path with extension but non-existent file, server
  // responds with 404.
  describe('Property 6: Server 404 for non-existent files with extension', () => {
    // Generate random filenames that won't collide with our test fixtures
    const nonExistentFilenameArb = fc
      .stringMatching(/^[a-z0-9]{1,15}$/)
      .filter((name) => name !== 'test' && name !== 'index');

    it('responds with 404 for any non-existent file with known extension', async () => {
      await fc.assert(
        fc.asyncProperty(
          nonExistentFilenameArb,
          fc.constantFrom(...knownExtensions),
          async (filename, ext) => {
            const urlPath = `/${filename}.${ext}`;
            const res = await request(server, urlPath);
            expect(res.statusCode).toBe(404);
            expect(res.body).toBe('Not Found');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
