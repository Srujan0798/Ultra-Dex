#!/usr/bin/env node

/**
 * Ultra-Dex Skills Demo
 * Demonstrates practical usage of skills with real-world examples
 */

import { UltraDexCore } from '../src/core/orchestration/ultra-dex-core.ts';

async function demoSkills() {
  console.log('🚀 Ultra-Dex Skills Demo');
  console.log('========================\n');

  // Initialize Ultra-Dex core with Mock AI
  console.log('🔧 Initializing Ultra-Dex Core (Mock AI mode)...');
  const core = new UltraDexCore();
  process.env.MOCK_AI_PROVIDERS = 'true';
  await core.initialize({ env: 'test' });
  console.log('✅ Ultra-Dex Core ready\n');

  // Demo 1: Code Review
  console.log('📝 Demo 1: Code Review');
  console.log('----------------------');

  const codeToReview = `
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}
  `;

  // Debug: Check if router is available
  console.log('🔍 Debug: Checking router availability...');
  console.log('Router defined:', !!core.router);
  console.log('Router initialized:', core.router?.initialized);
  console.log('Skills API executor:', !!core.skills?.executor);
  console.log('Skills API executor config:', !!core.skills?.executor?.config);
  console.log('Skills API executor aiRouter:', !!core.skills?.executor?.config?.aiRouter);

  try {
    const reviewResult = await core.skills.execute('/code-review', {
      code: codeToReview,
      language: 'javascript',
      focus: ['security', 'performance', 'correctness'],
    });

    console.log('✅ Code review completed');

    // Handle mock responses (raw text vs structured JSON)
    if (typeof reviewResult.output === 'string') {
      console.log('Mock response received');
      console.log('Output:', reviewResult.output.substring(0, 100) + '...');
    } else {
      console.log('Summary:', reviewResult.output?.summary || 'No summary available');
      console.log('Findings:', reviewResult.output?.findings?.length || 0, 'issues found\n');
    }
  } catch (error) {
    console.log('❌ Code review failed:', error.message);
    console.log('Error stack:', error.stack);
  }

  // Demo 2: SQL Query Generation
  console.log('📊 Demo 2: SQL Query Generation');
  console.log('-------------------------------');

  try {
    const sqlResult = await core.skills.execute('/sql-queries', {
      prompt: 'Get all users who signed up in the last 30 days and their total order value',
      dialect: 'postgresql',
      schema: {
        users: ['id', 'email', 'created_at'],
        orders: ['id', 'user_id', 'amount', 'created_at'],
      },
    });

    console.log('✅ SQL query generated');

    // Handle mock responses
    if (typeof sqlResult.output === 'string') {
      console.log('Mock response received');
      console.log('Output:', sqlResult.output.substring(0, 100) + '...');
    } else {
      console.log('Query:', sqlResult.output?.query || 'No query available');
      console.log('Explanation:', sqlResult.output?.explanation || 'No explanation available');
    }
    console.log('');
  } catch (error) {
    console.log('❌ SQL generation failed:', error.message);
  }

  // Demo 3: Sales Call Preparation
  console.log('💰 Demo 3: Sales Call Preparation');
  console.log('--------------------------------');

  try {
    const salesResult = await core.skills.execute('/call-prep', {
      prompt: 'Prepare for sales call with Acme Corp about enterprise pricing',
      context: {
        company: 'Acme Corp',
        industry: 'SaaS',
        previousInteractions: ['Initial discovery call 2 weeks ago'],
      },
    });

    console.log('✅ Sales call preparation completed');

    // Handle mock responses
    if (typeof salesResult.output === 'string') {
      console.log('Mock response received');
      console.log('Output:', salesResult.output.substring(0, 100) + '...');
    } else {
      console.log('Agenda:', salesResult.output?.agenda || 'No agenda available');
      console.log('Key talking points:', salesResult.output?.talkingPoints?.length || 0, 'points');
    }
    console.log('');
  } catch (error) {
    console.log('❌ Sales call preparation failed:', error.message);
  }

  // Demo 4: Data Analysis
  console.log('📈 Demo 4: Data Analysis');
  console.log('-----------------------');

  try {
    const analysisResult = await core.skills.execute('/analyze', {
      question: 'What are the key trends in our sales data for the last quarter?',
      data: {
        timeframe: 'Last quarter',
        metrics: ['revenue', 'conversion_rate', 'customer_acquisition'],
        segments: ['product_category', 'region', 'sales_channel'],
      },
    });

    console.log('✅ Data analysis completed');

    // Handle mock responses
    if (typeof analysisResult.output === 'string') {
      console.log('Mock response received');
      console.log('Output:', analysisResult.output.substring(0, 100) + '...');
    } else {
      console.log('Insights:', analysisResult.output?.insights || 'No insights available');
      console.log(
        'Recommendations:',
        analysisResult.output?.recommendations?.length || 0,
        'recommendations'
      );
    }
    console.log('');
  } catch (error) {
    console.log('❌ Data analysis failed:', error.message);
  }

  // Demo 5: Documentation Generation
  console.log('📚 Demo 5: Documentation Generation');
  console.log('----------------------------------');

  try {
    const docResult = await core.skills.execute('/documentation', {
      code: codeToReview,
      language: 'javascript',
      focus: ['api', 'usage', 'examples'],
    });

    console.log('✅ Documentation generated');

    // Handle mock responses
    if (typeof docResult.output === 'string') {
      console.log('Mock response received');
      console.log('Output:', docResult.output.substring(0, 100) + '...');
    } else {
      console.log(
        'Function description:',
        docResult.output?.description || 'No description available'
      );
      console.log(
        'Parameters:',
        docResult.output?.parameters?.length || 0,
        'parameters documented'
      );
    }
    console.log('');
  } catch (error) {
    console.log('❌ Documentation generation failed:', error.message);
  }

  // List all available skills
  console.log('📋 All Available Skills');
  console.log('----------------------');

  const skills = core.skills.list();
  const categories = {};

  skills.forEach((skill) => {
    if (!categories[skill.category]) {
      categories[skill.category] = [];
    }
    categories[skill.category].push(skill);
  });

  Object.entries(categories).forEach(([category, skills]) => {
    console.log(`\n${category.toUpperCase()}:`);
    skills.forEach((skill) => {
      console.log(`  ${skill.id.padEnd(25)} - ${skill.name}`);
    });
  });

  console.log(`\n🎯 Total skills available: ${skills.length}`);

  // Cleanup
  await core.stop();
  console.log('\n🏁 Demo completed successfully!');
}

// Run demo
demoSkills().catch((error) => {
  console.error('❌ Demo failed:', error);
  process.exit(1);
});
