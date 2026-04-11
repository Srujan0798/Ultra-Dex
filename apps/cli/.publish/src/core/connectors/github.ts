/**
 * GitHub Connector for Ultra-Dex
 * Fetches PRs, repo context, posts comments
 */

import { Connector, ConnectorAuth, ConnectorOperation } from './types.js';

export interface GitHubConfig {
  token: string;
  baseUrl?: string;
}

export class GitHubConnector implements Connector {
  id = 'github';
  name = 'GitHub';
  description = 'Access GitHub repositories, PRs, and issues';
  category = 'engineering' as const;
  status: 'connected' | 'disconnected' | 'error' = 'disconnected';
  auth: ConnectorAuth;
  operations: ConnectorOperation[] = [
    {
      name: 'getPR',
      description: 'Fetch PR details including diff and files',
      input: {
        type: 'object',
        properties: {
          prUrl: { type: 'string' },
        },
        required: ['prUrl'],
      },
      output: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          body: { type: 'string' },
          diff: { type: 'string' },
          files: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                filename: { type: 'string' },
                status: { type: 'string' },
                additions: { type: 'number' },
                deletions: { type: 'number' },
                patch: { type: 'string' },
              },
            },
          },
          author: { type: 'string' },
          status: { type: 'string' },
          base: {
            type: 'object',
            properties: {
              ref: { type: 'string' },
              sha: { type: 'string' },
            },
          },
          head: {
            type: 'object',
            properties: {
              ref: { type: 'string' },
              sha: { type: 'string' },
            },
          },
        },
      },
    },
    {
      name: 'getRepoContext',
      description: 'Get repository context including languages, structure, and recent commits',
      input: {
        type: 'object',
        properties: {
          repo: { type: 'string' },
        },
        required: ['repo'],
      },
      output: {
        type: 'object',
        properties: {
          languages: { type: 'array', items: { type: 'string' } },
          structure: { type: 'string' },
          recentCommits: { type: 'array', items: { type: 'string' } },
          readme: { type: 'string' },
        },
      },
    },
    {
      name: 'postComment',
      description: 'Post a comment on a PR',
      input: {
        type: 'object',
        properties: {
          prUrl: { type: 'string' },
          comment: { type: 'string' },
        },
        required: ['prUrl', 'comment'],
      },
      output: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
        },
      },
    },
    {
      name: 'getRecentActivity',
      description: 'Get recent activity for standup',
      input: {
        type: 'object',
        properties: {
          repo: { type: 'string' },
          since: { type: 'string' },
        },
        required: ['repo', 'since'],
      },
      output: {
        type: 'object',
        properties: {
          commits: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                author: { type: 'string' },
                date: { type: 'string' },
                sha: { type: 'string' },
              },
            },
          },
          prs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                number: { type: 'number' },
                state: { type: 'string' },
                url: { type: 'string' },
              },
            },
          },
        },
      },
    },
  ];
  lastError?: string;

  private token: string;
  private baseUrl: string;

  constructor(config: GitHubConfig) {
    this.token = config.token;
    this.baseUrl = config.baseUrl || 'https://api.github.com';
    this.auth = { type: 'token', token: config.token };
  }

  async connect(): Promise<void> {
    try {
      // Validate token by fetching user
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('GitHub authentication failed: Invalid or expired token');
        } else if (response.status === 403) {
          throw new Error(
            'GitHub access forbidden: Token lacks required permissions or rate limit exceeded'
          );
        } else {
          throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
        }
      }

      this.status = 'connected';
    } catch (error) {
      this.status = 'error';
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected';
  }

  /**
   * Fetch PR details including diff
   */
  async getPR(prUrl: string): Promise<{
    title: string;
    body: string;
    diff: string;
    files: Array<{
      filename: string;
      status: string;
      additions: number;
      deletions: number;
      patch?: string;
    }>;
    author: string;
    status: string;
    base: { ref: string; sha: string };
    head: { ref: string; sha: string };
  }> {
    this.ensureConnected();

    const { owner, repo, number } = this.parsePRUrl(prUrl);

    // Fetch PR details
    const prResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/pulls/${number}`, {
      headers: this.getHeaders(),
    });

    if (!prResponse.ok) {
      if (prResponse.status === 404) {
        throw new Error(`PR not found: ${prUrl}`);
      } else if (prResponse.status === 403) {
        throw new Error(
          'GitHub access forbidden: Token lacks required permissions or rate limit exceeded'
        );
      } else {
        throw new Error(`Failed to fetch PR: ${prResponse.status} - ${prResponse.statusText}`);
      }
    }

    const pr = await prResponse.json();

    // Fetch PR diff
    const diffResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/pulls/${number}`, {
      headers: {
        ...this.getHeaders(),
        Accept: 'application/vnd.github.v3.diff',
      },
    });

    if (!diffResponse.ok) {
      if (diffResponse.status === 404) {
        throw new Error(`PR not found: ${prUrl}`);
      } else if (diffResponse.status === 403) {
        throw new Error(
          'GitHub access forbidden: Token lacks required permissions or rate limit exceeded'
        );
      } else {
        throw new Error(
          `Failed to fetch PR diff: ${diffResponse.status} - ${diffResponse.statusText}`
        );
      }
    }

    const diff = await diffResponse.text();

    // Fetch files
    const filesResponse = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/pulls/${number}/files`,
      { headers: this.getHeaders() }
    );

    if (!filesResponse.ok) {
      if (filesResponse.status === 404) {
        throw new Error(`PR not found: ${prUrl}`);
      } else if (filesResponse.status === 403) {
        throw new Error(
          'GitHub access forbidden: Token lacks required permissions or rate limit exceeded'
        );
      } else {
        throw new Error(
          `Failed to fetch PR files: ${filesResponse.status} - ${filesResponse.statusText}`
        );
      }
    }

    const files = await filesResponse.json();

    return {
      title: pr.title,
      body: pr.body || '',
      diff,
      files: files.map((f: any) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch,
      })),
      author: pr.user.login,
      status: pr.state,
      base: { ref: pr.base.ref, sha: pr.base.sha },
      head: { ref: pr.head.ref, sha: pr.head.sha },
    };
  }

  /**
   * Get repository context
   */
  async getRepoContext(repo: string): Promise<{
    languages: string[];
    structure: string;
    recentCommits: string[];
    readme?: string;
  }> {
    this.ensureConnected();

    const [owner, repoName] = repo.split('/');

    // Fetch languages
    const langResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repoName}/languages`, {
      headers: this.getHeaders(),
    });

    if (!langResponse.ok) {
      if (langResponse.status === 404) {
        throw new Error(`Repository not found: ${repo}`);
      } else if (langResponse.status === 403) {
        throw new Error(
          'GitHub access forbidden: Token lacks required permissions or rate limit exceeded'
        );
      } else {
        throw new Error(
          `Failed to fetch languages: ${langResponse.status} - ${langResponse.statusText}`
        );
      }
    }
    const languages = Object.keys(await langResponse.json());

    // Fetch recent commits
    const commitsResponse = await fetch(
      `${this.baseUrl}/repos/${owner}/${repoName}/commits?per_page=10`,
      { headers: this.getHeaders() }
    );

    if (!commitsResponse.ok) {
      if (commitsResponse.status === 404) {
        throw new Error(`Repository not found: ${repo}`);
      } else if (commitsResponse.status === 403) {
        throw new Error(
          'GitHub access forbidden: Token lacks required permissions or rate limit exceeded'
        );
      } else {
        throw new Error(
          `Failed to fetch commits: ${commitsResponse.status} - ${commitsResponse.statusText}`
        );
      }
    }
    const commits = await commitsResponse.json();
    const recentCommits = commits.map((c: any) => `${c.sha.slice(0, 7)}: ${c.commit.message}`);

    // Fetch README
    let readme: string | undefined;
    try {
      const readmeResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repoName}/readme`, {
        headers: this.getHeaders(),
      });

      if (!readmeResponse.ok) {
        // README might not exist (404) or other error
        if (readmeResponse.status !== 404) {
          if (readmeResponse.status === 403) {
            throw new Error(
              'GitHub access forbidden: Token lacks required permissions or rate limit exceeded'
            );
          } else {
            throw new Error(
              `Failed to fetch README: ${readmeResponse.status} - ${readmeResponse.statusText}`
            );
          }
        }
      } else {
        const readmeData = await readmeResponse.json();
        readme = Buffer.from(readmeData.content, 'base64').toString('utf8');
      }
    } catch {
      // README might not exist or other parsing error
    }

    // Get structure (top-level files)
    const treeResponse = await fetch(
      `${this.baseUrl}/repos/${owner}/${repoName}/git/trees/HEAD?recursive=1`,
      { headers: this.getHeaders() }
    );

    if (!treeResponse.ok) {
      if (treeResponse.status === 404) {
        throw new Error(`Repository not found: ${repo}`);
      } else if (treeResponse.status === 403) {
        throw new Error(
          'GitHub access forbidden: Token lacks required permissions or rate limit exceeded'
        );
      } else {
        throw new Error(
          `Failed to fetch repository tree: ${treeResponse.status} - ${treeResponse.statusText}`
        );
      }
    }
    const tree = await treeResponse.json();
    const structure = tree.tree
      .slice(0, 100)
      .map((t: any) => t.path)
      .join('\n');

    return {
      languages,
      structure,
      recentCommits,
      readme,
    };
  }

  /**
   * Post a comment on a PR
   */
  async postComment(prUrl: string, comment: string): Promise<void> {
    this.ensureConnected();

    const { owner, repo, number } = this.parsePRUrl(prUrl);

    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/issues/${number}/comments`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ body: comment }),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`PR or issue not found: #${number} in ${owner}/${repo}`);
      } else if (response.status === 403) {
        throw new Error(
          'GitHub access forbidden: Token lacks required permissions or rate limit exceeded'
        );
      } else {
        throw new Error(`Failed to post comment: ${response.status} - ${response.statusText}`);
      }
    }
  }

  /**
   * Get recent activity for standup
   */
  async getRecentActivity(
    repo: string,
    since: Date
  ): Promise<{
    commits: Array<{
      message: string;
      author: string;
      date: string;
      sha: string;
    }>;
    prs: Array<{
      title: string;
      number: number;
      state: string;
      url: string;
    }>;
  }> {
    this.ensureConnected();

    const [owner, repoName] = repo.split('/');

    // Fetch commits since date
    const commitsResponse = await fetch(
      `${this.baseUrl}/repos/${owner}/${repoName}/commits?since=${since.toISOString()}`,
      { headers: this.getHeaders() }
    );
    const commits = await commitsResponse.json();

    // Fetch recent PRs
    const prsResponse = await fetch(
      `${this.baseUrl}/repos/${owner}/${repoName}/pulls?state=all&sort=updated&direction=desc&per_page=20`,
      { headers: this.getHeaders() }
    );
    const prs = await prsResponse.json();

    return {
      commits: commits.map((c: any) => ({
        message: c.commit.message,
        author: c.commit.author.name,
        date: c.commit.author.date,
        sha: c.sha,
      })),
      prs: prs.map((p: any) => ({
        title: p.title,
        number: p.number,
        state: p.state,
        url: p.html_url,
      })),
    };
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `token ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Ultra-Dex',
    };
  }

  private parsePRUrl(url: string): { owner: string; repo: string; number: string } {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (!match) {
      throw new Error('Invalid GitHub PR URL');
    }
    return { owner: match[1], repo: match[2], number: match[3] };
  }

  private ensureConnected(): void {
    if (this.status !== 'connected') {
      throw new Error('GitHub connector not connected. Call connect() first.');
    }
  }
}

export default GitHubConnector;
