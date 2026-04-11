/**
 * Enhanced Skill Executor with Connector Integration
 * This is what makes Ultra-Dex competitive with Claude plugins
 */

import { SkillExecutor, SkillExecutorConfig } from './executor.js';
import {
  SkillDefinition,
  SkillInput,
  SkillExecutionResult,
  SkillExecutionOptions,
} from './types.js';
import { ConnectorRegistry, Connector } from '../connectors/types.js';

export interface ConnectorSkillConfig extends SkillExecutorConfig {
  connectors: ConnectorRegistry;
}

/**
 * Enhanced executor that fetches data from connectors before executing skills
 */
export class ConnectorSkillExecutor extends SkillExecutor {
  private connectors: ConnectorRegistry;

  constructor(config: ConnectorSkillConfig) {
    super(config);
    this.connectors = config.connectors;
  }

  /**
   * Execute skill with connector data fetching
   */
  async execute(
    skill: SkillDefinition,
    input: SkillInput,
    options: SkillExecutionOptions = {}
  ): Promise<SkillExecutionResult> {
    // 1. Fetch data from connectors if needed
    const enrichedInput = await this.enrichWithConnectorData(skill, input, options);

    // 2. Execute skill with enriched data
    return super.execute(skill, enrichedInput, options);
  }

  /**
   * Enrich input with data from connectors
   */
  private async enrichWithConnectorData(
    skill: SkillDefinition,
    input: SkillInput,
    options: SkillExecutionOptions
  ): Promise<SkillInput> {
    const enriched = { ...input };

    // Handle skill-specific connector fetching
    switch (skill.id) {
      case '/code-review':
        if (input.prUrl && !input.code) {
          enriched.code = await this.fetchPRDiff(input.prUrl as string);
          enriched.repoContext = await this.fetchRepoContext(input.prUrl as string);
        }
        break;

      case '/architecture':
        if (options.connectors?.notion) {
          enriched.existingADRs = await this.fetchNotionADRs();
        }
        break;

      case '/standup':
        if (!input.commits || (input.commits as string[]).length === 0) {
          enriched.commits = await this.fetchRecentCommits();
          enriched.prs = await this.fetchRecentPRs();
          enriched.tickets = await this.fetchRecentTickets();
        }
        break;

      case '/sql-queries':
        if (options.connectors?.snowflake && input.schema) {
          enriched.schema = await this.fetchSnowflakeSchema(input.schema as string);
        }
        if (options.connectors?.bigquery && input.tables) {
          enriched.tableSchemas = await this.fetchBigQuerySchemas(input.tables as string[]);
        }
        break;

      case '/explore-data':
        if (options.connectors?.snowflake && input.dataset) {
          enriched.sample = await this.fetchDataSample(input.dataset as string);
        }
        break;

      case '/incident-response':
        if (input.service) {
          enriched.metrics = await this.fetchServiceMetrics(input.service as string);
          enriched.logs = await this.fetchServiceLogs(input.service as string);
        }
        break;

      case '/debug':
        if (input.service) {
          enriched.metrics = await this.fetchServiceMetrics(input.service as string);
          enriched.logs = await this.fetchRecentLogs(input.service as string);
        }
        break;
    }

    return enriched;
  }

  // Connector data fetching methods

  private async fetchPRDiff(prUrl: string): Promise<string> {
    const github = this.connectors.get('github');
    if (!github || github.status !== 'connected') {
      throw new Error('GitHub connector not connected');
    }

    const pr = await (github as any).getPR(prUrl);
    return pr.diff;
  }

  private async fetchRepoContext(prUrl: string): Promise<string> {
    const github = this.connectors.get('github');
    if (!github || github.status !== 'connected') return '';

    const repo = prUrl.split('/').slice(3, 5).join('/');
    const context = await (github as any).getRepoContext(repo);
    return JSON.stringify(context);
  }

  private async fetchNotionADRs(): Promise<any[]> {
    const notion = this.connectors.get('notion');
    if (!notion || notion.status !== 'connected') return [];

    // Fetch from Notion database
    const db = await (notion as any).getDatabase(process.env.NOTION_ADR_DB_ID);
    return db.results || [];
  }

  private async fetchRecentCommits(): Promise<string[]> {
    const github = this.connectors.get('github');
    if (!github || github.status !== 'connected') return [];

    const repo = process.env.GITHUB_REPO || '';
    const context = await (github as any).getRepoContext(repo);
    return context.recentCommits.slice(0, 10);
  }

  private async fetchRecentPRs(): Promise<string[]> {
    const github = this.connectors.get('github');
    if (!github || github.status !== 'connected') return [];

    // This would fetch from GitHub API
    return [];
  }

