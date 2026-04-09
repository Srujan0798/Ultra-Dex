#!/usr/bin/env node

/**
 * Ultra-Dex Customer Support Agent
 *
 * This example demonstrates how to create an AI-powered customer support system using Ultra-Dex.
 * The agent can handle common queries, escalate complex issues, and learn from interactions.
 *
 * Features:
 * - Natural language understanding for customer queries
 * - Issue categorization and prioritization
 * - Escalation to human agents for complex issues
 * - Knowledge base integration
 * - Sentiment analysis
 */

import { UltraDex } from '@ultra-dex/sdk';

class CustomerSupportAgent {
  constructor(config) {
    this.ultraDex = new UltraDex(config.ultraDex);

    // Initialize specialized agents
    this.agents = {
      queryClassifier: this.ultraDex.createAgent({
        name: 'query-classifier',
        role: 'Classifies customer queries into categories and determines urgency',
        tools: ['intent-detector', 'sentiment-analyzer', 'urgency-assessor'],
      }),

      knowledgeBaseSearcher: this.ultraDex.createAgent({
        name: 'kb-searcher',
        role: 'Searches the knowledge base for relevant solutions',
        tools: ['semantic-search', 'document-retriever', 'solution-verifier'],
      }),

      responseGenerator: this.ultraDex.createAgent({
        name: 'response-generator',
        role: 'Generates helpful, empathetic responses to customer queries',
        tools: ['tone-adjuster', 'personalization-engine', 'solution-formatter'],
      }),

      escalationHandler: this.ultraDex.createAgent({
        name: 'escalation-handler',
        role: 'Determines when to escalate issues to human agents',
        tools: ['complexity-analyzer', 'policy-checker', 'human-handoff-orchestrator'],
      }),

      satisfactionTracker: this.ultraDex.createAgent({
        name: 'satisfaction-tracker',
        role: 'Follows up with customers to measure satisfaction',
        tools: ['feedback-analyzer', 'sentiment-tracker', 'improvement-suggester'],
      }),
    };

    // Maintain conversation context
    this.conversations = new Map();
    this.knowledgeBase = config.knowledgeBase || [];
  }

  /**
   * Process a customer query
   */
  async processQuery(customerId, query, context = {}) {
    // Create conversation context
    const conversationId = `${customerId}-${Date.now()}`;
    const conversation = {
      id: conversationId,
      customerId,
      query,
      timestamp: new Date().toISOString(),
      context,
      history: [],
    };

    this.conversations.set(conversationId, conversation);

    try {
      // Classify the query
      const classification = await this.agents.queryClassifier.execute({
        query: query,
        customerContext: context,
        conversationHistory: conversation.history,
      });

      // Search knowledge base for solutions
      const kbResults = await this.agents.knowledgeBaseSearcher.execute({
        query: query,
        category: classification.category,
        urgency: classification.urgency,
      });

      // Generate response
      const response = await this.agents.responseGenerator.execute({
        query: query,
        classification: classification,
        knowledgeBaseResults: kbResults,
        customerContext: context,
      });

      // Check if escalation is needed
      const escalation = await this.agents.escalationHandler.execute({
        query: query,
        classification: classification,
        response: response,
        sentiment: classification.sentiment,
      });

      // Update conversation history
      conversation.history.push({
        query,
        response,
        classification,
        escalated: escalation.needed,
        timestamp: new Date().toISOString(),
      });

      // Return response and escalation status
      return {
        response: response.text,
        confidence: response.confidence,
        escalated: escalation.needed,
        escalationReason: escalation.reason,
        followUpNeeded: response.followUp,
        conversationId,
      };
    } catch (error) {
      console.error('Error processing customer query:', error);
      return {
        response:
          "I apologize, but I'm experiencing technical difficulties. A human agent will assist you shortly.",
        confidence: 0,
        escalated: true,
        escalationReason: 'technical_error',
        followUpNeeded: false,
        conversationId,
      };
    }
  }

