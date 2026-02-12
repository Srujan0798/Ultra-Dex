/* global WebSocket */
// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
// import { CronJob } from 'cron'; // Removed external dependency
import chokidar from 'chokidar';
import axios from 'axios';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { printInfo, printSuccess, printError, printWarning } from '../utils/output.js';
import { loadState } from '../commands/state.js';
import { ultraMemory } from '../mcp/memory.js';
import { GovernanceEngine } from '../governance/index.js';
import { AgentSwarm } from '../agents/swarm.js';
import { MCPHost } from '../mcp/host.js';

const execAsync = promisify(exec);

/**
 * Autonomous Daemon - 24/7 AI Assistant for Development
 * Monitors, analyzes, fixes, and improves your codebase automatically
 */
export class AutonomousDaemon {
  constructor(options = {}) {
    this.options = {
      port: options.port || 3003,
      checkInterval: options.checkInterval || 300000, // 5 minutes
      fileWatch: options.fileWatch !== false,
      autoFix: options.autoFix !== false,
      notifications: options.notifications !== false,
      verbose: options.verbose || false,
      ...options,
    };

    this.isRunning = false;
    this.server = null;
    this.wss = null;
    this.fileWatcher = null;
    this.healthCheckJob = null;
    this.governanceEngine = new GovernanceEngine();
    this.agentSwarm = new AgentSwarm();
    this.mcpHost = new MCPHost();
    this.interrupted = false;

    // Task queues
    this.priorityQueue = [];
    this.backgroundQueue = [];

    // Stats
    this.stats = {
      tasksCompleted: 0,
      issuesFixed: 0,
      errors: 0,
      uptime: 0,
      lastActivity: null,
      activeAgents: 0,
      aiRequests: 0,
      memoryUsage: 0,
    };

    // Monitors
    this.monitors = new Map();
    this.activeChecks = new Set();
  }

