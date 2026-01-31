/**
 * Ultra-Dex Model Router & Evaluation Engine
 * Routes tasks to optimal AI models based on task type, cost, and quality
 */

import fs from 'fs/promises';
import path from 'path';
import { createProvider, getDefaultProvider, getProvider } from '../providers/index.js';
import { monitoring } from '../utils/monitoring.js';
import { errorRecovery } from '../utils/error-recovery.js';

class TaskClassifier {
  constructor() {
    this.classificationRules = {
      // Task type patterns
      'bugfix': [
        /fix|bug|error|issue|debug|correct|patch|resolve|solve|troubleshoot/i,
        /broken|failing|not working|crash|exception|failure/i
      ],
      'refactor': [
        /refactor|clean|improve|optimize|performance|speed|efficiency|simplify|restructure|modernize/i,
        /code quality|lint|format|maintainability|readability|patterns/i
      ],
      'feature': [
        /implement|add|create|build|develop|new|feature|functionality|capability/i,
        /api|endpoint|service|component|page|screen|module|library/i
      ],
      'security': [
        /security|vulnerability|auth|authentication|authorization|permission|secure|protect|cve|owasp/i,
        /xss|csrf|sql injection|injection|validation|sanitiz/i
      ],
      'testing': [
        /test|spec|jest|unit|integration|e2e|coverage|qa|quality|verify|validate|check/i,
        /assert|expect|mock|stub|snapshot|behavior/i
      ],
      'documentation': [
        /docs|documentation|readme|guide|tutorial|comment|explain|describe|api doc|swagger/i,
        /write|update|improve|create|generate|content/i
      ],
      'deployment': [
        /deploy|release|build|prod|production|staging|ci|cd|pipeline|github action|docker|kubernetes/i,
        /environment|config|secrets|variables|hosting|server/i
      ],
      'database': [
        /database|schema|migration|query|sql|prisma|orm|model|table|column|relationship|index/i,
        /data|storage|persist|save|retrieve|postgres|mysql|mongo/i
      ],
      'frontend': [
        /ui|component|react|vue|angular|html|css|style|tailwind|bootstrap|responsive|mobile|design/i,
        /frontend|client|browser|render|display|visual|interface/i
      ],
      'backend': [
        /api|backend|server|express|fastify|rest|graphql|endpoint|route|controller|service/i,
        /backend|server|logic|business|function|algorithm|compute/i
      ]
    };
  }

