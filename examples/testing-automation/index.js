#!/usr/bin/env node

/**
 * Ultra-Dex Testing Automation
 * 
 * This example demonstrates how to create an AI-powered testing automation system using Ultra-Dex.
 * The system can generate tests, execute them, and analyze results to improve code quality.
 * 
 * Features:
 * - AI-powered test generation
 * - Multi-type testing (unit, integration, e2e)
 * - Test execution and result analysis
 * - Defect prediction and prevention
 * - Test coverage optimization
 */

import { UltraDex } from '../src/ultradex.js';
import fs from 'fs/promises';
import path from 'path';

class TestingAutomation {
  constructor(config) {
    this.ultraDex = new UltraDex(config.ultraDex);
    
    // Initialize specialized agents
    this.agents = {
      testGenerator: this.ultraDex.createAgent({
        name: 'test-generator',
        role: 'Generates comprehensive tests based on code analysis and requirements',
        tools: ['code-analyzer', 'requirement-parser', 'edge-case-identifier', 'test-pattern-library']
      }),
      
      testExecutor: this.ultraDex.createAgent({
        name: 'test-executor',
        role: 'Executes tests and reports results with detailed analysis',
        tools: ['test-runner', 'result-analyzer', 'performance-tracker', 'flaky-test-detector']
      }),
      
      defectPredictor: this.ultraDex.createAgent({
        name: 'defect-predictor',
        role: 'Predicts potential defects and suggests preventive measures',
        tools: ['pattern-analyzer', 'risk-assessor', 'historical-data-analyzer', 'defect-classifier']
      }),
      
      coverageOptimizer: this.ultraDex.createAgent({
        name: 'coverage-optimizer',
        role: 'Analyzes test coverage and suggests improvements',
        tools: ['coverage-analyzer', 'gap-identifier', 'priority-scheduler', 'duplication-detector']
      }),
      
      testMaintainer: this.ultraDex.createAgent({
        name: 'test-maintainer',
        role: 'Maintains and updates tests as code evolves',
        tools: ['change-detector', 'test-updater', 'regression-analyzer', 'maintenance-prioritizer']
      })
    };
    
    this.testSuites = [];
    this.testResults = [];
    this.defectPredictions = [];
  }

  /**
   * Generate tests for source code
   */
  async generateTests(sourcePath, options = {}) {
    try {
      // Read source code
      const code = await fs.readFile(sourcePath, 'utf8');
      
      // Analyze code and generate tests
      const testGeneration = await this.agents.testGenerator.execute({
        code,
        language: this.detectLanguage(sourcePath),
        filePath: sourcePath,
        testType: options.type || 'unit',
        targetCoverage: options.targetCoverage || 80,
        includeEdgeCases: options.includeEdgeCases !== false,
        includeIntegration: options.includeIntegration || false
      });
      
      // Create test suite object
      const testSuite = {
        id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sourcePath,
        tests: testGeneration.tests,
        language: this.detectLanguage(sourcePath),
        type: options.type || 'unit',
        createdAt: new Date().toISOString(),
        metadata: {
          testCount: testGeneration.tests.length,
          estimatedCoverage: testGeneration.estimatedCoverage,
          complexity: testGeneration.complexity,
          riskLevel: testGeneration.riskLevel
        }
      };
      
      this.testSuites.push(testSuite);
      return testSuite;
      
    } catch (error) {
      console.error('Error generating tests:', error);
      throw error;
    }
  }

  /**
   * Execute tests
   */
  async executeTests(testSuiteId, options = {}) {
    try {
      const testSuite = this.testSuites.find(ts => ts.id === testSuiteId);
      if (!testSuite) {
        throw new Error('Test suite not found');
      }
      
      // Execute tests
      const executionResult = await this.agents.testExecutor.execute({
        tests: testSuite.tests,
        testFramework: options.framework || this.getDefaultFramework(testSuite.language),
        environment: options.environment || 'development',
        parallel: options.parallel !== false,
        timeout: options.timeout || 30000
      });
      
      // Create test result object
      const testResult = {
        id: `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        testSuiteId,
        results: executionResult.results,
        summary: executionResult.summary,
        executedAt: new Date().toISOString(),
        metadata: {
          passed: executionResult.summary.passed,
          failed: executionResult.summary.failed,
          skipped: executionResult.summary.skipped,
          duration: executionResult.summary.duration,
          coverage: executionResult.coverage
        }
      };
      
      this.testResults.push(testResult);
      return testResult;
      
    } catch (error) {
      console.error('Error executing tests:', error);
      throw error;
    }
  }

  /**
   * Predict potential defects
   */
  async predictDefects(sourcePath, options = {}) {
    try {
      // Read source code
      const code = await fs.readFile(sourcePath, 'utf8');
      
      // Predict defects
      const prediction = await this.agents.defectPredictor.execute({
        code,
        language: this.detectLanguage(sourcePath),
        filePath: sourcePath,
        historicalData: options.historicalData || [],
        changeType: options.changeType || 'enhancement',
        complexityThreshold: options.complexityThreshold || 5
      });
      
      // Create defect prediction object
      const defectPrediction = {
        id: `defect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sourcePath,
        predictions: prediction.predictions,
        riskScore: prediction.riskScore,
        recommendations: prediction.recommendations,
        analyzedAt: new Date().toISOString(),
        metadata: {
          highRiskAreas: prediction.highRiskAreas,
          defectProbability: prediction.defectProbability,
          suggestedTests: prediction.suggestedTests
        }
      };
      
      this.defectPredictions.push(defectPrediction);
      return defectPrediction;
      
    } catch (error) {
      console.error('Error predicting defects:', error);
      throw error;
    }
  }

