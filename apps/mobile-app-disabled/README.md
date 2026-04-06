# Ultra-Dex Mobile App

The official mobile companion app for Ultra-Dex, providing full access to AI orchestration capabilities on iOS and Android devices.

## Features

- **Task Management**: Create, monitor, and control AI orchestration tasks
- **Offline Support**: Work offline and sync when connection is restored
- **Push Notifications**: Real-time alerts for task completion and system events
- **Voice Commands**: AI assistant with natural language voice control
- **Biometric Authentication**: Secure access using fingerprint or face ID
- **Real-time Monitoring**: System status and performance dashboards
- **Cross-Platform**: Native iOS and Android apps

## Prerequisites

- Node.js 18+
- React Native development environment
- iOS development (for iOS builds)
- Android development (for Android builds)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Srujan0798/Ultra-Dex.git
cd Ultra-Dex/apps/mobile-app
```

2. Install dependencies:

```bash
npm install
```

3. Install CocoaPods (iOS only):

```bash
cd ios && pod install && cd ..
```

## Setup

### iOS Setup

1. Open `ios/UltraDexMobile.xcworkspace` in Xcode
2. Configure signing and capabilities
3. Enable push notifications in Capabilities

### Android Setup

1. Create `android/app/src/main/assets/custom/` directory if it doesn't exist
2. Configure Firebase (if using push notifications)
3. Update `android/app/build.gradle` with your application ID

## Development

### Running the App

```bash
# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Building for Production

```bash
# Build for iOS
npm run build:ios

# Build for Android
npm run build:android
```

## Configuration

The app uses the Ultra-Dex Mobile SDK. Configure the connection in `src/App.tsx`:

```typescript
const config: MobileConfig = {
  auth: {
    baseUrl: 'https://your-ultra-dex-api.com',
    enableBiometrics: true,
  },
  storage: {
    enableOfflineStorage: true,
    syncInterval: 15,
  },
  notifications: {
    enablePushNotifications: true,
  },
  voice: {
    enableVoiceCommands: true,
    wakeWord: 'ultra dex',
  },
};
```

## Features Overview

### Authentication

- API key authentication
- Biometric authentication (Touch ID / Face ID)
- Secure token storage

### Task Management

- Create tasks with natural language
- View task status and progress
- Cancel or retry failed tasks
- Task history and details

### Voice Assistant

- Voice-activated task creation
- Hands-free operation
- Customizable wake words
- Natural language processing

### Offline Mode

- Automatic offline detection
- Local task storage
- Background sync when online
- Conflict resolution

### Notifications

- Push notifications for task completion
- System alerts and warnings
- Customizable notification preferences
- Background notification handling

### Monitoring

- Real-time system status
- Performance metrics
- Task statistics
- Network connectivity status

## Voice Commands

The app supports various voice commands:

- **"Create task [description]"** - Create a new task
- **"Show my tasks"** - List all tasks
- **"Cancel task"** - Cancel current task
- **"Ultra Dex, help"** - Show available commands

## Permissions

The app requires the following permissions:

### iOS

- Microphone (for voice commands)
- Face ID/Touch ID (for biometric auth)
- Push Notifications
- Background app refresh

### Android

- Microphone
- Fingerprint/Biometric
- Notifications
- Network state
- Wake lock

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx react-native start --reset-cache`

2. **iOS build fails**: Ensure CocoaPods are installed and run `pod install`

3. **Android build fails**: Check Android SDK versions and ensure emulator/device is properly configured

4. **Voice recognition not working**: Check microphone permissions and iOS/Android voice settings

5. **Push notifications not working**: Verify Firebase configuration and APNs certificates

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG=ultra-dex:* npm start
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Test on both iOS and Android
5. Ensure accessibility compliance

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:

- GitHub Issues: https://github.com/Srujan0798/Ultra-Dex/issues
- Documentation: https://docs.ultra-dex.ai
