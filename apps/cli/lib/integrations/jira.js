// Copyright (c) 2026 Ultra-Dex

/**
 * cli/lib/integrations/jira.js
 * Jira Integration with Real API Implementation
 */

import fetch from 'node-fetch';
import { printSuccess, printError } from '../utils/output.js';
import { retryWithBackoff } from './utils.js';

export class JiraClient {
  constructor(config) {
    this.domain = config.domain;
    this.email = config.email;
    this.apiToken = config.apiToken;
    this.baseUrl = `https://${this.domain}.atlassian.net/rest/api/3`;
  }

  get headers() {
    return {
      Authorization: `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  async createIssue(data) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${this.baseUrl}/issue`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            fields: {
              project: { key: data.projectKey },
              summary: data.summary,
              description: {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: data.description || '' }],
                  },
                ],
              },
              issuetype: { name: data.issueType || 'Task' },
              priority: data.priority ? { name: data.priority } : undefined,
              labels: data.labels || [],
            },
          }),
        })
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Jira API Error: ${JSON.stringify(error)}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to create Jira issue: ${error.message}`);
      throw error;
    }
  }

  async getIssue(issueKey) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${this.baseUrl}/issue/${issueKey}`, {
          headers: this.headers,
        })
      );

      if (!response.ok) {
        throw new Error(`Failed to get issue: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Jira issue ${issueKey}: ${error.message}`);
      throw error;
    }
  }

  async searchIssues(jql, maxResults = 50) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${this.baseUrl}/search`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            jql,
            maxResults,
            fields: ['summary', 'status', 'assignee', 'priority', 'labels', 'description'],
          }),
        })
      );

      if (!response.ok) {
        throw new Error(`Failed to search issues: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to search Jira issues: ${error.message}`);
      throw error;
    }
  }

  async updateIssue(issueKey, updates) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${this.baseUrl}/issue/${issueKey}`, {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify({ fields: updates }),
        })
      );

      if (!response.ok) {
        throw new Error(`Failed to update issue: ${response.status} ${response.statusText}`);
      }

      return response.ok;
    } catch (error) {
      printError(`Failed to update Jira issue ${issueKey}: ${error.message}`);
      throw error;
    }
  }

  async transitionIssue(issueKey, transitionId) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${this.baseUrl}/issue/${issueKey}/transitions`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ transition: { id: transitionId } }),
        })
      );

      if (!response.ok) {
        throw new Error(`Failed to transition issue: ${response.status} ${response.statusText}`);
      }

      return response.ok;
    } catch (error) {
      printError(`Failed to transition Jira issue ${issueKey}: ${error.message}`);
      throw error;
    }
  }

  async addComment(issueKey, comment) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${this.baseUrl}/issue/${issueKey}/comment`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            body: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: comment }],
                },
              ],
            },
          }),
        })
      );

      if (!response.ok) {
        throw new Error(`Failed to add comment: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to add comment to Jira issue ${issueKey}: ${error.message}`);
      throw error;
    }
  }

  async getTransitions(issueKey) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${this.baseUrl}/issue/${issueKey}/transitions`, {
          headers: this.headers,
        })
      );

      if (!response.ok) {
        throw new Error(`Failed to get transitions: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get transitions for Jira issue ${issueKey}: ${error.message}`);
      throw error;
    }
  }
}

export async function syncFromPlan(client, planSections) {
  const issues = [];
  for (const section of planSections) {
    try {
      const issue = await client.createIssue({
        projectKey: section.projectKey,
        summary: section.name,
        description: section.description,
        issueType: section.type || 'Story',
      });
      issues.push(issue);
      printSuccess(`Created issue: ${issue.key}`);
    } catch (error) {
      printError(`Failed to create issue for section ${section.name}: ${error.message}`);
    }
  }
  return issues;
}

export async function validateJiraConfig(config) {
  if (!config.domain || !config.email || !config.apiToken) {
    throw new Error('Jira configuration requires domain, email, and apiToken');
  }

  // Test connection by fetching user info
  const client = new JiraClient(config);
  try {
    const response = await fetch(`${client.baseUrl}/myself`, {
      headers: client.headers,
    });

    if (!response.ok) {
      throw new Error(`Jira connection test failed: ${response.status} ${response.statusText}`);
    }

    const userInfo = await response.json();
    printSuccess(`✅ Jira connection validated for user: ${userInfo.displayName}`);
    return true;
  } catch (error) {
    printError(`❌ Jira connection failed: ${error.message}`);
    return false;
  }
}

export default {
  JiraClient,
  syncFromPlan,
  validateJiraConfig,
};
