const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const filePath = path.resolve(__dirname, '../lib/progress-tracker.ts');
const source = fs.readFileSync(filePath, 'utf8');

test('progress-tracker exports required functions', () => {
  assert.match(source, /export async function trackLessonComplete/);
  assert.match(source, /export async function getCourseProgress/);
  assert.match(source, /export async function generateCertificate/);
});

test('progress-tracker checks completion percentage', () => {
  assert.match(source, /calculateCourseProgress/);
});
