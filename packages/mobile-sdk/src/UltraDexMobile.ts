// Copyright (c) 2026 Ultra-Dex
// packages/mobile-sdk/src/UltraDexMobile.ts

import { TaskManager } from './api/TaskManager';
import { AuthManager } from './auth/AuthManager';
import { StorageManager } from './storage/StorageManager';
import { NotificationManager } from './notifications/NotificationManager';
import { VoiceAssistant } from './VoiceAssistant';
import { MobileConfig } from './types';

export class UltraDexMobile {
  private config: MobileConfig;
  public taskManager: TaskManager;
  public authManager: AuthManager;
  public storageManager: StorageManager;
  public notificationManager: NotificationManager;
  public voiceAssistant?: VoiceAssistant;

  constructor(config: MobileConfig) {
    this.config = config;

    // Initialize core managers
    this.authManager = new AuthManager(config.auth);
    this.storageManager = new StorageManager(config.storage);
    this.notificationManager = new NotificationManager(config.notifications);
    this.taskManager = new TaskManager(
      this.authManager,
      this.storageManager,
      this.notificationManager
    );

    // Initialize voice assistant if enabled
    if (config.voice?.enableVoiceCommands) {
      this.voiceAssistant = new VoiceAssistant(config.voice, this.taskManager);
    }
  }

  /**
   * Initialize the mobile SDK
   */
  async initialize(): Promise<void> {
    try {
      // Initialize auth
      await this.authManager.initialize();

      // Initialize storage
      await this.storageManager.initialize();

      // Initialize notifications
      await this.notificationManager.initialize();

      // Initialize task manager
      await this.taskManager.initialize();

      // Initialize voice assistant
      if (this.voiceAssistant) {
        await this.voiceAssistant.initialize();
      }

      console.log('Ultra-Dex Mobile SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Ultra-Dex Mobile SDK:', error);
      throw error;
    }
  }

  /**
   * Execute a task using Ultra-Dex
   */
  async executeTask(
    task: string,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      tags?: string[];
      metadata?: Record<string, any>;
    } = {}
  ): Promise<any> {
    return this.taskManager.executeTask(task, options);
  }

  /**
   * Get system status
   */
  async getStatus(): Promise<{
    authenticated: boolean;
    offlineMode: boolean;
    pendingSync: boolean;
    voiceEnabled: boolean;
  }> {
    const [authenticated, offlineMode, pendingSync] = await Promise.all([
      this.authManager.isAuthenticated(),
      this.storageManager.isOfflineMode(),
      this.storageManager.hasPendingSync(),
    ]);

    return {
      authenticated,
      offlineMode,
      pendingSync,
      voiceEnabled: !!this.voiceAssistant,
    };
  }

  /**
   * Sync offline data when online
   */
  async syncOfflineData(): Promise<void> {
    await this.storageManager.syncWithServer();
  }

  /**
   * Shutdown the SDK
   */
  async shutdown(): Promise<void> {
    if (this.voiceAssistant) {
      await this.voiceAssistant.shutdown();
    }
    await this.notificationManager.shutdown();
    await this.taskManager.shutdown();
    await this.storageManager.shutdown();
    await this.authManager.shutdown();
  }
}
