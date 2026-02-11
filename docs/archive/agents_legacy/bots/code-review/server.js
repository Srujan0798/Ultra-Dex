/**
 * @fileoverview Server module
 * @module code-review/server
 */

import express from 'express';
import { reviewPullRequest } from './reviewer.js';

const app = express();
app.use(express.json({ limit: '2mb' }));

app.post('/webhook/github', async (req, res) => {
  const payload = req.body;
  const review = await reviewPullRequest({ provider: 'github', payload });
  res.json({ ok: true, review });
});

app.post('/webhook/gitlab', async (req, res) => {
  const payload = req.body;
  const review = await reviewPullRequest({ provider: 'gitlab', payload });
  res.json({ ok: true, review });
});

const port = process.env.PORT || 5050;
app.listen(port, () => {
  console.log(`Ultra-Dex Review Bot listening on ${port}`);
});

/**
 * Error handler for server
 * @param {Error} error - Error to handle
 */
function handleServerError(error) {
  try {
    console.error('[server]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