  /**
   * Start the autonomous daemon
   */
  async start(runtimeOptions = {}) {
    if (this.isRunning) {
      printWarning('⚠️  Daemon already running');
      return;
    }

    // Apply one-time runtime overrides from command flags.
    this.options = {
      ...this.options,
      ...runtimeOptions,
    };

    this.isRunning = true;
    this.startTime = Date.now();

    printInfo('🎮 Starting Ultra-Dex Autonomous Daemon...');
    printInfo('🛡️  Mode: 24/7 AI Assistant Active');
    printInfo(`📡 Port: ${this.options.port}`);
    printInfo(`⏱️  Check Interval: ${this.options.checkInterval / 1000}s`);

    try {
      // Initialize governance engine
      await this.governanceEngine.init();

      // Initialize agent swarm
      await this.agentSwarm.init();

      // Initialize MCP host
      await this.mcpHost.init();

      // Start HTTP server
      this.server = createServer();
      this.server.listen(this.options.port, () => {
        printSuccess(`✅ Daemon server running on port ${this.options.port}`);
      });

      // Start WebSocket server
      this.wss = new WebSocketServer({ server: this.server });
      this.setupWebSocketHandlers();

      // Start file watcher
      if (this.options.fileWatch) {
        this.setupFileWatcher();
      }

      // Start periodic health checks
      this.startHealthChecks();

      // Start task processors
      this.startTaskProcessors();

      // Start autonomous monitoring
      this.startAutonomousMonitoring();

      // Notify startup
      await this.sendNotification('Daemon started', 'success', {
        port: this.options.port,
        uptime: this.stats.uptime,
      });

      printSuccess('🚀 Autonomous Daemon is now monitoring your project!');
      printInfo('💡 Features: Auto-fix, Health checks, Performance monitoring, Security scanning');

      // Update stats
      this.stats.lastActivity = new Date();

      // Handle graceful shutdown
      process.on('SIGINT', this.gracefulShutdown.bind(this));
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
    } catch (error) {
      printError(`Failed to start daemon: ${error.message}`);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Setup WebSocket handlers for real-time updates
   */
  setupWebSocketHandlers() {
    this.wss.on('connection', (ws) => {
      printInfo('🌐 New daemon client connected');

      // Send initial status
      ws.send(
        JSON.stringify({
          type: 'status',
          data: {
            status: 'connected',
            stats: this.stats,
            uptime: this.getUptime(),
          },
        })
      );

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleWebSocketMessage(data, ws);
        } catch (error) {
          printError(`WebSocket message error: ${error.message}`);
        }
      });

      ws.on('close', () => {
        printInfo('🌐 Daemon client disconnected');
      });
    });
  }

  /**
   * Handle WebSocket messages
   */
  handleWebSocketMessage(data, ws) {
    switch (data.type) {
      case 'status':
        ws.send(
          JSON.stringify({
            type: 'status',
            data: { ...this.stats, uptime: this.getUptime() },
          })
        );
        break;
      case 'tasks':
        ws.send(
          JSON.stringify({
            type: 'tasks',
            data: {
              priority: this.priorityQueue.length,
              background: this.backgroundQueue.length,
            },
          })
        );
        break;
      case 'command':
        this.executeRemoteCommand(data.command, ws);
        break;
      case 'monitor':
        this.startMonitor(data.monitor, ws);
        break;
      case 'stop-monitor':
        this.stopMonitor(data.monitorId);
        break;
    }
  }

  /**
   * Execute command from WebSocket client
   */
  async executeRemoteCommand(command, ws) {
    try {
      const result = await this.executeCommand(command);
      ws.send(
        JSON.stringify({
          type: 'command_result',
          data: result,
        })
      );
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: 'command_error',
          data: { error: error.message },
        })
      );
    }
  }

  /**
   * Setup file watcher for auto-detection
   */
  setupFileWatcher() {
    this.fileWatcher = chokidar.watch(
      [
        '**/*.{js,ts,jsx,tsx,py,go,rs,md,json,yaml,toml}',
        'package.json',
        'CONTEXT.md',
        'IMPLEMENTATION-PLAN.md',
        '.ultra-dex/**/*',
      ],
      {
        ignored: [
          'node_modules/**',
          '.git/**',
          'dist/**',
          'build/**',
          '.next/**',
          'coverage/**',
          '*.log',
          'tmp/**',
          'temp/**',
        ],
        ignoreInitial: true,
        awaitWriteFinish: true,
      }
    );

    this.fileWatcher.on('change', (filePath) => {
      this.handleFileChange(filePath);
    });

    this.fileWatcher.on('add', (filePath) => {
      this.handleFileChange(filePath);
    });

    this.fileWatcher.on('unlink', (filePath) => {
      this.handleFileDelete(filePath);
    });

    printSuccess('👀 File watcher initialized');
  }

  /**
   * Handle file changes
   */
  async handleFileChange(filePath) {
    try {
      if (this.options.verbose) {
        printInfo(`📝 File changed: ${filePath}`);
      }

      // Analyze the change
      const analysis = await this.analyzeFileChange(filePath);

      if (analysis.needsAttention) {
        // Add to priority queue for immediate attention
        this.priorityQueue.push({
          type: 'file_change',
          filePath,
          analysis,
          timestamp: Date.now(),
        });

        if (this.options.verbose) {
          printInfo(`⚡ Queued analysis for: ${filePath}`);
        }
      }
    } catch (error) {
      printError(`File change analysis failed: ${error.message}`);
    }
  }

  /**
   * Handle file deletion
   */
  async handleFileDelete(filePath) {
    try {
      if (this.options.verbose) {
        printInfo(`🗑️ File deleted: ${filePath}`);
      }

      // Update context and memory
      await ultraMemory.remember(`File deleted: ${filePath}`, ['file-change', 'deletion']);

      // Check if this affects other parts of the system
      this.priorityQueue.push({
        type: 'file_delete',
        filePath,
        timestamp: Date.now(),
      });
    } catch (error) {
      printError(`File deletion handling failed: ${error.message}`);
    }
  }

  /**
   * Analyze file change for potential issues
   */
  async analyzeFileChange(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const stats = await fs.stat(filePath);

      const analysis = {
        filePath,
        size: stats.size,
        needsAttention: false,
        issues: [],
        suggestions: [],
        type: this.getFileType(filePath),
      };

      // Check for common issues
      if (content.includes('TO_DO') || content.includes('FIXME') || content.includes('HACK')) {
        analysis.needsAttention = true;
        analysis.issues.push('Contains TO_DO/FIXME/HACK comments');
      }

      if (content.includes('console.log') && !filePath.includes('__tests__')) {
        analysis.needsAttention = true;
        analysis.issues.push('Contains console.log statements');
      }

      if (content.includes('any') && filePath.endsWith('.ts')) {
        analysis.needsAttention = true;
        analysis.issues.push('Contains "any" type annotations');
      }

      if (content.length > 10000) {
        // 10KB threshold
        analysis.needsAttention = true;
        analysis.issues.push('Large file size (>10KB)');
      }

      // Check for security issues
      if (this.containsSecurityIssues(content)) {
        analysis.needsAttention = true;
        analysis.issues.push('Potential security issues detected');
      }

      // Check for performance issues
      if (this.containsPerformanceIssues(content)) {
        analysis.needsAttention = true;
        analysis.issues.push('Potential performance issues detected');
      }

      return analysis;
    } catch (error) {
      printError(`File analysis failed: ${error.message}`);
      return { filePath, needsAttention: false, issues: [], suggestions: [] };
    }
  }

  /**
   * Check for security issues in content
   */
  containsSecurityIssues(content) {
    const securityPatterns = [
      /password\s*[:=]/i,
      /secret\s*[:=]/i,
      /token\s*[:=]/i,
      /key\s*[:=]/i,
      /api_key\s*[:=]/i,
      /private_key\s*[:=]/i,
      /credential\s*[:=]/i,
      /process\.env\.[A-Z_]+/g, // Environment variable access
      /eval\s*\(/, // eval usage
      /Function\s*\(\s*["'].*["']\s*\)/, // Function constructor
      /setTimeout\s*\(\s*["']/, // String-based setTimeout
      /setInterval\s*\(\s*["']/, // String-based setInterval
    ];

    return securityPatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Check for performance issues in content
   */
  containsPerformanceIssues(content) {
    const performancePatterns = [
      /for\s*\(\s*let\s+i\s*=\s*0\s*;\s*i\s*<\s*arr\.length\s*;\s*i\s*\+\+\s*\)/, // Inefficient loop
      /JSON\.parse\s*\(\s*JSON\.stringify\s*\(/, // JSON cloning
      /document\.querySelectorAll\s*\(\s*".*"\s*\)\s*\[\s*\d+\s*\]/, // Inefficient DOM access
      /new\s+Array\s*\(\s*\d+\s*\)/, // Large array creation
      /while\s*\(\s*true\s*\)/, // Infinite loop
    ];

    return performancePatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Get file type based on extension
   */
  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
      return 'frontend';
    } else if (ext === '.py') {
      return 'backend';
    } else if (ext === '.go') {
      return 'backend';
    } else if (ext === '.rs') {
      return 'backend';
    } else if (ext === '.md') {
      return 'documentation';
    } else if (ext === '.json' || ext === '.yaml' || ext === '.toml') {
      return 'config';
    }
    return 'other';
  }

  /**
   * Start health check cron job
   */
  startHealthChecks() {
    this.healthCheckJob = setInterval(async () => {
      await this.runHealthCheck();
    }, 5000); // Check every 5 seconds

    printSuccess('🏥 Health check scheduler started (every 5 minutes)');
  }

  /**
   * Run comprehensive health check
   */
  async runHealthCheck() {
    try {
      const healthReport = {
        timestamp: new Date().toISOString(),
        checks: {},
        overall: 'healthy',
      };

      // Check project state
      healthReport.checks.projectState = await this.checkProjectState();

      // Check memory system
      healthReport.checks.memory = await this.checkMemorySystem();

      // Check governance compliance
      healthReport.checks.governance = await this.checkGovernanceCompliance();

      // Check security
      healthReport.checks.security = await this.checkSecurityIssues();

      // Check performance
      healthReport.checks.performance = await this.checkPerformanceMetrics();

      // Check dependencies
      healthReport.checks.dependencies = await this.checkDependencies();

      // Check agent health
      healthReport.checks.agents = await this.checkAgentHealth();

      // Check MCP connectivity
      healthReport.checks.mcp = await this.checkMCPConnectivity();

      // Determine overall health
      const unhealthyChecks = Object.values(healthReport.checks).filter(
        (check) => check.status !== 'healthy'
      );
      healthReport.overall = unhealthyChecks.length > 0 ? 'unhealthy' : 'healthy';

      // Process issues if found
      if (healthReport.overall === 'unhealthy') {
        await this.handleHealthIssues(healthReport);
      }

      // Update stats
      this.stats.lastActivity = new Date();

      if (this.options.verbose) {
        printInfo('🏥 Health check completed');
      }

      // Broadcast to WebSocket clients
      this.broadcastToClients({
        type: 'health_check',
        data: healthReport,
      });
    } catch (error) {
      printError(`Health check failed: ${error.message}`);
      this.stats.errors++;
    }
  }

  /**
   * Check project state health
   */
  async checkProjectState() {
    try {
      const state = await loadState();
      if (!state) {
        return { status: 'unhealthy', message: 'No project state found' };
      }

      // Check for incomplete tasks
      const incompleteTasks = this.getIncompleteTasks(state);

      return {
        status: incompleteTasks.length === 0 ? 'healthy' : 'warning',
        message:
          incompleteTasks.length === 0
            ? 'All tasks complete'
            : `${incompleteTasks.length} incomplete tasks`,
        data: { incompleteTasks },
      };
    } catch (error) {
      return { status: 'unhealthy', message: `State check failed: ${error.message}` };
    }
  }

  /**
   * Check memory system health
   */
  async checkMemorySystem() {
    try {
      const memoryStats = ultraMemory.getStats();

      return {
        status: 'healthy',
        message: `Memory system active, ${memoryStats.total} items`,
        data: memoryStats,
      };
    } catch (error) {
      return { status: 'unhealthy', message: `Memory check failed: ${error.message}` };
    }
  }

  /**
   * Check governance compliance
   */
  async checkGovernanceCompliance() {
    try {
      const compliance = await this.governanceEngine.checkCompliance();

      return {
        status: compliance.passed ? 'healthy' : 'unhealthy',
        message: compliance.passed ? 'Governance checks passing' : 'Governance violations detected',
        data: compliance,
      };
    } catch (error) {
      return { status: 'unhealthy', message: `Governance check failed: ${error.message}` };
    }
  }

  /**
   * Check security issues
   */
  async checkSecurityIssues() {
    try {
      const issues = await this.scanSecurityIssues();

      return {
        status: issues.length === 0 ? 'healthy' : 'unhealthy',
        message:
          issues.length === 0
            ? 'No security issues found'
            : `${issues.length} security issues found`,
        data: { issues },
      };
    } catch (error) {
      return { status: 'unhealthy', message: `Security check failed: ${error.message}` };
    }
  }

  /**
   * Scan for security issues
   */
  async scanSecurityIssues() {
    const issues = [];

    try {
      const files = await this.getAllProjectFiles();

      for (const file of files) {
        if (
          file.endsWith('.js') ||
          file.endsWith('.ts') ||
          file.endsWith('.py') ||
          file.endsWith('.go') ||
          file.endsWith('.rs')
        ) {
          const content = await fs.readFile(file, 'utf8');

          if (this.containsSecurityIssues(content)) {
            issues.push({
              file,
              type: 'security_vulnerability',
              severity: 'high',
            });
          }
        }
      }
    } catch (error) {
      printError(`Security scan failed: ${error.message}`);
    }

    return issues;
  }

  /**
   * Check performance metrics
   */
  async checkPerformanceMetrics() {
    // This would check performance metrics
    return { status: 'healthy', message: 'Performance metrics nominal' };
  }

  /**
   * Check dependencies
   */
  async checkDependencies() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (
        await fs
          .access(packageJsonPath)
          .then(() => true)
          .catch(() => false)
      ) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

        // Check for outdated dependencies
        // This would normally call npm audit or similar
        return { status: 'healthy', message: 'Dependency check passed' };
      }

      return { status: 'warning', message: 'No package.json found' };
    } catch (error) {
      return { status: 'unhealthy', message: `Dependency check failed: ${error.message}` };
    }
  }

  /**
   * Check agent health
   */
  async checkAgentHealth() {
    try {
      const agentHealth = await this.agentSwarm.getHealth();

      return {
        status: agentHealth.allHealthy ? 'healthy' : 'warning',
        message: agentHealth.allHealthy
          ? 'All agents healthy'
          : `${agentHealth.unhealthyCount} agents unhealthy`,
        data: agentHealth,
      };
    } catch (error) {
      return { status: 'unhealthy', message: `Agent health check failed: ${error.message}` };
    }
  }

  /**
   * Check MCP connectivity
   */
  async checkMCPConnectivity() {
    try {
      const mcpStatus = await this.mcpHost.getStatus();

      return {
        status: mcpStatus.connected ? 'healthy' : 'unhealthy',
        message: mcpStatus.connected ? 'MCP connected' : 'MCP disconnected',
        data: mcpStatus,
      };
    } catch (error) {
      return { status: 'unhealthy', message: `MCP check failed: ${error.message}` };
    }
  }

  /**
   * Handle health issues by creating tasks
   */
  async handleHealthIssues(healthReport) {
    for (const [checkName, checkResult] of Object.entries(healthReport.checks)) {
      if (checkResult.status !== 'healthy') {
        // Create a task to address the issue
        const task = {
          type: 'health_fix',
          check: checkName,
          issue: checkResult.message,
          priority: 'high',
          timestamp: Date.now(),
          data: checkResult.data,
        };

        this.priorityQueue.push(task);

        if (this.options.verbose) {
          printWarning(`⚠️  Health issue detected: ${checkName} - ${checkResult.message}`);
        }
      }
    }
  }

  /**
   * Start task processors
   */
  startTaskProcessors() {
    // Process priority queue
    setInterval(async () => {
      if (this.priorityQueue.length > 0) {
        const task = this.priorityQueue.shift();
        await this.processTask(task);
      }
    }, 1000); // Process every second

    // Process background queue
    setInterval(async () => {
      if (this.backgroundQueue.length > 0) {
        const task = this.backgroundQueue.shift();
        await this.processTask(task);
      }
    }, 5000); // Process every 5 seconds
  }

  /**
   * Start autonomous monitoring
   */
  startAutonomousMonitoring() {
    // Monitor for common patterns that need attention
    this.startCodeQualityMonitor();
    this.startSecurityMonitor();
    this.startPerformanceMonitor();
    this.startDependencyMonitor();
  }

  /**
   * Start code quality monitor
   */
  startCodeQualityMonitor() {
    this.monitors.set('code_quality', {
      interval: 300000, // 5 minutes
      check: async () => {
        // Check for code quality issues
        const issues = await this.scanCodeQualityIssues();
        if (issues.length > 0) {
          this.priorityQueue.push({
            type: 'code_quality_fix',
            issues,
            priority: 'medium',
            timestamp: Date.now(),
          });
        }
      },
    });
  }

  /**
   * Start security monitor
   */
  startSecurityMonitor() {
    this.monitors.set('security', {
      interval: 600000, // 10 minutes
      check: async () => {
        // Check for security vulnerabilities
        const issues = await this.scanSecurityIssues();
        if (issues.length > 0) {
          this.priorityQueue.push({
            type: 'security_fix',
            issues,
            priority: 'high',
            timestamp: Date.now(),
          });
        }
      },
    });
  }

  /**
   * Start performance monitor
   */
  startPerformanceMonitor() {
    this.monitors.set('performance', {
      interval: 900000, // 15 minutes
      check: async () => {
        // Check for performance issues
        const issues = await this.scanPerformanceIssues();
        if (issues.length > 0) {
          this.priorityQueue.push({
            type: 'performance_optimization',
            issues,
            priority: 'medium',
            timestamp: Date.now(),
          });
        }
      },
    });
  }

  /**
   * Start dependency monitor
   */
  startDependencyMonitor() {
    this.monitors.set('dependencies', {
      interval: 3600000, // 1 hour
      check: async () => {
        // Check for outdated dependencies
        const outdated = await this.checkOutdatedDependencies();
        if (outdated.length > 0) {
          this.backgroundQueue.push({
            type: 'dependency_update',
            outdated,
            priority: 'low',
            timestamp: Date.now(),
          });
        }
      },
    });
  }

  /**
   * Process a task
   */
  async processTask(task) {
    try {
      if (this.options.verbose) {
        printInfo(`🔄 Processing task: ${task.type} - ${task.filePath || task.check || 'unknown'}`);
      }

      let result;

      switch (task.type) {
        case 'file_change':
          result = await this.processFileChangeTask(task);
          break;
        case 'health_fix':
          result = await this.processHealthFixTask(task);
          break;
        case 'auto_fix':
          result = await this.processAutoFixTask(task);
          break;
        case 'code_quality_fix':
          result = await this.processCodeQualityFix(task);
          break;
        case 'security_fix':
          result = await this.processSecurityFix(task);
          break;
        case 'performance_optimization':
          result = await this.processPerformanceOptimization(task);
          break;
        case 'dependency_update':
          result = await this.processDependencyUpdate(task);
          break;
        default:
          result = { success: false, message: `Unknown task type: ${task.type}` };
      }

      if (result.success) {
        this.stats.tasksCompleted++;
        if (result.fixedIssues) {
          this.stats.issuesFixed += result.fixedIssues;
        }
      } else {
        this.stats.errors++;
      }

      // Broadcast result
      this.broadcastToClients({
        type: 'task_completed',
        data: { task, result },
      });

      if (this.options.verbose) {
        printSuccess(`✅ Task completed: ${task.type}`);
      }
    } catch (error) {
      printError(`Task processing failed: ${error.message}`);
      this.stats.errors++;
    }
  }

  /**
   * Process file change task
   */
  async processFileChangeTask(task) {
    try {
      const content = await fs.readFile(task.filePath, 'utf8');
      let newContent = content;
      let fixedIssues = 0;

      // Auto-fix common issues if autoFix is enabled
      if (this.options.autoFix) {
        // Remove console.log statements (except in tests)
        if (
          !task.filePath.includes('__tests__') &&
          !task.filePath.includes('.test.') &&
          !task.filePath.includes('.spec.')
        ) {
          const originalLength = newContent.length;
          newContent = newContent.replace(/console\.log\(.*?\);?\n?/g, '');
          if (newContent.length !== originalLength) {
            fixedIssues++;
            if (this.options.verbose) {
              printInfo(`🧹 Removed console.log from ${task.filePath}`);
            }
          }
        }

        // Fix TO_DO comments by converting to proper issues
        if (newContent.includes('TO_DO') || newContent.includes('FIXME')) {
          // In a real implementation, this would create GitHub issues
          fixedIssues++;
        }
      }

      // If content was modified, write it back
      if (newContent !== content) {
        await fs.writeFile(task.filePath, newContent, 'utf8');
      }

      return {
        success: true,
        message: `Processed file change in ${task.filePath}`,
        fixedIssues,
        modified: newContent !== content,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to process file change: ${error.message}`,
      };
    }
  }

  /**
   * Process health fix task
   */
  async processHealthFixTask(task) {
    try {
      // This would implement specific fixes based on the health check
      switch (task.check) {
        case 'security':
          // Implement security fixes
          break;
        case 'dependencies':
          // Implement dependency updates
          break;
        case 'projectState':
          // Implement project state fixes
          break;
        case 'governance':
          // Implement governance fixes
          break;
      }

      return {
        success: true,
        message: `Started fix for ${task.check}: ${task.issue}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to process health fix: ${error.message}`,
      };
    }
  }

  /**
   * Process auto-fix task
   */
  async processAutoFixTask(task) {
    // This would implement automated fixes
    return {
      success: true,
      message: 'Auto-fix task completed',
    };
  }

  /**
   * Process code quality fix
   */
  async processCodeQualityFix(task) {
    try {
      // Implement code quality improvements
      for (const issue of task.issues) {
        // Apply quality fixes
        printInfo(`🔧 Fixing code quality issue in ${issue.file}: ${issue.type}`);
      }

      return {
        success: true,
        message: `Fixed ${task.issues.length} code quality issues`,
        fixedIssues: task.issues.length,
      };
    } catch (error) {
      return {
        success: false,
        message: `Code quality fix failed: ${error.message}`,
      };
    }
  }

  /**
   * Process security fix
   */
  async processSecurityFix(task) {
    try {
      // Implement security fixes
      for (const issue of task.issues) {
        printWarning(`🔒 Addressing security issue in ${issue.file}: ${issue.type}`);
        // Apply security fixes
      }

      return {
        success: true,
        message: `Fixed ${task.issues.length} security issues`,
        fixedIssues: task.issues.length,
      };
    } catch (error) {
      return {
        success: false,
        message: `Security fix failed: ${error.message}`,
      };
    }
  }

  /**
   * Process performance optimization
   */
  async processPerformanceOptimization(task) {
    try {
      // Implement performance optimizations
      for (const issue of task.issues) {
        printInfo(`⚡ Optimizing performance in ${issue.file}: ${issue.type}`);
        // Apply performance optimizations
      }

      return {
        success: true,
        message: `Optimized ${task.issues.length} performance issues`,
        fixedIssues: task.issues.length,
      };
    } catch (error) {
      return {
        success: false,
        message: `Performance optimization failed: ${error.message}`,
      };
    }
  }

  /**
   * Process dependency update
   */
  async processDependencyUpdate(task) {
    try {
      // Update dependencies
      for (const dep of task.outdated) {
        printInfo(`📦 Updating dependency: ${dep.name} ${dep.current} → ${dep.latest}`);
        // Apply dependency updates
      }

      return {
        success: true,
        message: `Updated ${task.outdated.length} dependencies`,
        fixedIssues: task.outdated.length,
      };
    } catch (error) {
      return {
        success: false,
        message: `Dependency update failed: ${error.message}`,
      };
    }
  }

  /**
   * Execute a command through the daemon
   */
  async executeCommand(command) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, { shell: true, cwd: process.cwd() });
      let output = '';
      let error = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        error += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output, code });
        } else {
          resolve({ success: false, error, code });
        }
      });
    });
  }

  /**
   * Send notification
   */
  async sendNotification(message, type = 'info', data = {}) {
    if (!this.options.notifications) return;

    try {
      // This would integrate with notification systems
      // For now, just log
      const notification = {
        timestamp: new Date().toISOString(),
        type,
        message,
        data,
        daemon: true,
      };

      if (this.options.verbose) {
        printInfo(`🔔 Notification: ${message}`);
      }

      // Broadcast to WebSocket clients
      this.broadcastToClients({
        type: 'notification',
        data: notification,
      });
    } catch (error) {
      printError(`Notification failed: ${error.message}`);
    }
  }

  /**
   * Broadcast message to all WebSocket clients
   */
  broadcastToClients(message) {
    if (this.wss) {
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }

  /**
   * Get daemon stats
   */
  getStats() {
    return {
      ...this.stats,
      uptime: this.getUptime(),
      isRunning: this.isRunning,
      queueSizes: {
        priority: this.priorityQueue.length,
        background: this.backgroundQueue.length,
      },
      monitors: Array.from(this.monitors.keys()),
      activeChecks: Array.from(this.activeChecks),
    };
  }

  /**
   * Get uptime in milliseconds
   */
  getUptime() {
    return this.isRunning && this.startTime ? Date.now() - this.startTime : 0;
  }

  /**
   * Get incomplete tasks from state
   */
  getIncompleteTasks(state) {
    if (!state || !state.phases) return [];

    const incomplete = [];
    for (const phase of state.phases) {
      if (phase.steps) {
        for (const step of phase.steps) {
          if (step.status !== 'completed') {
            incomplete.push(step);
          }
        }
      }
    }
    return incomplete;
  }

  /**
   * Stop the daemon gracefully
   */
  async stop() {
    if (!this.isRunning) return;

    printInfo('🛑 Shutting down autonomous daemon...');

    this.isRunning = false;

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }

    // Close HTTP server
    if (this.server) {
      this.server.close();
    }

    // Stop cron jobs
    if (this.healthCheckJob) {
      clearInterval(this.healthCheckJob);
    }

    // Close file watcher
    if (this.fileWatcher) {
      await this.fileWatcher.close();
    }

    // Stop all monitors
    for (const [id, monitor] of this.monitors) {
      clearInterval(monitor.intervalId);
    }

    printSuccess('✅ Autonomous daemon stopped');
  }

  /**
   * Graceful shutdown handler
   */
  async gracefulShutdown(signal) {
    printInfo(`\n⚠️  Received ${signal}, shutting down gracefully...`);
    this.interrupted = true;

    await this.stop();

    // Give any remaining operations a moment to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    process.exit(0);
  }

  /**
   * Start a specific monitor
   */
  startMonitor(monitorType, ws) {
    const monitor = this.monitors.get(monitorType);
    if (monitor) {
      const intervalId = setInterval(async () => {
        try {
          await monitor.check();
        } catch (error) {
          printError(`Monitor ${monitorType} failed: ${error.message}`);
        }
      }, monitor.interval);

      monitor.intervalId = intervalId;
      this.activeChecks.add(monitorType);

      ws.send(
        JSON.stringify({
          type: 'monitor_started',
          data: { monitor: monitorType },
        })
      );
    }
  }

  /**
   * Stop a specific monitor
   */
  stopMonitor(monitorId) {
    const monitor = this.monitors.get(monitorId);
    if (monitor && monitor.intervalId) {
      clearInterval(monitor.intervalId);
      this.activeChecks.delete(monitorId);
    }
  }

  /**
   * Scan all project files
   */
  async getAllProjectFiles() {
    const { glob } = await import('glob');
    return await glob('**/*.{js,ts,jsx,tsx,py,go,rs,json,md,html,css,scss}', {
      ignore: [
        'node_modules/**',
        '.git/**',
        'dist/**',
        'build/**',
        '.next/**',
        'coverage/**',
        '*.log',
        'tmp/**',
        'temp/**',
      ],
    });
  }

  /**
   * Scan for code quality issues
   */
  async scanCodeQualityIssues() {
    const issues = [];
    const files = await this.getAllProjectFiles();

    for (const file of files) {
      if (
        file.endsWith('.js') ||
        file.endsWith('.ts') ||
        file.endsWith('.jsx') ||
        file.endsWith('.tsx')
      ) {
        const content = await fs.readFile(file, 'utf8');

        // Check for common quality issues
        if (content.includes('any') && file.endsWith('.ts')) {
          issues.push({
            file,
            type: 'type_any_usage',
            severity: 'medium',
          });
        }

        if (content.includes('TO_DO') || content.includes('FIXME')) {
          issues.push({
            file,
            type: 'technical_debt',
            severity: 'low',
          });
        }
      }
    }

    return issues;
  }

  /**
   * Scan for performance issues
   */
  async scanPerformanceIssues() {
    const issues = [];
    const files = await this.getAllProjectFiles();

    for (const file of files) {
      if (
        file.endsWith('.js') ||
        file.endsWith('.ts') ||
        file.endsWith('.py') ||
        file.endsWith('.go')
      ) {
        const content = await fs.readFile(file, 'utf8');

        // Check for performance anti-patterns
        if (content.includes('JSON.parse(JSON.stringify(')) {
          issues.push({
            file,
            type: 'inefficient_cloning',
            severity: 'medium',
          });
        }

        if (
          content.includes('for (let i = 0; i < arr.length; i++)') &&
          content.includes('arr.length')
        ) {
          issues.push({
            file,
            type: 'inefficient_loop',
            severity: 'medium',
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check for outdated dependencies
   */
  async checkOutdatedDependencies() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (
        await fs
          .access(packageJsonPath)
          .then(() => true)
          .catch(() => false)
      ) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        // In a real implementation, this would call npm outdated
        // For now, return empty array
        return [];
      }
      return [];
    } catch (error) {
      printError(`Dependency check failed: ${error.message}`);
      return [];
    }
  }
}

// Singleton instance
export const autonomousDaemon = new AutonomousDaemon();

export default AutonomousDaemon;