  /**
   * Add content to the knowledge base
   */
  addToKnowledgeBase(title, content, category, tags = []) {
    const entry = {
      id: `kb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      content,
      category,
      tags,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    this.knowledgeBase.push(entry);
    return entry.id;
  }

  /**
   * Update knowledge base entry
   */
  updateKnowledgeBaseEntry(id, updates) {
    const entry = this.knowledgeBase.find((item) => item.id === id);
    if (entry) {
      Object.assign(entry, updates, { lastUpdated: new Date().toISOString() });
      return true;
    }
    return false;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId) {
    return this.conversations.get(conversationId);
  }

  /**
   * Follow up with customer after resolution
   */
  async followUp(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const lastInteraction = conversation.history[conversation.history.length - 1];

    const followUpResult = await this.agents.satisfactionTracker.execute({
      conversation: conversation,
      resolution: lastInteraction.response,
      customerSatisfaction: lastInteraction.customerSatisfaction || null,
    });

    return followUpResult.feedbackRequest;
  }

  /**
   * Train the agent with new examples
   */
  async trainWithExamples(examples) {
    // In a real implementation, this would update the agent's knowledge
    // For now, we'll just log the training request
    console.log(`Training agent with ${examples.length} examples`);

    // Add examples to knowledge base
    for (const example of examples) {
      this.addToKnowledgeBase(
        example.question,
        example.answer,
        example.category,
        example.tags || []
      );
    }
  }

  /**
   * Get support metrics
   */
  getMetrics() {
    const conversations = Array.from(this.conversations.values());
    const totalConversations = conversations.length;
    const escalatedCount = conversations.filter((conv) =>
      conv.history.some((h) => h.escalated)
    ).length;

    const avgResolutionTime =
      conversations.reduce((sum, conv) => {
        if (conv.history.length > 0) {
          const startTime = new Date(conv.timestamp).getTime();
          const endTime = new Date(conv.history[conv.history.length - 1].timestamp).getTime();
          return sum + (endTime - startTime);
        }
        return sum;
      }, 0) / totalConversations || 0;

    return {
      totalConversations,
      escalatedCount,
      escalationRate: totalConversations > 0 ? (escalatedCount / totalConversations) * 100 : 0,
      avgResolutionTime: avgResolutionTime > 0 ? avgResolutionTime / 1000 : 0, // in seconds
      knowledgeBaseSize: this.knowledgeBase.length,
      timestamp: new Date().toISOString(),
    };
  }
}

// Example usage
async function main() {
  const supportAgent = new CustomerSupportAgent({
    ultraDex: {
      apiKey: process.env.ULTRA_DEX_API_KEY,
      endpoint: process.env.ULTRA_DEX_ENDPOINT || 'https://api.ultra-dex.ai',
    },
    knowledgeBase: [
      {
        id: 'kb-001',
        title: 'How to reset password?',
        content:
          'To reset your password, go to the login page and click "Forgot Password". Enter your email address and follow the instructions sent to your inbox.',
        category: 'account',
        tags: ['password', 'login', 'reset'],
      },
      {
        id: 'kb-002',
        title: 'Billing inquiry',
        content:
          'For billing questions, please contact our billing department at billing@example.com or call 1-800-123-4567.',
        category: 'billing',
        tags: ['billing', 'payment', 'subscription'],
      },
    ],
  });

  // Example customer interaction
  const result = await supportAgent.processQuery(
    'cust-123',
    "I forgot my password and can't log in to my account",
    {
      customerType: 'premium',
      lastLogin: '2023-01-15T10:30:00Z',
      language: 'en',
    }
  );

  console.log('Response:', result.response);
  console.log('Escalated:', result.escalated);

  // Print metrics
  console.log('Support Metrics:', supportAgent.getMetrics());
}

if (require.main === module) {
  main().catch(console.error);
}

export default CustomerSupportAgent;
