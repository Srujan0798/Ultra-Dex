#!/usr/bin/env node

/**
 * Ultra-Dex Core API Server
 * Production-ready API server for the Ultra-Dex orchestration platform
 */

import 'dotenv/config';
import { ultraDexAPIServer } from './server.js';
import { logger } from '../lib/logger.js';

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    logger.info('🚀 Starting Ultra-Dex Core API Server...');
    
    // Start the API server
    const server = await ultraDexAPIServer.start(PORT);
    
    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      await ultraDexAPIServer.stop();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      await ultraDexAPIServer.stop();
      process.exit(0);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('Failed to start Ultra-Dex Core API Server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  startServer();
}

// Export the server for use in tests and other modules
export { ultraDexAPIServer };
export default ultraDexAPIServer;