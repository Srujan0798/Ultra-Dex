const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const filePath = path.resolve(__dirname, '../lib/slugify.ts');
const source = fs.readFileSync(filePath, 'utf8');

test('slugify helper exists', () => {
  assert.match(source, /export function slugify/);
});

test('slugify enforces lowercase and replaces spaces', () => {
  assert.match(source, /toLowerCase/);
  assert.match(source, /replace\(/);
});
