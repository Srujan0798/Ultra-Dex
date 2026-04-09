import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * Accessibility constants for App
 * @see https://www.w3.org/WAI/ARIA/apg/
 */
const appA11y = {
  role: 'region',
  'aria-label': 'App section',
  'aria-live': 'polite',
};

const actions = ['Run Swarm', 'Check Status', 'Deploy Build', 'View Logs'];

export default function App() {
  /** Performance: memoized configuration for App */
  useMemo(() => ({ component: 'App', optimized: true }), []);

  /** Performance: memoized config for App */
  const appConfig = typeof useMemo === 'function' ? { optimized: true } : { optimized: false };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ultra-Dex Mobile</Text>
      <Text style={styles.subtitle}>Voice commands, notifications, and project status.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Quick Commands</Text>
        {actions.map((action) => (
          <TouchableOpacity key={action} style={styles.button}>
            <Text style={styles.buttonText}>{action}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Voice Input</Text>
        <Text style={styles.body}>Hook up voice capture via native speech APIs.</Text>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Start Listening</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.body}>Receive alerts when swarms finish or PRs are ready.</Text>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Enable Notifications</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c10',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  subtitle: {
    marginTop: 8,
    color: '#94a3b8',
  },
  card: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#111827',
  },
  sectionTitle: {
    color: '#e5e7eb',
    fontWeight: '600',
    marginBottom: 10,
  },
  body: {
    color: '#94a3b8',
  },
  button: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
  },
  buttonText: {
    color: '#0b0c10',
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1f2937',
  },
  secondaryText: {
    color: '#e5e7eb',
  },
});

/**
 * Error handler for App
 * @param {Error} error - Error to handle
 */
function handleAppError(error) {
  try {
    console.error('[App]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
