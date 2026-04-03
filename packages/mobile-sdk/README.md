# Ultra-Dex Mobile SDK

A React Native SDK for Ultra-Dex mobile integration, providing AI orchestration capabilities with offline support, push notifications, voice commands, and biometric authentication.

## Features

- **Mobile-Optimized API Client**: Efficient API communication for mobile networks
- **Offline Capabilities**: Store tasks locally and sync when online
- **Push Notifications**: Real-time alerts for task completion and system events
- **Voice Commands**: AI assistant with voice control
- **Biometric Authentication**: Secure access using fingerprint/face ID
- **Task Management**: Create, monitor, and control AI orchestration tasks
- **Real-time Monitoring**: System status and performance dashboards

## Installation

```bash
npm install @ultra-dex/mobile-sdk
# or
yarn add @ultra-dex/mobile-sdk
```

### Peer Dependencies

Make sure to install the required peer dependencies:

```bash
npm install react-native react-native-async-storage @react-native-community/push-notification-ios react-native-push-notification @react-native-community/biometrics @react-native-community/voice @react-native-community/netinfo
```

## Quick Start

```typescript
import { UltraDexMobile, MobileConfig } from '@ultra-dex/mobile-sdk';

const config: MobileConfig = {
  auth: {
    baseUrl: 'https://api.ultra-dex.ai',
    enableBiometrics: true,
    biometricPrompt: 'Authenticate to access Ultra-Dex',
  },
  storage: {
    enableOfflineStorage: true,
    syncInterval: 15, // minutes
  },
  notifications: {
    enablePushNotifications: true,
    enableTaskCompletionAlerts: true,
  },
  voice: {
    enableVoiceCommands: true,
    wakeWord: 'ultra dex',
  },
};

const ultraDex = new UltraDexMobile(config);
await ultraDex.initialize();

// Execute a task
const task = await ultraDex.executeTask('Analyze this codebase and provide insights');

// Get system status
const status = await ultraDex.getStatus();
```

## Configuration

### MobileConfig

```typescript
interface MobileConfig {
  auth: AuthConfig;
  storage: StorageConfig;
  notifications: NotificationConfig;
  voice?: VoiceConfig;
  instanceId?: string;
}
```

### AuthConfig

```typescript
interface AuthConfig {
  apiKey?: string;
  baseUrl: string;
  timeout?: number;
  enableBiometrics?: boolean;
  biometricPrompt?: string;
}
```

### StorageConfig

```typescript
interface StorageConfig {
  enableOfflineStorage: boolean;
  syncInterval?: number; // in minutes
  maxOfflineTasks?: number;
}
```

### NotificationConfig

```typescript
interface NotificationConfig {
  enablePushNotifications: boolean;
  enableTaskCompletionAlerts: boolean;
  enableSystemAlerts: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
}
```

### VoiceConfig

```typescript
interface VoiceConfig {
  enableVoiceCommands: boolean;
  language?: string;
  wakeWord?: string;
  autoStart?: boolean;
}
```

## Usage

### Task Management

```typescript
// Execute a task
const task = await ultraDex.executeTask('Build a React component', {
  priority: 'high',
  tags: ['frontend', 'react'],
});

// Get all tasks
const tasks = await ultraDex.taskManager.getTasks();

// Get task by ID
const task = await ultraDex.taskManager.getTask(taskId);

// Cancel a task
await ultraDex.taskManager.cancelTask(taskId);

// Retry a failed task
await ultraDex.taskManager.retryTask(taskId);
```

### Offline Sync

```typescript
// Check sync status
const { isOnline, hasPendingSync } = useOfflineSync(storageManager);

// Manual sync
await ultraDex.syncOfflineData();
```

### Voice Commands

```typescript
// Use voice assistant hook
const { isListening, toggleListening } = useVoiceCommands(voiceAssistant);

// Voice commands:
// - "Create task [description]"
// - "List tasks"
// - "Cancel task"
```

### Authentication

```typescript
// Check auth status
const { isAuthenticated, isBiometricsAvailable } = useAuth(authManager);

// Authenticate
await ultraDex.authManager.authenticate();
```

## UI Components

The SDK provides pre-built React Native components:

```typescript
import {
  TaskList,
  TaskCard,
  MonitoringDashboard,
  VoiceCommandButton,
} from '@ultra-dex/mobile-sdk';

// Task list with pull-to-refresh
<TaskList
  tasks={tasks}
  onTaskPress={handleTaskPress}
  onRefresh={refreshTasks}
  refreshing={loading}
/>

// Voice command button with animation
<VoiceCommandButton
  isListening={isListening}
  onPress={toggleListening}
/>

// System monitoring dashboard
<MonitoringDashboard
  onRefresh={loadMetrics}
  refreshInterval={30000}
/>
```

## Hooks

### useTasks

```typescript
const { tasks, loading, error, executeTask, cancelTask, retryTask, refreshTasks } =
  useTasks(taskManager);
```

### useAuth

```typescript
const { isAuthenticated, isBiometricsAvailable, loading, error, authenticate } =
  useAuth(authManager);
```

### useOfflineSync

```typescript
const { isOnline, hasPendingSync, syncing, syncNow, clearCache } = useOfflineSync(storageManager);
```

### useVoiceCommands

```typescript
const { isListening, isAvailable, error, startListening, stopListening, toggleListening } =
  useVoiceCommands(voiceAssistant);
```

## Permissions

Add these permissions to your `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- For push notifications -->
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<!-- For voice recognition -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- For biometrics -->
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />

<!-- For network state -->
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

And for iOS, add to your `ios/UltraDexMobile/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to microphone for voice commands</string>
<key>NSCameraUsageDescription</key>
<string>This app needs access to camera for biometric authentication</string>
<key>NSFaceIDUsageDescription</key>
<string>This app needs access to Face ID for biometric authentication</string>
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

## Platform Setup

### Android

1. Add to `android/app/build.gradle`:

```gradle
dependencies {
    // ... other dependencies
    implementation 'com.facebook.react:react-native:+'
    // Push notifications
    implementation 'com.dieam.reactnativepushnotification:react-native-push-notification:8.1.1'
    // Biometrics
    implementation 'androidx.biometric:biometric:1.1.0'
}
```

2. Update `android/app/src/main/AndroidManifest.xml` with permissions above.

### iOS

1. Update `ios/Podfile`:

```ruby
pod 'react-native-push-notification', :path => '../node_modules/react-native-push-notification'
pod 'react-native-biometrics', :path => '../node_modules/react-native-biometrics'
```

2. Update `ios/UltraDexMobile/Info.plist` with permissions above.

## API Reference

For detailed API documentation, see the TypeScript definitions in `lib/index.d.ts`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the linter: `npm run lint`
6. Build the project: `npm run build`
7. Submit a pull request

## License

MIT License - see LICENSE file for details.
