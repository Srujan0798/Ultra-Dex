#!/usr/bin/env node

/**
 * Ultra-Dex AI Chatbot
 * 
 * This example demonstrates how to create an AI-powered chatbot using Ultra-Dex.
 * The chatbot maintains conversation history, learns from interactions, and provides intelligent responses.
 * 
 * Features:
 * - Natural language understanding
 * - Context-aware responses
 * - Conversation memory
 * - Multi-turn dialogues
 * - Personality customization
 */

import { UltraDex } from '../src/ultradex.js';

class Chatbot {
  constructor(config) {
    this.ultraDex = new UltraDex(config.ultraDex);
    
    // Initialize specialized agents
    this.agents = {
      intentClassifier: this.ultraDex.createAgent({
        name: 'intent-classifier',
        role: 'Classifies user intents and extracts entities from messages',
        tools: ['natural-language-parser', 'entity-extractor', 'intent-matcher', 'context-analyzer']
      }),
      
      responseGenerator: this.ultraDex.createAgent({
        name: 'response-generator',
        role: 'Generates contextually appropriate responses based on intent and history',
        tools: ['context-understanding', 'tone-matcher', 'knowledge-retriever', 'response-formatter']
      }),
      
      conversationManager: this.ultraDex.createAgent({
        name: 'conversation-manager',
        role: 'Manages conversation flow and context across multiple turns',
        tools: ['context-tracker', 'dialogue-state-manager', 'memory-archiver', 'topic-transitioner']
      }),
      
      personalityEngine: this.ultraDex.createAgent({
        name: 'personality-engine',
        role: 'Maintains consistent personality traits and communication style',
        tools: ['tone-regulator', 'style-matcher', 'personality-consistency-checker', 'brand-voice-adapter']
      }),
      
      knowledgeEnhancer: this.ultraDex.createAgent({
        name: 'knowledge-enhancer',
        role: 'Retrieves and incorporates relevant knowledge into responses',
        tools: ['information-retriever', 'fact-checker', 'source-verifier', 'knowledge-updater']
      })
    };
    
    // Maintain conversation history
    this.conversations = new Map();
    this.personality = config.personality || {
      name: 'Ultra-Dex Assistant',
      tone: 'helpful and professional',
      expertise: 'AI and technology',
      communicationStyle: 'clear and concise'
    };
  }

