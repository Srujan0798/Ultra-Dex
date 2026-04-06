// Copyright (c) 2026 Ultra-Dex
// apps/mobile-app/src/screens/TaskDetailsScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  Home: undefined;
  TaskDetails: { taskId: string };
  Settings: undefined;
};

type TaskDetailsScreenProps = StackScreenProps<RootStackParamList, 'TaskDetails'>;

export const TaskDetailsScreen: React.FC<TaskDetailsScreenProps> = ({ route, navigation }) => {
  const { taskId } = route.params;
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // In a real app, this would come from a context or hook
  // For now, we'll simulate loading a task
  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock task data - in real app, fetch from taskManager
      setTask({
        id: taskId,
        title: 'Sample Task',
        description: 'This is a sample task description',
        status: 'completed',
        priority: 'high',
        createdAt: new Date(),
        completedAt: new Date(),
        tags: ['sample', 'demo'],
        metadata: {
          result: 'Task completed successfully',
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load task details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Task', 'Are you sure you want to cancel this task?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        onPress: () => {
          // Cancel task logic here
          Alert.alert('Success', 'Task cancelled');
          navigation.goBack();
        },
      },
    ]);
  };

  const handleRetry = () => {
    Alert.alert('Retry Task', 'Retry this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Retry',
        onPress: () => {
          // Retry task logic here
          Alert.alert('Success', 'Task queued for retry');
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading task details...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Task not found</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'running':
        return '#2196F3';
      case 'failed':
        return '#F44336';
      case 'cancelled':
        return '#9E9E9E';
      default:
        return '#FF9800';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.title}>{task.title}</Text>
            <Chip style={[styles.statusChip, { backgroundColor: getStatusColor(task.status) }]}>
              {task.status.toUpperCase()}
            </Chip>
          </View>

          {task.description && <Text style={styles.description}>{task.description}</Text>}

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Priority:</Text>
              <Chip mode="outlined">{task.priority}</Chip>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Created:</Text>
              <Text style={styles.metaValue}>{task.createdAt.toLocaleString()}</Text>
            </View>

            {task.completedAt && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Completed:</Text>
                <Text style={styles.metaValue}>{task.completedAt.toLocaleString()}</Text>
              </View>
            )}
          </View>

          {task.tags && task.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={styles.tagsLabel}>Tags:</Text>
              <View style={styles.tagsList}>
                {task.tags.map((tag: string, index: number) => (
                  <Chip key={index} mode="outlined" style={styles.tag}>
                    {tag}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          {task.metadata && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>Result:</Text>
              <Text style={styles.resultText}>
                {typeof task.metadata.result === 'string'
                  ? task.metadata.result
                  : JSON.stringify(task.metadata.result, null, 2)}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <View style={styles.actionsContainer}>
        {task.status === 'running' && (
          <Button mode="outlined" onPress={handleCancel} style={styles.cancelButton}>
            Cancel Task
          </Button>
        )}

        {task.status === 'failed' && (
          <Button mode="contained" onPress={handleRetry} style={styles.retryButton}>
            Retry Task
          </Button>
        )}
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
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  card: {
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  statusChip: {
    height: 32,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 24,
  },
  metaContainer: {
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
    minWidth: 80,
  },
  metaValue: {
    fontSize: 16,
    color: '#666',
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
  resultContainer: {
    marginTop: 16,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
  },
  actionsContainer: {
    padding: 16,
  },
  cancelButton: {
    borderColor: '#F44336',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
  },
});
