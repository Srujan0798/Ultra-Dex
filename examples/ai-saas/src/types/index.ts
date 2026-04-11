/**
 * @fileoverview Index module
 * @module types/index
 */

export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  credits: number;
  plan: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  model: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokensUsed: number | null;
  createdAt: Date;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'PURCHASE' | 'USAGE' | 'BONUS' | 'REFUND';
  description: string | null;
  createdAt: Date;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number | null;
  credits: number | null;
  features: string[];
  stripePriceId: string | null;
  popular: boolean;
}

export interface ChatCompletionRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  conversationId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function handleIndexError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
