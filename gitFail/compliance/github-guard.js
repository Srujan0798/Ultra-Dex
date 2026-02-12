#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

const secretPatterns = [
  /ghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /AIza[0-9A-Za-z_-]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----/,
  /sk-[A-Za-z0-9]{20,}/,
];

const riskyPatterns = [
  { id: 'bulk-star', regex: /star(Repo|Repository|s)?\(/i, reason: 'Potential automated starring activity' },
  { id: 'bulk-follow', regex: /follow(er|ing)?s?\(/i, reason: 'Potential automated following activity' },
  { id: 'spam-loop', regex: /(createIssue|createPullRequest).*(for|while)\s*\(/is, reason: 'Potential bulk issue/PR automation loop' },
  { id: 'github-scrape', regex: /(scrape|crawler|crawl).*(github\.com|api\.github\.com)/is, reason: 'Potential GitHub scraping flow' },
];

function info(msg) {
  console.log(`${GREEN}[github-guard]${RESET} ${msg}`);
}

function warn(msg) {
  console.warn(`${YELLOW}[github-guard]${RESET} ${msg}`);
}

function fail(msg) {
  console.error(`${RED}[github-guard]${RESET} ${msg}`);
  process.exit(1);
}

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
}

function getCurrentBranch() {
  return run('git rev-parse --abbrev-ref HEAD');
}

function getUpstreamRef() {
  try {
    return run('git rev-parse --abbrev-ref --symbolic-full-name @{u}');
  } catch {
    return '';
  }
}

function getChangedFilesForPush(upstreamRef) {
  let cmd = '';
  if (upstreamRef) {
    cmd = `git diff --name-only ${upstreamRef}..HEAD`;
  } else {
    cmd = 'git diff --name-only HEAD~1..HEAD';
  }

  try {
    const out = run(cmd);
    return out ? out.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

async function checkGitHubStatus() {
  const res = await fetch('https://www.githubstatus.com/api/v2/status.json');
  if (!res.ok) {
    fail(`Unable to query GitHub Status API (HTTP ${res.status}).`);
  }

  const payload = await res.json();
  const indicator = payload?.status?.indicator ?? 'unknown';
  const description = payload?.status?.description ?? 'Unknown status';
  const allowDegraded = process.env.ALLOW_GITHUB_DEGRADED === '1';

  if (indicator === 'none') {
    info(`GitHub status is green: ${description}`);
    return;
  }

  const msg = `GitHub status is ${indicator}: ${description}. Push is blocked by policy.`;
  if (allowDegraded) {
    warn(`${msg} Override enabled via ALLOW_GITHUB_DEGRADED=1.`);
    return;
  }

  fail(`${msg} Set ALLOW_GITHUB_DEGRADED=1 only for critical emergency exceptions.`);
}

function checkRemoteAccess() {
  const remote = run('git config --get remote.origin.url || true');
  if (!remote) {
    warn('No origin remote configured. Skipping remote access check.');
    return;
  }

  try {
    run("GIT_SSH_COMMAND='ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new' git ls-remote --heads origin");
    info('Remote access check passed.');
  } catch (error) {
    const stderr = String(error?.stderr || error?.message || '');
    if (stderr.includes('account is suspended')) {
      fail('Account is suspended on GitHub. Do not push. Follow suspension recovery process.');
    }
    fail(`Remote access check failed: ${stderr.trim()}`);
  }
}

function checkSecretLeakInRange(upstreamRef) {
  let diff = '';
  try {
    diff = upstreamRef
      ? run(`git diff --no-color ${upstreamRef}..HEAD`)
      : run('git diff --no-color HEAD~1..HEAD');
  } catch {
    diff = '';
  }

  for (const pattern of secretPatterns) {
    if (pattern.test(diff)) {
      fail(`Potential secret detected in to-be-pushed diff (${pattern}). Remove before push.`);
    }
  }
  info('No secret patterns detected in to-be-pushed diff.');
}

function checkRiskyAutomationPatterns(files) {
  const repoRoot = process.cwd();
  const violations = [];

  for (const relativeFile of files) {
    const absoluteFile = path.resolve(repoRoot, relativeFile);
    if (!fs.existsSync(absoluteFile)) continue;

    const stat = fs.statSync(absoluteFile);
    if (!stat.isFile() || stat.size > 2_000_000) continue;

    const lower = relativeFile.toLowerCase();
    if (!lower.endsWith('.js') && !lower.endsWith('.ts') && !lower.endsWith('.md') && !lower.endsWith('.yml') && !lower.endsWith('.yaml')) {
      continue;
    }

    const content = fs.readFileSync(absoluteFile, 'utf8');
    for (const rule of riskyPatterns) {
      if (rule.regex.test(content)) {
        // Explicit allow marker for reviewed exceptions.
        if (content.includes('ALLOW_GITHUB_POLICY_EXCEPTION')) continue;
        violations.push(`${relativeFile}: ${rule.reason}`);
      }
    }
  }

  if (violations.length > 0) {
    const list = violations.map((v) => `- ${v}`).join('\n');
    fail(
      `Potential policy-risk automation detected in changed files:\n${list}\n` +
        'If this is legitimate and reviewed, add ALLOW_GITHUB_POLICY_EXCEPTION with documented justification.'
    );
  }

  info('No policy-risk automation patterns detected in changed files.');
}

async function main() {
  info('Starting GitHub policy guard...');
  const branch = getCurrentBranch();
  const upstreamRef = getUpstreamRef();
  const changedFiles = getChangedFilesForPush(upstreamRef);

  info(`Branch: ${branch}`);
  info(`Upstream: ${upstreamRef || 'none'}`);
  info(`Files in push range: ${changedFiles.length}`);

  await checkGitHubStatus();
  checkRemoteAccess();
  checkSecretLeakInRange(upstreamRef);
  checkRiskyAutomationPatterns(changedFiles);

  info('GitHub policy guard passed.');
}

main().catch((error) => {
  fail(`Guard failed unexpectedly: ${error?.message || error}`);
});
