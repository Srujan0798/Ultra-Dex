/**
 * Notion Connector for Ultra-Dex
 * Create/update pages, query databases, manage content
 */

import { Connector, ConnectorAuth, ConnectorOperation } from './types.js';

export interface NotionConfig {
  token: string;
  version?: string;
}

export class NotionConnector implements Connector {
  id = 'notion';
  name = 'Notion';
  description = 'Create and manage Notion pages and databases';
  category = 'communication' as const; // Used for documentation and knowledge management
  status: 'connected' | 'disconnected' | 'error' = 'disconnected';
  auth: ConnectorAuth;
  operations: ConnectorOperation[] = [
    {
      name: 'createPage',
      description: 'Create a new Notion page',
      input: {
        type: 'object',
        properties: {
          parentId: { type: 'string' },
          title: { type: 'string' },
          content: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
        },
        required: ['parentId', 'title'],
      },
      output: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          url: { type: 'string' },
        },
      },
    },
    {
      name: 'updatePage',
      description: 'Update an existing Notion page',
      input: {
        type: 'object',
        properties: {
          pageId: { type: 'string' },
          content: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
        },
        required: ['pageId'],
      },
      output: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
        },
      },
    },
    {
      name: 'getDatabase',
      description: 'Get a Notion database and its contents',
      input: {
        type: 'object',
        properties: {
          databaseId: { type: 'string' },
        },
        required: ['databaseId'],
      },
      output: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          results: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
        },
      },
    },
  ];
  lastError?: string;

  private token: string;
  private version: string;
  private baseUrl: string = 'https://api.notion.com/v1';

  constructor(config: NotionConfig) {
    this.token = config.token;
    this.version = config.version || '2022-06-28';
    this.auth = { type: 'token', token: config.token };
  }

  async connect(): Promise<void> {
    try {
      // Validate token by fetching user info
      const response = await fetch(`${this.baseUrl}/users/me`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Notion API error: ${response.status}`);
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
   * Create a new Notion page
   */
  async createPage(
    parentId: string,
    title: string,
    content: any[] = []
  ): Promise<{
    id: string;
    url: string;
  }> {
    this.ensureConnected();

    const properties: Record<string, any> = {
      title: {
        title: [
          {
            text: {
              content: title,
            },
          },
        ],
      },
    };

    const children: any[] = content;

    const response = await fetch(`${this.baseUrl}/pages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        parent: { page_id: parentId },
        properties,
        ...(children.length > 0 && { children }),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status} - ${data.message}`);
    }

    return {
      id: data.id,
      url: data.url,
    };
  }

  /**
   * Update an existing Notion page
   */
  async updatePage(
    pageId: string,
    content: any[] = []
  ): Promise<{
    success: boolean;
  }> {
    this.ensureConnected();

    // First, archive the existing page content by updating with empty children
    // Then we could append blocks, but for simplicity we'll replace content
    const response = await fetch(`${this.baseUrl}/blocks/${pageId}/children`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({
        children: content,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status} - ${data.message}`);
    }

    return {
      success: true,
    };
  }

  /**
   * Get a Notion database and its contents
   */
  async getDatabase(databaseId: string): Promise<{
    id: string;
    title: string;
    results: any[];
  }> {
    this.ensureConnected();

    const response = await fetch(`${this.baseUrl}/databases/${databaseId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }

    const database = await response.json();

    // Query the database to get its contents
    const queryResponse = await fetch(`${this.baseUrl}/databases/${databaseId}/query`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!queryResponse.ok) {
      throw new Error(`Notion API error: ${queryResponse.status}`);
    }

    const queryData = await queryResponse.json();

    return {
      id: database.id,
      title: database.title[0]?.plain_text || 'Untitled Database',
      results: queryData.results,
    };
  }

  /**
   * Search for pages in Notion
   */
  async search(query: string): Promise<{
    results: Array<{
      id: string;
      title: string;
      url: string;
      type: 'page' | 'database';
    }>;
  }> {
    this.ensureConnected();

    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        query,
        filter: {
          value: 'page',
          property: 'object',
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status} - ${data.message}`);
    }

    return {
      results: data.results.map((result: any) => ({
        id: result.id,
        title: result.properties.title.title[0]?.plain_text || 'Untitled',
        url: result.url,
        type: result.object,
      })),
    };
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      'Notion-Version': this.version,
      'Content-Type': 'application/json',
    };
  }

  private ensureConnected(): void {
    if (this.status !== 'connected') {
      throw new Error('Notion connector not connected. Call connect() first.');
    }
  }
}

export default NotionConnector;
