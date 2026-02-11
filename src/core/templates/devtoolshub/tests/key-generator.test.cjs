const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const filePath = path.resolve(__dirname, '../lib/key-generator.ts');
const source = fs.readFileSync(filePath, 'utf8');

test('key-generator exports required helpers', () => {
  assert.match(source, /export function hashKey/);
  assert.match(source, /export function generateKey/);
  assert.match(source, /export function validateKey/);
});

test('key-generator uses crypto sha256', () => {
  assert.match(source, /createHash\('sha256'\)/);
});
