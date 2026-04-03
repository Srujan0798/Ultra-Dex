// Copyright (c) 2026 Ultra-Dex
// packages/mobile-sdk/src/components/MonitoringDashboard.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';

interface SystemMetrics {
  authenticated: boolean;
  offlineMode: boolean;
  pendingSync: boolean;
  voiceEnabled: boolean;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  runningTasks: number;
}

interface MonitoringDashboardProps {
  onRefresh?: () => Promise<SystemMetrics>;
  refreshInterval?: number;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  onRefresh,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (onRefresh) {
      loadMetrics();

      // Set up periodic refresh
      const interval = setInterval(loadMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [onRefresh, refreshInterval]);

  const loadMetrics = async () => {
    if (!onRefresh) return;

    try {
      const newMetrics = await onRefresh();
      setMetrics(newMetrics);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMetrics();
    setRefreshing(false);
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    color?: string;
  }> = ({ title, value, color = '#333' }) => (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );

  const StatusIndicator: React.FC<{
    status: boolean;
    label: string;
  }> = ({ status, label }) => (
    <View style={styles.statusRow}>
      <View style={[styles.statusDot, { backgroundColor: status ? '#4CAF50' : '#F44336' }]} />
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );

  if (!metrics) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading metrics...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <Text style={styles.title}>System Status</Text>

      <View style={styles.statusSection}>
        <StatusIndicator status={metrics.authenticated} label="Authenticated" />
        <StatusIndicator status={!metrics.offlineMode} label="Online" />
        <StatusIndicator status={!metrics.pendingSync} label="Synced" />
        <StatusIndicator status={metrics.voiceEnabled} label="Voice Assistant" />
      </View>

      <Text style={styles.sectionTitle}>Task Statistics</Text>
      <View style={styles.metricsGrid}>
        <MetricCard title="Total Tasks" value={metrics.totalTasks} color="#2196F3" />
        <MetricCard title="Completed" value={metrics.completedTasks} color="#4CAF50" />
        <MetricCard title="Running" value={metrics.runningTasks} color="#FF9800" />
        <MetricCard title="Failed" value={metrics.failedTasks} color="#F44336" />
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Quick Stats</Text>
        <Text style={styles.summaryText}>
          Success Rate:{' '}
          {metrics.totalTasks > 0
            ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100)
            : 0}
          %
        </Text>
        <Text style={styles.summaryText}>Active Tasks: {metrics.runningTasks}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    paddingBottom: 8,
  },
  statusSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  summarySection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
});
