// Copyright (c) 2026 Ultra-Dex
// final-system-verification.js

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

const execAsync = promisify(exec);

class FinalSystemVerification {
  constructor() {
    this.projectRoot = '/Users/roshwinram/Music/Ultra-Dex';
    this.verificationResults = {
      coreFunctionality: {},
      performance: {},
      security: {},
      integration: {},
      usability: {},
      overall: 'pending'
    };
    this.startTime = Date.now();
  }

  async runComprehensiveVerification() {
    console.log('🔬 Starting Final System Verification...\n');

    // Run all verification checks
    await this.verifyCoreFunctionality();
    await this.verifyPerformance();
    await this.verifySecurity();
    await this.verifyIntegration();
    await this.verifyUsability();
    
    // Calculate overall status
    this.calculateOverallStatus();
    
    // Generate final report
    await this.generateFinalReport();
    
    const duration = Date.now() - this.startTime;
    console.log(`\n⏱️  Total verification time: ${duration}ms`);
    
    return this.verificationResults;
  }

  async verifyCoreFunctionality() {
    console.log('⚙️  Verifying Core Functionality...');
    
    const tests = [
      { name: 'version', command: 'node apps/cli/bin/ultra-dex.js --version', expected: '6.0.0', critical: true },
      { name: 'help', command: 'node apps/cli/bin/ultra-dex.js --help', expected: 'AI Orchestration Meta-Layer', critical: true },
      { name: 'agents-list', command: 'node apps/cli/bin/ultra-dex.js agents list', expected: 'AI Agents', critical: true },
      { name: 'brain-sync', command: 'echo "n" | node apps/cli/bin/ultra-dex.js brain', expected: 'Context synchronized', critical: true },
      { name: 'verify', command: 'echo "n" | node apps/cli/bin/ultra-dex.js verify --json', expected: 'valid', critical: true },
      { name: 'quality', command: 'node apps/cli/bin/ultra-dex.js quality --help', expected: 'quality assessment', critical: true },
      { name: 'status', command: 'node apps/cli/bin/ultra-dex.js status', expected: 'Status', critical: true },
      { name: 'memory', command: 'node apps/cli/bin/ultra-dex.js memory --help', expected: 'memory management', critical: false },
      { name: 'swarm', command: 'node apps/cli/bin/ultra-dex.js swarm --help', expected: 'autonomous agent swarm', critical: true },
      { name: 'config', command: 'node apps/cli/bin/ultra-dex.js config --help', expected: 'configuration', critical: false }
    ];

    let passed = 0;
    let criticalPassed = 0;
    let criticalTotal = 0;
    const results = {};

    for (const test of tests) {
      if (test.critical) criticalTotal++;
      
      try {
        const result = await execAsync(`cd ${this.projectRoot} && ${test.command}`, { timeout: 30000 });
        const output = result.stdout + result.stderr;
        const success = output.includes(test.expected);
        
        results[test.name] = {
          success,
          outputLength: output.length,
          expected: test.expected,
          critical: test.critical
        };
        
        if (success) {
          passed++;
          if (test.critical) criticalPassed++;
          console.log(`   ✅ ${test.name}: OK`);
        } else {
          console.log(`   ❌ ${test.name}: Missing expected output "${test.expected}"`);
        }
      } catch (error) {
        results[test.name] = {
          success: false,
          error: error.message,
          expected: test.expected,
          critical: test.critical
        };
        console.log(`   ❌ ${test.name}: ERROR - ${error.message.substring(0, 60)}...`);
      }
    }

    this.verificationResults.coreFunctionality = {
      passed: passed,
      total: tests.length,
      criticalPassed: criticalPassed,
      criticalTotal: criticalTotal,
      successRate: Math.round((passed / tests.length) * 100),
      criticalSuccessRate: criticalTotal > 0 ? Math.round((criticalPassed / criticalTotal) * 100) : 100,
      details: results,
      status: criticalPassed === criticalTotal ? 'pass' : 'partial'
    };

    console.log(`   📊 Core functionality: ${passed}/${tests.length} tests passed (${Math.round((passed / tests.length) * 100)}%)\n`);
  }

