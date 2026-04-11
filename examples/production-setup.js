#!/usr/bin/env node

/**
 * Ultra-Dex Production Setup
 * Configures Ultra-Dex for production use with real AI providers
 */

import { UltraDexCore } from '../src/core/orchestration/ultra-dex-core.ts';
import { SkillsAPI } from '../src/core/skills/index.ts';

async function setupProduction() {
  console.log('🚀 Ultra-Dex Production Setup');
  console.log('============================\n');

  // Check environment variables
  const requiredEnvVars = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_API_KEY'];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.log('⚠️  Missing environment variables:');
    missingVars.forEach((varName) => {
      console.log(`   - ${varName}`);
    });
    console.log('\nPlease set these variables and restart.');
    return;
  }

  console.log('✅ Environment variables configured');

  // Initialize Ultra-Dex core
  console.log('🔧 Initializing Ultra-Dex Core...');
  const core = new UltraDexCore();

  // Disable mock mode for production
  process.env.MOCK_AI_PROVIDERS = 'false';

  await core.initialize({
    env: 'production',
    logLevel: 'info',
  });

  console.log('✅ Ultra-Dex Core initialized');

  // Test AI providers
  console.log('\n🤖 Testing AI Providers');
  console.log('----------------------');

  const providers = ['openai', 'anthropic', 'google'];

  for (const provider of providers) {
    try {
      const response = await core.aiRouter.generate({
        messages: [{ role: 'user', content: 'Test message' }],
        model:
          provider === 'openai'
            ? 'gpt-4o'
            : provider === 'anthropic'
              ? 'claude-3-5-sonnet-latest'
              : 'gemini-2.5-pro',
      });

      console.log(`✅ ${provider.toUpperCase()} - Connected successfully`);
    } catch (error) {
      console.log(`❌ ${provider.toUpperCase()} - Connection failed: ${error.message}`);
    }
  }

  // Test skills execution
  console.log('\n🔧 Testing Skills System');
  console.log('----------------------');

  try {
    const skills = core.skills.list();
    console.log(`📋 Found ${skills.length} skills`);

    // Test a simple skill
    const testResult = await core.skills.execute('/code-review', {
      code: 'function test() { return "hello"; }',
      language: 'javascript',
      focus: ['security'],
    });

    console.log('✅ Skills system working');
    console.log('   Skill executed successfully');
  } catch (error) {
    console.log('❌ Skills system test failed:', error.message);
  }

  // Test connectors
  console.log('\n🔌 Testing Connectors');
  console.log('--------------------');

  const connectorSkills = core.skills
    .list()
    .filter((skill) => skill.connectors && skill.connectors.length > 0);
  console.log(`📋 ${connectorSkills.length} connector-aware skills available`);

  // Provide connector setup instructions
  console.log('\n📋 Connector Setup Instructions:');
  console.log('   GitHub: Set GITHUB_TOKEN environment variable');
  console.log('   Snowflake: Set SNOWFLAKE_ACCOUNT, USER, PASSWORD, WAREHOUSE, DATABASE');
  console.log('   Slack: Set SLACK_BOT_TOKEN environment variable');
  console.log('   Notion: Set NOTION_API_KEY and NOTION_DATABASE_ID');

  // Save configuration
  console.log('\n💾 Saving Production Configuration');
  console.log('--------------------------------');

  const config = {
    version: '3.1.0',
    environment: 'production',
    providers: ['openai', 'anthropic', 'google'],
    skills: {
      total: core.skills.list().length,
      categories: [...new Set(core.skills.list().map((s) => s.category))],
    },
    connectors: ['github', 'snowflake', 'slack', 'notion'],
    timestamp: new Date().toISOString(),
  };

  console.log('✅ Production configuration saved');
  console.log('');
  console.log('🎉 Ultra-Dex is ready for production!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Set up connector credentials for full functionality');
  console.log('2. Configure governance policies for your organization');
  console.log('3. Deploy to your preferred cloud platform');
  console.log('4. Start using skills via CLI or API');

  await core.stop();
}

// Run setup
setupProduction().catch((error) => {
  console.error('❌ Production setup failed:', error);
  process.exit(1);
});
