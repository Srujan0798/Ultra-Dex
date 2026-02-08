#!/usr/bin/env node

/**
 * Ultra-Dex Version Coordination Script
 * 
 * This script helps agents coordinate version updates across all components
 * ensuring consistency and preventing version conflicts.
 */

import fs from 'fs/promises';
import path from 'path';

const ROOT_DIR = process.cwd();
const MASTER_PACKAGE = path.join(ROOT_DIR, 'package.json');

// Components that must be synchronized with master version
const SYNCED_COMPONENTS = [
  './cli/package.json',
  './extensions/vscode/package.json',
  './apps/desktop/package.json',
  './web/package.json',
  './dashboard/package.json'
];

// Components that have independent versions
const INDEPENDENT_COMPONENTS = [
  './mobile/package.json',
  './sdk/package.json'
];

async function getMasterVersion() {
  try {
    const content = await fs.readFile(MASTER_PACKAGE, 'utf8');
    const pkg = JSON.parse(content);
    return pkg.version;
  } catch (error) {
    throw new Error(`Could not read master version: ${error.message}`);
  }
}

async function updateComponentVersion(componentPath, newVersion) {
  try {
    const fullPath = path.join(ROOT_DIR, componentPath);
    const content = await fs.readFile(fullPath, 'utf8');
    const pkg = JSON.parse(content);
    
    pkg.version = newVersion;
    
    await fs.writeFile(fullPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`✅ Updated ${componentPath} to ${newVersion}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to update ${componentPath}: ${error.message}`);
    return false;
  }
}

async function syncVersions(newVersion) {
  console.log(`🔄 Starting version synchronization to ${newVersion}...`);
  
  // First, update the master version
  try {
    const masterContent = await fs.readFile(MASTER_PACKAGE, 'utf8');
    const masterPkg = JSON.parse(masterContent);
    masterPkg.version = newVersion;
    await fs.writeFile(MASTER_PACKAGE, JSON.stringify(masterPkg, null, 2) + '\n');
    console.log(`✅ Updated master version to ${newVersion}`);
  } catch (error) {
    console.error(`❌ Failed to update master version: ${error.message}`);
    return false;
  }
  
  // Then update all synced components
  let successCount = 0;
  const totalCount = SYNCED_COMPONENTS.length;
  
  for (const component of SYNCED_COMPONENTS) {
    const success = await updateComponentVersion(component, newVersion);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Sync Results: ${successCount}/${totalCount} components updated`);
  
  if (successCount === totalCount) {
    console.log(`🎉 Version synchronization completed successfully!`);
    return true;
  } else {
    console.log(`⚠️  Some components failed to update. Please check manually.`);
    return false;
  }
}

async function checkVersionConsistency() {
  console.log(`🔍 Checking version consistency...`);
  
  const masterVersion = await getMasterVersion();
  console.log(`📋 Master version: ${masterVersion}`);
  
  let inconsistent = [];
  
  for (const component of SYNCED_COMPONENTS) {
    try {
      const fullPath = path.join(ROOT_DIR, component);
      const content = await fs.readFile(fullPath, 'utf8');
      const pkg = JSON.parse(content);
      
      if (pkg.version !== masterVersion) {
        inconsistent.push({
          component,
          version: pkg.version,
          expected: masterVersion
        });
      }
    } catch (error) {
      console.error(`❌ Could not read ${component}: ${error.message}`);
    }
  }
  
  if (inconsistent.length > 0) {
    console.log(`❌ Found ${inconsistent.length} inconsistent components:`);
    inconsistent.forEach(item => {
      console.log(`   ${item.component}: ${item.version} (expected: ${item.expected})`);
    });
    return false;
  } else {
    console.log(`✅ All components are consistent with master version ${masterVersion}`);
    return true;
  }
}

async function showVersionStatus() {
  console.log(`📋 Current Version Status:`);
  console.log(``);
  
  const masterVersion = await getMasterVersion();
  console.log(`🎯 Master Version: ${masterVersion} (${MASTER_PACKAGE})`);
  console.log(``);
  
  console.log(`🔄 Synchronized Components:`);
  for (const component of SYNCED_COMPONENTS) {
    try {
      const fullPath = path.join(ROOT_DIR, component);
      const content = await fs.readFile(fullPath, 'utf8');
      const pkg = JSON.parse(content);
      const status = pkg.version === masterVersion ? '✅' : '❌';
      console.log(`   ${status} ${component}: ${pkg.version}`);
    } catch (error) {
      console.log(`   ❌ ${component}: ERROR - ${error.message}`);
    }
  }
  
  console.log(``);
  console.log(`📦 Independent Components:`);
  for (const component of INDEPENDENT_COMPONENTS) {
    try {
      const fullPath = path.join(ROOT_DIR, component);
      const content = await fs.readFile(fullPath, 'utf8');
      const pkg = JSON.parse(content);
      console.log(`   🏷️  ${component}: ${pkg.version}`);
    } catch (error) {
      console.log(`   ❌ ${component}: ERROR - ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log(`🚀 Ultra-Dex Version Coordination System`);
  console.log(`📍 Coordination Center: ${ROOT_DIR}`);
  console.log(``);
  
  switch (command) {
    case 'sync':
      if (args[1]) {
        await syncVersions(args[1]);
      } else {
        console.log('❌ Usage: node version-coordination.js sync <version>');
        console.log('   Example: node version-coordination.js sync 4.4.0');
      }
      break;
      
    case 'check':
      await checkVersionConsistency();
      break;
      
    case 'status':
      await showVersionStatus();
      break;
      
    case 'help':
    case '--help':
    default:
      console.log('📖 Available Commands:');
      console.log('   node version-coordination.js status  - Show current version status');
      console.log('   node version-coordination.js check   - Check version consistency');
      console.log('   node version-coordination.js sync <version> - Sync all components to version');
      console.log('');
      console.log('🎯 Coordination Center for all Ultra-Dex agents');
      console.log('   Use this script to ensure version consistency across all components');
  }
}

// Run the main function
main().catch(error => {
  console.error(`💥 Coordination system error: ${error.message}`);
  process.exit(1);
});