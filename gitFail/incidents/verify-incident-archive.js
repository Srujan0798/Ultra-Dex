#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const incidentsDir = path.resolve('gitFail/incidents');

if (!fs.existsSync(incidentsDir)) {
  console.error('Incident directory not found: gitFail/incidents');
  process.exit(1);
}

const files = fs
  .readdirSync(incidentsDir)
  .filter((name) => /^Feb .*\.md$/.test(name))
  .sort((a, b) => a.localeCompare(b));

if (files.length === 0) {
  console.error('No incident files found matching "Feb *.md" in gitFail/incidents');
  process.exit(1);
}

const requiredSnippets = [
  '# ',
  '- **Capture Label:**',
  '- **Source:**',
  '- **Current State (captured):**',
  '## Timeline',
  '## Raw Capture',
  '<details>',
  '```text',
];

const problems = [];

for (const file of files) {
  const fullPath = path.join(incidentsDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');

  for (const snippet of requiredSnippets) {
    if (!content.includes(snippet)) {
      problems.push(`${file}: missing section/snippet "${snippet}"`);
    }
  }

  const timelineMatches = content.match(/^\d+\. \*\*/gm) || [];
  if (timelineMatches.length === 0) {
    problems.push(`${file}: timeline has no numbered entries`);
  }

  const rawCaptureBlock = /## Raw Capture[\s\S]*?```text[\s\S]*?```/.test(content);
  if (!rawCaptureBlock) {
    problems.push(`${file}: raw capture fenced block is missing or malformed`);
  }
}

if (problems.length > 0) {
  console.error('Incident archive verification failed:\n');
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

console.log(`Incident archive verification passed (${files.length} files).`);
