#!/usr/bin/env node
/**
 * Self-Healing Deployment Monitor
 * Automatically checks Render logs, detects errors, and fixes them
 */

import { execSync } from 'child_process';
import fs from 'fs';

const RENDER_SERVICE_ID = 'srv-d7avn1tm5p6s73aki250';
const RENDER_API_KEY = process.env.RENDER_API_KEY;
const SERVICE_URL = 'https://ultra-dex.onrender.com';

// Common errors and their fixes
const ERROR_PATTERNS = [
  {
    pattern: /vite: not found/,
    name: 'Vite Missing',
    fix: async () => {
      console.log('🔧 Fixing: Installing vite...');
      execSync('cd apps/dashboard && npm install vite --save-dev', { stdio: 'inherit' });
      return 'Installed vite in dashboard';
    }
  },
  {
    pattern: /Cannot find module/,
    name: 'Missing Module',
    fix: async () => {
      console.log('🔧 Fixing: Installing dependencies...');
      execSync('npm install', { stdio: 'inherit' });
      return 'Reinstalled dependencies';
    }
  },
  {
    pattern: /Build failed/,
    name: 'Build Error',
    fix: async () => {
      console.log('🔧 Fixing: Cleaning and rebuilding...');
      execSync('rm -rf node_modules && npm install', { stdio: 'inherit' });
      return 'Clean reinstall';
    }
  },
  {
    pattern: /TypeScript|type error/i,
    name: 'Type Error',
    fix: async () => {
      console.log('🔧 Fixing: Running type check...');
      try {
        execSync('npm run typecheck', { stdio: 'inherit' });
      } catch (e) {
        // Type errors need manual fix
        return 'TYPE_ERROR_NEEDS_MANUAL_FIX';
      }
      return 'Type check passed';
    }
  }
];

async function checkDeployment() {
  console.log('🔍 Checking deployment status...\n');
  
  try {
    // Check if service is live
    const response = await fetch(`${SERVICE_URL}/health`, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ DEPLOYMENT IS LIVE!');
      console.log(`   Status: ${data.status}`);
      console.log(`   Version: ${data.version}`);
      console.log(`   URL: ${SERVICE_URL}`);
      return { status: 'live', data };
    }
  } catch (error) {
    console.log('❌ Deployment not responding');
    return { status: 'down', error: error.message };
  }
  
  return { status: 'unknown' };
}

async function analyzeLogs() {
  console.log('📋 Analyzing deployment logs...\n');
  
  // Try to get logs from Render API if key is available
  if (RENDER_API_KEY) {
    try {
      const logs = await fetch(`https://api.render.com/v1/services/${RENDER_SERVICE_ID}/logs`, {
        headers: {
          'Authorization': `Bearer ${RENDER_API_KEY}`,
          'Accept': 'application/json'
        }
      });
      
      if (logs.ok) {
        const data = await logs.json();
        return analyzeLogContent(JSON.stringify(data));
      }
    } catch (e) {
      console.log('⚠️  Could not fetch logs from API, using fallback...');
    }
  }
  
  // Fallback: Check if we have recent logs saved
  return null;
}

function analyzeLogContent(logText) {
  const detectedErrors = [];
  
  for (const errorPattern of ERROR_PATTERNS) {
    if (errorPattern.pattern.test(logText)) {
      detectedErrors.push(errorPattern);
    }
  }
  
  return detectedErrors;
}

async function autoFix(errors) {
  console.log(`🔧 Auto-fixing ${errors.length} detected issues...\n`);
  
  const results = [];
  
  for (const error of errors) {
    console.log(`➡️  Fixing: ${error.name}`);
    try {
      const result = await error.fix();
      results.push({ error: error.name, result, success: true });
      
      if (result === 'TYPE_ERROR_NEEDS_MANUAL_FIX') {
        console.log('⚠️  Type errors detected - needs manual review');
        return { fixed: false, needsManual: true };
      }
    } catch (e) {
      results.push({ error: error.name, result: e.message, success: false });
    }
  }
  
  return { fixed: true, results };
}

async function commitAndPush() {
  console.log('\n📤 Committing fixes...\n');
  
  try {
    execSync('git add -A', { stdio: 'inherit' });
    execSync('git commit -m "fix: Auto-heal deployment issues [auto-generated]"', { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('✅ Changes pushed, Render will auto-deploy');
    return true;
  } catch (e) {
    console.log('⚠️  Nothing to commit or push failed');
    return false;
  }
}

async function waitForDeploy(maxMinutes = 10) {
  console.log(`\n⏳ Waiting for deployment (max ${maxMinutes} mins)...\n`);
  
  const startTime = Date.now();
  const maxTime = maxMinutes * 60 * 1000;
  
  while (Date.now() - startTime < maxTime) {
    const status = await checkDeployment();
    
    if (status.status === 'live') {
      console.log('\n🎉 SUCCESS! Deployment is live!');
      console.log(`   URL: ${SERVICE_URL}`);
      console.log(`   Health: ${SERVICE_URL}/health`);
      return true;
    }
    
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 30000)); // Check every 30s
  }
  
  console.log('\n⏰ Timeout waiting for deployment');
  return false;
}

// Main auto-heal loop
async function autoHeal() {
  console.log('═══════════════════════════════════════════════════');
  console.log('   🤖 AUTO-HEAL DEPLOYMENT SYSTEM');
  console.log('═══════════════════════════════════════════════════\n');
  
  // Step 1: Check current status
  const status = await checkDeployment();
  
  if (status.status === 'live') {
    console.log('\n✅ Already live! No action needed.');
    return;
  }
  
  // Step 2: Analyze logs for errors
  const errors = await analyzeLogs();
  
  if (errors && errors.length > 0) {
    console.log(`\n🚨 Detected ${errors.length} errors:`);
    errors.forEach(e => console.log(`   - ${e.name}`));
    
    // Step 3: Auto-fix
    const fixResult = await autoFix(errors);
    
    if (fixResult.needsManual) {
      console.log('\n⚠️  Some errors need manual fixing. Check logs.');
      return;
    }
    
    if (fixResult.fixed) {
      // Step 4: Commit and push
      await commitAndPush();
      
      // Step 5: Wait for deployment
      await waitForDeploy();
    }
  } else {
    console.log('\n⏳ No specific errors detected, waiting for deployment...');
    await waitForDeploy();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  autoHeal().catch(console.error);
}

export { autoHeal, checkDeployment };
