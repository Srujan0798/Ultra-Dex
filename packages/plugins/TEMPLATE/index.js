/**
 * Ultra-Dex Plugin Template
 *
 * This is a starter template for creating Ultra-Dex plugins.
 * Copy this directory and customize for your plugin.
 */

import { UltraDexPlugin } from '@ultra-dex/core';

/**
 * Plugin class
 */
export class TemplatePlugin extends UltraDexPlugin {
  constructor(config = {}) {
    super({
      id: 'template',
      name: 'Plugin Template',
      version: '6.0.0',
      ...config,
    });

    this.config = {
      enabled: true,
      option1: config.option1 || 'default-value',
      ...config,
    };
  }

  /**
   * Initialize the plugin
   */
  async initialize(context) {
    console.log(`[${this.name}] Initializing...`);

    // Register hooks
    this.registerHook('before:task', this.onBeforeTask.bind(this));
    this.registerHook('after:task', this.onAfterTask.bind(this));
    this.registerHook('on:error', this.onError.bind(this));

    return this;
  }

  /**
   * Hook: Before task execution
   */
  async onBeforeTask(task) {
    console.log(`[${this.name}] Before task: ${task.id}`);
    // Modify task if needed
    return task;
  }

  /**
   * Hook: After task execution
   */
  async onAfterTask(result) {
    console.log(`[${this.name}] After task: ${result.taskId}`);
    // Process result if needed
    return result;
  }

  /**
   * Hook: On error
   */
  async onError(error) {
    console.error(`[${this.name}] Error: ${error.message}`);
    // Handle error if needed
  }

  /**
   * Custom plugin method
   */
  async customAction(data) {
    // Your custom logic here
    return {
      success: true,
      data,
      processed: true,
    };
  }

  /**
   * Cleanup when plugin is unloaded
   */
  async cleanup() {
    console.log(`[${this.name}] Cleaning up...`);
    // Cleanup resources
  }
}

/**
 * Factory function for creating plugin instance
 */
export function createPlugin(config = {}) {
  return new TemplatePlugin(config);
}

export default TemplatePlugin;
