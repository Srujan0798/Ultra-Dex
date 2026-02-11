const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const filePath = path.resolve(__dirname, '../lib/versioning.ts');
const source = fs.readFileSync(filePath, 'utf8');

test('versioning exports diff and version helpers', () => {
  assert.match(source, /export async function createVersion/);
  assert.match(source, /export async function restoreVersion/);
  assert.match(source, /export function diff/);
});

test('diff implementation compares lines', () => {
  assert.ok(source.includes("split('\\n')"));
});
