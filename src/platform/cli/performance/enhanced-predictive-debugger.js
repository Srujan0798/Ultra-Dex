// Copyright (c) 2026 Ultra-Dex

/**
 * Enhanced Predictive Debugging System
 * Advanced static analysis and predictive bug detection
 */

import EventEmitter from 'events';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { performance } from 'perf_hooks';

/**
 * Enhanced CodePattern with more detailed analysis
 */
export class EnhancedCodePattern {
  constructor(type, location, confidence, details = {}, severity = 'medium') {
    this.id = crypto.randomUUID();
    this.type = type; // 'bug-prone', 'performance', 'security', 'maintainability'
    this.location = location; // { file, line, column }
    this.confidence = confidence; // 0-1
    this.severity = severity; // 'critical', 'high', 'medium', 'low'
    this.details = details;
    this.timestamp = Date.now();
    this.resolved = false;
    this.priority = this.calculatePriority();
  }

  calculatePriority() {
    const severityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
    return this.confidence * severityWeights[this.severity];
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      location: this.location,
      confidence: this.confidence,
      severity: this.severity,
      details: this.details,
      timestamp: this.timestamp,
      resolved: this.resolved,
      priority: this.priority,
    };
  }
}

/**
 * Enhanced BugPrediction with ML-based confidence scoring
 */
export class EnhancedBugPrediction {
  constructor(pattern, severity, description, fix = null, probability = 0.5) {
    this.id = crypto.randomUUID();
    this.pattern = pattern;
    this.severity = severity; // 'critical', 'high', 'medium', 'low'
    this.description = description;
    this.fix = fix;
    this.probability = probability; // Estimated probability of occurrence
    this.timestamp = Date.now();
    this.validated = false;
    this.occurred = false;
    this.falsePositive = false;
  }

  toJSON() {
    return {
      id: this.id,
      pattern: this.pattern.toJSON(),
      severity: this.severity,
      description: this.description,
      fix: this.fix,
      probability: this.probability,
      timestamp: this.timestamp,
      validated: this.validated,
      occurred: this.occurred,
      falsePositive: this.falsePositive,
    };
  }
}

/**
 * Advanced Static Analyzer
 */
class StaticAnalyzer {
  constructor() {
    this.patterns = this.loadAnalysisPatterns();
  }

