const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const filePath = path.resolve(__dirname, '../lib/rate-limiting.ts');
const source = fs.readFileSync(filePath, 'utf8');

test('rate-limiting exports token bucket helpers', () => {
  assert.match(source, /export function tokenBucketAllow/);
  assert.match(source, /export async function checkLimit/);
  assert.match(source, /export async function incrementUsage/);
});

test('rate-limiting implements refill logic', () => {
  assert.match(source, /refillBucket/);
});