  /**
   * Process a user message
   */
  async processMessage(userId, message, options = {}) {
    // Get or create conversation
    const conversationId = `${userId}-${Date.now()}`;
    let conversation = this.conversations.get(userId);
    
    if (!conversation) {
      conversation = {
        id: conversationId,
        userId,
        messages: [],
        context: {},
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      this.conversations.set(userId, conversation);
    }
    
    // Add user message to conversation
    const userMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString(),
      metadata: {
        wordCount: message.split(' ').length,
        sentiment: await this.estimateSentiment(message)
      }
    };
    
    conversation.messages.push(userMessage);
    conversation.lastActive = new Date().toISOString();
    
    try {
      // Classify intent
      const intentResult = await this.agents.intentClassifier.execute({
        message: message,
        conversationHistory: conversation.messages,
        context: conversation.context,
        userPreferences: options.userPreferences || {}
      });
      
      // Retrieve relevant knowledge
      const knowledgeResult = await this.agents.knowledgeEnhancer.execute({
        query: message,
        intent: intentResult.intent,
        entities: intentResult.entities,
        context: conversation.context
      });
      
      // Generate response
      const responseResult = await this.agents.responseGenerator.execute({
        message: message,
        intent: intentResult.intent,
        entities: intentResult.entities,
        knowledge: knowledgeResult.knowledge,
        conversationHistory: conversation.messages,
        context: conversation.context,
        personality: this.personality,
        userPreferences: options.userPreferences || {}
      });
      
      // Update conversation context
      const contextUpdate = await this.agents.conversationManager.execute({
        currentContext: conversation.context,
        newMessage: userMessage,
        response: responseResult,
        intent: intentResult.intent
      });
      
      conversation.context = { ...conversation.context, ...contextUpdate.context };
      
      // Apply personality to response
      const personalizedResponse = await this.agents.personalityEngine.execute({
        response: responseResult,
        personality: this.personality,
        context: conversation.context,
        userHistory: conversation.messages.filter(m => m.sender === 'user')
      });
      
      // Add bot response to conversation
      const botMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: personalizedResponse.text,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        metadata: {
          intent: intentResult.intent,
          confidence: responseResult.confidence,
          sources: knowledgeResult.sources || []
        }
      };
      
      conversation.messages.push(botMessage);
      
      // Trim conversation if too long
      if (conversation.messages.length > 50) {
        conversation.messages = conversation.messages.slice(-50);
      }
      
      return {
        response: personalizedResponse.text,
        intent: intentResult.intent,
        entities: intentResult.entities,
        confidence: responseResult.confidence,
        sources: knowledgeResult.sources,
        conversationId: conversation.id,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error response to conversation
      const errorMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: "I apologize, but I'm experiencing technical difficulties. Could you please try rephrasing your question?",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        metadata: { error: true }
      };
      
      conversation.messages.push(errorMessage);
      
      return {
        response: "I apologize, but I'm experiencing technical difficulties. Could you please try rephrasing your question?",
        intent: 'error',
        entities: [],
        confidence: 0,
        sources: [],
        conversationId: conversation.id,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Estimate sentiment of a message
   */
  async estimateSentiment(text) {
    // Simplified sentiment estimation
    // In a real implementation, use a proper sentiment analysis tool
    const positiveWords = ['good', 'great', 'excellent', 'awesome', 'love', 'happy', 'pleased', 'satisfied'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'disappointed', 'sad'];
    
    const lowerText = text.toLowerCase();
    const posCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (posCount > negCount) return 'positive';
    if (negCount > posCount) return 'negative';
    return 'neutral';
  }

  /**
   * Get conversation history
   */
  getConversationHistory(userId) {
    const conversation = this.conversations.get(userId);
    return conversation ? [...conversation.messages] : [];
  }

  /**
   * Clear conversation history
   */
  clearConversation(userId) {
    this.conversations.delete(userId);
  }

  /**
   * Update bot personality
   */
  updatePersonality(personality) {
    this.personality = { ...this.personality, ...personality };
  }

  /**
   * Train the chatbot with conversation examples
   */
  async trainWithExamples(examples) {
    // In a real implementation, this would update the underlying models
    // For now, we'll just log the training request
    console.log(`Training chatbot with ${examples.length} conversation examples`);
    
    // Add examples to conversation memory for future reference
    for (const example of examples) {
      const userId = `training-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const conversation = {
        id: `conv-${userId}`,
        userId,
        messages: [
          {
            id: `msg-${Date.now()}-user`,
            text: example.input,
            sender: 'user',
            timestamp: new Date().toISOString()
          },
          {
            id: `msg-${Date.now()}-bot`,
            text: example.output,
            sender: 'bot',
            timestamp: new Date().toISOString()
          }
        ],
        context: example.context || {},
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      
      this.conversations.set(userId, conversation);
    }
  }

  /**
   * Get chatbot statistics
   */
  getStats() {
    const totalConversations = this.conversations.size;
    const totalMessages = Array.from(this.conversations.values()).reduce(
      (sum, conv) => sum + conv.messages.length, 0
    );
    
    const avgMessagesPerConversation = totalConversations > 0 
      ? Math.round(totalMessages / totalConversations) 
      : 0;
    
    // Get most common intents (would need to track this properly)
    const intents = {};
    Array.from(this.conversations.values()).forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.metadata?.intent) {
          intents[msg.metadata.intent] = (intents[msg.metadata.intent] || 0) + 1;
        }
      });
    });
    
    return {
      totalConversations,
      totalMessages,
      avgMessagesPerConversation,
      activeConversations: this.getActiveConversations().length,
      mostCommonIntents: intents,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get active conversations (active in last 30 minutes)
   */
  getActiveConversations() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    return Array.from(this.conversations.values()).filter(
      conv => conv.lastActive >= thirtyMinutesAgo
    );
  }

  /**
   * Export conversation data
   */
  exportConversations(format = 'json') {
    const data = {
      conversations: Array.from(this.conversations.values()),
      stats: this.getStats(),
      exportedAt: new Date().toISOString()
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      // Simplified CSV export
      let csv = 'UserId,Timestamp,Sender,Message,Intent,Confidence\n';
      Array.from(this.conversations.values()).forEach(conv => {
        conv.messages.forEach(msg => {
          csv += `"${conv.userId}","${msg.timestamp}","${msg.sender}","${msg.text.replace(/"/g, '""')}","${msg.metadata?.intent || ''}","${msg.metadata?.confidence || ''}"\n`;
        });
      });
      return csv;
    }
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import conversation data
   */
  importConversations(data) {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    
    if (data.conversations) {
      data.conversations.forEach(conv => {
        this.conversations.set(conv.userId, conv);
      });
    }
  }

  /**
   * Simulate a conversation for testing
   */
  async simulateConversation(initialPrompt, turns = 5) {
    const userId = `sim-${Date.now()}`;
    const conversation = [];
    
    let lastResponse = initialPrompt;
    
    for (let i = 0; i < turns; i++) {
      const response = await this.processMessage(userId, lastResponse);
      conversation.push({
        turn: i + 1,
        user: lastResponse,
        bot: response.response,
        timestamp: response.timestamp
      });
      
      // Generate a follow-up question based on the bot's response
      // In a real implementation, this could be more sophisticated
      lastResponse = this.generateFollowUp(response.response);
    }
    
    return conversation;
  }

  /**
   * Generate a follow-up question based on response
   */
  generateFollowUp(response) {
    const followUpPhrases = [
      "Can you elaborate on that?",
      "That's interesting, tell me more.",
      "How does that work in practice?",
      "What are the implications of that?",
      "Can you give me an example?",
      "What else should I know about this?",
      "How is this different from other approaches?",
      "What are the pros and cons?",
      "When would I use this?",
      "Are there any limitations?"
    ];
    
    return followUpPhrases[Math.floor(Math.random() * followUpPhrases.length)];
  }
}