  loadAnalysisPatterns() {
    return {
      // Security patterns
      security: [
        {
          name: 'hardcoded_secret',
          regex: /(password|secret|token|key|api_key|credential)\s*[:=]\s*["'][^"']{8,}["']/gi,
          severity: 'critical',
          confidence: 0.95,
          message: 'Hardcoded secret detected',
          fix: 'Move secrets to environment variables'
        },
        {
          name: 'sql_injection',
          regex: /(?:query|execute|sql)\s*[+=]\s*["'`][^"'`]*\+[^"'`]*["'`]/gi,
          severity: 'critical',
          confidence: 0.9,
          message: 'Potential SQL injection',
          fix: 'Use parameterized queries'
        },
        {
          name: 'xss_vulnerability',
          regex: /\.innerHTML\s*=/g,
          severity: 'high',
          confidence: 0.85,
          message: 'Potential XSS vulnerability',
          fix: 'Use textContent or sanitize inputs'
        },
        {
          name: 'eval_usage',
          regex: /\beval\s*\(/g,
          severity: 'high',
          confidence: 0.95,
          message: 'Dangerous eval() usage',
          fix: 'Avoid eval() or use safer alternatives'
        }
      ],
      // Bug-prone patterns
      bugProne: [
        {
          name: 'empty_catch_block',
          regex: /catch\s*\([^)]*\)\s*\{\s*\}/g,
          severity: 'high',
          confidence: 0.9,
          message: 'Empty catch block',
          fix: 'Add error handling or logging'
        },
        {
          name: 'potential_null_access',
          regex: /\.[a-zA-Z_$][\w$]*\s*\(/g,
          severity: 'medium',
          confidence: 0.7,
          message: 'Potential null/undefined access',
          fix: 'Add null checks or use optional chaining'
        },
        {
          name: 'infinite_loop',
          regex: /while\s*\(\s*(true|1)\s*\)/g,
          severity: 'high',
          confidence: 0.8,
          message: 'Potential infinite loop',
          fix: 'Add break conditions'
        },
        {
          name: 'memory_leak',
          regex: /setInterval\(/g,
          severity: 'medium',
          confidence: 0.6,
          message: 'Potential memory leak (setInterval without clearInterval)',
          fix: 'Store interval ID and clear when component unmounts'
        }
      ],
      // Performance patterns
      performance: [
        {
          name: 'inefficient_loop',
          regex: /for\s*\(\s*var\s+\w+\s+in\s+\w+\s*\)/g,
          severity: 'medium',
          confidence: 0.7,
          message: 'Inefficient for...in loop on arrays',
          fix: 'Use for...of or traditional for loop for arrays'
        },
        {
          name: 'sync_operation',
          regex: /\.(readFileSync|writeFileSync|execSync|spawnSync)/g,
          severity: 'medium',
          confidence: 0.8,
          message: 'Synchronous operation in async context',
          fix: 'Use async alternatives'
        },
        {
          name: 'large_object_creation',
          regex: /new Array\([0-9]{4,}\)/g,
          severity: 'medium',
          confidence: 0.6,
          message: 'Large object/array creation',
          fix: 'Consider lazy initialization or pagination'
        }
      ],
      // Maintainability patterns
      maintainability: [
        {
          name: 'console_log',
          regex: /console\.(log|warn|error|debug)\s*\(/g,
          severity: 'low',
          confidence: 0.5,
          message: 'Console statement in production code',
          fix: 'Use proper logging framework'
        },
        {
          name: 'magic_number',
          regex: /[^a-zA-Z_$]([0-9]{4,}|0[xX][0-9a-fA-F]{5,}|0[oO][0-7]{5,}|0[bB][01]{10,})[^a-zA-Z_$]/g,
          severity: 'low',
          confidence: 0.4,
          message: 'Magic number detected',
          fix: 'Assign to named constant'
        },
        {
          name: 'long_function',
          regex: null, // Special case - analyzed by line count
          severity: 'medium',
          confidence: 0.6,
          message: 'Function too long (>50 lines)',
          fix: 'Split into smaller functions'
        }
      ]
    };
  }

  async analyzeFile(filePath, content) {
    const startTime = performance.now();
    const patterns = [];

    // Analyze for each pattern category
    for (const [category, categoryPatterns] of Object.entries(this.patterns)) {
      for (const pattern of categoryPatterns) {
        if (pattern.regex) {
          let match;
          while ((match = pattern.regex.exec(content)) !== null) {
            const lines = content.substring(0, match.index).split('\n');
            const lineNum = lines.length;
            const colNum = lines[lineNum - 1].length - (lines[lineNum - 1].length - match.index + content.lastIndexOf('\n', match.index - 1));

            patterns.push(new EnhancedCodePattern(
              category,
              { file: filePath, line: lineNum, column: colNum },
              pattern.confidence,
              {
                issue: pattern.name,
                message: pattern.message,
                code: match[0].substring(0, 100) + (match[0].length > 100 ? '...' : ''),
                category
              },
              pattern.severity
            ));
          }
        }
      }
    }

    // Special analysis for long functions
    const lines = content.split('\n');
    let currentFunction = null;
    let functionStartLine = 0;
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect function start
      if (line.match(/^(function|const|let|var|class)\s+\w+\s*(=|\(|\s)/) && line.includes('{')) {
        currentFunction = line;
        functionStartLine = i;
        braceDepth = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      } else if (currentFunction) {
        braceDepth += (line.match(/{/g) || []).length;
        braceDepth -= (line.match(/}/g) || []).length;

        if (braceDepth <= 0) {
          // End of function
          if (i - functionStartLine > 50) { // More than 50 lines
            patterns.push(new EnhancedCodePattern(
              'maintainability',
              { file: filePath, line: functionStartLine + 1, column: 0 },
              0.6,
              {
                issue: 'long_function',
                message: 'Function too long (>50 lines)',
                code: currentFunction.substring(0, 100),
                lines: i - functionStartLine
              },
              'medium'
            ));
          }
          currentFunction = null;
        }
      }
    }

    const analysisTime = performance.now() - startTime;
    return { patterns, analysisTime, fileSize: content.length };
  }
}

/**
 * Machine Learning Predictor for bug probability
 */
class MLPredictor {
  constructor() {
    // Historical data for ML model (simplified version)
    this.model = {
      weights: {
        severity: { critical: 0.9, high: 0.7, medium: 0.5, low: 0.3 },
        confidence: 1.0,
        context: 0.2, // Weight for contextual factors
      },
      bias: 0.1
    };
  }

  predictBugProbability(pattern, context = {}) {
    // Simplified ML prediction model
    const severityWeight = this.model.weights.severity[pattern.severity] || 0.5;
    const confidenceWeight = pattern.confidence;
    const contextWeight = this.model.weights.context;

    // Contextual factors that affect probability
    let contextFactor = 1.0;
    if (context.inHotPath) contextFactor *= 1.5; // Hot code paths
    if (context.complexity > 10) contextFactor *= 1.2; // Complex functions
    if (context.churn > 5) contextFactor *= 1.3; // Frequently changed code

    // Calculate probability
    const rawScore = (severityWeight * 0.4) + (confidenceWeight * 0.4) + (contextFactor * 0.2);
    const probability = Math.min(0.99, Math.max(0.01, rawScore)); // Clamp between 0.01 and 0.99

    return probability;
  }
}

/**
 * Enhanced Predictive Debugger
 */
export class EnhancedPredictiveDebugger extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      watchPatterns: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
      ignorePatterns: ['**/node_modules/**', '**/*.test.js', '**/coverage/**', '**/dist/**', '**/build/**'],
      enableBackgroundAnalysis: true,
      analysisInterval: 30000, // Reduced from default for better responsiveness
      maxConcurrentAnalyses: 4, // Limit concurrent analyses
      ...options,
    };

    this.analyzer = new StaticAnalyzer();
    this.mlPredictor = new MLPredictor();
    this.predictions = new Map(); // predictionId -> EnhancedBugPrediction
    this.patterns = new Map(); // patternId -> EnhancedCodePattern
    this.fileHashes = new Map(); // filePath -> hash
    this.isRunning = false;
    this.watcher = null;
    this.analysisQueue = [];
    this.activeAnalyses = 0;
    this.maxAnalyses = this.options.maxConcurrentAnalyses;
  }

