// Copyright (c) 2026 Ultra-Dex

import https from 'https';

function requestGitHub(path, token) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.github.com',
        path,
        method: 'GET',
        headers: {
          'User-Agent': 'Ultra-Dex',
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk.toString()));
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

export async function fetchPullRequestDiff(owner, repo, prNumber, token) {
  const response = await requestGitHub(`/repos/${owner}/${repo}/pulls/${prNumber}`, token);
  if (response.status !== 200) {
    throw new Error(`GitHub API error: ${response.status}`);
  }
  const payload = JSON.parse(response.data);

  const diffResponse = await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'github.com',
        path: `/${owner}/${repo}/pull/${prNumber}.diff`,
        method: 'GET',
        headers: { 'User-Agent': 'Ultra-Dex' },
      },
      (res) => {
        let diff = '';
        res.on('data', (chunk) => (diff += chunk.toString()));
        res.on('end', () => resolve(diff));
      }
    );
    req.on('error', reject);
    req.end();
  });

  return { diff: diffResponse, pr: payload };
}

export default {
  fetchPullRequestDiff,
};

/**
 * Safe execution wrapper with error handling for github
 * @param {Function} fn - Async function to execute
 * @param {string} [context='github'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'github') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
