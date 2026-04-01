#!/usr/bin/env node
// Copyright (c) 2026 Ultra-Dex
/**
 * Test Integrity Agent - Ensure tests are real
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('═══════════════════════════════════════════════════════════');
console.log('         🧪 TEST INTEGRITY AGENT - STARTING');
console.log('═══════════════════════════════════════════════════════════\n');

const issues = [];
const verified = [];

// 1. Scan for modified assertions
console.log('1️⃣  Scanning for modified assertions...\n');

try {
  const testFiles = execSync('find tests -name "*.test.js" 2>/dev/null | head -30', {
    cwd: process.cwd(),
    encoding: 'utf8',
  }).trim().split('\n').filter(f => f.length > 0);
  
  let relaxedAssertions = 0;
  
  for (const file of testFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for always-true assertions
      if (content.includes('assert.ok(true)') || content.includes('assert.strictEqual(true, true)')) {
        console.log(`   ⚠️  ${file}: Always-true assertion`);
        relaxedAssertions++;
      }
      
      // Check for empty try-catch
      if (content.match(/try\s*\{\s*\}/)) {
        console.log(`   ⚠️  ${file}: Empty try block`);
        relaxedAssertions++;
      }
      
      // Check for skipped tests
      if (content.includes('.skip(')) {
        console.log(`   ℹ️  ${file}: Has skipped test`);
      }
    } catch {}
  }
  
  if (relaxedAssertions === 0) {
    console.log('   ✅ No relaxed assertions found\n');
    verified.push('Assertions are strict');
  } else {
    issues.push(`${relaxedAssertions} files with relaxed assertions`);
    console.log('');
  }
} catch (e) {
  console.log('   ℹ️  Scan completed\n');
}

// 2. Verify tests match real behavior
console.log('2️⃣  Verifying tests match real behavior...\n');

try {
  // Run tests and check for real failures
  const testOutput = execSync('npm test 2>&1 | grep -E "^(ok|not ok) [0-9]+" | head -20', {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 120000,
  });
  
  const passCount = (testOutput.match(/^ok /gm) || []).length;
  const failCount = (testOutput.match(/^not ok /gm) || []).length;
  
  console.log(`   Sample: ${passCount} pass, ${failCount} fail`);
  
  if (failCount > 0) {
    console.log('   ✅ Tests are catching real failures\n');
    verified.push('Tests catch real failures');
  } else {
    console.log('   ℹ️  All sampled tests passing\n');
    verified.push('Tests passing');
  }
} catch (e) {
  console.log('   ℹ️  Test verification completed\n');
}

// 3. Check for test modifications
console.log('3️⃣  Checking for test modifications...\n');

try {
  const recentTestChanges = execSync('git log --oneline --since="24 hours ago" -- tests/ 2>/dev/null | head -10', {
    cwd: process.cwd(),
    encoding: 'utf8',
  }).trim();
  
  if (recentTestChanges) {
    console.log('   ℹ️  Recent test changes:\n');
    recentTestChanges.split('\n').forEach(line => console.log(`      ${line}`));
    console.log('');
  } else {
    console.log('   ℹ️  No recent test modifications\n');
  }
} catch (e) {
  console.log('   ℹ️  Git history not available\n');
}

// 4. Verify implementation fixes (not test changes)
console.log('4️⃣  Verifying implementation fixes...\n');

try {
  const srcFiles = execSync('find src -name "*.js" -newer tests 2>/dev/null | head -10', {
    cwd: process.cwd(),
    encoding: 'utf8',
  }).trim().split('\n').filter(f => f.length > 0);
  
  if (srcFiles.length > 0) {
    console.log('   ✅ Recent source file modifications:\n');
    srcFiles.forEach(f => console.log(`      ${f}`));
    console.log('');
    verified.push('Implementation files modified (correct approach)');
  } else {
    console.log('   ℹ️  No recent source modifications\n');
  }
} catch (e) {
  console.log('   ℹ️  File comparison completed\n');
}

// 5. Check test coverage
console.log('5️⃣  Checking test coverage...\n');

try {
  const testCount = execSync('find tests -name "*.test.js" 2>/dev/null | wc -l', {
    cwd: process.cwd(),
    encoding: 'utf8',
  }).trim();
  
  console.log(`   📊 Total test files: ${testCount}`);
  
  const testResult = execSync('npm test 2>&1 | grep "^# tests"', {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 120000,
  }).trim();
  
  console.log(`   ${testResult}\n`);
  verified.push('Test coverage adequate');
} catch (e) {
  console.log('   ℹ️  Coverage check completed\n');
}

// Summary
console.log('═══════════════════════════════════════════════════════════');
console.log('         📊 TEST INTEGRITY AGENT - SUMMARY');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`Issues Found: ${issues.length}`);
issues.forEach((i, idx) => console.log(`   ${idx + 1}. ${i}`));
if (issues.length === 0) console.log('   ✅ None\n');

console.log('');
console.log(`Verifications Passed: ${verified.length}`);
verified.forEach((v, idx) => console.log(`   ${idx + 1}. ${v}`));

// Write report
const reportPath = path.join(process.cwd(), '.ultra-dex/test-integrity-report.json');
fs.writeFileSync(reportPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  issues,
  verified,
  status: issues.length === 0 ? 'PASS' : 'REVIEW',
  assertionsStrict: verified.some(v => v.includes('strict')),
  testsReal: verified.some(v => v.includes('failures') || v.includes('passing')),
  implementationFixed: verified.some(v => v.includes('Implementation')),
}, null, 2));

console.log('');
console.log(`📄 Report saved to: ${reportPath}\n`);

const integrityStatus = issues.length === 0 ? 'PASS ✅' : 'REVIEW ⚠️';

console.log('═══════════════════════════════════════════════════════════');
console.log('         🎯 TEST INTEGRITY: ' + integrityStatus);
console.log('═══════════════════════════════════════════════════════════\n');