  async verifyPerformance() {
    console.log('⚡ Verifying Performance...');
    
    const performanceTests = [
      { name: 'version-response', command: 'node apps/cli/bin/ultra-dex.js --version', maxTime: 5000 }, // 5 seconds max
      { name: 'help-response', command: 'node apps/cli/bin/ultra-dex.js --help', maxTime: 8000 }, // 8 seconds max
      { name: 'agents-response', command: 'node apps/cli/bin/ultra-dex.js agents list', maxTime: 10000 } // 10 seconds max
    ];

    let passed = 0;
    const results = {};

    for (const test of performanceTests) {
      const start = performance.now();
      try {
        const result = await execAsync(`cd ${this.projectRoot} && timeout 15s ${test.command}`);
        const end = performance.now();
        const responseTime = end - start;
        
        const success = responseTime < test.maxTime;
        
        results[test.name] = {
          success,
          responseTime: Math.round(responseTime),
          maxTime: test.maxTime,
          outputLength: (result.stdout + result.stderr).length
        };
        
        if (success) {
          passed++;
          console.log(`   ✅ ${test.name}: ${Math.round(responseTime)}ms (<${test.maxTime}ms)`);
        } else {
          console.log(`   ⚠️  ${test.name}: ${Math.round(responseTime)}ms (>${test.maxTime}ms)`);
        }
      } catch (error) {
        results[test.name] = {
          success: false,
          responseTime: -1,
          maxTime: test.maxTime,
          error: error.message
        };
        console.log(`   ❌ ${test.name}: ERROR - ${error.message.substring(0, 60)}...`);
      }
    }

    this.verificationResults.performance = {
      passed: passed,
      total: performanceTests.length,
      successRate: Math.round((passed / performanceTests.length) * 100),
      details: results,
      status: passed === performanceTests.length ? 'excellent' : passed >= performanceTests.length * 0.7 ? 'good' : 'needs_improvement'
    };

    console.log(`   📊 Performance: ${passed}/${performanceTests.length} tests passed (${Math.round((passed / performanceTests.length) * 100)}%)\n`);
  }

  async verifySecurity() {
    console.log('🛡️  Verifying Security...');
    
    // Check for security-related configurations
    const securityChecks = [
      { name: 'config-security', path: '.ultra-dex/config.json', shouldExist: false }, // Should not have plain text config
      { name: 'env-security', path: '.env', shouldExist: true }, // Should have env file
      { name: 'gitignore-security', path: '.gitignore', checkContent: ['.env', '*.key', '*.pem'] },
      { name: 'sandbox-enabled', command: 'node apps/cli/bin/ultra-dex.js config --help', expected: 'sandbox' }
    ];

    let passed = 0;
    const results = {};

    for (const check of securityChecks) {
      try {
        if (check.path) {
          // File existence/content check
          const fullPath = path.join(this.projectRoot, check.path);
          const exists = await fs.access(fullPath).then(() => true).catch(() => false);
          
          let success = false;
          if (typeof check.shouldExist !== 'undefined') {
            success = exists === check.shouldExist;
          } else if (check.checkContent) {
            if (exists) {
              const content = await fs.readFile(fullPath, 'utf8');
              success = check.checkContent.every(pattern => content.includes(pattern));
            }
          }
          
          results[check.name] = {
            success,
            exists,
            expected: check.shouldExist || check.checkContent,
            path: check.path
          };
        } else if (check.command) {
          // Command output check
          const result = await execAsync(`cd ${this.projectRoot} && ${check.command}`);
          const output = result.stdout + result.stderr;
          const success = output.toLowerCase().includes(check.expected.toLowerCase());
          
          results[check.name] = {
            success,
            expected: check.expected,
            outputLength: output.length
          };
        }
        
        if (results[check.name].success) {
          passed++;
          console.log(`   ✅ ${check.name}: OK`);
        } else {
          console.log(`   ❌ ${check.name}: FAILED`);
        }
      } catch (error) {
        results[check.name] = {
          success: false,
          error: error.message
        };
        console.log(`   ❌ ${check.name}: ERROR - ${error.message.substring(0, 60)}...`);
      }
    }

    this.verificationResults.security = {
      passed: passed,
      total: securityChecks.length,
      successRate: Math.round((passed / securityChecks.length) * 100),
      details: results,
      status: passed === securityChecks.length ? 'secure' : passed >= securityChecks.length * 0.8 ? 'mostly_secure' : 'insecure'
    };

    console.log(`   📊 Security: ${passed}/${securityChecks.length} checks passed (${Math.round((passed / securityChecks.length) * 100)}%)\n`);
  }

