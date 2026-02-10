const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const filePath = path.resolve(__dirname, '../lib/streak-logic.ts');
const source = fs.readFileSync(filePath, 'utf8');

test('streak-logic exports required functions', () => {
  assert.match(source, /export async function calculateStreak/);
  assert.match(source, /export async function updateStreak/);
  assert.match(source, /export async function getStreakHistory/);
  assert.match(source, /export async function checkAchievements/);
});

test('streak-logic uses target days logic', () => {
  assert.match(source, /targetDays/);
  assert.match(source, /isTargetDay/);
});
