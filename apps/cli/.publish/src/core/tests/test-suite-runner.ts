import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
class TestSuiteRunner {
  constructor() {
    this.testSuites = [
      'core/ultra-dex-core.test.js',
      'core/agent-orchestrator.test.js',
      'core/ai-meta-layer.test.js',
      'core/context-meta-manager.test.js',
      'integration/end-to-end.test.js',
      'cli/cli-commands.test.js',
    ];
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
    };
    this.failedTests = [];
  }
  async runAllTests() {
    console.log('\u{1F680} Starting Ultra-Dex Test Suite...\n');
    console.log(`\u{1F4C5} Run started at: ${/* @__PURE__ */ new Date().toISOString()}
`);
    for (const testSuite of this.testSuites) {
      await this.runTestSuite(testSuite);
    }
    this.printSummary();
    return this.results.failed === 0;
  }
  async runTestSuite(suitePath) {
    console.log(`
\u{1F9EA} Running test suite: ${suitePath}`);
    console.log('\u2500'.repeat(60));
    try {
      const testPath = join(__dirname, suitePath);
      const result = await this.runNodeTest(testPath);
      console.log(`\u2705 ${suitePath} completed successfully`);
      this.results.passed += result.passed;
      this.results.failed += result.failed;
      this.results.skipped += result.skipped;
      this.results.total += result.total;
      if (result.failed > 0) {
        this.failedTests.push({
          suite: suitePath,
          failures: result.failures,
        });
      }
    } catch (error) {
      console.log(`\u274C ${suitePath} failed to run:`, error.message);
      this.results.failed++;
      this.results.total++;
      this.failedTests.push({
        suite: suitePath,
        error: error.message,
      });
    }
  }
  async runNodeTest(testPath) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', ['--test', testPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' },
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
          const results = this.parseTestResults(output);
          resolve(results);
        } else {
          reject(new Error(`Test exited with code ${code}: ${errorOutput}`));
        }
      });
    });
  }
  parseTestResults(output) {
    const lines = output.split('\n');
    const results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      failures: [],
    };
    for (const line of lines) {
      if (line.includes('\u2713')) {
        results.passed++;
        results.total++;
      } else if (line.includes('\u2717') || line.includes('fail')) {
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
    console.log('\u{1F4CA} TEST SUITE SUMMARY');
    console.log('='.repeat(60));
    console.log(`\u2705 Passed:  ${this.results.passed}`);
    console.log(`\u274C Failed:  ${this.results.failed}`);
    console.log(`\u23ED\uFE0F  Skipped: ${this.results.skipped}`);
    console.log(`\u{1F4CA} Total:   ${this.results.total}`);
    console.log('='.repeat(60));
    if (this.failedTests.length > 0) {
      console.log('\n\u274C FAILED TESTS DETAILS:');
      for (const failedTest of this.failedTests) {
        console.log(`
\u{1F4C1} Suite: ${failedTest.suite}`);
        if (failedTest.error) {
          console.log(`   Error: ${failedTest.error}`);
        } else if (failedTest.failures && failedTest.failures.length > 0) {
          for (const failure of failedTest.failures) {
            console.log(`   Failure: ${failure}`);
          }
        }
      }
    }
    const successRate =
      this.results.total > 0 ? ((this.results.passed / this.results.total) * 100).toFixed(2) : 0;
    console.log(`
\u{1F4C8} Success Rate: ${successRate}%`);
    if (this.results.failed === 0) {
      console.log('\n\u{1F389} ALL TESTS PASSED! Ultra-Dex is ready for production! \u{1F680}');
    } else {
      console.log('\n\u26A0\uFE0F  Some tests failed. Please review the above details.');
    }
    console.log(`
\u{1F3C1} Run completed at: ${/* @__PURE__ */ new Date().toISOString()}`);
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const runner = new TestSuiteRunner();
  runner
    .runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test suite runner failed:', error);
      process.exit(1);
    });
}
export { TestSuiteRunner };