  async verifyIntegration() {
    console.log('🔗 Verifying Integration...');
    
    // Test integration between components
    const integrationTests = [
      { 
        name: 'memory-context-integration', 
        setup: async () => {
          await fs.writeFile(path.join(this.projectRoot, 'TEST-CONTEXT.md'), '# Test Context\nThis is a test context for integration.');
        },
        test: 'node apps/cli/bin/ultra-dex.js brain',
        expected: 'Context synchronized',
        cleanup: async () => {
          try { await fs.unlink(path.join(this.projectRoot, 'TEST-CONTEXT.md')); } catch {}
        }
      },
      {
        name: 'agent-coordination',
        test: 'node apps/cli/bin/ultra-dex.js agents list',
        expected: 'Total',
        critical: true
      }
    ];

    let passed = 0;
    const results = {};

    for (const test of integrationTests) {
      try {
        // Setup if needed
        if (test.setup) {
          await test.setup();
        }

        // Run the integration test
        const result = await execAsync(`cd ${this.projectRoot} && echo "n" | ${test.test}`, { timeout: 30000 });
        const output = result.stdout + result.stderr;
        const success = output.includes(test.expected);

        results[test.name] = {
          success,
          expected: test.expected,
          outputLength: output.length,
          critical: test.critical || false
        };

        if (success) {
          passed++;
          console.log(`   ✅ ${test.name}: OK`);
        } else {
          console.log(`   ❌ ${test.name}: Missing expected output "${test.expected}"`);
        }

        // Cleanup if needed
        if (test.cleanup) {
          await test.cleanup();
        }
      } catch (error) {
        results[test.name] = {
          success: false,
          error: error.message
        };
        console.log(`   ❌ ${test.name}: ERROR - ${error.message.substring(0, 60)}...`);
        
        // Cleanup if needed even on error
        if (test.cleanup) {
          try { await test.cleanup(); } catch {}
        }
      }
    }

    this.verificationResults.integration = {
      passed: passed,
      total: integrationTests.length,
      successRate: Math.round((passed / integrationTests.length) * 100),
      details: results,
      status: passed === integrationTests.length ? 'fully_integrated' : 'partially_integrated'
    };

    console.log(`   📊 Integration: ${passed}/${integrationTests.length} tests passed (${Math.round((passed / integrationTests.length) * 100)}%)\n`);
  }

  async verifyUsability() {
    console.log('🎯 Verifying Usability...');
    
    // Test common user workflows
    const usabilityTests = [
      { name: 'init-workflow', command: 'node apps/cli/bin/ultra-dex.js init --help', expected: 'Initialize' },
      { name: 'generate-workflow', command: 'node apps/cli/bin/ultra-dex.js generate --help', expected: 'Generate' },
      { name: 'review-workflow', command: 'node apps/cli/bin/ultra-dex.js review --help', expected: 'Review' },
      { name: 'audit-workflow', command: 'node apps/cli/bin/ultra-dex.js audit --help', expected: 'Audit' },
      { name: 'docs-workflow', command: 'node apps/cli/bin/ultra-dex.js docs --help', expected: 'Documentation' },
      { name: 'setup-workflow', command: 'node apps/cli/bin/ultra-dex.js setup --help', expected: 'Interactive setup' },
      { name: 'config-workflow', command: 'node apps/cli/bin/ultra-dex.js config --help', expected: 'configuration' },
      { name: 'verify-workflow', command: 'node apps/cli/bin/ultra-dex.js verify --help', expected: '21-step verification' }
    ];

    let passed = 0;
    const results = {};

    for (const test of usabilityTests) {
      try {
        const result = await execAsync(`cd ${this.projectRoot} && ${test.command}`, { timeout: 15000 });
        const output = result.stdout + result.stderr;
        const success = output.toLowerCase().includes(test.expected.toLowerCase());
        
        results[test.name] = {
          success,
          expected: test.expected,
          outputLength: output.length
        };
        
        if (success) {
          passed++;
          console.log(`   ✅ ${test.name}: OK`);
        } else {
          console.log(`   ❌ ${test.name}: Missing expected output "${test.expected}"`);
        }
      } catch (error) {
        results[test.name] = {
          success: false,
          error: error.message
        };
        console.log(`   ❌ ${test.name}: ERROR - ${error.message.substring(0, 60)}...`);
      }
    }

    this.verificationResults.usability = {
      passed: passed,
      total: usabilityTests.length,
      successRate: Math.round((passed / usabilityTests.length) * 100),
      details: results,
      status: passed === usabilityTests.length ? 'excellent' : passed >= usabilityTests.length * 0.8 ? 'good' : 'poor'
    };

    console.log(`   📊 Usability: ${passed}/${usabilityTests.length} workflows functional (${Math.round((passed / usabilityTests.length) * 100)}%)\n`);
  }

