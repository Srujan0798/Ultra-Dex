/**
 * Connector Types for Ultra-Dex
 * MCP-based connectors for external services
 */

export interface ConnectorConfig {
  name: string;
  enabled: boolean;
  credentials?: Record<string, string>;
  settings?: Record<string, unknown>;
}

export interface ConnectorAuth {
  type: 'oauth' | 'token' | 'api_key' | 'basic';
  token?: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string[];
}

export interface ConnectorOperation {
  name: string;
  description: string;
  input: object;
  output: object;
}

export interface Connector {
  id: string;
  name: string;
  description: string;
  category: 'engineering' | 'data' | 'communication' | 'monitoring';
  auth: ConnectorAuth;
  operations: ConnectorOperation[];
  status: 'connected' | 'disconnected' | 'error';
  lastError?: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

// Engineering Connectors
export interface GitHubConnector extends Connector {
  getPR(prUrl: string): Promise<{
    title: string;
    body: string;
    diff: string;
    files: string[];
    author: string;
    status: string;
  }>;
  getRepoContext(repo: string): Promise<{
    languages: string[];
    structure: string;
    recentCommits: string[];
  }>;
  postComment(prUrl: string, comment: string): Promise<void>;
}

export interface SlackConnector extends Connector {
  sendMessage(channel: string, message: string): Promise<void>;
  getChannelHistory(channel: string, limit?: number): Promise<any[]>;
}

export interface NotionConnector extends Connector {
  createPage(parentId: string, content: any): Promise<string>;
  updatePage(pageId: string, content: any): Promise<void>;
  getDatabase(databaseId: string): Promise<any>;
}

export interface LinearConnector extends Connector {
  createIssue(team: string, title: string, description: string): Promise<string>;
  getIssues(filter: any): Promise<any[]>;
}

export interface PagerDutyConnector extends Connector {
  createIncident(service: string, title: string, description: string): Promise<string>;
  getIncidents(): Promise<any[]>;
  acknowledgeIncident(incidentId: string): Promise<void>;
}

export interface DatadogConnector extends Connector {
  getMetrics(query: string, from: Date, to: Date): Promise<any>;
  getLogs(query: string, limit: number): Promise<any[]>;
}

// Data Connectors
export interface SnowflakeConnector extends Connector {
  query(sql: string): Promise<any[]>;
  getSchema(database: string, schema: string): Promise<any>;
  getTables(database: string): Promise<string[]>;
}

export interface BigQueryConnector extends Connector {
  query(sql: string): Promise<any[]>;
  getDataset(datasetId: string): Promise<any>;
}

export interface DatabricksConnector extends Connector {
  query(sql: string): Promise<any[]>;
  runNotebook(path: string): Promise<void>;
}

export interface HexConnector extends Connector {
  getProjects(): Promise<any[]>;
  runProject(projectId: string): Promise<void>;
}

export interface AmplitudeConnector extends Connector {
  getEvents(eventType: string, from: Date, to: Date): Promise<any[]>;
  getMetrics(metric: string, interval: string): Promise<any>;
}

// Connector Registry
export interface ConnectorRegistry {
  register(connector: Connector): void;
  get(id: string): Connector | undefined;
  list(): Connector[];
  listByCategory(category: string): Connector[];
  getConnected(): Connector[];
  disconnect(id: string): Promise<void>;
  connect(id: string, auth: ConnectorAuth): Promise<void>;
}
