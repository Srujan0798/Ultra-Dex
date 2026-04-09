#!/usr/bin/env node
// Copyright (c) 2026 Ultra-Dex
/**
 * Phase 2: Real AI Integration Agent
 *
 * GOAL: Verify REAL NVIDIA API inference (no mocks, no 401)
 *
 * REQUIREMENTS:
 * - Real NVIDIA API key in .env.local
 * - Real API response (200 OK, not 401)
 * - Real inference output (not hardcoded)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('═══════════════════════════════════════════════════════════');
console.log('      🔴 PHASE 2: REAL AI INTEGRATION AGENT');
console.log('═══════════════════════════════════════════════════════════\n');

const results = {
  apiKey: { status: 'UNKNOWN', details: '' },
  apiCall: { status: 'UNKNOWN', details: '' },
  inference: { status: 'UNKNOWN', details: '' },
  output: { status: 'UNKNOWN', details: '' },
};

// 1. Verify real API key
console.log('1️⃣  Verifying REAL NVIDIA API key...\n');

try {
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');

  const keyMatch = envContent.match(/NVIDIA_API_KEY=(nvapi-[a-zA-Z0-9_-]{40,})/);
  const placeholderMatch = envContent.match(/NVIDIA_API_KEY=(.*your-.*)/i);

  if (placeholderMatch) {
    results.apiKey.status = 'FAIL';
    results.apiKey.details = 'Placeholder key detected (contains "your-")';
    console.log(`   ❌ FAIL: ${results.apiKey.details}\n`);
  } else if (keyMatch) {
    const key = keyMatch[1];
    const masked = key.slice(0, 10) + '...' + key.slice(-5);
    results.apiKey.status = 'PASS';
    results.apiKey.details = `Real key detected: ${masked}`;
    console.log(`   ✅ PASS: ${results.apiKey.details}\n`);
  } else {
    results.apiKey.status = 'FAIL';
    results.apiKey.details = 'No valid NVIDIA_API_KEY found';
    console.log(`   ❌ FAIL: ${results.apiKey.details}\n`);
  }
} catch (e) {
  results.apiKey.status = 'FAIL';
  results.apiKey.details = `Error: ${e.message}`;
  console.log(`   ❌ FAIL: ${e.message}\n`);
}

// 2. Test real API call
console.log('2️⃣  Testing REAL API call...\n');

try {
  console.log('   Running: node test-nvidia-api.js\n');
  const output = execSync('node test-nvidia-api.js 2>&1', {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 120000,
  });

  const has401 = output.includes('401');
  const hasSuccess = output.includes('Success') || output.includes('✅');
  const hasResponse = output.includes('Response:') || output.includes('choices');
  const hasError = output.includes('Error') || output.includes('❌');

  if (has401) {
    results.apiCall.status = 'FAIL';
    results.apiCall.details = '401 AUTH FAILURE (invalid/expired key)';
    console.log(`   ❌ FAIL: ${results.apiCall.details}\n`);
  } else if (hasSuccess && hasResponse) {
    results.apiCall.status = 'PASS';
    results.apiCall.details = '200 OK - Real API response';
    console.log(`   ✅ PASS: ${results.apiCall.details}\n`);
  } else if (hasError) {
    results.apiCall.status = 'FAIL';
    results.apiCall.details =
      output.split('\n').find((l) => l.includes('Error')) || 'Unknown error';
    console.log(`   ❌ FAIL: ${results.apiCall.details}\n`);
  } else {
    results.apiCall.status = 'REVIEW';
    results.apiCall.details = 'Response received (needs verification)';
    console.log(`   ⚠️  REVIEW: ${results.apiCall.details}\n`);
  }
} catch (e) {
  const msg = e.message.split('\n')[0];
  if (msg.includes('401')) {
    results.apiCall.status = 'FAIL';
    results.apiCall.details = '401 AUTH FAILURE';
    console.log(`   ❌ FAIL: ${results.apiCall.details}\n`);
  } else {
    results.apiCall.status = 'FAIL';
    results.apiCall.details = msg;
    console.log(`   ❌ FAIL: ${results.apiCall.details}\n`);
  }
}

// 3. Verify real inference
console.log('3️⃣  Verifying REAL inference...\n');

try {
  console.log('   Running: npx ultra-dex run planner -t "say hello" --provider nvidia\n');
  const output = execSync(
    'npx ultra-dex run planner -t "say hello" --provider nvidia 2>&1 | tail -30',
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 120000,
    }
  );

  const has401 = output.includes('401');
  const hasThinking = output.includes('Thinking') || output.includes('think');
  const hasResponse = output.includes('Response:') || output.includes('result');
  const hasRealOutput = hasResponse && !has401;

  if (has401) {
    results.inference.status = 'FAIL';
    results.inference.details = '401 AUTH FAILURE (no inference)';
    console.log(`   ❌ FAIL: ${results.inference.details}\n`);
  } else if (hasRealOutput) {
    results.inference.status = 'PASS';
    results.inference.details = 'Real inference completed';
    console.log(`   ✅ PASS: ${results.inference.details}\n`);
  } else {
    results.inference.status = 'REVIEW';
    results.inference.details = 'Inference attempted (verify output)';
    console.log(`   ⚠️  REVIEW: ${results.inference.details}\n`);
  }
} catch (e) {
  const msg = e.message.split('\n')[0];
  if (msg.includes('401')) {
    results.inference.status = 'FAIL';
    results.inference.details = '401 AUTH FAILURE';
    console.log(`   ❌ FAIL: ${results.inference.details}\n`);
  } else {
    results.inference.status = 'FAIL';
    results.inference.details = msg;
    console.log(`   ❌ FAIL: ${results.inference.details}\n`);
  }
}

// 4. Validate output quality
console.log('4️⃣  Validating OUTPUT QUALITY...\n');

try {
  const resultPath = path.join(process.cwd(), '.ultra-dex/runs');
  const runs = fs.readdirSync(resultPath).sort().reverse();

  if (runs.length > 0) {
    const latestRun = runs[0];
    const resultFile = path.join(resultPath, latestRun, 'result.txt');

    if (fs.existsSync(resultFile)) {
      const resultContent = fs.readFileSync(resultFile, 'utf8');

      const isEmpty = resultContent.trim().length === 0;
      const hasError = resultContent.includes('[Error]');
      const has401 = resultContent.includes('401');
      const hasRealContent = resultContent.length > 20 && !hasError && !has401;

      if (has401 || hasError) {
        results.output.status = 'FAIL';
        results.output.details = 'Error in output';
        console.log(`   ❌ FAIL: ${results.output.details}\n`);
      } else if (isEmpty) {
        results.output.status = 'FAIL';
        results.output.details = 'Empty output';
        console.log(`   ❌ FAIL: ${results.output.details}\n`);
      } else if (hasRealContent) {
        results.output.status = 'PASS';
        results.output.details = `Real output (${resultContent.length} chars)`;
        console.log(`   ✅ PASS: ${results.output.details}\n`);
        console.log('   Preview:\n');
        console.log('   ─────────────────────────────────────────────');
        resultContent
          .split('\n')
          .slice(0, 5)
          .forEach((line) => {
            console.log(`   ${line}`);
          });
        console.log('   ─────────────────────────────────────────────\n');
      } else {
        results.output.status = 'REVIEW';
        results.output.details = 'Output needs manual review';
        console.log(`   ⚠️  REVIEW: ${results.output.details}\n`);
      }
    } else {
      results.output.status = 'FAIL';
      results.output.details = 'Result file not found';
      console.log(`   ❌ FAIL: ${results.output.details}\n`);
    }
  } else {
    results.output.status = 'FAIL';
    results.output.details = 'No runs found';
    console.log(`   ❌ FAIL: ${results.output.details}\n`);
  }
} catch (e) {
  results.output.status = 'FAIL';
  results.output.details = e.message.split('\n')[0];
  console.log(`   ❌ FAIL: ${results.output.details}\n`);
}

// Summary
console.log('═══════════════════════════════════════════════════════════');
console.log('         📊 PHASE 2 REAL AI INTEGRATION - SUMMARY');
console.log('═══════════════════════════════════════════════════════════\n');

const allPass =
  results.apiKey.status === 'PASS' &&
  results.apiCall.status === 'PASS' &&
  results.inference.status === 'PASS' &&
  results.output.status === 'PASS';

console.log('FINAL STATUS:\n');
console.log(`  API Key:      ${results.apiKey.status} - ${results.apiKey.details}`);
console.log(`  API Call:     ${results.apiCall.status} - ${results.apiCall.details}`);
console.log(`  Inference:    ${results.inference.status} - ${results.inference.details}`);
console.log(`  Output:       ${results.output.status} - ${results.output.details}`);
console.log('');

// Write report
const reportPath = path.join(process.cwd(), '.ultra-dex/phase2-real-ai-report.json');
fs.writeFileSync(
  reportPath,
  JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      phase: 'Phase 2 - Real AI Integration',
      results,
      allPass,
      phase2Complete: allPass,
      readyForProduction: allPass,
    },
    null,
    2
  )
);

console.log(`📄 Report saved to: ${reportPath}\n`);

console.log('═══════════════════════════════════════════════════════════');
console.log('         🎯 PHASE 2 STATUS: ' + (allPass ? 'COMPLETE ✅' : 'INCOMPLETE ⚠️'));
console.log('═══════════════════════════════════════════════════════════\n');

if (allPass) {
  console.log('🎉 PHASE 2 COMPLETE - SYSTEM PRODUCTION READY!\n');
} else {
  console.log('⚠️  PHASE 2 INCOMPLETE - FIX REQUIRED:\n');

  if (results.apiKey.status === 'FAIL') {
    console.log('  1. Get real NVIDIA API key from:');
    console.log('     https://build.nvidia.com/explore/discover\n');
    console.log('  2. Update .env.local with real key:\n');
    console.log('     NVIDIA_API_KEY=nvapi-YOUR-REAL-KEY\n');
  }

  if (results.apiCall.status === 'FAIL' || results.inference.status === 'FAIL') {
    console.log('  3. After updating key, re-run:');
    console.log('     node agents/real-ai-integration-agent.js\n');
  }

  console.log('');
}

process.exit(allPass ? 0 : 1);
