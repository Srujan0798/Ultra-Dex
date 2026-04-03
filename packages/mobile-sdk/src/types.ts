// Copyright (c) 2026 Ultra-Dex
// packages/mobile-sdk/src/types.ts

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
  localId?: string; // For offline support
  syncedAt?: Date;
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AuthConfig {
  apiKey?: string;
  baseUrl: string;
  timeout?: number;
  enableBiometrics?: boolean;
  biometricPrompt?: string;
}

export interface StorageConfig {
  enableOfflineStorage: boolean;
  syncInterval?: number; // in minutes
  maxOfflineTasks?: number;
}

export interface NotificationConfig {
  enablePushNotifications: boolean;
  enableTaskCompletionAlerts: boolean;
  enableSystemAlerts: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
}

export interface VoiceConfig {
  enableVoiceCommands: boolean;
  language?: string;
  wakeWord?: string;
  autoStart?: boolean;
}

export interface MobileConfig {
  auth: AuthConfig;
  storage: StorageConfig;
  notifications: NotificationConfig;
  voice?: VoiceConfig;
  instanceId?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface SyncResult {
  uploaded: number;
  downloaded: number;
  conflicts: number;
  errors: string[];
}
