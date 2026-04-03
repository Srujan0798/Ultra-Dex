// Copyright (c) 2026 Ultra-Dex
// packages/mobile-sdk/src/notifications/NotificationManager.ts

import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform } from 'react-native';
import { NotificationConfig, Task } from '../types';

export class NotificationManager {
  private config: NotificationConfig;

  constructor(config: NotificationConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (!this.config.enablePushNotifications) {
      return;
    }

    // Configure push notifications
    PushNotification.configure({
      onRegister: (token) => {
        console.log('Push notification token:', token);
      },

      onNotification: (notification) => {
        console.log('Notification received:', notification);

        // Handle notification tap
        if (Platform.OS === 'ios') {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },

      permissions: {
        alert: true,
        badge: true,
        sound: this.config.soundEnabled ?? true,
      },

      popInitialNotification: true,
      requestPermissions: true,
    });

    // Create notification channel for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'ultradex-tasks',
          channelName: 'Ultra-Dex Tasks',
          channelDescription: 'Notifications for task updates',
          playSound: this.config.soundEnabled ?? true,
          soundName: 'default',
          importance: 4,
          vibrate: this.config.vibrationEnabled ?? true,
        },
        (created) => console.log(`Channel created: ${created}`)
      );
    }
  }

  async shutdown(): Promise<void> {
    // Clean up if needed
  }

  /**
   * Send notification for task completion
   */
  async sendTaskCompletionNotification(task: Task): Promise<void> {
    if (!this.config.enableTaskCompletionAlerts) {
      return;
    }

    const notification = {
      channelId: 'ultradex-tasks',
      title: 'Task Completed',
      message: `Task "${task.title}" has been completed successfully`,
      playSound: this.config.soundEnabled ?? true,
      soundName: 'default',
      importance: 'high',
      vibrate: this.config.vibrationEnabled ?? true,
      vibration: 300,
      userInfo: {
        taskId: task.id,
        type: 'task_completed',
      },
    };

    PushNotification.localNotification(notification);
  }

  /**
   * Send notification for task failure
   */
  async sendTaskFailureNotification(task: Task, error: string): Promise<void> {
    if (!this.config.enableSystemAlerts) {
      return;
    }

    const notification = {
      channelId: 'ultradex-tasks',
      title: 'Task Failed',
      message: `Task "${task.title}" failed: ${error}`,
      playSound: this.config.soundEnabled ?? true,
      soundName: 'default',
      importance: 'high',
      vibrate: this.config.vibrationEnabled ?? true,
      vibration: 300,
      userInfo: {
        taskId: task.id,
        type: 'task_failed',
      },
    };

    PushNotification.localNotification(notification);
  }

  /**
   * Send system alert notification
   */
  async sendSystemAlert(title: string, message: string, data?: any): Promise<void> {
    if (!this.config.enableSystemAlerts) {
      return;
    }

    const notification = {
      channelId: 'ultradex-tasks',
      title,
      message,
      playSound: this.config.soundEnabled ?? true,
      soundName: 'default',
      importance: 'default',
      vibrate: this.config.vibrationEnabled ?? false,
      userInfo: {
        type: 'system_alert',
        data,
      },
    };

    PushNotification.localNotification(notification);
  }

  /**
   * Cancel a specific notification
   */
  cancelNotification(notificationId: string): void {
    PushNotification.cancelLocalNotification(notificationId);
  }

  /**
   * Cancel all notifications
   */
  cancelAllNotifications(): void {
    PushNotification.cancelAllLocalNotifications();
  }

  /**
   * Schedule a notification
   */
  scheduleNotification(title: string, message: string, date: Date, data?: any): void {
    PushNotification.localNotificationSchedule({
      channelId: 'ultradex-tasks',
      title,
      message,
      date,
      playSound: this.config.soundEnabled ?? true,
      soundName: 'default',
      vibrate: this.config.vibrationEnabled ?? true,
      userInfo: {
        type: 'scheduled',
        data,
      },
    });
  }
}
