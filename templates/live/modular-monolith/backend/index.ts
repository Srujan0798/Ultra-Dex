/**
 * @fileoverview Index module
 * @module backend/index
 */

import { createServer } from 'http';

const server = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok' }));
});

server.listen(3001, () => console.log('Modular monolith API on 3001'));

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function handleIndexError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