  classifyTask(taskDescription) {
    const lowerTask = taskDescription.toLowerCase();
    const scores = {};

    // Score each category based on pattern matches
    for (const [category, patterns] of Object.entries(this.classificationRules)) {
      let score = 0;
      for (const pattern of patterns) {
        const matches = lowerTask.match(pattern);
        if (matches) {
          score += matches.length;
        }
      }
      scores[category] = score;
    }

    // Find the highest scoring category
    let bestCategory = 'general';
    let bestScore = 0;
    
    for (const [category, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    // If no strong match, use general
    if (bestScore === 0) {
      bestCategory = 'general';
    }

    return {
      category: bestCategory,
      confidence: bestScore > 0 ? Math.min(bestScore / 10, 1) : 0,
      scores
    };
  }
}

class ModelRouter {
  constructor() {
    this.taskClassifier = new TaskClassifier();
    this.modelCapabilities = {
      'claude-sonnet-4-20250514': { reasoning: 9, coding: 8, creative: 7, speed: 6, cost: 4 },
      'claude-opus-20240229': { reasoning: 10, coding: 9, creative: 8, speed: 3, cost: 8 },
      'claude-haiku-20240307': { reasoning: 6, coding: 5, creative: 4, speed: 9, cost: 1 },
      'gpt-4-turbo': { coding: 9, creative: 8, reasoning: 7, speed: 7, cost: 5 },
      'gpt-4': { coding: 8, creative: 9, reasoning: 8, speed: 5, cost: 7 },
      'gpt-3.5-turbo': { coding: 6, creative: 5, reasoning: 4, speed: 8, cost: 2 },
      'gemini-pro': { reasoning: 7, coding: 8, creative: 6, speed: 8, cost: 3 }
    };

    // Default hardcoded policies as fallback
    this.routingPolicies = {
      costEffective: {
        priority: ['claude-haiku-20240307', 'gpt-3.5-turbo', 'gemini-pro'],
        fallback: 'claude-sonnet-4-20250514'
      },
      qualityFirst: {
        priority: ['claude-opus-20240229', 'claude-sonnet-4-20250514', 'gpt-4-turbo'],
        fallback: 'gpt-4'
      },
      balanced: {
        priority: ['claude-sonnet-4-20250514', 'gpt-4-turbo', 'gpt-4'],
        fallback: 'gpt-3.5-turbo'
      }
    };
    
    this.configLoaded = false;
  }

  async loadConfig() {
    if (this.configLoaded) return;

    try {
      // Try project config first, then template
      const projectConfigPath = path.resolve(process.cwd(), '.ultra-dex/router.json');
      const templateConfigPath = path.resolve(new URL(import.meta.url).pathname, '../../../../assets/templates/config/router.json');
      
      let configData;
      try {
        configData = await fs.readFile(projectConfigPath, 'utf8');
      } catch {
        try {
          // Fallback to template if project config missing
          // Note: Relative path handling might need adjustment based on install location
           configData = await fs.readFile(templateConfigPath, 'utf8');
        } catch (e) {
          // Fallback to internal defaults if files missing
          console.warn('⚠️  Could not load router.json, using defaults.');
          this.configLoaded = true;
          return;
        }
      }

      if (configData) {
        const config = JSON.parse(configData);
        // Map config strategies to routing policies
        if (config.strategies) {
          if (config.strategies.cost_optimized) {
            this.routingPolicies.costEffective = {
              priority: [config.strategies.cost_optimized.default],
              fallback: config.strategies.cost_optimized.complex
            };
          }
          if (config.strategies.performance) {
            this.routingPolicies.qualityFirst = {
              priority: [config.strategies.performance.default],
              fallback: config.strategies.performance.complex
            };
          }
        }
        
        // Load overrides
        if (config.overrides) {
            this.overrides = config.overrides;
        }
      }
    } catch (e) {
      console.warn('⚠️  Error parsing router configuration:', e.message);
    } finally {
      this.configLoaded = true;
    }
  }

  /**
   * Route a task to the optimal model based on classification and policy
   */
  async routeTask(taskDescription, policy = 'balanced', options = {}) {
    await this.loadConfig(); // Ensure config is loaded

    const classification = this.taskClassifier.classifyTask(taskDescription);
    
    // Check overrides first
    if (this.overrides) {
        for (const override of this.overrides) {
            if (taskDescription.toLowerCase().includes(override.keyword)) {
                return {
                    model: override.model,
                    classification,
                    candidates: [override.model],
                    policy: 'override'
                };
            }
        }
    }

    const policyConfig = this.routingPolicies[policy] || this.routingPolicies.balanced;

    // Adjust routing based on task category
    let candidateModels = [...policyConfig.priority];

    // For specific task types, prefer models with stronger capabilities in that area
    switch (classification.category) {
      case 'security':
        // Prioritize models with strong reasoning for security analysis
        candidateModels = this._prioritizeModels(candidateModels, 'reasoning');
        break;
      case 'coding':
      case 'backend':
      case 'frontend':
      case 'database':
      case 'bugfix':
      case 'feature':
      case 'deployment':
        // Prioritize models with strong coding capabilities
        candidateModels = this._prioritizeModels(candidateModels, 'coding');
        break;
      case 'testing':
        // Prioritize models with attention to detail
        candidateModels = this._prioritizeModels(candidateModels, 'coding');
        break;
      case 'refactor':
        // Prioritize models with strong reasoning and code understanding
        candidateModels = this._prioritizeModels(candidateModels, 'reasoning');
        break;
      case 'documentation':
        // Prioritize models with strong creative/writing skills
        candidateModels = this._prioritizeModels(candidateModels, 'creative');
        break;
      default:
        // Use policy default
    }

    return {
      model: candidateModels[0] || policyConfig.fallback,
      classification,
      candidates: candidateModels,
      policy
    };
  }

  _prioritizeModels(models, capability) {
    return models.sort((a, b) => {
      const capA = this.modelCapabilities[a]?.[capability] || 0;
      const capB = this.modelCapabilities[b]?.[capability] || 0;
      return capB - capA; // Higher capability first
    });
  }

  /**
   * Get model performance metrics for cost/quality analysis
   */
  getModelMetrics(modelId) {
    const capabilities = this.modelCapabilities[modelId] || {};
    
    // Calculate composite score
    const compositeScore = Object.values(capabilities).reduce((sum, val) => sum + val, 0);
    
    return {
      modelId,
      capabilities,
      compositeScore,
      estimatedCost: this._estimateCost(modelId),
      estimatedSpeed: this._estimateSpeed(modelId)
    };
  }

  _estimateCost(modelId) {
    // Cost estimates based on model capabilities and usage patterns
    const baseCosts = {
      'claude-haiku-20240307': 0.25,
      'gpt-3.5-turbo': 0.50,
      'gemini-pro': 0.75,
      'claude-sonnet-4-20250514': 3.00,
      'gpt-4-turbo': 10.00,
      'gpt-4': 15.00,
      'claude-opus-20240229': 15.00
    };
    
    return baseCosts[modelId] || 5.00; // Default cost
  }

  _estimateSpeed(modelId) {
    // Speed estimates based on model capabilities (higher = faster)
    const speeds = {
      'claude-haiku-20240307': 9,
      'gpt-3.5-turbo': 8,
      'gemini-pro': 8,
      'claude-sonnet-4-20250514': 6,
      'gpt-4-turbo': 5,
      'gpt-4': 4,
      'claude-opus-20240229': 3
    };
    
    return speeds[modelId] || 5; // Default speed
  }
}

class EvaluationEngine {
  constructor() {
    this.evaluationRules = {
      'code-quality': {
        checks: [
          { name: 'no-any-types', pattern: /:\s*any\b|<\s*any\s*>/, severity: 'error', message: 'Avoid explicit "any" types' },
          { name: 'no-console-logs', pattern: /console\.log\(/, severity: 'warning', message: 'Remove console.log statements' },
          { name: 'no-commented-code', pattern: /^[\s\t]*\/\/\s*[^\n]+/gm, severity: 'warning', message: 'Remove commented-out code blocks' },
          { name: 'proper-error-handling', pattern: /try\s*{|catch\s*\(|finally/, severity: 'error', message: 'Add error handling' }
        ]
      },
      'security': {
        checks: [
          { name: 'no-hardcoded-secrets', pattern: /process\.env\.[A-Z_]+/, severity: 'critical', message: 'Avoid hardcoded secrets' },
          { name: 'input-validation', pattern: /z\.string\(\)|validate|sanitize/, severity: 'error', message: 'Add input validation' },
          { name: 'auth-check', pattern: /auth|permission|role|acl/, severity: 'error', message: 'Add authentication/authorization' }
        ]
      },
      'performance': {
        checks: [
          { name: 'response-time', pattern: /<\d+ms|performance|timeout/, severity: 'warning', message: 'Consider performance implications' },
          { name: 'caching', pattern: /cache|memoize|ttl/, severity: 'warning', message: 'Consider caching strategies' }
        ]
      }
    };
  }

  /**
   * Evaluate content against quality gates
   */
  async evaluateContent(content, taskType = 'general', context = {}) {
    const results = {
      taskType,
      passed: true,
      issues: [],
      score: 100,
      recommendations: []
    };

    const rules = this.evaluationRules[taskType] || this.evaluationRules['code-quality'];
    
    for (const check of rules.checks) {
      if (check.pattern) {
        const matches = content.match(check.pattern);
        if (matches) {
          const issue = {
            check: check.name,
            severity: check.severity,
            message: check.message,
            matches: matches.length,
            context: content.substring(0, 200) + (content.length > 200 ? '...' : '')
          };
          
          results.issues.push(issue);
          
          // Adjust score based on severity
          switch (check.severity) {
            case 'critical':
              results.score -= 25;
              break;
            case 'error':
              results.score -= 15;
              break;
            case 'warning':
              results.score -= 5;
              break;
          }
          
          if (check.severity === 'critical' || check.severity === 'error') {
            results.passed = false;
          }
        }
      }
    }

    // Add task-specific recommendations
    results.recommendations = this._getRecommendations(taskType, content);

    return results;
  }

  _getRecommendations(taskType, content) {
    const recommendations = [];
    
    switch (taskType) {
      case 'code-quality':
        if (!content.includes('test') && !content.includes('spec')) {
          recommendations.push('Consider adding unit tests for the implemented functionality');
        }
        if (!content.includes('error') && !content.includes('catch')) {
          recommendations.push('Add comprehensive error handling for edge cases');
        }
        break;
        
      case 'security':
        if (!content.includes('validate') && !content.includes('sanitize')) {
          recommendations.push('Add input validation and sanitization');
        }
        if (!content.includes('auth') && !content.includes('permission')) {
          recommendations.push('Add authentication and authorization checks');
        }
        break;
        
      case 'performance':
        if (!content.includes('cache') && !content.includes('memo')) {
          recommendations.push('Consider implementing caching strategies');
        }
        if (!content.includes('debounce') && !content.includes('throttle')) {
          recommendations.push('Consider rate limiting or throttling for performance');
        }
        break;
    }
    
    return recommendations;
  }

  /**
   * Run evaluation loop with feedback-driven re-routing
   */
  async evaluationLoop(task, content, provider = null, options = {}) {
    const { maxIterations = 3, policy = 'balanced', taskType = 'general' } = options;

    let currentContent = content;
    let iteration = 0;
    let finalResult = null;
    
    // Ensure we have a provider
    if (!provider) {
       provider = getProvider();
    }

    while (iteration < maxIterations) {
      iteration++;

      // Evaluate current content
      const evaluation = await this.evaluateContent(currentContent, taskType);

      if (evaluation.passed) {
        monitoring.info('Evaluation loop completed successfully', {
          iterations: iteration,
          finalScore: evaluation.score,
          taskType
        });
        finalResult = { content: currentContent, evaluation, iterations };
        break;
      }

      if (evaluation.issues.length > 0) {
        // Generate improvement suggestions
        const improvementPrompt = `
Current content has quality issues that need to be addressed:

Issues found:
${evaluation.issues.map(issue => `- ${issue.severity.toUpperCase()}: ${issue.message}`).join('\n')}

Recommendations:
${evaluation.recommendations.join('\n')}

Task: ${task}

Please improve the content to address these issues while maintaining the original functionality.
Return ONLY the improved code/content.
        `.trim();

        try {
          if (!provider) {
             console.warn('⚠️ No AI provider available for self-correction loop.');
             break;
          }
          
          // Route to appropriate model based on issues (in future iterations, pass explicit model)
          // For now, reuse the active provider
          let improved;
          if (provider.complete) {
              improved = await provider.complete(improvementPrompt);
          } else if (provider.generate) {
              const res = await provider.generate(improvementPrompt);
              improved = res.content || res.text || (typeof res === 'string' ? res : JSON.stringify(res));
          }
          
          if (improved) {
             currentContent = improved;
             monitoring.info('Content improved in evaluation loop', {
                iteration,
                issuesAddressed: evaluation.issues.length
             });
          }

        } catch (error) {
          monitoring.error('Evaluation loop iteration failed', {
            iteration,
            error: error.message
          });
          // Continue with current content if improvement fails
          finalResult = { content: currentContent, evaluation, iterations: iteration, error: error.message };
          break;
        }
      }
    }

    if (!finalResult) {
      finalResult = { content: currentContent, evaluation: null, iterations: maxIterations };
    }

    return finalResult;
  }
}

// Global instances
export const taskClassifier = new TaskClassifier();
export const modelRouter = new ModelRouter();
export const evaluationEngine = new EvaluationEngine();

// Combined orchestrator
export class ModelOrchestrator {
  constructor() {
    this.router = new ModelRouter();
    this.evaluator = new EvaluationEngine();
    this.classifier = new TaskClassifier();
  }

  /**
   * Complete orchestration: classify → route → evaluate → improve
   */
  async orchestrate(task, initialContent = '', options = {}) {
    const startTime = Date.now();
    
    // 1. Classify the task
    const classification = this.classifier.classifyTask(task);
    
    // 2. Route to appropriate model
    const routing = await this.router.routeTask(task, options.policy || 'balanced');
    
    // 3. If initial content exists, run evaluation loop
    let result;
    if (initialContent) {
      result = await this.evaluator.evaluationLoop(
        task,
        initialContent,
        null, // provider will be determined dynamically
        {
          taskType: classification.category,
          policy: options.policy || 'balanced',
          maxIterations: options.maxIterations || 3
        }
      );
    } else {
      // Just return routing information
      result = {
        content: initialContent,
        evaluation: null,
        iterations: 0,
        routing
      };
    }
    
    const duration = Date.now() - startTime;
    
    monitoring.recordPerformance('model_orchestration', duration, {
      taskType: classification.category,
      model: routing.model,
      duration
    });
    
    return {
      ...result,
      classification,
      routing,
      duration
    };
  }
}

export const modelOrchestrator = new ModelOrchestrator();

export default {
  taskClassifier,
  modelRouter,
  evaluationEngine,
  modelOrchestrator
};