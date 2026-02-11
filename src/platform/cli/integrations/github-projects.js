// Copyright (c) 2026 Ultra-Dex

import { requireConfig, retryWithBackoff } from './utils.js';

const GITHUB_GRAPHQL = 'https://api.github.com/graphql';

async function githubRequest(token, query, variables = {}) {
  return retryWithBackoff(async () => {
    const response = await fetch(GITHUB_GRAPHQL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    const payload = await response.json();
    if (!response.ok || payload.errors) {
      const message = payload.errors?.map((e) => e.message).join(', ') || response.statusText;
      throw new Error(`GitHub Projects API Error: ${message}`);
    }

    return payload.data;
  });
}

export async function connect(config = {}) {
  requireConfig(config, ['token'], 'GitHub Projects');
  const data = await githubRequest(config.token, `query { viewer { login } }`);
  return { ok: true, connected: true, viewer: data.viewer };
}

export async function disconnect() {
  return { ok: true, disconnected: true };
}

export async function listProjects(config = {}, owner) {
  requireConfig(config, ['token'], 'GitHub Projects');
  const data = await githubRequest(
    config.token,
    `query($login: String!) {
      user(login: $login) {
        projectsV2(first: 20) { nodes { id title number } }
      }
    }`,
    { login: owner }
  );
  return data.user?.projectsV2?.nodes || [];
}

export async function createProject(config = {}, ownerId, title) {
  requireConfig(config, ['token'], 'GitHub Projects');
  const data = await githubRequest(
    config.token,
    `mutation($ownerId: ID!, $title: String!) {
      createProjectV2(input: { ownerId: $ownerId, title: $title }) {
        projectV2 { id title number }
      }
    }`,
    { ownerId, title }
  );
  return data.createProjectV2.projectV2;
}

export async function sync({ direction = 'both', state = {} } = {}, config = {}) {
  requireConfig(config, ['token'], 'GitHub Projects');
  const pulled = direction === 'push' ? 0 : state.pulled || 0;
  const pushed = direction === 'pull' ? 0 : state.pushed || 0;
  return { ok: true, direction, pulled, pushed, timestamp: new Date().toISOString() };
}

export const integration = {
  id: 'github-projects',
  name: 'GitHub Projects',
  connect,
  disconnect,
  sync,
  listProjects,
  createProject,
};

export default integration;

/**
 * Safe execution wrapper with error handling for github-projects
 * @param {Function} fn - Async function to execute
 * @param {string} [context='github-projects'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'github-projects') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
