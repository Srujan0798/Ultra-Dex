#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';

function getInput(name, fallback = '') {
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
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    throw new Error(`Command failed: ${command}`);
  }
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

  const prNumber = event.pull_request?.number;
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
  } catch (error) {
    console.log(`::warning::Failed to post PR comment: ${error.message}`);
  }
}

async function main() {
  const agentsInput = getInput('agents', 'code-reviewer,security-audit');
  const autoApprove = getInput('auto-approve', 'false') === 'true';
  const token = getInput('github-token', process.env.GITHUB_TOKEN || '');
  
  // Log new inputs for debugging purposes, but proceed with existing logic
  const task = getInput('task');
  const provider = getInput('provider');
  const model = getInput('model');
  
  if (task) {
    console.log(`::notice::Received task: ${task}`);
    console.log(`::notice::Provider: ${provider}, Model: ${model}`);
  }

  const agents = agentsInput
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const results = [];
  let passed = true;

  try {
    // Check if the governance script exists before running it
    if (fs.existsSync('gitFail/compliance/check-governance-files.js')) {
      run('node gitFail/compliance/check-governance-files.js');
      results.push({ check: 'governance', status: 'passed' });
    } else {
      console.log('::warning::Governance check script not found, skipping.');
      results.push({ check: 'governance', status: 'skipped', summary: 'Script not found' });
    }

    for (const agent of agents) {
      if (agent === 'security-audit') {
        // Non-blocking audit in action context (same policy as repo pre-push)
        try {
          run('npm audit --audit-level=high');
          results.push({ agent, status: 'passed', summary: 'Security audit passed' });
        } catch {
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
           // check if script exists in package.json
           const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
           if (pkg.scripts && pkg.scripts['test:push:smoke']) {
             run('npm run -s test:push:smoke');
             results.push({ agent, status: 'passed', summary: 'Push smoke suite passed' });
           } else {
             console.log('::warning::test:push:smoke script not found');
             results.push({ agent, status: 'skipped', summary: 'Script not found' });
           }
        } catch (e) {
           passed = false;
           results.push({ agent, status: 'failed', summary: e.message });
        }
        continue;
      }

      if (agent === 'test-generator') {
        try {
           const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
           if (pkg.scripts && pkg.scripts['test:cli']) {
             run('npm run -s test:cli');
             results.push({ agent, status: 'passed', summary: 'CLI suite passed' });
           } else {
              console.log('::warning::test:cli script not found');
              results.push({ agent, status: 'skipped', summary: 'Script not found' });
           }
        } catch (e) {
            passed = false;
            results.push({ agent, status: 'failed', summary: e.message });
        }
        continue;
      }

      results.push({ agent, status: 'skipped', summary: 'Unknown agent type; no-op' });
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

  const bodyLines = [
    '## Ultra-Dex Action Report',
    '',
    ...results.map(
      (item) => `- **${item.agent || item.check}**: ${item.status} - ${item.summary || ''}`
    ),
    '',
    `Overall: **${passed ? 'PASSED' : 'FAILED'}**`,
  ];

  await postPrComment(token, bodyLines.join('\n'));

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
