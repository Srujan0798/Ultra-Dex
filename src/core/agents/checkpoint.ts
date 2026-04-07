var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
import { EventEmitter } from "events";
import * as fs from "fs";
import * as path from "path";
let Checkpoint = class extends EventEmitter {
  constructor(options = {}) {
    super();
    this.checkpoints = /* @__PURE__ */ new Map();
    this.config = {
      storagePath: options.storagePath || "./.checkpoints",
      autoSave: options.autoSave !== false,
      saveInterval: options.saveInterval || 5e3,
      compressionEnabled: options.compressionEnabled || false,
      maxCheckpointsPerAgent: options.maxCheckpointsPerAgent || 10,
      ...options
    };
    this.state = "idle";
    this.saveTimer = null;
    this.ensureStorageDir();
  }
  /**
   * Initialize checkpoint system
   */
  async initialize() {
    this.state = "ready";
    if (this.config.autoSave) {
      this.startAutoSave();
    }
    this.emit("checkpoint.ready");
    return this;
  }
  /**
   * Ensure storage directory exists
   */
  ensureStorageDir() {
    const dir = this.config.storagePath;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  /**
   * Create a checkpoint for an agent
   */
  async createCheckpoint(agentId, state, metadata = {}) {
    const checkpointId = this.generateId();
    const timestamp = Date.now();
    const checkpoint = {
      id: checkpointId,
      agentId,
      state,
      metadata,
      timestamp,
      version: 1,
      compressed: false
    };
    if (!this.checkpoints.has(agentId)) {
      this.checkpoints.set(agentId, []);
    }
    const agentCheckpoints = this.checkpoints.get(agentId);
    agentCheckpoints.push(checkpoint);
    if (agentCheckpoints.length > this.config.maxCheckpointsPerAgent) {
      agentCheckpoints.shift();
    }
    this.emit("checkpoint.created", { checkpointId, agentId, timestamp });
    if (this.config.autoSave) {
      await this.saveCheckpointToDisk(checkpoint);
    }
    return checkpoint;
  }
  /**
   * Save checkpoint to disk
   */
  async saveCheckpointToDisk(checkpoint) {
    try {
      const filename = this.getCheckpointFilename(checkpoint.agentId, checkpoint.id);
      const data = JSON.stringify(checkpoint, null, 2);
      fs.writeFileSync(filename, data, "utf8");
      this.emit("checkpoint.saved", { checkpointId: checkpoint.id, agentId: checkpoint.agentId });
    } catch (error) {
      this.emit("checkpoint.save-failed", { checkpointId: checkpoint.id, error });
      throw error;
    }
  }
  /**
   * Load checkpoint from disk
   */
  async loadCheckpointFromDisk(agentId, checkpointId) {
    try {
      const filename = this.getCheckpointFilename(agentId, checkpointId);
      if (!fs.existsSync(filename)) {
        throw new Error(`Checkpoint file not found: ${filename}`);
      }
      const data = fs.readFileSync(filename, "utf8");
      const checkpoint = JSON.parse(data);
      this.emit("checkpoint.loaded", { checkpointId, agentId });
      return checkpoint;
    } catch (error) {
      this.emit("checkpoint.load-failed", { checkpointId, agentId, error });
      throw error;
    }
  }
  /**
   * Restore agent to a checkpoint
   */
  async restoreFromCheckpoint(agentId, checkpointId = null) {
    const agentCheckpoints = this.checkpoints.get(agentId);
    if (!agentCheckpoints || agentCheckpoints.length === 0) {
      throw new Error(`No checkpoints found for agent ${agentId}`);
    }
    const checkpoint = checkpointId ? agentCheckpoints.find((c) => c.id === checkpointId) : agentCheckpoints[agentCheckpoints.length - 1];
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found for agent ${agentId}`);
    }
    this.emit("checkpoint.restore.started", { checkpointId: checkpoint.id, agentId });
    try {
      const restoredState = JSON.parse(JSON.stringify(checkpoint.state));
      this.emit("checkpoint.restore.succeeded", {
        checkpointId: checkpoint.id,
        agentId,
        timestamp: checkpoint.timestamp
      });
      return restoredState;
    } catch (error) {
      this.emit("checkpoint.restore.failed", { agentId, checkpointId, error });
      throw error;
    }
  }
  /**
   * List checkpoints for an agent
   */
  listCheckpoints(agentId) {
    const checkpoints = this.checkpoints.get(agentId) || [];
    return checkpoints.map((c) => ({
      id: c.id,
      agentId: c.agentId,
      timestamp: c.timestamp,
      metadata: c.metadata,
      version: c.version
    }));
  }
  /**
   * Delete a checkpoint
   */
  deleteCheckpoint(agentId, checkpointId) {
    const checkpoints = this.checkpoints.get(agentId);
    if (!checkpoints)
      return false;
    const index = checkpoints.findIndex((c) => c.id === checkpointId);
    if (index === -1)
      return false;
    checkpoints.splice(index, 1);
    try {
      const filename = this.getCheckpointFilename(agentId, checkpointId);
      if (fs.existsSync(filename)) {
        fs.unlinkSync(filename);
      }
    } catch (error) {
      this.emit("checkpoint.delete-failed", { checkpointId, agentId, error });
    }
    this.emit("checkpoint.deleted", { checkpointId, agentId });
    return true;
  }
  /**
   * Clean old checkpoints
   */
  cleanOldCheckpoints(agentId, retentionDays = 30) {
    const checkpoints = this.checkpoints.get(agentId);
    if (!checkpoints)
      return;
    const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1e3;
    const toDelete = checkpoints.filter((c) => c.timestamp < cutoffTime);
    for (const checkpoint of toDelete) {
      this.deleteCheckpoint(agentId, checkpoint.id);
    }
    this.emit("checkpoints.cleaned", {
      agentId,
      deletedCount: toDelete.length
    });
  }
  /**
   * Start automatic saving
   */
  startAutoSave() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }
    this.saveTimer = setInterval(() => {
      this.saveAllCheckpoints();
    }, this.config.saveInterval);
  }
  /**
   * Save all checkpoints
   */
  async saveAllCheckpoints() {
    const promises = [];
    for (const checkpoints of this.checkpoints.values()) {
      for (const checkpoint of checkpoints) {
        promises.push(this.saveCheckpointToDisk(checkpoint).catch(() => null));
      }
    }
    await Promise.all(promises);
  }
  /**
   * Load all checkpoints from disk
   */
  async loadAllCheckpoints() {
    try {
      const dir = this.config.storagePath;
      if (!fs.existsSync(dir)) {
        return;
      }
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (!file.endsWith(".json"))
          continue;
        try {
          const fullPath = path.join(dir, file);
          const data = fs.readFileSync(fullPath, "utf8");
          const checkpoint = JSON.parse(data);
          if (!this.checkpoints.has(checkpoint.agentId)) {
            this.checkpoints.set(checkpoint.agentId, []);
          }
          this.checkpoints.get(checkpoint.agentId).push(checkpoint);
        } catch (error) {
          this.emit("checkpoint.load-error", { file, error });
        }
      }
      this.emit("checkpoints.loaded", { count: this.checkpoints.size });
    } catch (error) {
      this.emit("checkpoints.load-failed", { error });
      throw error;
    }
  }
  /**
   * Export checkpoint for backup
   */
  async exportCheckpoint(agentId, checkpointId, exportPath) {
    try {
      const checkpoint = this.checkpoints.get(agentId)?.find((c) => c.id === checkpointId);
      if (!checkpoint) {
        throw new Error(`Checkpoint not found: ${checkpointId}`);
      }
      const data = JSON.stringify(checkpoint, null, 2);
      fs.writeFileSync(exportPath, data, "utf8");
      this.emit("checkpoint.exported", { checkpointId, exportPath });
      return exportPath;
    } catch (error) {
      this.emit("checkpoint.export-failed", { checkpointId, error });
      throw error;
    }
  }
  /**
   * Import checkpoint from backup
   */
  async importCheckpoint(importPath) {
    try {
      const data = fs.readFileSync(importPath, "utf8");
      const checkpoint = JSON.parse(data);
      if (!this.checkpoints.has(checkpoint.agentId)) {
        this.checkpoints.set(checkpoint.agentId, []);
      }
      this.checkpoints.get(checkpoint.agentId).push(checkpoint);
      this.emit("checkpoint.imported", {
        checkpointId: checkpoint.id,
        agentId: checkpoint.agentId
      });
      return checkpoint;
    } catch (error) {
      this.emit("checkpoint.import-failed", { importPath, error });
      throw error;
    }
  }
  /**
   * Get checkpoint file path
   */
  getCheckpointFilename(agentId, checkpointId) {
    return path.join(
      this.config.storagePath,
      `${agentId}-${checkpointId}.json`
    );
  }
  /**
   * Get checkpoint statistics
   */
  getStats() {
    let totalCheckpoints = 0;
    const agentStats = {};
    for (const [agentId, checkpoints] of this.checkpoints) {
      agentStats[agentId] = {
        count: checkpoints.length,
        oldest: checkpoints[0]?.timestamp,
        newest: checkpoints[checkpoints.length - 1]?.timestamp
      };
      totalCheckpoints += checkpoints.length;
    }
    return {
      totalCheckpoints,
      agentCount: this.checkpoints.size,
      agentStats,
      storageSize: this.getStorageSize()
    };
  }
  /**
   * Get storage size
   */
  getStorageSize() {
    try {
      let totalSize = 0;
      const dir = this.config.storagePath;
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const stats = fs.statSync(path.join(dir, file));
          totalSize += stats.size;
        }
      }
      return totalSize;
    } catch {
      return 0;
    }
  }
  /**
   * Generate unique ID
   */
  generateId() {
    return `ckpt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Shutdown checkpoint system
   */
  async shutdown() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }
    await this.saveAllCheckpoints();
    this.state = "shutdown";
    this.emit("checkpoint.shutdown");
  }
};
Checkpoint = __decorateClass([
  singleton()
], Checkpoint);
var checkpoint_default = Checkpoint;
export {
  Checkpoint,
  checkpoint_default as default
};
