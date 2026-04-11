// Copyright (c) 2026 Ultra-Dex
// packages/mobile-sdk/src/VoiceAssistant.ts

import Voice from '@react-native-community/voice';
import { VoiceConfig } from './types';
import { TaskManager } from './api/TaskManager';

export class VoiceAssistant {
  private config: VoiceConfig;
  private taskManager: TaskManager;
  private isListening = false;
  private wakeWordDetected = false;

  constructor(config: VoiceConfig, taskManager: TaskManager) {
    this.config = config;
    this.taskManager = taskManager;
  }

  async initialize(): Promise<void> {
    // Configure voice recognition
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);

    // Set up wake word detection if configured
    if (this.config.wakeWord && this.config.autoStart) {
      this.startListening();
    }
  }

  async shutdown(): Promise<void> {
    await this.stopListening();
    Voice.destroy().then(Voice.removeAllListeners);
  }

  /**
   * Start listening for voice commands
   */
  async startListening(): Promise<void> {
    try {
      if (this.isListening) {
        return;
      }

      await Voice.start(this.config.language || 'en-US');
      this.isListening = true;
    } catch (error) {
      console.error('Failed to start voice listening:', error);
      throw error;
    }
  }

  /**
   * Stop listening for voice commands
   */
  async stopListening(): Promise<void> {
    try {
      if (!this.isListening) {
        return;
      }

      await Voice.stop();
      this.isListening = false;
      this.wakeWordDetected = false;
    } catch (error) {
      console.error('Failed to stop voice listening:', error);
    }
  }

  /**
   * Check if currently listening
   */
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  private onSpeechStart(): void {
    console.log('Voice recognition started');
  }

  private onSpeechEnd(): void {
    console.log('Voice recognition ended');
    this.isListening = false;
  }

  private onSpeechResults(event: any): void {
    const results = event.value;
    if (results && results.length > 0) {
      const command = results[0].toLowerCase();
      this.processVoiceCommand(command);
    }
  }

  private onSpeechError(event: any): void {
    console.error('Voice recognition error:', event.error);
    this.isListening = false;
  }

  private async processVoiceCommand(command: string): Promise<void> {
    console.log('Processing voice command:', command);

    // Check for wake word
    if (this.config.wakeWord && !this.wakeWordDetected) {
      if (command.includes(this.config.wakeWord.toLowerCase())) {
        this.wakeWordDetected = true;
        console.log('Wake word detected, listening for command...');
        // Restart listening for the actual command
        setTimeout(() => this.startListening(), 1000);
      }
      return;
    }

    // Process commands
    try {
      if (command.includes('create task') || command.includes('new task')) {
        const taskDescription = this.extractTaskDescription(command);
        if (taskDescription) {
          await this.taskManager.executeTask(taskDescription);
          console.log('Task created via voice command');
        }
      } else if (command.includes('list tasks') || command.includes('show tasks')) {
        const tasks = await this.taskManager.getTasks();
        console.log(`You have ${tasks.length} tasks`);
        // In a real app, this would trigger a UI update or voice response
      } else if (command.includes('cancel task')) {
        // This would need more sophisticated parsing to identify which task
        console.log('Cancel task command received');
      } else if (command.includes('status') || command.includes('how are you')) {
        console.log('Voice assistant status check');
      } else {
        console.log('Unknown voice command:', command);
      }
    } catch (error) {
      console.error('Failed to process voice command:', error);
    }

    // Reset wake word detection
    this.wakeWordDetected = false;
  }

  private extractTaskDescription(command: string): string | null {
    // Simple extraction - in a real implementation, use NLP
    const taskPatterns = [/create task (.+)/i, /new task (.+)/i, /task (.+)/i];

    for (const pattern of taskPatterns) {
      const match = command.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Speak a response (placeholder for text-to-speech)
   */
  async speakResponse(text: string): Promise<void> {
    // In a real implementation, integrate with text-to-speech
    console.log('Voice Assistant:', text);
  }
}