  /**
   * Start the enhanced predictive debugger
   */
  async start(projectPath) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.projectPath = projectPath;

    // Initial scan
    await this.scanProject();

    // Start file watcher if enabled
    if (this.options.enableBackgroundAnalysis) {
      this.startWatcher();
    }

    this.emit('started', { projectPath });
  }

  /**
   * Stop the enhanced predictive debugger
   */
  async stop() {
    this.isRunning = false;

    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    this.emit('stopped');
  }

  /**
   * Scan entire project for issues with enhanced analysis
   */
  async scanProject() {
    const startTime = performance.now();
    const files = await this.getProjectFiles();
    const allPatterns = [];

    // Process files in batches to manage memory and performance
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      // Process batch in parallel but limit concurrency
      const batchPromises = batch.map(async (filePath) => {
        if (this.activeAnalyses >= this.maxAnalyses) {
          // Wait if we've hit the concurrency limit
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.activeAnalyses++;
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const fileHash = this.calculateHash(content);

          // Skip if file hasn't changed
          if (this.fileHashes.has(filePath) && this.fileHashes.get(filePath) === fileHash) {
            return [];
          }

          this.fileHashes.set(filePath, fileHash);
          const result = await this.analyzer.analyzeFile(filePath, content);
          allPatterns.push(...result.patterns);

          // Emit progress update
          this.emit('file:analyzed', {
            filePath,
            patternCount: result.patterns.length,
            analysisTime: result.analysisTime
          });

          return result.patterns;
        } finally {
          this.activeAnalyses--;
        }
      });

      await Promise.all(batchPromises);
    }

    // Generate predictions from patterns
    for (const pattern of allPatterns) {
      const probability = this.mlPredictor.predictBugProbability(pattern);
      const prediction = new EnhancedBugPrediction(
        pattern,
        pattern.severity,
        `Predicted issue in ${pattern.location.file}:${pattern.location.line} - ${pattern.details.message}`,
        this.generateFix(pattern),
        probability
      );

      this.addPrediction(prediction);
    }

    const scanTime = performance.now() - startTime;
    this.emit('scan:complete', {
      fileCount: files.length,
      patternCount: allPatterns.length,
      scanTime
    });
  }

  /**
   * Get list of project files to analyze with improved filtering
   */
  async getProjectFiles() {
    const files = [];
    const ignoreSet = new Set(this.options.ignorePatterns);

    async function traverse(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(process.cwd(), fullPath);

        // Check if path should be ignored
        const shouldIgnore = Array.from(ignoreSet).some(pattern => {
          // Simple glob matching
          const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
          return regex.test(relPath);
        });

        if (shouldIgnore) {
          continue;
        }

        if (entry.isDirectory()) {
          // Skip common directories that shouldn't be analyzed
          if (['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'out'].includes(entry.name)) {
            continue;
          }
          await traverse(fullPath);
        } else if (
          entry.isFile() &&
          (entry.name.endsWith('.js') ||
            entry.name.endsWith('.ts') ||
            entry.name.endsWith('.jsx') ||
            entry.name.endsWith('.tsx'))
        ) {
          files.push(fullPath);
        }
      }
    }

    await traverse(this.projectPath);
    return files;
  }

  /**
   * Start enhanced file watcher with debouncing
   */
  startWatcher() {
    // In production, use chokidar or similar with debounce
    // For now, polling with intelligent intervals
    let timeoutId = null;

    this.watcher = setInterval(async () => {
      // Debounce multiple rapid scans
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        await this.scanProject();
      }, 2000); // 2 second debounce
    }, 5000); // Check every 5 seconds
  }

  /**
   * Add a prediction with deduplication
   */
  addPrediction(prediction) {
    // Deduplicate similar predictions
    const existing = Array.from(this.predictions.values()).find(p =>
      p.pattern.location.file === prediction.pattern.location.file &&
      p.pattern.location.line === prediction.pattern.location.line &&
      p.pattern.details.issue === prediction.pattern.details.issue
    );

    if (existing) {
      // Update existing prediction with new probability if higher
      if (prediction.probability > existing.probability) {
        existing.probability = prediction.probability;
        existing.timestamp = Date.now();
      }
    } else {
      this.predictions.set(prediction.id, prediction);
      this.emit('prediction:new', prediction);
    }
  }

  /**
   * Get predictions with advanced filtering and sorting
   */
  getPredictions(filter = {}) {
    let predictions = Array.from(this.predictions.values());

    if (filter.severity) {
      predictions = predictions.filter((p) => p.severity === filter.severity);
    }

    if (filter.type) {
      predictions = predictions.filter((p) => p.pattern.type === filter.type);
    }

    if (filter.file) {
      predictions = predictions.filter((p) => p.pattern.location.file.includes(filter.file));
    }

    if (filter.minProbability) {
      predictions = predictions.filter((p) => p.probability >= filter.minProbability);
    }

    // Sort by priority (probability * severity weight)
    return predictions.sort((a, b) => {
      const priorityA = a.probability * (['critical', 'high', 'medium', 'low'].indexOf(a.severity) + 1);
      const priorityB = b.probability * (['critical', 'high', 'medium', 'low'].indexOf(b.severity) + 1);
      return priorityB - priorityA; // Descending order
    });
  }

  /**
   * Generate smart fix suggestions
   */
  generateFix(pattern) {
    const fixes = {
      'hardcoded_secret': {
        description: 'Use environment variables',
        replacement: 'process.env.SECRET_KEY',
      },
      'sql_injection': {
        description: 'Use parameterized queries',
        replacement: 'db.query("SELECT * FROM users WHERE id = ?", [userId])',
      },
      'xss_vulnerability': {
        description: 'Use textContent or sanitize inputs',
        replacement: 'element.textContent = userInput',
      },
      'eval_usage': {
        description: 'Avoid eval() or use safer alternatives',
        replacement: 'Use JSON.parse() or Function constructor carefully',
      },
      'empty_catch_block': {
        description: 'Add error handling or logging',
        replacement: 'catch (error) { console.error("Error:", error); }',
      },
      'potential_null_access': {
        description: 'Add null checks or use optional chaining',
        replacement: 'obj?.property',
      },
      'infinite_loop': {
        description: 'Add break conditions',
        replacement: 'let attempts = 0; while (condition && attempts++ < 100) { ... }',
      },
      'memory_leak': {
        description: 'Store interval ID and clear when needed',
        replacement: 'const id = setInterval(...); clearInterval(id);',
      },
      'console_log': {
        description: 'Use proper logging framework',
        replacement: 'logger.info("message")',
      },
      'magic_number': {
        description: 'Assign to named constant',
        replacement: 'const TIMEOUT_MS = 5000;',
      },
      'long_function': {
        description: 'Split into smaller functions',
        replacement: 'Extract logic into separate functions',
      }
    };

    return fixes[pattern.details.issue] || null;
  }

  /**
   * Calculate file hash for change detection
   */
  calculateHash(content) {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Get enhanced accuracy and performance stats
   */
  getAccuracyStats() {
    const predictions = Array.from(this.predictions.values());
    const total = predictions.length;

    if (total === 0) return {
      total: 0,
      accuracy: 0,
      precision: 0,
      recall: 0,
      avgProbability: 0,
      criticalCount: 0,
      highCount: 0
    };

    const criticalCount = predictions.filter(p => p.severity === 'critical').length;
    const highCount = predictions.filter(p => p.severity === 'high').length;
    const avgProbability = predictions.reduce((sum, p) => sum + p.probability, 0) / total;

    return {
      total,
      accuracy: 0, // Placeholder - would need historical validation data
      precision: 0, // Placeholder - would need historical validation data
      recall: 0, // Placeholder - would need historical validation data
      avgProbability,
      criticalCount,
      highCount,
    };
  }

  /**
   * Export enhanced predictions report
   */
  exportReport() {
    const predictions = this.getPredictions();
    const stats = this.getAccuracyStats();

    return {
      generatedAt: new Date().toISOString(),
      projectPath: this.projectPath,
      summary: {
        totalPredictions: predictions.length,
        bySeverity: {
          critical: predictions.filter((p) => p.severity === 'critical').length,
          high: predictions.filter((p) => p.severity === 'high').length,
          medium: predictions.filter((p) => p.severity === 'medium').length,
          low: predictions.filter((p) => p.severity === 'low').length,
        },
        byType: {
          security: predictions.filter((p) => p.pattern.type === 'security').length,
          bugProne: predictions.filter((p) => p.pattern.type === 'bugProne').length,
          performance: predictions.filter((p) => p.pattern.type === 'performance').length,
          maintainability: predictions.filter((p) => p.pattern.type === 'maintainability').length,
        },
        accuracy: stats,
      },
      predictions: predictions.map((p) => p.toJSON()),
    };
  }
}

export default { EnhancedPredictiveDebugger, EnhancedBugPrediction, EnhancedCodePattern };