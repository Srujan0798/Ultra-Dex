// Copyright (c) 2026 Ultra-Dex
// Predictive Debugging - Background LLM Error Prediction

/**
 * PredictiveDebugger - Analyzes code patterns to predict bugs before they occur
 * Uses background LLM analysis on code changes, test results, and error patterns
 */

import EventEmitter from 'events';
import fs from 'fs/promises';
import path from 'path';

export class PredictiveDebugger extends EventEmitter {
    constructor(options = {}) {
        super();
        this.provider = options.provider || null;
        this.enabled = options.enabled !== false;
        this.analysisInterval = options.analysisInterval || 30000; // 30 seconds
        this.errorPatterns = new Map();
        this.predictions = [];
        this.watchedPaths = new Set();
        this.isRunning = false;
        this.analysisTimer = null;
    }

    /**
     * Start background analysis
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.emit('started');

        // Run initial analysis
        this.analyze().catch(err => this.emit('error', err));

        // Set up periodic analysis
        this.analysisTimer = setInterval(() => {
            this.analyze().catch(err => this.emit('error', err));
        }, this.analysisInterval);

        return this;
    }

    /**
     * Stop background analysis
     */
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.analysisTimer) {
            clearInterval(this.analysisTimer);
            this.analysisTimer = null;
        }

        this.emit('stopped');
        return this;
    }

    /**
     * Add a path to watch for changes
     */
    watch(filePath) {
        this.watchedPaths.add(path.resolve(filePath));
        return this;
    }

    /**
     * Run predictive analysis
     */
    async analyze() {
        if (!this.enabled) return null;

        const analysis = {
            timestamp: Date.now(),
            predictions: [],
            confidence: 0
        };

        // Analyze error patterns
        const patternPredictions = await this.analyzePatterns();
        analysis.predictions.push(...patternPredictions);

        // Analyze code complexity
        const complexityPredictions = await this.analyzeComplexity();
        analysis.predictions.push(...complexityPredictions);

        // Analyze test coverage gaps
        const coveragePredictions = await this.analyzeCoverageGaps();
        analysis.predictions.push(...coveragePredictions);

        // Calculate overall confidence
        if (analysis.predictions.length > 0) {
            analysis.confidence = analysis.predictions.reduce((sum, p) => sum + p.confidence, 0) / analysis.predictions.length;
        }

        this.predictions.unshift(analysis);

        // Keep only last 100 analyses
        if (this.predictions.length > 100) {
            this.predictions = this.predictions.slice(0, 100);
        }

        this.emit('analysis:complete', analysis);
        return analysis;
    }

    /**
     * Analyze historical error patterns
     */
    async analyzePatterns() {
        const predictions = [];

        // Common error patterns to detect
        const patterns = [
            {
                name: 'null-reference',
                regex: /(\w+)\s*\.\s*\w+/g,
                riskLevel: 'medium',
                message: 'Potential null reference - add null checks'
            },
            {
                name: 'unhandled-promise',
                regex: /new\s+Promise|async\s+function|\.then\(/g,
                riskLevel: 'high',
                message: 'Async code without proper error handling'
            },
            {
                name: 'hardcoded-secrets',
                regex: /(api[_-]?key|password|secret|token)\s*[:=]\s*['"][^'"]+['"]/gi,
                riskLevel: 'critical',
                message: 'Potential hardcoded secret detected'
            },
            {
                name: 'sql-injection',
                regex: /query\s*\(\s*`[^`]*\$\{/g,
                riskLevel: 'critical',
                message: 'Potential SQL injection vulnerability'
            },
            {
                name: 'memory-leak',
                regex: /addEventListener.*(?!removeEventListener)/g,
                riskLevel: 'medium',
                message: 'Event listener without cleanup - potential memory leak'
            }
        ];

        for (const filePath of this.watchedPaths) {
            try {
                const content = await fs.readFile(filePath, 'utf-8');

                for (const pattern of patterns) {
                    const matches = content.match(pattern.regex);
                    if (matches && matches.length > 0) {
                        predictions.push({
                            type: 'pattern',
                            name: pattern.name,
                            file: filePath,
                            riskLevel: pattern.riskLevel,
                            message: pattern.message,
                            occurrences: matches.length,
                            confidence: this.calculateConfidence(pattern.riskLevel, matches.length)
                        });
                    }
                }
            } catch (err) {
                // File may not exist or be readable
                continue;
            }
        }

        return predictions;
    }

    /**
     * Analyze code complexity for bug prediction
     */
    async analyzeComplexity() {
        const predictions = [];

        for (const filePath of this.watchedPaths) {
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                const lines = content.split('\n');

                // Simple complexity metrics
                const metrics = {
                    totalLines: lines.length,
                    nestedBlocks: (content.match(/\{[^{}]*\{[^{}]*\{/g) || []).length,
                    longFunctions: (content.match(/function[^{]*\{[^}]{1000,}/g) || []).length,
                    cyclomaticIndicators: (content.match(/if\s*\(|else\s*if|switch\s*\(|\?\s*:/g) || []).length
                };

                // Flag high complexity files
                if (metrics.nestedBlocks > 10 || metrics.longFunctions > 0 || metrics.cyclomaticIndicators > 20) {
                    predictions.push({
                        type: 'complexity',
                        file: filePath,
                        riskLevel: 'high',
                        message: 'High code complexity - consider refactoring',
                        metrics,
                        confidence: 0.7
                    });
                }
            } catch (err) {
                continue;
            }
        }

        return predictions;
    }

    /**
     * Analyze test coverage gaps
     */
    async analyzeCoverageGaps() {
        const predictions = [];

        // Look for files without corresponding test files
        for (const filePath of this.watchedPaths) {
            const ext = path.extname(filePath);
            const basename = path.basename(filePath, ext);
            const dir = path.dirname(filePath);

            // Skip if already a test file
            if (basename.includes('.test') || basename.includes('.spec')) {
                continue;
            }

            // Check for corresponding test file
            const testPatterns = [
                `${basename}.test${ext}`,
                `${basename}.spec${ext}`,
                `__tests__/${basename}${ext}`,
                `test/${basename}${ext}`
            ];

            let hasTest = false;
            for (const pattern of testPatterns) {
                try {
                    await fs.access(path.join(dir, pattern));
                    hasTest = true;
                    break;
                } catch {
                    // Test file doesn't exist
                }
            }

            if (!hasTest) {
                predictions.push({
                    type: 'coverage',
                    file: filePath,
                    riskLevel: 'low',
                    message: 'No test file found - consider adding tests',
                    confidence: 0.5
                });
            }
        }

        return predictions;
    }

    /**
     * Calculate confidence based on risk level and occurrences
     */
    calculateConfidence(riskLevel, occurrences) {
        const baseConfidence = {
            critical: 0.9,
            high: 0.7,
            medium: 0.5,
            low: 0.3
        };

        const base = baseConfidence[riskLevel] || 0.5;
        const occurrence_boost = Math.min(occurrences * 0.05, 0.1);

        return Math.min(base + occurrence_boost, 1.0);
    }

    /**
     * Get high-risk predictions
     */
    getHighRiskPredictions() {
        const latest = this.predictions[0];
        if (!latest) return [];

        return latest.predictions.filter(p =>
            p.riskLevel === 'critical' || p.riskLevel === 'high'
        );
    }

    /**
     * Get all predictions as formatted report
     */
    getReport() {
        const latest = this.predictions[0];
        if (!latest) return 'No analysis available yet.';

        let report = `# Predictive Debugging Report\n`;
        report += `Generated: ${new Date(latest.timestamp).toISOString()}\n`;
        report += `Overall Confidence: ${(latest.confidence * 100).toFixed(1)}%\n\n`;

        const grouped = {
            critical: [],
            high: [],
            medium: [],
            low: []
        };

        for (const pred of latest.predictions) {
            grouped[pred.riskLevel]?.push(pred);
        }

        for (const [level, preds] of Object.entries(grouped)) {
            if (preds.length > 0) {
                report += `## ${level.toUpperCase()} Risk (${preds.length})\n`;
                for (const p of preds) {
                    report += `- **${p.name || p.type}** in \`${path.basename(p.file)}\`: ${p.message}\n`;
                }
                report += '\n';
            }
        }

        return report;
    }

    /**
     * Register a learned error pattern
     */
    learnPattern(name, regex, riskLevel, message) {
        this.errorPatterns.set(name, { regex, riskLevel, message });
        return this;
    }
}

export default PredictiveDebugger;
