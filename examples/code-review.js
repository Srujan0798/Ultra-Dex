/**
 * Example: Code Review with GitHub Integration
 *
 * This example shows how to:
 * 1. Initialize Ultra-Dex
 * 2. Connect to GitHub
 * 3. Review a PR automatically
 * 4. Post results back to GitHub
 */

import { UltraDexCore } from '../src/core/orchestration/ultra-dex-core.js';
import {
  initializeSkillsSystem,
  createSkillHelpers,
} from '../src/core/orchestration/skills-integration.js';

async function main() {
  console.log('🚀 Ultra-Dex Code Review Example\n');

  // 1. Initialize Ultra-Dex
  const ultraDex = new UltraDexCore({
    dataPath: './data',
    env: 'development',
  });

  await ultraDex.initialize();
  await ultraDex.start();

  console.log('✅ Ultra-Dex initialized\n');

  // 2. Initialize skills
  const skillsAPI = initializeSkillsSystem({
    aiRouter: ultraDex.router,
    memory: ultraDex.memory,
    agentRegistry: ultraDex.agents,
    // connectors: connectorRegistry, // Add if you have connectors
  });

  const skills = createSkillHelpers(skillsAPI);

  console.log('✅ Skills system ready\n');

  // 3. Review code (with direct code input)
  console.log('🔍 Reviewing code snippet...\n');

  const result = await skills.codeReview({
    code: `
function authenticateUser(token) {
  if (token) {
    return jwt.verify(token, SECRET);
  }
  return null;
}

function getUserData(userId) {
  return db.query('SELECT * FROM users WHERE id = ' + userId);
}
    `,
    language: 'javascript',
    focus: ['security', 'performance'],
    filePath: 'auth.js',
  });

  console.log('📋 Review Results:\n');
  console.log(JSON.stringify(result.result, null, 2));
  console.log(`\n⏱️  Latency: ${result.latencyMs}ms`);
  console.log(`💰 Cost: $${result.costUsd.toFixed(6)}`);
  console.log(`🤖 Provider: ${result.provider}`);
  console.log(`🧠 Model: ${result.model}`);

  // 4. List all available skills
  console.log('\n📚 Available Skills:');
  const allSkills = skills.list();
  allSkills.forEach((skill) => {
    console.log(`  ${skill.id.padEnd(20)} - ${skill.name}`);
  });

  // Cleanup
  await ultraDex.stop();
  console.log('\n✅ Done!');
}

main().catch(console.error);
