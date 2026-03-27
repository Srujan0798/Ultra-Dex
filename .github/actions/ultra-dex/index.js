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

  const prNumber = event.pull_request?.number;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!prNumber || !repo) return;

  const [owner, name] = repo.split('/');
  if (!owner || !name) return;

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
}

async function main() {
  const agentsInput = getInput('agents', 'code-reviewer,security-audit');
  const autoApprove = getInput('auto-approve', 'false') === 'true';
  const token = getInput('github-token', process.env.GITHUB_TOKEN || '');

  const agents = agentsInput
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const results = [];
  let passed = true;

  try {
    // Mandatory governance gate
    run('node gitFail/compliance/check-governance-files.js');
    results.push({ check: 'governance', status: 'passed' });

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
        run('npm run -s test:push:smoke');
        results.push({ agent, status: 'passed', summary: 'Push smoke suite passed' });
        continue;
      }

      if (agent === 'test-generator') {
        run('npm run -s test:cli');
        results.push({ agent, status: 'passed', summary: 'CLI suite passed' });
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
