/**
 * Ultra-Dex SDK — Custom Agent Example
 *
 * Demonstrates how to extend the Agent class with:
 *   - Custom `run()` implementation
 *   - Agent memory (remember/recall)
 *   - Multi-step task decomposition
 *   - Agent registration with UltraDex client
 *
 * Usage:
 *   node packages/sdk/examples/custom-agent.js
 */

import { UltraDex, Agent } from '../index.ts';

// ---------------------------------------------------------------------------
// 1. Define a custom agent by extending Agent
// ---------------------------------------------------------------------------

class CodeReviewAgent extends Agent {
  constructor() {
    super({
      id: 'code-reviewer',
      name: 'Code Review Agent',
      description: 'Reviews code for quality, security, and best practices',
      capabilities: ['code-review', 'security-scan', 'style-check'],
      meta: { language: 'javascript', framework: 'node' },
    });
  }

  /**
   * Run the code review pipeline
   * @param {string} task - The code or file path to review
   * @param {object} context - Additional context (severity, focus areas)
   */
  async run(task, context = {}) {
    const steps = [];

    // Step 1: Parse the code
    steps.push({
      step: 'parse',
      status: 'completed',
      detail: `Parsed ${task.length} characters of code`,
    });

    // Step 2: Check style
    const styleIssues = this.checkStyle(task);
    steps.push({
      step: 'style-check',
      status: 'completed',
      issues: styleIssues,
    });

    // Step 3: Security scan
    const securityIssues = this.securityScan(task);
    steps.push({
      step: 'security-scan',
      status: 'completed',
      issues: securityIssues,
    });

    // Remember the review for future reference
    this.remember(`review:${Date.now()}`, {
      codeLength: task.length,
      styleIssues: styleIssues.length,
      securityIssues: securityIssues.length,
      context,
    });

    return {
      summary: `Reviewed ${task.length} chars: ${styleIssues.length} style issues, ${securityIssues.length} security issues`,
      steps,
      approved: securityIssues.length === 0,
    };
  }

  checkStyle(code) {
    const issues = [];
    if (code.includes('var ')) issues.push('Use `const`/`let` instead of `var`');
    if (code.includes('==') && !code.includes('===')) issues.push('Use strict equality `===`');
    if (code.length > 500) issues.push('Consider splitting into smaller functions');
    return issues;
  }

  securityScan(code) {
    const issues = [];
    if (code.includes('eval(')) issues.push('CRITICAL: `eval()` usage detected');
    if (code.includes('innerHTML')) issues.push('WARNING: `innerHTML` can lead to XSS');
    if (/password\s*=\s*['"]/.test(code)) issues.push('CRITICAL: Hardcoded password detected');
    return issues;
  }
}

// ---------------------------------------------------------------------------
// 2. Register and run the agent
// ---------------------------------------------------------------------------

const dex = new UltraDex();
const reviewer = new CodeReviewAgent();

dex.registerAgent(reviewer);

console.log('🤖 Custom Agent Demo\n');
console.log(`  Agent: ${reviewer.name}`);
console.log(`  Capabilities: ${reviewer.capabilities.join(', ')}\n`);

// Good code
const goodCode = `
const greet = (name) => {
  if (!name || typeof name !== 'string') {
    throw new Error('Name must be a non-empty string');
  }
  return 'Hello, ' + name + '!';
};
`;

const result1 = await dex.runAgent('code-reviewer', goodCode);
console.log('  Review 1 (clean code):');
console.log(`    ${result1.result.summary}`);
console.log(`    Approved: ${result1.result.approved ? '✅' : '❌'}\n`);

// Bad code
const badCode = `
var userPass = "admin123";
function verify(input) {
  if (input == userPass) {
    document.innerHTML = eval(input);
    return true;
  }
}
`;

const result2 = await dex.runAgent('code-reviewer', badCode);
console.log('  Review 2 (bad code):');
console.log(`    ${result2.result.summary}`);
console.log(`    Approved: ${result2.result.approved ? '✅' : '❌'}`);
for (const step of result2.result.steps) {
  if (step.issues && step.issues.length > 0) {
    for (const issue of step.issues) {
      console.log(`      ⚠ ${issue}`);
    }
  }
}

// Check agent memory
console.log('\n  Agent memory entries:', reviewer.memory.size);
console.log('\n✅ Agent demo complete');
