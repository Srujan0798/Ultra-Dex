/**
 * Main Test Runner for Ultra-Dex
 * Executes all test suites and provides comprehensive reporting
 */

import { runTests as runSecurityTests } from './security-tests.js';
import { runPerformanceTests as runPerfTests } from './performance-tests.js';
import { runSwarmTests as runSwarmIntegrationTests } from './swarm-tests.js';
import { runSystemTests as runSystemIntegrationTests } from './system-tests.js';

// Import node:test for structured testing (Node.js 18+)
import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

// Test results tracker
class TestReporter {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      suites: []
    };
  }

  addSuite(name, passed, details = {}) {
    this.results.suites.push({
      name,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
    
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
  }

  getSummary() {
    const total = this.results.passed + this.results.failed;
    const passRate = total > 0 ? (this.results.passed / total) * 100 : 0;
    
    return {
      ...this.results,
      total,
      passRate: passRate.toFixed(1) + '%',
      success: this.results.failed === 0
    };
  }

  printSummary() {
    const summary = this.getSummary();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RUNNER SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Suites: ${summary.total}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Success Rate: ${summary.passRate}`);
    console.log('='.repeat(60));
    
    if (summary.success) {
      console.log('🎉 ALL TESTS PASSED! System is healthy.');
    } else {
      console.log('❌ SOME TESTS FAILED! Please review the issues.');
    }
    
    console.log('\n📋 Suite Details:');
    for (const suite of this.results.suites) {
      const status = suite.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status} ${suite.name}`);
    }
    
    console.log('='.repeat(60));
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Ultra-Dex Test Suite Runner');
  console.log('Running comprehensive tests for all system components...\n');
  
  const reporter = new TestReporter();
  
  try {
    // Run Security Tests
    console.log('🔒 Running Security Tests...');
    try {
      await runSecurityTests();
      reporter.addSuite('Security Tests', true);
    } catch (error) {
      console.error('❌ Security Tests Failed:', error.message);
      reporter.addSuite('Security Tests', false, { error: error.message });
    }
    
    // Run Performance Tests
    console.log('\n⏱️  Running Performance Tests...');
    try {
      await runPerfTests();
      reporter.addSuite('Performance Tests', true);
    } catch (error) {
      console.error('❌ Performance Tests Failed:', error.message);
      reporter.addSuite('Performance Tests', false, { error: error.message });
    }
    
    // Run Swarm Integration Tests
    console.log('\n🤖 Running Swarm Integration Tests...');
    try {
      await runSwarmIntegrationTests();
      reporter.addSuite('Swarm Integration Tests', true);
    } catch (error) {
      console.error('❌ Swarm Integration Tests Failed:', error.message);
      reporter.addSuite('Swarm Integration Tests', false, { error: error.message });
    }
    
    // Run System Integration Tests
    console.log('\n🏗️  Running System Integration Tests...');
    try {
      await runSystemIntegrationTests();
      reporter.addSuite('System Integration Tests', true);
    } catch (error) {
      console.error('❌ System Integration Tests Failed:', error.message);
      reporter.addSuite('System Integration Tests', false, { error: error.message });
    }
    
    // Print final summary
    reporter.printSummary();
    
    // Exit with appropriate code
    process.exit(reporter.getSummary().success ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Critical Error in Test Runner:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests().catch(console.error);
}

// Export for module usage
export { runAllTests, TestReporter };

// Also export individual runners
export { 
  runSecurityTests, 
  runPerfTests, 
  runSwarmIntegrationTests, 
  runSystemIntegrationTests 
};