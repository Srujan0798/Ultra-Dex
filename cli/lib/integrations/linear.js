// Copyright (c) 2026 Ultra-Dex

import { requireConfig, retryWithBackoff } from './utils.js';

const LINEAR_API = 'https://api.linear.app/graphql';

export class LinearClient {
  constructor(token) {
    requireConfig({ token }, ['token'], 'Linear');
    this.token = token;
  }

  get headers() {
    return {
      'Authorization': this.token,
      'Content-Type': 'application/json',
    };
  }

  async request(query, variables = {}) {
    return retryWithBackoff(async () => {
      const response = await fetch(LINEAR_API, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });

      const payload = await response.json();

      if (!response.ok || payload.errors) {
        const message = payload.errors?.map((e) => e.message).join(', ') || response.statusText;
        throw new Error(`Linear API Error: ${message}`);
      }

      return payload.data;
    });
  }

  async getViewer() {
    const data = await this.request(`query { viewer { id name email } }`);
    return data.viewer;
  }

  async listTeams() {
    const data = await this.request(`query { teams { nodes { id name key } } }`);
    return data.teams.nodes;
  }

  async createIssue(input) {
    const data = await this.request(
      `mutation IssueCreate($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          issue { id identifier title url }
        }
      }`,
      { input }
    );

    return data.issueCreate.issue;
  }

  async updateIssue(id, input) {
    const data = await this.request(
      `mutation IssueUpdate($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          issue { id identifier title url }
        }
      }`,
      { id, input }
    );

    return data.issueUpdate.issue;
  }

  async searchIssues(queryText, teamId) {
    const data = await this.request(
      `query Issues($filter: IssueFilter) {
        issues(filter: $filter, first: 50) {
          nodes { id identifier title url state { name } }
        }
      }`,
      {
        filter: {
          team: teamId ? { id: { eq: teamId } } : undefined,
          title: { contains: queryText },
        },
      }
    );

    return data.issues.nodes;
  }
}

export async function connect(config = {}) {
  requireConfig(config, ['token'], 'Linear');
  const client = new LinearClient(config.token);
  const viewer = await client.getViewer();
  return { connected: true, viewer };
}

export async function disconnect() {
  return { connected: false };
}

export async function syncFromPlan(client, planSections, teamId) {
  const issues = [];
  for (const section of planSections) {
    const issue = await client.createIssue({
      teamId: section.teamId || teamId,
      title: section.name,
      description: section.description || '',
      priority: section.priority || 2,
    });
    issues.push(issue);
  }
  return issues;
}

export async function sync({ direction = 'both', state = {}, planSections = [] } = {}, config = {}) {
  requireConfig(config, ['token', 'teamId'], 'Linear');
  const client = new LinearClient(config.token);

  const pulled = direction === 'push' ? 0 : state.pulled || 0;
  let pushed = direction === 'pull' ? 0 : state.pushed || 0;

  if (direction !== 'pull' && planSections.length) {
    const created = await syncFromPlan(client, planSections, config.teamId);
    pushed += created.length;
  }

  return { ok: true, direction, pulled, pushed };
}

const integration = {
  id: 'linear',
  name: 'Linear',
  connect,
  disconnect,
  sync,
};

export default integration;

/**
 * Safe execution wrapper with error handling for linear
 * @param {Function} fn - Async function to execute
 * @param {string} [context='linear'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'linear') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
