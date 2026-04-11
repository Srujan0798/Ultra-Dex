/**
 * Skills with Connectors Demo
 * Shows how skills work with real connectors
 */

import { SkillsAPI, initializeSkills } from '../src/core/skills/index.js';
import { ConnectorSkillExecutor } from '../src/core/skills/connector-executor.js';
import { connectorRegistry } from '../src/core/connectors/registry.js';
import { GitHubConnector } from '../src/core/connectors/github.js';
import { SnowflakeConnector } from '../src/core/connectors/snowflake.js';
import { SlackConnector } from '../src/core/connectors/slack.js';
import { NotionConnector } from '../src/core/connectors/notion.js';

async function demoSkillsWithConnectors() {
  console.log('🔌 Skills with Connectors Demo\n');

  try {
    // Initialize skills system
    initializeSkills();

    // Create Skills API
    const skillsAPI = new SkillsAPI();

    console.log('✅ Skills system initialized\n');

    // Register connectors
    console.log('📡 Registering connectors...');

    // GitHub connector (will be disconnected since we don't have token)
    const githubConnector = new GitHubConnector({
      token: process.env.GITHUB_TOKEN || '',
    });
    connectorRegistry.register(githubConnector);

    // Snowflake connector
    const snowflakeConnector = new SnowflakeConnector({
      account: process.env.SNOWFLAKE_ACCOUNT || '',
      username: process.env.SNOWFLAKE_USERNAME || '',
      password: process.env.SNOWFLAKE_PASSWORD || '',
    });
    connectorRegistry.register(snowflakeConnector);

    // Slack connector
    const slackConnector = new SlackConnector({
      token: process.env.SLACK_TOKEN || '',
    });
    connectorRegistry.register(slackConnector);

    // Notion connector
    const notionConnector = new NotionConnector({
      token: process.env.NOTION_TOKEN || '',
    });
    connectorRegistry.register(notionConnector);

    console.log('✅ Connectors registered\n');

    // Check connector status
    const status = connectorRegistry.getStatus();
    console.log('🔌 Connector Status:');
    console.log(`  • Total: ${status.total}`);
    console.log(`  • Connected: ${status.connected}`);
    console.log(`  • Disconnected: ${status.disconnected}`);
    console.log(`  • Error: ${status.error}`);

    status.connectors.forEach((connector) => {
      console.log(`  • ${connector.name}: ${connector.status}`);
    });

    console.log('\n🧪 Demo: Skills that use connectors');

    // Demo skills that use connectors
    console.log('\n🎯 Skills that benefit from connectors:');
    const connectorSkills = skillsAPI
      .list()
      .filter(
        (skill) =>
          skill.id === '/code-review' ||
          skill.id === '/sql-queries' ||
          skill.id === '/incident-response' ||
          skill.id === '/architecture' ||
          skill.id === '/standup' ||
          skill.id === '/build-dashboard'
      );

    connectorSkills.forEach((skill) => {
      console.log(`  • ${skill.id} - ${skill.name}`);
      console.log(`    ${skill.description}`);
    });

    console.log('\n💡 To enable connectors:');
    console.log('   • Set GITHUB_TOKEN for GitHub integration');
    console.log('   • Set SNOWFLAKE_* credentials for data warehouse');
    console.log('   • Set SLACK_TOKEN for notifications');
    console.log('   • Set NOTION_TOKEN for documentation');

    console.log('\n✅ Demo completed! Skills are ready for connector integration.');
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error(error.stack);
  }
}

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demoSkillsWithConnectors().catch(console.error);
}

export default demoSkillsWithConnectors;