// Example usage
async function main() {
  const chatbot = new Chatbot({
    ultraDex: {
      apiKey: process.env.ULTRA_DEX_API_KEY,
      endpoint: process.env.ULTRA_DEX_ENDPOINT || 'https://api.ultra-dex.ai'
    },
    personality: {
      name: 'Ultra-Dex Assistant',
      tone: 'helpful and professional',
      expertise: 'AI, technology, and software development',
      communicationStyle: 'clear, concise, and informative'
    }
  });
  
  // Example conversation
  try {
    console.log('Chatbot initialized. Starting sample conversation...');
    
    // Process a sample message
    const response = await chatbot.processMessage('user123', 'Hello! Can you tell me about AI orchestration?');
    console.log(`Bot: ${response.response}`);
    
    // Process a follow-up
    const followUpResponse = await chatbot.processMessage('user123', 'That sounds interesting. How does it work?');
    console.log(`Bot: ${followUpResponse.response}`);
    
    // Print chatbot stats
    console.log('Chatbot Stats:', chatbot.getStats());
    
    // Simulate a longer conversation
    console.log('\nSimulating conversation:');
    const simulation = await chatbot.simulateConversation('What is machine learning?', 3);
    simulation.forEach(turn => {
      console.log(`Turn ${turn.turn}:`);
      console.log(`  User: ${turn.user}`);
      console.log(`  Bot: ${turn.bot}`);
    });
  } catch (error) {
    console.error('Error in main:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default Chatbot;