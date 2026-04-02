// Copyright (c) 2026 Ultra-Dex
// tests/test-suite-runner.js

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Test Suite Runner for Ultra-Dex
 * Runs all test suites in sequence
 */
class TestSuiteRunner {
  constructor() {
    this.testSuites = [
      'core/ultra-dex-core.test.js',
      'core/agent-orchestrator.test.js',
      'core/ai-meta-layer.test.js',
      'core/context-meta-manager.test.js',
      'integration/end-to-end.test.js',
      'cli/cli-commands.test.js'
    ];
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0
    };
    this.failedTests = [];
  }

  async runAllTests() {
    console.log('🚀 Starting Ultra-Dex Test Suite...\n');
    console.log(`📅 Run started at: ${new Date().toISOString()}\n`);

    for (const testSuite of this.testSuites) {
      await this.runTestSuite(testSuite);
    }

    this.printSummary();
    return this.results.failed === 0;
  }

  async runTestSuite(suitePath) {
    console.log(`\n🧪 Running test suite: ${suitePath}`);
    console.log('─'.repeat(60));

    try {
      // Run the specific test file
      const testPath = join(__dirname, suitePath);
      const result = await this.runNodeTest(testPath);
      
      console.log(`✅ ${suitePath} completed successfully`);
      this.results.passed += result.passed;
      this.results.failed += result.failed;
      this.results.skipped += result.skipped;
      this.results.total += result.total;
      
      if (result.failed > 0) {
        this.failedTests.push({
          suite: suitePath,
          failures: result.failures
        });
      }
    } catch (error) {
      console.log(`❌ ${suitePath} failed to run:`, error.message);
      this.results.failed++;
      this.results.total++;
      this.failedTests.push({
        suite: suitePath,
        error: error.message
      });
    }
  }

  async runNodeTest(testPath) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', ['--test', testPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          // Parse the test results from output
          const results = this.parseTestResults(output);
          resolve(results);
        } else {
          reject(new Error(`Test exited with code ${code}: ${errorOutput}`));
        }
      });
    });
  }

  parseTestResults(output) {
    // Simple parsing of test results from node --test output
    const lines = output.split('\n');
    const results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      failures: []
    };

    for (const line of lines) {
      if (line.includes('✓')) {
        results.passed++;
        results.total++;
      } else if (line.includes('✗') || line.includes('fail')) {
        results.failed++;
        results.total++;
        if (line.includes('fail')) {
          results.failures.push(line.trim());
        }
      } else if (line.includes('skipped')) {
        results.skipped++;
        results.total++;
      }
    }

    return results;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUITE SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed:  ${this.results.passed}`);
    console.log(`❌ Failed:  ${this.results.failed}`);
    console.log(`⏭️  Skipped: ${this.results.skipped}`);
    console.log(`📊 Total:   ${this.results.total}`);
    console.log('='.repeat(60));

    if (this.failedTests.length > 0) {
      console.log('\n❌ FAILED TESTS DETAILS:');
      for (const failedTest of this.failedTests) {
        console.log(`\n📁 Suite: ${failedTest.suite}`);
        if (failedTest.error) {
          console.log(`   Error: ${failedTest.error}`);
        } else if (failedTest.failures && failedTest.failures.length > 0) {
          for (const failure of failedTest.failures) {
            console.log(`   Failure: ${failure}`);
          }
        }
      }
    }

    const successRate = this.results.total > 0 
      ? ((this.results.passed / this.results.total) * 100).toFixed(2) 
      : 0;
    
    console.log(`\n📈 Success Rate: ${successRate}%`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Ultra-Dex is ready for production! 🚀');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the above details.');
    }
    
    console.log(`\n🏁 Run completed at: ${new Date().toISOString()}`);
  }
}

// Run the test suite if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const runner = new TestSuiteRunner();
  
  runner.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite runner failed:', error);
      process.exit(1);
    });
}

export { TestSuiteRunner };