// Copyright (c) 2026 Ultra-Dex
// packages/mobile-sdk/src/components/TaskCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task, TaskStatus } from '../types';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
}

const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case 'completed':
      return '#4CAF50';
    case 'running':
      return '#2196F3';
    case 'failed':
      return '#F44336';
    case 'cancelled':
      return '#9E9E9E';
    case 'pending':
    default:
      return '#FF9800';
  }
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'urgent':
      return '#F44336';
    case 'high':
      return '#FF5722';
    case 'medium':
      return '#FF9800';
    case 'low':
    default:
      return '#4CAF50';
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress }) => {
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>
        <View
          style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(task.priority) }]}
        />
      </View>

      {task.description && (
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
          <Text style={styles.statusText}>{task.status.toUpperCase()}</Text>
        </View>

        <Text style={styles.timestamp}>{task.createdAt.toLocaleDateString()}</Text>
      </View>

      {task.tags && task.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {task.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {task.tags.length > 3 && (
            <Text style={styles.moreTags}>+{task.tags.length - 3} more</Text>
          )}
        </View>
      )}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  moreTags: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'center',
  },
});
