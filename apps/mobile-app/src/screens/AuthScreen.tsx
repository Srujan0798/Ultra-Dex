// Copyright (c) 2026 Ultra-Dex
// apps/mobile-app/src/screens/AuthScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { UltraDexMobile } from '@ultra-dex/mobile-sdk';

type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
};

type AuthScreenProps = StackScreenProps<RootStackParamList, 'Auth'> & {
  ultraDexMobile: UltraDexMobile | null;
  onAuthenticated: () => void;
};

export const AuthScreen: React.FC<AuthScreenProps> = ({ ultraDexMobile, onAuthenticated }) => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBiometricAuth = async () => {
    if (!ultraDexMobile) return;

    setLoading(true);
    try {
      const success = await ultraDexMobile.authManager.authenticate();
      if (success) {
        onAuthenticated();
      } else {
        Alert.alert('Authentication Failed', 'Biometric authentication failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication not available');
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeyAuth = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter your API key');
      return;
    }

    if (!ultraDexMobile) return;

    setLoading(true);
    try {
      // Update auth config with API key
      ultraDexMobile.authManager.updateConfig({ apiKey: apiKey.trim() });

      const success = await ultraDexMobile.authManager.authenticate();
      if (success) {
        onAuthenticated();
      } else {
        Alert.alert('Authentication Failed', 'Invalid API key');
      }
    } catch (error) {
      Alert.alert('Error', 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const isBiometricsAvailable = ultraDexMobile?.authManager.isBiometricsAvailable();

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>🤖</Text>
        <Text style={styles.title}>Ultra-Dex</Text>
        <Text style={styles.subtitle}>AI Orchestration Platform</Text>
      </View>

      <View style={styles.authContainer}>
        <Text style={styles.welcomeText}>Welcome Back</Text>
        <Text style={styles.instructionText}>
          Authenticate to access your AI orchestration tasks
        </Text>

        {isBiometricsAvailable && (
          <View style={styles.biometricSection}>
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricAuth}
              disabled={loading}
            >
              <Text style={styles.biometricIcon}>👆</Text>
              <Text style={styles.biometricText}>
                {loading ? 'Authenticating...' : 'Touch ID / Face ID'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.orText}>or</Text>
          </View>
        )}

        <TextInput
          label="API Key"
          value={apiKey}
          onChangeText={setApiKey}
          mode="outlined"
          secureTextEntry
          style={styles.input}
          disabled={loading}
        />

        <Button
          mode="contained"
          onPress={handleApiKeyAuth}
          loading={loading}
          disabled={loading}
          style={styles.loginButton}
        >
          Sign In
        </Button>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Get your API key from the Ultra-Dex dashboard</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  authContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  biometricSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  biometricButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    width: '100%',
  },
  biometricIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  biometricText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  orText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 16,
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
