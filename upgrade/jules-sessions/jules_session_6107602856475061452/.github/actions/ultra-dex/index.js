import { execSync } from 'node:child_process';
import fs from 'node:fs';

function getInput(name, fallback = '') {
  // Inputs are passed as environment variables in the format INPUT_NAME
  const key = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
  return process.env[key] || fallback;
}

function setOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath) {
    fs.appendFileSync(outputPath, `${name}=${value}\n`);
  }
  console.log(`::notice::output ${name}=${value}`);
}

function run(command) {
  execSync(command, { stdio: 'inherit' });
}

async function postPrComment(token, body) {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !token) return;

  let event;
  try {
    event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  } catch {
    return;
  }

  // Handle both pull_request and pull_request_target events
  const prNumber = event.pull_request?.number || event.issue?.number;
  const repo = process.env.GITHUB_REPOSITORY;
  
  if (!prNumber || !repo) return;

  const [owner, name] = repo.split('/');
  if (!owner || !name) return;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${name}/issues/${prNumber}/comments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'ultra-dex-action',
        },
        body: JSON.stringify({ body }),
      }
    );

    if (!response.ok) {
      console.log(`::warning::Unable to post PR comment (status=${response.status})`);
    }
  } catch (err) {
    console.log(`::warning::Failed to post comment: ${err.message}`);
  }
}

async function main() {
  const agentsInput = getInput('agents', 'code-reviewer,security-audit');
  const autoApprove = getInput('auto-approve', 'false') === 'true';
  const token = getInput('github-token', process.env.GITHUB_TOKEN || '');
  
  // These inputs were missing but are passed by workflow
  const task = getInput('task');
  const provider = getInput('provider');
  const model = getInput('model');

  console.log(`Starting Ultra-Dex Action with agents: ${agentsInput}`);
  if (provider) console.log(`Provider: ${provider}, Model: ${model}`);

  const agents = agentsInput
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const results = [];
  let passed = true;

  try {
    // Mandatory governance gate
    console.log('Running governance check...');
    try {
        run('node gitFail/compliance/check-governance-files.js');
        results.push({ check: 'governance', status: 'passed', summary: 'Governance checks passed' });
    } catch (e) {
        console.error('Governance check failed');
        passed = false;
        results.push({ check: 'governance', status: 'failed', summary: 'Governance violations found' });
        // Don't exit early, try to run other checks
    }

    for (const agent of agents) {
      if (agent === 'security-audit') {
        // Non-blocking audit in action context (same policy as repo pre-push)
        try {
          console.log('Running security audit...');
          // Using --audit-level=high to fail only on serious issues
          run('npm audit --audit-level=high');
          results.push({ agent, status: 'passed', summary: 'Security audit passed' });
        } catch {
          console.error('Security audit failed');
          passed = false;
          results.push({
            agent,
            status: 'failed',
            summary: 'Security audit found high/critical issues',
          });
        }
        continue;
      }

      if (agent === 'code-reviewer') {
        try {
            console.log('Running smoke tests...');
            run('npm run test:push:smoke');
            results.push({ agent, status: 'passed', summary: 'Push smoke suite passed' });
        } catch {
            console.error('Smoke tests failed');
            passed = false;
            results.push({ agent, status: 'failed', summary: 'Smoke tests failed' });
        }
        continue;
      }

      if (agent === 'test-generator') {
        try {
            console.log('Running CLI tests...');
            run('npm run test:cli');
            results.push({ agent, status: 'passed', summary: 'CLI suite passed' });
        } catch {
            console.error('CLI tests failed');
            passed = false;
            results.push({ agent, status: 'failed', summary: 'CLI suite failed' });
        }
        continue;
      }
      
      console.log(`Skipping unknown agent: ${agent}`);
    }
  } catch (error) {
    passed = false;
    results.push({
      check: 'action-runtime',
      status: 'failed',
      summary: error instanceof Error ? error.message : String(error),
    });
  }

  const report = {
    passed,
    autoApprove,
    results,
  };

  if (token) {
      const resultLines = results.map(
        (item) => `- **${item.agent || item.check}**: ${item.status === 'passed' ? '✅' : '❌'} ${item.status} - ${item.summary || ''}`
      );
      
      const bodyLines = [
        '## Ultra-Dex Action Report',
        '',
        ...resultLines,
        '',
        `**Overall Status**: ${passed ? '✅ PASSED' : '❌ FAILED'}`,
      ];

      await postPrComment(token, bodyLines.join('\n'));
  }

  setOutput('results', JSON.stringify(report));
  setOutput('passed', String(passed));

  if (!passed) {
    console.error('::error::Ultra-Dex action checks failed');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
