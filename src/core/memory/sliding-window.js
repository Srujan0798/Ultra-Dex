// Copyright (c) 2026 Ultra-Dex

import { PersistentMemoryStore } from './persistent-store.js';

export class SlidingWindowContextManager {
  constructor(options = {}) {
    this.store = options.store || new PersistentMemoryStore();
    this.maxWindowSize = options.maxWindowSize || 20; // Max number of messages to keep
    this.summarizationThreshold = options.summarizationThreshold || 15; // When to start summarizing
    this.tokenEstimatePerMessage = options.tokenEstimatePerMessage || 100; // Rough estimate
    this.maxTokens = options.maxTokens || 32000; // Max tokens in context window
    this.contextWindow = []; // Current active context window
    this.summaryHistory = []; // Summarized history
  }

  async addMessage(message) {
    // Calculate current token count
    const currentTokenCount = this.calculateTokenCount([...this.summaryHistory, ...this.contextWindow, message]);
    
    // If adding this message would exceed token limit, trigger summarization
    if (currentTokenCount > this.maxTokens) {
      await this.summarizeAndPrune();
    }
    
    // Add the message to context window
    this.contextWindow.push({
      ...message,
      timestamp: Date.now(),
      id: this.generateId()
    });
    
    // If context window exceeds threshold, summarize oldest messages
    if (this.contextWindow.length > this.summarizationThreshold) {
      await this.summarizeOldestMessages();
    }
    
    // Ensure context window doesn't exceed max size
    if (this.contextWindow.length > this.maxWindowSize) {
      this.contextWindow = this.contextWindow.slice(-this.maxWindowSize);
    }
    
    // Store in persistent memory
    await this.store.add(message);
  }

  async summarizeAndPrune() {
    if (this.contextWindow.length <= 1) return; // Need at least 2 messages to summarize
    
    // Take the first half of the context window to summarize
    const messagesToSummarize = this.contextWindow.slice(0, Math.floor(this.contextWindow.length / 2));
    
    if (messagesToSummarize.length === 0) return;
    
    // Create a summary of these messages
    const summary = await this.createSummary(messagesToSummarize);
    
    // Add summary to summary history
    this.summaryHistory.push({
      type: 'summary',
      content: summary,
      timestamp: Date.now(),
      originalMessageCount: messagesToSummarize.length,
      id: this.generateId()
    });
    
    // Keep only the remaining messages in context window
    this.contextWindow = this.contextWindow.slice(messagesToSummarize.length);
  }

  async summarizeOldestMessages() {
    if (this.contextWindow.length <= this.summarizationThreshold) return;
    
    // Determine how many messages to summarize (keep newest ones in context)
    const excessCount = this.contextWindow.length - this.summarizationThreshold;
    const messagesToSummarize = this.contextWindow.slice(0, excessCount);
    
    if (messagesToSummarize.length === 0) return;
    
    // Create a summary of these messages
    const summary = await this.createSummary(messagesToSummarize);
    
    // Add summary to summary history
    this.summaryHistory.push({
      type: 'summary',
      content: summary,
      timestamp: Date.now(),
      originalMessageCount: messagesToSummarize.length,
      id: this.generateId()
    });
    
    // Keep only the remaining messages in context window
    this.contextWindow = this.contextWindow.slice(excessCount);
  }

  async createSummary(messages) {
    // This is a simplified summary creation
    // In a real implementation, this would call an AI model to create a summary
    const summaryContent = `Previous conversation summary: ${messages.length} messages condensed. Key topics: ${this.extractKeyTopics(messages)}.`;
    
    return summaryContent;
  }

  extractKeyTopics(messages) {
    // Extract key topics from messages (simplified implementation)
    const allText = messages.map(m => m.content || m.text || '').join(' ');
    const words = allText.toLowerCase().match(/\b(\w+)\b/g) || [];
    
    // Count word frequency
    const wordCount = {};
    words.forEach(word => {
      if (word.length > 4) { // Only consider words longer than 4 chars
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    // Get top 5 most frequent words
    const topWords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
    
    return topWords.join(', ');
  }

  getContext() {
    // Return combined context: summary history + current window
    return [...this.summaryHistory, ...this.contextWindow];
  }

  getRecentContext(count = 10) {
    // Return only the most recent messages from the context window
    return this.contextWindow.slice(-count);
  }

  getAllMessages() {
    // Return all messages (summary + current context)
    return [...this.summaryHistory, ...this.contextWindow];
  }

  calculateTokenCount(messages) {
    // Rough estimation of token count
    const text = messages.map(m => m.content || m.text || '').join(' ');
    return Math.ceil(text.length / 4); // Rough estimate: 1 token ~ 4 characters
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  async clear() {
    this.contextWindow = [];
    this.summaryHistory = [];
    await this.store.clear();
  }

  async restoreFromHistory(history) {
    // Restore context from a saved history
    this.contextWindow = [];
    this.summaryHistory = [];
    
    for (const message of history) {
      await this.addMessage(message);
    }
  }
}