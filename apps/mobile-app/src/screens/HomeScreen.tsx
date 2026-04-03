// Copyright (c) 2026 Ultra-Dex
// apps/mobile-app/src/screens/HomeScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { FAB, Appbar, TextInput } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { UltraDexMobile, useTasks, useOfflineSync, useVoiceCommands } from '@ultra-dex/mobile-sdk';

import { TaskList } from '@ultra-dex/mobile-sdk';
import { VoiceCommandButton } from '@ultra-dex/mobile-sdk';

type RootStackParamList = {
  Home: undefined;
  TaskDetails: { taskId: string };
  Settings: undefined;
};

type HomeScreenProps = StackScreenProps<RootStackParamList, 'Home'> & {
  ultraDexMobile: UltraDexMobile;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, ultraDexMobile }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);

  const {
    tasks,
    loading: tasksLoading,
    executeTask,
    refreshTasks,
  } = useTasks(ultraDexMobile.taskManager);

  const { isOnline, hasPendingSync, syncing, syncNow } = useOfflineSync(
    ultraDexMobile.storageManager
  );

  const {
    isListening,
    isAvailable: voiceAvailable,
    toggleListening,
  } = useVoiceCommands(ultraDexMobile.voiceAssistant);

  const handleCreateTask = async () => {
    if (!newTaskText.trim()) return;

    try {
      await executeTask(newTaskText.trim());
      setNewTaskText('');
      setShowTaskInput(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create task');
    }
  };

  const handleSync = async () => {
    try {
      await syncNow();
      Alert.alert('Success', 'Data synced successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync data');
    }
  };

  const handleTaskPress = (task: any) => {
    navigation.navigate('TaskDetails', { taskId: task.id });
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Tasks" />
        <Appbar.Action
          icon={hasPendingSync ? 'sync-alert' : 'sync'}
          onPress={handleSync}
          disabled={!isOnline || syncing}
        />
        <Appbar.Action icon="cog" onPress={handleSettings} />
      </Appbar.Header>

      <View style={styles.statusBar}>
        <View
          style={[styles.statusIndicator, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]}
        />
        <TouchableOpacity
          style={styles.statusTextContainer}
          onPress={() =>
            isOnline
              ? null
              : Alert.alert(
                  'Offline',
                  'You are currently offline. Tasks will be synced when online.'
                )
          }
        >
          <Appbar.Content title={isOnline ? 'Online' : 'Offline'} titleStyle={styles.statusText} />
        </TouchableOpacity>
      </View>

      <TaskList
        tasks={tasks}
        onTaskPress={handleTaskPress}
        onRefresh={refreshTasks}
        refreshing={tasksLoading}
        emptyMessage="No tasks yet. Create your first task!"
      />

      {showTaskInput && (
        <View style={styles.taskInputContainer}>
          <TextInput
            placeholder="What would you like Ultra-Dex to do?"
            value={newTaskText}
            onChangeText={setNewTaskText}
            multiline
            numberOfLines={3}
            style={styles.taskInput}
            onSubmitEditing={handleCreateTask}
          />
          <View style={styles.inputActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowTaskInput(false);
                setNewTaskText('');
              }}
            >
              <Appbar.Action icon="close" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleCreateTask}>
              <Appbar.Action icon="send" color="#2196F3" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.fabContainer}>
        {voiceAvailable && (
          <View style={styles.voiceButtonContainer}>
            <VoiceCommandButton isListening={isListening} onPress={toggleListening} />
          </View>
        )}

        <FAB
          icon={showTaskInput ? 'minus' : 'plus'}
          onPress={() => setShowTaskInput(!showTaskInput)}
          style={styles.fab}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    color: '#666',
    fontSize: 14,
  },
  taskInputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
  },
  taskInput: {
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    borderRadius: 20,
  },
  submitButton: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    alignItems: 'flex-end',
  },
  voiceButtonContainer: {
    marginBottom: 16,
  },
  fab: {
    backgroundColor: '#2196F3',
  },
});