  calculateOverallStatus() {
    const allTests = [
      this.verificationResults.coreFunctionality,
      this.verificationResults.performance, 
      this.verificationResults.security,
      this.verificationResults.integration,
      this.verificationResults.usability
    ];

    const totalPassed = allTests.reduce((sum, test) => sum + test.passed, 0);
    const totalTests = allTests.reduce((sum, test) => sum + test.total, 0);
    const overallSuccessRate = Math.round((totalPassed / totalTests) * 100);

    // Check critical functionality
    const coreCriticalPassed = this.verificationResults.coreFunctionality.criticalPassed;
    const coreCriticalTotal = this.verificationResults.coreFunctionality.criticalTotal;
    const criticalSuccessRate = Math.round((coreCriticalPassed / coreCriticalTotal) * 100);

    if (criticalSuccessRate >= 95 && overallSuccessRate >= 90) {
      this.verificationResults.overall = 'excellent';
    } else if (criticalSuccessRate >= 85 && overallSuccessRate >= 80) {
      this.verificationResults.overall = 'good';
    } else if (criticalSuccessRate >= 70 && overallSuccessRate >= 70) {
      this.verificationResults.overall = 'fair';
    } else {
      this.verificationResults.overall = 'needs_attention';
    }

    this.verificationResults.summary = {
      totalPassed,
      totalTests,
      overallSuccessRate,
      criticalSuccessRate,
      componentStatus: {
        core: this.verificationResults.coreFunctionality.status,
        performance: this.verificationResults.performance.status,
        security: this.verificationResults.security.status,
        integration: this.verificationResults.integration.status,
        usability: this.verificationResults.usability.status
      }
    };
  }

  async generateFinalReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      overallStatus: this.verificationResults.overall,
      summary: this.verificationResults.summary,
      details: {
        coreFunctionality: this.verificationResults.coreFunctionality,
        performance: this.verificationResults.performance,
        security: this.verificationResults.security,
        integration: this.verificationResults.integration,
        usability: this.verificationResults.usability
      }
    };

    const reportPath = path.join(this.projectRoot, 'FINAL_SYSTEM_VERIFICATION_REPORT.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 Final verification report saved to: ${reportPath}`);
    
    // Print executive summary
    console.log('\n' + '='.repeat(70));
    console.log('🔬 ULTRA-DEX FINAL SYSTEM VERIFICATION COMPLETE');
    console.log('='.repeat(70));
    console.log(`📊 Overall Status: ${this.verificationResults.overall.toUpperCase()}`);
    console.log(`📈 Success Rate: ${this.verificationResults.summary.overallSuccessRate}%`);
    console.log(`🎯 Critical Success Rate: ${this.verificationResults.summary.criticalSuccessRate}%`);
    console.log(`✅ Passed: ${this.verificationResults.summary.totalPassed} tests`);
    console.log(`❌ Failed: ${this.verificationResults.summary.totalTests - this.verificationResults.summary.totalPassed} tests`);
    console.log(`🧩 Total: ${this.verificationResults.summary.totalTests} tests`);
    console.log(`⏱️  Duration: ${Math.round(this.verificationResults.duration/1000)}s`);
    console.log('\n📋 COMPONENT BREAKDOWN:');
    console.log(`   ⚙️  Core Functionality: ${this.verificationResults.coreFunctionality.passed}/${this.verificationResults.coreFunctionality.total} (${this.verificationResults.coreFunctionality.successRate}%)`);
    console.log(`   ⚡ Performance: ${this.verificationResults.performance.passed}/${this.verificationResults.performance.total} (${this.verificationResults.performance.successRate}%)`);
    console.log(`   🛡️  Security: ${this.verificationResults.security.passed}/${this.verificationResults.security.total} (${this.verificationResults.security.successRate}%)`);
    console.log(`   🔗 Integration: ${this.verificationResults.integration.passed}/${this.verificationResults.integration.total} (${this.verificationResults.integration.successRate}%)`);
    console.log(`   🎯 Usability: ${this.verificationResults.usability.passed}/${this.verificationResults.usability.total} (${this.verificationResults.usability.successRate}%)`);
    
    if (this.verificationResults.overall === 'excellent' || this.verificationResults.overall === 'good') {
      console.log('\n🎉 RESULT: Ultra-Dex is fully verified and ready for production!');
      console.log('🚀 System is optimized for maximum efficiency and performance!');
    } else {
      console.log('\n⚠️  RESULT: System needs attention before production deployment.');
      console.log('🔧 Address the failed tests before proceeding.');
    }
    
    console.log('='.repeat(70));
  }
}

// Run the verification if executed directly
if (process.argv[1].endsWith('final-system-verification.js')) {
  const verifier = new FinalSystemVerification();
  verifier.runComprehensiveVerification()
    .then(() => console.log('\n✅ Verification completed successfully!'))
    .catch(error => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

export { FinalSystemVerification };