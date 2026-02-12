#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const requiredFiles = [
  'LICENSE',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'SECURITY.md',
  'gitFail/compliance/GITHUB_COMPLIANCE_CHECKLIST.md',
];

const requiredChecklistLinks = [
  'https://www.githubstatus.com/',
  'https://docs.github.com/en/site-policy/github-terms/github-terms-of-service',
  'https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies',
  'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
];

const errors = [];

for (const relativeFile of requiredFiles) {
  const absoluteFile = path.resolve(relativeFile);
  if (!fs.existsSync(absoluteFile)) {
    errors.push(`Missing required governance file: ${relativeFile}`);
    continue;
  }

  const content = fs.readFileSync(absoluteFile, 'utf8').trim();
  if (!content) {
    errors.push(`Governance file is empty: ${relativeFile}`);
  }
}

const checklistPath = path.resolve('gitFail/compliance/GITHUB_COMPLIANCE_CHECKLIST.md');
if (fs.existsSync(checklistPath)) {
  const checklist = fs.readFileSync(checklistPath, 'utf8');
  for (const link of requiredChecklistLinks) {
    if (!checklist.includes(link)) {
      errors.push(`Checklist is missing official policy link: ${link}`);
    }
  }
}

if (errors.length > 0) {
  console.error('Governance compliance checks failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Governance compliance checks passed.');
