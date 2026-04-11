// Copyright (c) 2026 Ultra-Dex
// packages/mobile-sdk/src/index.ts

export { UltraDexMobile } from './UltraDexMobile';
export { TaskManager } from './api/TaskManager';
export { AuthManager } from './auth/AuthManager';
export { StorageManager } from './storage/StorageManager';
export { NotificationManager } from './notifications/NotificationManager';
export { VoiceAssistant } from './VoiceAssistant';

// UI Components
export { TaskList } from './components/TaskList';
export { TaskCard } from './components/TaskCard';
export { MonitoringDashboard } from './components/MonitoringDashboard';
export { VoiceCommandButton } from './components/VoiceCommandButton';

// Hooks
export { useTasks } from './hooks/useTasks';
export { useAuth } from './hooks/useAuth';
export { useOfflineSync } from './hooks/useOfflineSync';
export { useVoiceCommands } from './hooks/useVoiceCommands';

// Types
export type {
  Task,
  TaskStatus,
  TaskPriority,
  AuthConfig,
  StorageConfig,
  NotificationConfig,
  VoiceConfig,
  MobileConfig,
} from './types';
