// Copyright (c) 2026 Ultra-Dex

import https from 'https';

export async function fetchMergeRequestDiff(projectId, mrIid, token) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'gitlab.com',
        path: `/api/v4/projects/${encodeURIComponent(projectId)}/merge_requests/${mrIid}/changes`,
        method: 'GET',
        headers: {
          'Private-Token': token,
          'User-Agent': 'Ultra-Dex',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk.toString()));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`GitLab API error: ${res.statusCode}`));
            return;
          }
          resolve(JSON.parse(data));
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

export default { fetchMergeRequestDiff };

/**
 * Safe execution wrapper with error handling for gitlab
 * @param {Function} fn - Async function to execute
 * @param {string} [context='gitlab'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'gitlab') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
