/**
 * Checkpoint System for Agent Sessions
 * Handles saving and restoring agent session states
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { printInfo, printSuccess, printWarning, printError } from '../../utils/output.js';
import chalk from 'chalk';
import { AppError } from '../../utils/errors.js';

// Checkpoint storage directory
const CHECKPOINT_DIR = path.join(os.homedir(), '.ultra-dex', 'checkpoints');

// Maximum number of full checkpoints to keep
const MAX_FULL_CHECKPOINTS = 5;

// Maximum number of differential checkpoints to keep
const MAX_DIFF_CHECKPOINTS = 10;

export class CheckpointSystem {
  constructor() {
    this.checkpointDir = CHECKPOINT_DIR;
    this.initialized = false;
  }

  /**
   * Initialize the checkpoint system
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      await fs.mkdir(this.checkpointDir, { recursive: true });
      this.initialized = true;
      printInfo(chalk.cyan('🔄 Initializing Checkpoint System...'));
      printSuccess(chalk.green('✅ Checkpoint System Initialized'));
    } catch (error) {
      printError(chalk.red(`❌ Failed to initialize checkpoint system: ${error.message}`));
      throw error;
    }
  }

  /**
   * Create a checkpoint for a session
   */
  async createCheckpoint(sessionId, sessionState, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const checkpointId = uuidv4();
    const checkpointPath = path.join(this.checkpointDir, `${sessionId}-${checkpointId}.json`);
    
    const checkpointData = {
      id: checkpointId,
      sessionId,
      step: sessionState.currentStep || 0,
      timestamp: new Date().toISOString(),
      state: sessionState,
      metadata: {
        version: '3.7.2',
        agent: sessionState.agent || 'unknown',
        task: sessionState.currentTask || 'unknown',
        ...options.metadata
      }
    };

    try {
      // Save checkpoint data
      await fs.writeFile(checkpointPath, JSON.stringify(checkpointData, null, 2));
      
      // Clean up old checkpoints for this session
      await this.cleanupOldCheckpoints(sessionId);
      
      printSuccess(chalk.green(`📍 Checkpoint created: ${checkpointId} for session ${sessionId}`));
      
      return {
        id: checkpointId,
        path: checkpointPath,
        step: checkpointData.step,
        timestamp: checkpointData.timestamp
      };
    } catch (error) {
      printError(chalk.red(`❌ Failed to create checkpoint: ${error.message}`));
      throw new AppError(`Failed to create checkpoint: ${error.message}`, { 
        code: 'CHECKPOINT_CREATION_FAILED',
        checkpointId 
      });
    }
  }

  /**
   * Restore a session from a checkpoint
   */
  async restoreFromCheckpoint(sessionId, checkpointId = null) {
    if (!this.initialized) {
      await this.initialize();
    }

    let checkpointPath;
    
    if (checkpointId) {
      // Use specific checkpoint
      checkpointPath = path.join(this.checkpointDir, `${sessionId}-${checkpointId}.json`);
    } else {
      // Use latest checkpoint
      const checkpoints = await this.getSessionCheckpoints(sessionId);
      if (checkpoints.length === 0) {
        throw new AppError(`No checkpoints found for session: ${sessionId}`, { 
          code: 'NO_CHECKPOINTS_FOUND' 
        });
      }
      
      const latestCheckpoint = checkpoints.reduce((latest, current) => 
        new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
      );
      
      checkpointPath = latestCheckpoint.path;
    }

    try {
      const checkpointContent = await fs.readFile(checkpointPath, 'utf8');
      const checkpoint = JSON.parse(checkpointContent);
      
      printSuccess(chalk.green(`✅ Restored session ${sessionId} from checkpoint ${checkpoint.id}`));
      
      return {
        state: checkpoint.state,
        checkpointId: checkpoint.id,
        step: checkpoint.step,
        timestamp: checkpoint.timestamp
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new AppError(`Checkpoint file not found: ${checkpointPath}`, { 
          code: 'CHECKPOINT_FILE_NOT_FOUND' 
        });
      }
      printError(chalk.red(`❌ Failed to restore checkpoint: ${error.message}`));
      throw new AppError(`Failed to restore checkpoint: ${error.message}`, { 
        code: 'CHECKPOINT_RESTORE_FAILED' 
      });
    }
  }

  /**
   * Get all checkpoints for a session
   */
  async getSessionCheckpoints(sessionId) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const files = await fs.readdir(this.checkpointDir);
      const sessionCheckpoints = files
        .filter(file => file.startsWith(`${sessionId}-`) && file.endsWith('.json'))
        .map(file => {
          const checkpointId = file.replace(`${sessionId}-`, '').replace('.json', '');
          return {
            id: checkpointId,
            path: path.join(this.checkpointDir, file),
            timestamp: this.extractTimestampFromFilename(file)
          };
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first
      
      return sessionCheckpoints;
    } catch (error) {
      printError(chalk.red(`❌ Failed to get checkpoints: ${error.message}`));
      throw new AppError(`Failed to get checkpoints: ${error.message}`, { 
        code: 'CHECKPOINTS_FETCH_FAILED' 
      });
    }
  }

  /**
   * Extract timestamp from checkpoint filename
   */
  extractTimestampFromFilename(filename) {
    // Extract timestamp from UUID portion of filename
    // Format: sessionId-checkpointId.json
    const parts = filename.split('-');
    if (parts.length >= 5) {
      // Reconstruct UUID and use current time as fallback
      return new Date().toISOString();
    }
    return new Date().toISOString();
  }

  /**
   * List all checkpoints
   */
  async listAllCheckpoints() {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const files = await fs.readdir(this.checkpointDir);
      const checkpoints = files
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const [sessionId, checkpointIdWithExt] = file.split('-');
          const checkpointId = checkpointIdWithExt.replace('.json', '');
          return {
            id: checkpointId,
            sessionId,
            path: path.join(this.checkpointDir, file),
            timestamp: this.extractTimestampFromFilename(file)
          };
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return checkpoints;
    } catch (error) {
      printError(chalk.red(`❌ Failed to list checkpoints: ${error.message}`));
      throw new AppError(`Failed to list checkpoints: ${error.message}`, { 
        code: 'CHECKPOINTS_LIST_FAILED' 
      });
    }
  }

  /**
   * Delete a specific checkpoint
   */
  async deleteCheckpoint(sessionId, checkpointId) {
    if (!this.initialized) {
      await this.initialize();
    }

    const checkpointPath = path.join(this.checkpointDir, `${sessionId}-${checkpointId}.json`);
    
    try {
      await fs.unlink(checkpointPath);
      printSuccess(chalk.green(`🗑️  Deleted checkpoint: ${checkpointId}`));
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        printWarning(chalk.yellow(`⚠️  Checkpoint not found: ${checkpointId}`));
        return false;
      }
      printError(chalk.red(`❌ Failed to delete checkpoint: ${error.message}`));
      throw new AppError(`Failed to delete checkpoint: ${error.message}`, { 
        code: 'CHECKPOINT_DELETE_FAILED' 
      });
    }
  }

  /**
   * Cleanup old checkpoints for a session
   */
  async cleanupOldCheckpoints(sessionId) {
    const checkpoints = await this.getSessionCheckpoints(sessionId);
    
    // Keep only the most recent full checkpoints
    const checkpointsToDelete = checkpoints.slice(MAX_FULL_CHECKPOINTS);
    
    for (const checkpoint of checkpointsToDelete) {
      await this.deleteCheckpoint(sessionId, checkpoint.id);
    }
  }

  /**
   * Cleanup all checkpoints older than specified days
   */
  async cleanupOldCheckpoints(days = 30) {
    if (!this.initialized) {
      await this.initialize();
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    try {
      const files = await fs.readdir(this.checkpointDir);
      const oldFiles = files.filter(file => {
        const filePath = path.join(this.checkpointDir, file);
        // In a real implementation, we'd check the actual file modification time
        // For now, we'll just use the timestamp in the filename if available
        return true; // Placeholder - implement proper date checking
      });
      
      for (const file of oldFiles) {
        const filePath = path.join(this.checkpointDir, file);
        await fs.unlink(filePath);
        printInfo(chalk.gray(`🧹 Cleaned up old checkpoint: ${file}`));
      }
      
      return oldFiles.length;
    } catch (error) {
      printError(chalk.red(`❌ Failed to cleanup old checkpoints: ${error.message}`));
      throw new AppError(`Failed to cleanup checkpoints: ${error.message}`, { 
        code: 'CHECKPOINT_CLEANUP_FAILED' 
      });
    }
  }

  /**
   * Get checkpoint statistics
   */
  async getCheckpointStats() {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const files = await fs.readdir(this.checkpointDir);
      const checkpoints = files.filter(file => file.endsWith('.json'));
      
      // Group by session ID
      const sessionMap = new Map();
      for (const file of checkpoints) {
        const [sessionId] = file.split('-');
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, []);
        }
        sessionMap.get(sessionId).push(file);
      }
      
      return {
        totalCheckpoints: checkpoints.length,
        totalSessions: sessionMap.size,
        sessions: Array.from(sessionMap.entries()).map(([sessionId, files]) => ({
          sessionId,
          checkpointCount: files.length
        }))
      };
    } catch (error) {
      printError(chalk.red(`❌ Failed to get checkpoint stats: ${error.message}`));
      throw new AppError(`Failed to get checkpoint stats: ${error.message}`, { 
        code: 'CHECKPOINT_STATS_FAILED' 
      });
    }
  }

  /**
   * Validate a checkpoint file
   */
  async validateCheckpoint(sessionId, checkpointId) {
    if (!this.initialized) {
      await this.initialize();
    }

    const checkpointPath = path.join(this.checkpointDir, `${sessionId}-${checkpointId}.json`);
    
    try {
      const content = await fs.readFile(checkpointPath, 'utf8');
      const checkpoint = JSON.parse(content);
      
      // Validate required fields
      const requiredFields = ['id', 'sessionId', 'timestamp', 'state'];
      const missingFields = requiredFields.filter(field => checkpoint[field] === undefined);
      
      if (missingFields.length > 0) {
        return {
          valid: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        };
      }
      
      // Validate session ID matches filename
      if (checkpoint.sessionId !== sessionId) {
        return {
          valid: false,
          error: `Session ID mismatch: ${checkpoint.sessionId} vs ${sessionId}`
        };
      }
      
      return {
        valid: true,
        checkpointId: checkpoint.id,
        step: checkpoint.step,
        timestamp: checkpoint.timestamp
      };
    } catch (error) {
      return {
        valid: false,
        error: `Invalid checkpoint file: ${error.message}`
      };
    }
  }
}

// Create singleton instance
export const checkpointSystem = new CheckpointSystem();

export default checkpointSystem;