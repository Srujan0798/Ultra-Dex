// Copyright (c) 2026 Ultra-Dex
// apps/mobile-app/src/App.tsx

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'react-native';

import { UltraDexMobile, MobileConfig } from '@ultra-dex/mobile-sdk';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { TaskDetailsScreen } from './screens/TaskDetailsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LoadingScreen } from './screens/LoadingScreen';

const Stack = createStackNavigator();

const App: React.FC = () => {
  const [ultraDexMobile, setUltraDexMobile] = useState<UltraDexMobile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Configuration for Ultra-Dex Mobile SDK
      const config: MobileConfig = {
        auth: {
          baseUrl: 'https://api.ultra-dex.ai', // Replace with actual API URL
          enableBiometrics: true,
          biometricPrompt: 'Authenticate to access Ultra-Dex',
        },
        storage: {
          enableOfflineStorage: true,
          syncInterval: 15, // 15 minutes
          maxOfflineTasks: 100,
        },
        notifications: {
          enablePushNotifications: true,
          enableTaskCompletionAlerts: true,
          enableSystemAlerts: true,
          soundEnabled: true,
          vibrationEnabled: true,
        },
        voice: {
          enableVoiceCommands: true,
          language: 'en-US',
          wakeWord: 'ultra dex',
          autoStart: false,
        },
        instanceId: `mobile_${Date.now()}`,
      };

      const ultraDex = new UltraDexMobile(config);
      await ultraDex.initialize();

      setUltraDexMobile(ultraDex);
      setIsInitialized(true);

      // Check authentication status
      const status = await ultraDex.getStatus();
      setIsAuthenticated(status.authenticated);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsInitialized(true); // Still show app even if init fails
    }
  };

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <PaperProvider>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2196F3',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          {!isAuthenticated ? (
            <Stack.Screen name="Auth" options={{ headerShown: false }}>
              {(props) => (
                <AuthScreen
                  {...props}
                  ultraDexMobile={ultraDexMobile}
                  onAuthenticated={() => setIsAuthenticated(true)}
                />
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Home" options={{ title: 'Ultra-Dex' }}>
                {(props) => <HomeScreen {...props} ultraDexMobile={ultraDexMobile!} />}
              </Stack.Screen>
              <Stack.Screen
                name="TaskDetails"
                component={TaskDetailsScreen}
                options={{ title: 'Task Details' }}
              />
              <Stack.Screen name="Settings" options={{ title: 'Settings' }}>
                {(props) => <SettingsScreen {...props} ultraDexMobile={ultraDexMobile!} />}
              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;