  private async fetchRecentTickets(): Promise<string[]> {
    const linear = this.connectors.get('linear');
    if (!linear || linear.status !== 'connected') return [];

    const issues = await (linear as any).getIssues({ limit: 10 });
    return issues.map((i: any) => `${i.identifier}: ${i.title}`);
  }

  private async fetchSnowflakeSchema(schemaName: string): Promise<any> {
    const snowflake = this.connectors.get('snowflake');
    if (!snowflake || snowflake.status !== 'connected') {
      throw new Error('Snowflake connector not connected');
    }

    return await (snowflake as any).getSchema(process.env.SNOWFLAKE_DATABASE, schemaName);
  }

  private async fetchBigQuerySchemas(tables: string[]): Promise<any[]> {
    const bigquery = this.connectors.get('bigquery');
    if (!bigquery || bigquery.status !== 'connected') return [];

    const schemas = [];
    for (const table of tables) {
      const schema = await (bigquery as any).getDataset(table.split('.')[0]);
      schemas.push(schema);
    }
    return schemas;
  }

  private async fetchDataSample(dataset: string): Promise<any[]> {
    const snowflake = this.connectors.get('snowflake');
    if (!snowflake || snowflake.status !== 'connected') return [];

    // Fetch sample with LIMIT
    return await (snowflake as any).query(`SELECT * FROM ${dataset} LIMIT 100`);
  }

  private async fetchServiceMetrics(service: string): Promise<any> {
    const datadog = this.connectors.get('datadog');
    if (!datadog || datadog.status !== 'connected') return null;

    const to = new Date();
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

    return await (datadog as any).getMetrics(`service:${service}`, from, to);
  }

  private async fetchServiceLogs(service: string): Promise<any[]> {
    const datadog = this.connectors.get('datadog');
    if (!datadog || datadog.status !== 'connected') return [];

    return await (datadog as any).getLogs(`service:${service}`, 100);
  }

  private async fetchRecentLogs(service: string): Promise<any[]> {
    return this.fetchServiceLogs(service);
  }

  /**
   * Post results back to connectors
   */
  async postResult(
    skill: SkillDefinition,
    result: SkillExecutionResult,
    options: SkillExecutionOptions
  ): Promise<void> {
    switch (skill.id) {
      case '/architecture':
        if (options.connectors?.notion) {
          await this.postToNotion(result);
        }
        if (options.connectors?.github) {
          await this.postToGitHubDiscussions(result);
        }
        break;

      case '/code-review':
        if (options.connectors?.github && result.result.prUrl) {
          await this.postReviewToGitHub(result);
        }
        break;

      case '/incident-response':
        if (options.connectors?.slack) {
          await this.postToSlack(result);
        }
        if (options.connectors?.pagerduty) {
          await this.updatePagerDuty(result);
        }
        break;

      case '/build-dashboard':
        if (options.connectors?.notion) {
          await this.embedDashboardInNotion(result);
        }
        break;
    }
  }

  private async postToNotion(result: SkillExecutionResult): Promise<void> {
    const notion = this.connectors.get('notion');
    if (!notion) return;

    await (notion as any).createPage(process.env.NOTION_ADR_DB_ID, {
      title: (result.result as any).title,
      content: JSON.stringify(result.result, null, 2),
    });
  }

  private async postToGitHubDiscussions(result: SkillExecutionResult): Promise<void> {
    // Implementation for GitHub discussions
  }

  private async postReviewToGitHub(result: SkillExecutionResult): Promise<void> {
    const github = this.connectors.get('github');
    if (!github) return;

    const prUrl = (result.result as any).prUrl;
    const reviewText = (result.result as any).summary;

    await (github as any).postComment(prUrl, reviewText);
  }

  private async postToSlack(result: SkillExecutionResult): Promise<void> {
    const slack = this.connectors.get('slack');
    if (!slack) return;

    const channel = process.env.SLACK_INCIDENT_CHANNEL || '#incidents';
    const message = (result.result as any).communication || 'Incident update';

    await (slack as any).sendMessage(channel, message);
  }

  private async updatePagerDuty(result: SkillExecutionResult): Promise<void> {
    const pagerduty = this.connectors.get('pagerduty');
    if (!pagerduty) return;

    // Update incident notes
  }

  private async embedDashboardInNotion(result: SkillExecutionResult): Promise<void> {
    const notion = this.connectors.get('notion');
    if (!notion) return;

    const dashboardUrl = (result.result as any).filePath;
    // Embed dashboard in Notion page
  }
}

export default ConnectorSkillExecutor;
