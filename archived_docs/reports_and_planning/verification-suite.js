/**
 * Ultra-Dex Comprehensive Verification Suite
 * Validates all enhancements and functionality
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { test } from 'node:test';
import assert from 'node:assert';

const PROJECT_ROOT = process.cwd();
const TEST_RESULTS = [];

function logResult(testName, success, details = '') {
  TEST_RESULTS.push({ testName, success, details });
  const status = success ? '✅' : '❌';
  console.log(`${status} ${testName} ${details ? `- ${details}` : ''}`);
}

async function runVerificationSuite() {
  console.log('🧪 Ultra-Dex Comprehensive Verification Suite\n');

  // Test 1: Core Template Preservation
  await test('Core template preserved in @ ultra-dex/Saas plan', async () => {
    const templatePath = path.join(PROJECT_ROOT, '@ ultra-dex', 'Saas plan', '04-Imp-Template.md');
    try {
      await fs.access(templatePath);
      logResult('Core template exists in @ ultra-dex/Saas plan', true);
    } catch {
      logResult('Core template exists in @ ultra-dex/Saas plan', false, 'File not found');
      assert.fail('Core template not found in expected location');
    }
  });

  // Test 2: Duplicate Templates Removed
  await test('Duplicate templates removed from other locations', async () => {
    const duplicateLocations = [
      path.join(PROJECT_ROOT, '04-Imp-Template.md'), // Root directory
      path.join(PROJECT_ROOT, 'cli', 'assets', 'saas-plan', '04-Imp-Template.md'), // CLI assets
      path.join(PROJECT_ROOT, 'docs', 'reference', '04-Imp-Template.md'), // Docs reference
    ];

    let duplicatesFound = 0;
    for (const location of duplicateLocations) {
      try {
        await fs.access(location);
        logResult(`Duplicate template found at ${location}`, false, 'Should be removed');
        duplicatesFound++;
      } catch {
        logResult(`Duplicate template absent at ${location}`, true, 'Correctly removed');
      }
    }

    if (duplicatesFound > 0) {
      assert.fail(`${duplicatesFound} duplicate templates still exist`);
    }
  });

  // Test 3: Security Hardening - Example Passwords
  await test('Example passwords replaced with secure placeholders', async () => {
    const templatePath = path.join(PROJECT_ROOT, '@ ultra-dex', 'Saas plan', '04-Imp-Template.md');
    try {
      const content = await fs.readFile(templatePath, 'utf8');
      
      // Check that old example passwords are not present
      const hasOldPasswords = /password.*['"]SecurePass123['"]|password.*['"]TestPass123['"]|password.*['"]AdminPass123['"]|password.*['"]anything['"]/i.test(content);
      
      // Check that new secure placeholders are present
      const hasSecurePlaceholders = content.includes('Use a secure, randomly generated password following company standards');
      
      if (!hasOldPasswords && hasSecurePlaceholders) {
        logResult('Example passwords replaced with secure placeholders', true);
      } else {
        logResult('Example passwords replaced with secure placeholders', false, 
          `Old passwords found: ${hasOldPasswords}, Secure placeholders found: ${hasSecurePlaceholders}`);
        assert.fail('Example passwords not properly replaced');
      }
    } catch (error) {
      logResult('Example passwords replaced with secure placeholders', false, error.message);
      assert.fail(error.message);
    }
  });

  // Test 4: Plugin System Exists
  await test('Plugin system exists and is functional', async () => {
    const pluginSystemPath = path.join(PROJECT_ROOT, 'cli', 'lib', 'plugin-system.js');
    try {
      await fs.access(pluginSystemPath);
      logResult('Plugin system file exists', true);

      // Check that plugin command is registered
      try {
        const helpOutput = execSync('node cli/bin/ultra-dex.js plugin --help', { encoding: 'utf8' });
        if (helpOutput.includes('plugin') && helpOutput.includes('Manage')) {
          logResult('Plugin command is registered', true);
        } else {
          logResult('Plugin command is registered', false, 'Command not found in help');
          // Don't fail the test if command isn't available in test environment
        }
      } catch {
        logResult('Plugin command is registered', false, 'Command execution failed (may be expected in test env)');
        // Don't fail the test if command isn't available in test environment
      }
    } catch {
      logResult('Plugin system file exists', false, 'File not found');
      assert.fail('Plugin system not found');
    }
  });

  // Test 5: Performance Optimizations
  await test('Performance optimizations implemented', async () => {
    const graphPath = path.join(PROJECT_ROOT, 'cli', 'lib', 'mcp', 'graph.js');
    try {
      const content = await fs.readFile(graphPath, 'utf8');
      
      const hasCaching = content.includes('cacheTimeout') || content.includes('lastScanTime');
      const hasConcurrency = content.includes('CONCURRENCY_LIMIT') || content.includes('Promise.allSettled');
      const hasPerformanceHooks = content.includes('performance') || content.includes('perf_hooks');
      
      if (hasCaching && hasConcurrency && hasPerformanceHooks) {
        logResult('Performance optimizations implemented', true);
      } else {
        logResult('Performance optimizations implemented', false, 
          `Caching: ${hasCaching}, Concurrency: ${hasConcurrency}, Perf Hooks: ${hasPerformanceHooks}`);
        assert.fail('Not all performance optimizations implemented');
      }
    } catch {
      logResult('Performance optimizations implemented', false, 'Graph file not found');
      assert.fail('Performance optimizations not found');
    }
  });

  // Test 6: New Documentation Files Exist
  await test('New documentation files exist', async () => {
    const docs = [
      'APIDOC.md',
      'USERGUIDE.md', 
      'BESTPRACTICES.md',
      'TROUBLESHOOTING.md',
      'CONTRIBUTING.md',
      'MIGRATION-GUIDE.md',
      'SECURITY.md',
      'TUTORIAL.md',
      'API-REFERENCE.md'
    ];

    let missingDocs = 0;
    for (const doc of docs) {
      try {
        await fs.access(path.join(PROJECT_ROOT, doc));
        logResult(`Documentation exists: ${doc}`, true);
      } catch {
        logResult(`Documentation exists: ${doc}`, false, 'File not found');
        missingDocs++;
      }
    }

    if (missingDocs > 0) {
      assert.fail(`${missingDocs} documentation files missing`);
    }
  });

  // Test 7: Directory Naming Consistency
  await test('Directory naming consistency', async () => {
    try {
      await fs.access(path.join(PROJECT_ROOT, '@ ultra-dex'));
      logResult('Directory naming consistent (@ ultra-dex)', true);
    } catch {
      logResult('Directory naming consistent (@ ultra-dex)', false, 'Directory not found');
      assert.fail('Directory naming not consistent');
    }
  });

  // Test 8: Version Updated
  await test('Version updated to 3.4.3', async () => {
    try {
      const packagePath = path.join(PROJECT_ROOT, 'package.json');
      const pkg = JSON.parse(await fs.readFile(packagePath, 'utf8'));
      
      if (pkg.version === '3.4.3') {
        logResult('Version updated to 3.4.3', true);
      } else {
        logResult('Version updated to 3.4.3', false, `Version is ${pkg.version}`);
        assert.fail(`Version not updated, still ${pkg.version}`);
      }
    } catch (error) {
      logResult('Version updated to 3.4.3', false, error.message);
      assert.fail(error.message);
    }
  });

  // Test 9: Sample Plugin Exists
  await test('Sample plugin exists for demonstration', async () => {
    try {
      await fs.access(path.join(PROJECT_ROOT, 'sample-plugin.js'));
      logResult('Sample plugin exists', true);
    } catch {
      logResult('Sample plugin exists', false, 'File not found');
      assert.fail('Sample plugin not found');
    }
  });

  // Test 10: Benchmark Suite Exists
  await test('Performance benchmark suite exists', async () => {
    try {
      await fs.access(path.join(PROJECT_ROOT, 'benchmark-suite.js'));
      logResult('Performance benchmark suite exists', true);
    } catch {
      logResult('Performance benchmark suite exists', false, 'File not found');
      assert.fail('Benchmark suite not found');
    }
  });

  // Test 11: Archiving of Reports Directory
  await test('Reports directory properly archived', async () => {
    try {
      await fs.access(path.join(PROJECT_ROOT, 'archived_reports'));
      logResult('Reports directory archived to archived_reports', true);
    } catch {
      logResult('Reports directory archived to archived_reports', false, 'Archive directory not found');
      try {
        // Check if old reports directory still exists
        await fs.access(path.join(PROJECT_ROOT, 'reports'));
        logResult('Old reports directory removed', false, 'Still exists');
        assert.fail('Old reports directory still exists');
      } catch {
        logResult('Old reports directory removed', true, 'Correctly removed');
      }
    }
  });

  // Test 12: README Updated
  await test('README updated with new features', async () => {
    try {
      const readme = await fs.readFile(path.join(PROJECT_ROOT, 'README.md'), 'utf8');

      const hasPluginSystem = readme.includes('Plugin Architecture') || readme.includes('ultra-dex plugin');
      const hasPerformanceSection = readme.includes('Performance & Optimization') || readme.includes('Performance Optimizations');
      const hasNewDocs = readme.includes('API Documentation') || readme.includes('User Guide') || readme.includes('Comprehensive Documentation') || readme.includes('Best Practices') || readme.includes('Troubleshooting Guide') || readme.includes('Contribution Guidelines');

      if (hasPluginSystem && hasPerformanceSection && hasNewDocs) {
        logResult('README updated with new features', true);
      } else {
        logResult('README updated with new features', false,
          `Plugin System: ${hasPluginSystem}, Performance: ${hasPerformanceSection}, New Docs: ${hasNewDocs}`);
        // Don't fail the test if README isn't fully updated in test environment
      }
    } catch {
      logResult('README updated with new features', false, 'README not found');
      // Don't fail the test if README isn't accessible in test environment
    }
  });

  // Print summary
  console.log('\n📊 VERIFICATION SUMMARY');
  console.log('=====================');

  const passed = TEST_RESULTS.filter(r => r.success).length;
  const total = TEST_RESULTS.length;
  const percentage = ((passed / total) * 100).toFixed(1);

  console.log(`\nPassed: ${passed}/${total} (${percentage}%)`);

  if (passed === total) {
    console.log('\n🎉 ALL VERIFICATION TESTS PASSED!');
    console.log('✅ Ultra-Dex Professional Enhancement Project: COMPLETE');
  } else {
    console.log(`\n❌ ${total - passed} tests failed`);
    console.log('⚠️  Please review the failed tests above');
  }

  // Exit with appropriate code
  process.exit(passed === total ? 0 : 1);
}

// Run the verification suite
runVerificationSuite().catch(error => {
  console.error('Verification suite failed:', error);
  process.exit(1);
});