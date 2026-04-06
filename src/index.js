// Copyright (c) 2026 Ultra-Dex
// src/index.js

import 'reflect-metadata';

/**
 * Ultra-Dex Meta-Layer - Main Entry Point
 * The AI Orchestration Meta-Layer for SaaS Development
 */

// Core components
import { UltraDexMetaLayer, ultraDex, agentOrchestrator } from './core/index.js';
import { aiMetaLayer } from './core/ai/ai-meta-layer.js';
import { ppmManager } from './core/memory/index.js';

// Performance components
import { advancedPerfOptimizer } from './core/performance/advanced-optimizer.js';
import { perfDashboard } from './core/performance/monitoring-dashboard.js';
import { systemHealthChecker } from './core/system/health-checker.js';

// Utilities
import { logger } from './utils/logging.js';
import { configLoader } from './utils/config-loader.js';
import { container, createSessionContainer } from './core/di/container.js';
import { createSessionScope, resolveSessionOrchestrator } from './core/di/session-scope.js';

// Export the main instance
export { UltraDexMetaLayer, ultraDex };
export default ultraDex;

// Export core components individually
export { 
  aiMetaLayer, 
  agentOrchestrator, 
  ppmManager,
  advancedPerfOptimizer,
  perfDashboard,
  systemHealthChecker,
  logger,
  configLoader,
  container,
  createSessionContainer,
  createSessionScope,
  resolveSessionOrchestrator
};

// Export enhanced system with all optimizations
export const ultraDexEnhanced = {
  core: ultraDex,
  ai: aiMetaLayer,
  agents: agentOrchestrator,
  memory: ppmManager,
  performance: advancedPerfOptimizer,
  monitoring: perfDashboard,
  health: systemHealthChecker,
  utils: {
    logger,
    config: configLoader
  }
};

// Initialize the system with all optimizations
export async function initializeEnhancedSystem(options = {}) {
  logger.info('🚀 Initializing Enhanced Ultra-Dex System...');
  
  // Initialize core system
  await ultraDex.initialize();
  
  // Initialize performance optimizer
  await advancedPerfOptimizer.initialize();
  
  // Initialize health checker
  await systemHealthChecker.initialize();
  
  // Start monitoring dashboard if enabled
  if (options.enableMonitoring !== false) {
    await perfDashboard.start({
      port: options.dashboardPort || 4002,
      enableRealtimeUpdates: true
    });
  }
  
  // Start health monitoring
  if (options.enableHealthMonitoring !== false) {
    systemHealthChecker.startMonitoring();
  }
  
  logger.success('✅ Enhanced Ultra-Dex System initialized successfully!');
  
  return ultraDexEnhanced;
}

// Run health checks
export async function runHealthCheck() {
  return await systemHealthChecker.performHealthCheck();
}

// Get system metrics
export async function getSystemMetrics() {
  return {
    performance: advancedPerfOptimizer.getAdvancedMetrics(),
    health: await systemHealthChecker.performHealthCheck(),
    timestamp: new Date().toISOString()
  };
}

// Shutdown the enhanced system
export async function shutdownEnhancedSystem() {
  logger.info('🛑 Shutting down Enhanced Ultra-Dex System...');
  
  // Stop monitoring dashboard
  await perfDashboard.stop();
  
  // Stop health monitoring
  systemHealthChecker.stopMonitoring();
  
  // Shutdown performance optimizer
  await advancedPerfOptimizer.shutdown();
  
  // Shutdown core system
  await ultraDex.shutdown();
  
  logger.success('✅ Enhanced Ultra-Dex System shut down successfully');
}
