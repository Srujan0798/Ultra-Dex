// Copyright (c) 2026 Ultra-Dex
// packages/mobile-sdk/src/components/TaskList.tsx

import React from 'react';
import { FlatList, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { Task } from '../types';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  onTaskPress?: (task: Task) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  emptyMessage?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onTaskPress,
  onRefresh,
  refreshing = false,
  emptyMessage = 'No tasks found',
}) => {
  const renderTask = ({ item }: { item: Task }) => (
    <TaskCard task={item} onPress={onTaskPress ? () => onTaskPress(item) : undefined} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{emptyMessage}</Text>
    </View>
  );

  return (
    <FlatList
      data={tasks}
      renderItem={renderTask}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
      }
      contentContainerStyle={tasks.length === 0 ? styles.emptyList : undefined}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
});
