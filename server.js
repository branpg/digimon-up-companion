// @ts-check
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * Mapeo de extensiones a Content-Type.
 */
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.md': 'text/plain',
};

/**
 * Crea el manejador de peticiones HTTP.
 * @param {string} root - Directorio raíz para servir archivos
 * @returns {(req: http.IncomingMessage, res: http.ServerResponse) => void}
 */
function createRequestHandler(root) {
  const resolvedRoot = path.resolve(root);

  return function handleRequest(req, res) {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(url.pathname);

    // Normalize: remove trailing slash for non-root paths
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    const ext = path.extname(pathname);
    const filePath = path.join(resolvedRoot, pathname);

    // Security: prevent directory traversal
    if (!filePath.startsWith(resolvedRoot)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    if (ext) {
      // Request has a file extension — serve the file or 404
      serveFile(filePath, ext, res);
    } else {
      // No extension — SPA fallback: serve index.html
      const indexPath = path.join(resolvedRoot, 'index.html');
      serveFile(indexPath, '.html', res);
    }
  };
}

/**
 * Sirve un archivo desde disco con el Content-Type adecuado.
 * @param {string} filePath - Ruta absoluta al archivo
 * @param {string} ext - Extensión del archivo (incluye el punto)
 * @param {http.ServerResponse} res
 */
function serveFile(filePath, ext, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
      return;
    }

    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

/**
 * Inicia el servidor estático.
 * @param {object} options
 * @param {string} [options.root] - Directorio raíz (default: './public')
 * @param {number} [options.port] - Puerto (default: 8080)
 * @returns {http.Server}
 */
function startServer(options = {}) {
  const root = options.root || './public';
  const port = options.port !== undefined ? options.port : 8080;

  const handleRequest = createRequestHandler(root);
  const server = http.createServer(handleRequest);

  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/ (root: ${path.resolve(root)})`);
  });

  return server;
}

/**
 * Parsea argumentos CLI para root y port.
 * @param {string[]} args - Argumentos de línea de comandos (sin node y script)
 * @returns {{ root: string; port: number }}
 */
function parseArgs(args) {
  let root = './public';
  let port = 8080;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if ((arg === '--root' || arg === '-r') && i + 1 < args.length) {
      root = args[++i];
    } else if ((arg === '--port' || arg === '-p') && i + 1 < args.length) {
      const parsed = parseInt(args[++i], 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
        process.stderr.write(`Error: Invalid port number "${args[i]}". Must be between 1 and 65535.\n`);
        process.exit(1);
      }
      port = parsed;
    } else if (!arg.startsWith('-') && i === 0) {
      // Positional first arg: root directory
      root = arg;
    } else if (!arg.startsWith('-') && i === 1) {
      // Positional second arg: port
      const parsed = parseInt(arg, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
        process.stderr.write(`Error: Invalid port number "${arg}". Must be between 1 and 65535.\n`);
        process.exit(1);
      }
      port = parsed;
    }
  }

  // Validate root directory exists
  if (!fs.existsSync(root)) {
    process.stderr.write(`Error: Directory "${root}" does not exist.\n`);
    process.exit(1);
  }

  return { root, port };
}

// Default handleRequest bound to './public' for direct use/testing
const handleRequest = createRequestHandler('./public');

// Export for testing
module.exports = { startServer, createRequestHandler, handleRequest, MIME_TYPES, parseArgs, serveFile };

// Auto-start when run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const { root, port } = parseArgs(args);
  startServer({ root, port });
}
