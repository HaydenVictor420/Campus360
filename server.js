/**
 * Lightweight Zero-Dependency HTTP Server for IMS PoC
 * Serves static web assets and handles automatic port failover & browser launch
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function createServerInstance() {
  return http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/') reqUrl = '/index.html';

    const filePath = path.join(PUBLIC_DIR, reqUrl);

    // Prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Access Denied');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });

      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
    });
  });
}

function openBrowserUrl(url) {
  try {
    const startCmd = process.platform === 'win32' ? `start "" "${url}"` :
                     process.platform === 'darwin' ? `open "${url}"` :
                     `xdg-open "${url}"`;
    exec(startCmd, (err) => {
      if (err) console.log(`Note: Please open ${url} in your browser.`);
    });
  } catch (e) {
    // Silent fallback
  }
}

function startServer(options = {}) {
  const openBrowser = options.openBrowser !== false;
  let currentPort = options.port || DEFAULT_PORT;
  const maxPort = currentPort + 10;

  function tryListen(port) {
    const srv = createServerInstance();

    srv.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} is currently busy, attempting port ${port + 1}...`);
        if (port < maxPort) {
          tryListen(port + 1);
        } else {
          console.error(`Unable to bind to any port between ${DEFAULT_PORT} and ${maxPort}.`);
        }
      } else {
        console.error('Server error:', err);
      }
    });

    srv.listen(port, () => {
      const url = `http://localhost:${port}`;
      console.log('===========================================================');
      console.log(' Educational Institution Management System (IMS) PoC');
      console.log(` Server is running live at: ${url}`);
      console.log('===========================================================');

      if (openBrowser) {
        console.log(`Opening ${url} in your default browser...`);
        openBrowserUrl(url);
      }
    });

    return srv;
  }

  return tryListen(currentPort);
}

// If run directly via "node server.js"
if (require.main === module) {
  startServer({ openBrowser: true });
}

module.exports = { startServer };