  /**
   * Optimize test coverage
   */
  async optimizeCoverage(testSuiteId, options = {}) {
    try {
      const testSuite = this.testSuites.find(ts => ts.id === testSuiteId);
      if (!testSuite) {
        throw new Error('Test suite not found');
      }
      
      // Get latest test results
      const latestResult = this.testResults
        .filter(tr => tr.testSuiteId === testSuiteId)
        .sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt))[0];
      
      // Optimize coverage
      const optimization = await this.agents.coverageOptimizer.execute({
        testSuite: testSuite,
        currentCoverage: latestResult?.metadata.coverage || 0,
        targetCoverage: options.targetCoverage || 90,
        uncoveredAreas: latestResult?.coverageDetails?.uncovered || [],
        codeComplexity: testSuite.metadata.complexity
      });
      
      // Update test suite with optimized tests
      testSuite.tests = [...testSuite.tests, ...optimization.additionalTests];
      testSuite.metadata.optimized = true;
      testSuite.metadata.optimizedAt = new Date().toISOString();
      
      return {
        testSuiteId,
        additionalTests: optimization.additionalTests,
        expectedCoverageImprovement: optimization.expectedCoverageImprovement,
        recommendations: optimization.recommendations
      };
      
    } catch (error) {
      console.error('Error optimizing coverage:', error);
      throw error;
    }
  }

  /**
   * Maintain tests after code changes
   */
  async maintainTests(sourcePath, changeDescription, options = {}) {
    try {
      // Read updated source code
      const updatedCode = await fs.readFile(sourcePath, 'utf8');
      
      // Analyze changes and update tests
      const maintenance = await this.agents.testMaintainer.execute({
        sourcePath,
        changeDescription,
        updatedCode,
        affectedTests: this.getAffectedTests(sourcePath),
        testSuites: this.testSuites.filter(ts => ts.sourcePath === sourcePath)
      });
      
      // Update affected test suites
      for (const update of maintenance.testUpdates) {
        const testSuite = this.testSuites.find(ts => ts.id === update.testSuiteId);
        if (testSuite) {
          testSuite.tests = update.updatedTests;
          testSuite.metadata.lastMaintained = new Date().toISOString();
        }
      }
      
      return {
        sourcePath,
        changesApplied: maintenance.changesApplied,
        testsUpdated: maintenance.testsUpdated,
        newTestsAdded: maintenance.newTestsAdded,
        deprecatedTests: maintenance.deprecatedTests
      };
      
    } catch (error) {
      console.error('Error maintaining tests:', error);
      throw error;
    }
  }

  /**
   * Run complete testing cycle
   */
  async runTestingCycle(sourcePath, options = {}) {
    const cycleResult = {
      sourcePath,
      stages: {},
      completedAt: new Date().toISOString()
    };
    
    try {
      // 1. Predict defects
      cycleResult.stages.defectPrediction = await this.predictDefects(sourcePath, options);
      
      // 2. Generate tests
      const testSuite = await this.generateTests(sourcePath, {
        ...options,
        targetCoverage: cycleResult.stages.defectPrediction.metadata.suggestedTests?.coverage || 80
      });
      cycleResult.stages.testGeneration = testSuite;
      
      // 3. Execute tests
      const testResult = await this.executeTests(testSuite.id, options);
      cycleResult.stages.testExecution = testResult;
      
      // 4. Optimize coverage
      const coverageOptimization = await this.optimizeCoverage(testSuite.id, options);
      cycleResult.stages.coverageOptimization = coverageOptimization;
      
      // 5. Execute optimized tests
      const optimizedResult = await this.executeTests(testSuite.id, options);
      cycleResult.stages.optimizedExecution = optimizedResult;
      
      return cycleResult;
      
    } catch (error) {
      console.error('Error in testing cycle:', error);
      cycleResult.error = error.message;
      return cycleResult;
    }
  }

  /**
   * Detect programming language from file extension
   */
  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'javascript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.cpp': 'c++',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala'
    };
    
    return languageMap[ext] || 'unknown';
  }

  /**
   * Get default test framework for language
   */
  getDefaultFramework(language) {
    const frameworkMap = {
      javascript: 'jest',
      typescript: 'jest',
      python: 'pytest',
      java: 'junit',
      go: 'go-test',
      rust: 'cargo-test',
      cplusplus: 'gtest',
      csharp: 'mstest',
      php: 'phpunit',
      ruby: 'rspec'
    };
    
    return frameworkMap[language] || 'default';
  }

  /**
   * Get tests affected by a source file change
   */
  getAffectedTests(sourcePath) {
    return this.testSuites.filter(ts => ts.sourcePath === sourcePath);
  }

  /**
   * Get testing statistics
   */
  getStats() {
    const totalTestSuites = this.testSuites.length;
    const totalTests = this.testSuites.reduce((sum, ts) => sum + ts.metadata.testCount, 0);
    const totalExecutions = this.testResults.length;
    const totalPassed = this.testResults.reduce((sum, tr) => sum + tr.metadata.passed, 0);
    const totalFailed = this.testResults.reduce((sum, tr) => sum + tr.metadata.failed, 0);
    
    const passRate = totalExecutions > 0 ? (totalPassed / (totalPassed + totalFailed)) * 100 : 0;
    
    const byLanguage = this.testSuites.reduce((acc, ts) => {
      const lang = ts.language || 'unknown';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});
    
    const byType = this.testSuites.reduce((acc, ts) => {
      const type = ts.type || 'unit';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalTestSuites,
      totalTests,
      totalExecutions,
      totalPassed,
      totalFailed,
      passRate,
      byLanguage,
      byType,
      defectPredictions: this.defectPredictions.length,
      coverageOptimizations: this.testSuites.filter(ts => ts.metadata.optimized).length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Export test results
   */
  async exportResults(format = 'json', outputPath) {
    const results = {
      testSuites: this.testSuites,
      testResults: this.testResults,
      defectPredictions: this.defectPredictions,
      stats: this.getStats(),
      exportedAt: new Date().toISOString()
    };
    
    if (format === 'json') {
      await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
    } else if (format === 'junit') {
      // Convert to JUnit XML format
      const junitXml = this.convertToJUnit(results);
      await fs.writeFile(outputPath, junitXml);
    } else if (format === 'html') {
      // Generate HTML report
      const htmlReport = this.generateHtmlReport(results);
      await fs.writeFile(outputPath, htmlReport);
    }
    
    return { success: true, outputPath, format };
  }

  /**
   * Convert results to JUnit XML format (simplified)
   */
  convertToJUnit(results) {
    // Simplified JUnit XML generation
    // In a real implementation, this would generate proper JUnit XML
    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="${results.stats.totalTests}" failures="${results.stats.totalFailed}">
  <testsuite name="Ultra-Dex Test Suite" tests="${results.stats.totalTests}" failures="${results.stats.totalFailed}">
    <!-- Test cases would go here -->
  </testsuite>
</testsuites>`;
  }

  /**
   * Generate HTML report (simplified)
   */
  generateHtmlReport(results) {
    // Simplified HTML report generation
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Ultra-Dex Testing Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .stats { background: #f5f5f5; padding: 15px; border-radius: 5px; }
    .test-result { margin: 10px 0; padding: 10px; border-left: 4px solid #ccc; }
    .passed { border-left-color: #4CAF50; }
    .failed { border-left-color: #f44336; }
  </style>
</head>
<body>
  <h1>Ultra-Dex Testing Report</h1>
  <div class="stats">
    <h2>Statistics</h2>
    <p>Total Test Suites: ${results.stats.totalTestSuites}</p>
    <p>Total Tests: ${results.stats.totalTests}</p>
    <p>Pass Rate: ${results.stats.passRate.toFixed(2)}%</p>
    <p>Defect Predictions: ${results.stats.defectPredictions}</p>
  </div>
  <h2>Recent Test Results</h2>
  ${results.testResults.slice(0, 5).map(result => `
    <div class="test-result ${result.metadata.failed > 0 ? 'failed' : 'passed'}">
      <h3>Test Suite: ${result.testSuiteId}</h3>
      <p>Executed: ${result.executedAt}</p>
      <p>Passed: ${result.metadata.passed}, Failed: ${result.metadata.failed}</p>
    </div>
  `).join('')}
</body>
</html>`;
  }
}

// Example usage
async function main() {
  const testingAutomation = new TestingAutomation({
    ultraDex: {
      apiKey: process.env.ULTRA_DEX_API_KEY,
      endpoint: process.env.ULTRA_DEX_ENDPOINT || 'https://api.ultra-dex.ai'
    }
  });
  
  // Example of how to use the testing automation
  try {
    console.log('Testing automation system initialized. Use runTestingCycle() to run a complete testing cycle.');
    
    // Example of running a testing cycle (would need actual source file):
    /*
    const result = await testingAutomation.runTestingCycle('./path/to/source/file.js', {
      type: 'unit',
      targetCoverage: 90,
      includeEdgeCases: true
    });
    
    console.log('Testing cycle completed:', result);
    */
    
    // Print testing statistics
    console.log('Testing Stats:', testingAutomation.getStats());
  } catch (error) {
    console.error('Error in main:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default TestingAutomation;