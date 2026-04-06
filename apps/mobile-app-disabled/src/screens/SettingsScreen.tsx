// Copyright (c) 2026 Ultra-Dex
// apps/mobile-app/src/screens/SettingsScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { List, Button, Divider } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { UltraDexMobile } from '@ultra-dex/mobile-sdk';

type RootStackParamList = {
  Home: undefined;
  TaskDetails: { taskId: string };
  Settings: undefined;
};

type SettingsScreenProps = StackScreenProps<RootStackParamList, 'Settings'> & {
  ultraDexMobile: UltraDexMobile;
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation, ultraDexMobile }) => {
  const [notifications, setNotifications] = useState(true);
  const [offlineMode, setOfflineMode] = useState(true);
  const [biometrics, setBiometrics] = useState(true);
  const [voiceCommands, setVoiceCommands] = useState(true);

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'This will remove all locally stored tasks and data. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        onPress: async () => {
          try {
            await ultraDexMobile.storageManager.clearCache();
            Alert.alert('Success', 'Cache cleared successfully');
          } catch (error) {
            Alert.alert('Error', 'Failed to clear cache');
          }
        },
      },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: () => {
          // Sign out logic here
          navigation.popToTop();
        },
      },
    ]);
  };

  const getSystemInfo = async () => {
    const status = await ultraDexMobile.getStatus();
    return {
      authenticated: status.authenticated,
      offline: !status.offlineMode,
      voiceEnabled: status.voiceEnabled,
      version: '1.0.0',
    };
  };

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>Preferences</List.Subheader>

        <List.Item
          title="Push Notifications"
          description="Receive alerts for task completion and system events"
          left={() => <List.Icon icon="bell" />}
          right={() => <Switch value={notifications} onValueChange={setNotifications} />}
        />

        <Divider />

        <List.Item
          title="Offline Mode"
          description="Store tasks locally when offline"
          left={() => <List.Icon icon="wifi-off" />}
          right={() => <Switch value={offlineMode} onValueChange={setOfflineMode} />}
        />

        <Divider />

        <List.Item
          title="Biometric Authentication"
          description="Use fingerprint or face recognition"
          left={() => <List.Icon icon="fingerprint" />}
          right={() => <Switch value={biometrics} onValueChange={setBiometrics} />}
        />

        <Divider />

        <List.Item
          title="Voice Commands"
          description="Enable voice control and AI assistant"
          left={() => <List.Icon icon="microphone" />}
          right={() => <Switch value={voiceCommands} onValueChange={setVoiceCommands} />}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>Data Management</List.Subheader>

        <List.Item
          title="Sync Data"
          description="Manually sync offline data with server"
          left={() => <List.Icon icon="sync" />}
          onPress={() => {
            // Trigger manual sync
            Alert.alert('Info', 'Sync functionality would be implemented here');
          }}
        />

        <Divider />

        <List.Item
          title="Clear Cache"
          description="Remove all locally stored data"
          left={() => <List.Icon icon="delete" />}
          onPress={handleClearCache}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>About</List.Subheader>

        <List.Item
          title="Version"
          description="1.0.0"
          left={() => <List.Icon icon="information" />}
        />

        <Divider />

        <List.Item
          title="Ultra-Dex"
          description="AI Orchestration Meta-Layer"
          left={() => <List.Icon icon="brain" />}
        />
      </List.Section>

      <View style={styles.signOutContainer}>
        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={styles.signOutButton}
          color="#F44336"
        >
          Sign Out
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  signOutContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  signOutButton: {
    borderColor: '#F44336',
  },
});
