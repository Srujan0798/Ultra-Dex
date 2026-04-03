// Copyright (c) 2026 Ultra-Dex
// apps/mobile-app/src/screens/LoadingScreen.tsx

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';

export const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.title}>Ultra-Dex</Text>
        <Text style={styles.subtitle}>Initializing AI Orchestration...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
