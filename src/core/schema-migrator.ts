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
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { atomicWriteJSON, safeReadJSON } from '../utils/safe-fs.js';
let SchemaMigrator = class {
  /**
   * @param {object} options - Migrator options
   * @param {string} options.migrationsPath - Path to migration files
   * @param {string} options.stateFile - Path to migration state file
   * @param {object} options.db - Database connection/instance
   */
  constructor(options = {}) {
    this.migrationsPath = options.migrationsPath || "./migrations";
    this.stateFile = options.stateFile || "./.migration-state.json";
    this.db = options.db || null;
    this.appliedMigrations = [];
  }
  /**
   * Initialize migrator and load state
   * @returns {Promise<void>}
   */
  async init() {
    const state = await safeReadJSON(this.stateFile, { applied: [], version: 0 });
    this.appliedMigrations = state.applied || [];
    this.currentVersion = state.version || 0;
  }
  /**
   * Get list of pending migrations
   * @returns {Promise<string[]>} Array of migration filenames
   */
  async getPendingMigrations() {
    try {
      const files = await readdir(this.migrationsPath);
      const migrations = files.filter((f) => f.endsWith(".js") || f.endsWith(".sql")).sort();
      return migrations.filter((m) => !this.appliedMigrations.includes(m));
    } catch (error) {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }
  /**
   * Run a single migration
   * @param {string} migrationFile - Migration filename
   * @returns {Promise<object>} Migration result
   */
  async runMigration(migrationFile) {
    const filePath = join(this.migrationsPath, migrationFile);
    const startTime = Date.now();
    try {
      if (migrationFile.endsWith(".js")) {
        const migration = await import(filePath);
        if (typeof migration.up === "function") {
          await migration.up(this.db);
        } else if (typeof migration.default === "function") {
          await migration.default(this.db);
        }
      } else if (migrationFile.endsWith(".sql")) {
        const sql = await readFile(filePath, "utf8");
        if (this.db && typeof this.db.exec === "function") {
          await this.db.exec(sql);
        } else if (this.db && typeof this.db.query === "function") {
          await this.db.query(sql);
        }
      }
      this.appliedMigrations.push(migrationFile);
      this.currentVersion++;
      await this.saveState();
      return {
        success: true,
        migration: migrationFile,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        migration: migrationFile,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }
  /**
   * Run all pending migrations
   * @returns {Promise<object>} Migration results
   */
  async migrate() {
    await this.init();
    const pending = await this.getPendingMigrations();
    const results = [];
    for (const migration of pending) {
      const result = await this.runMigration(migration);
      results.push(result);
      if (!result.success) {
        break;
      }
    }
    return {
      applied: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
      currentVersion: this.currentVersion
    };
  }
  /**
   * Save migration state
   * @returns {Promise<void>}
   */
  async saveState() {
    await atomicWriteJSON(this.stateFile, {
      applied: this.appliedMigrations,
      version: this.currentVersion,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  /**
   * Get current migration status
   * @returns {Promise<object>}
   */
  async status() {
    await this.init();
    const pending = await this.getPendingMigrations();
    return {
      currentVersion: this.currentVersion,
      appliedCount: this.appliedMigrations.length,
      pendingCount: pending.length,
      applied: this.appliedMigrations,
      pending
    };
  }
  /**
   * Rollback last migration (if supported)
   * @returns {Promise<object>}
   */
  async rollback() {
    if (this.appliedMigrations.length === 0) {
      return { success: false, error: "No migrations to rollback" };
    }
    const lastMigration = this.appliedMigrations[this.appliedMigrations.length - 1];
    const filePath = join(this.migrationsPath, lastMigration);
    try {
      if (lastMigration.endsWith(".js")) {
        const migration = await import(filePath);
        if (typeof migration.down === "function") {
          await migration.down(this.db);
        } else {
          return { success: false, error: "Migration does not support rollback" };
        }
      }
      this.appliedMigrations.pop();
      this.currentVersion--;
      await this.saveState();
      return { success: true, rolledBack: lastMigration };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
SchemaMigrator = __decorateClass([
  singleton()
], SchemaMigrator);
var schema_migrator_default = SchemaMigrator;
export {
  SchemaMigrator,
  schema_migrator_default as default
};
