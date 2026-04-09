/**
 * Token Budget Utility
 * Manages token estimation and budget allocation for AI calls
 */

export interface TokenAllocation {
  total: number;
  parts: Record<string, number>;
}

export class TokenBudget {
  /**
   * Calculate a token budget for a specific AI call
   */
  calculateBudget(model: string, maxTokens: number = 4096): number {
    // Model-specific logic could be added here
    // For now, return the provided max or a default
    return Math.min(maxTokens, 128000); // Caps at 128k
  }

  /**
   * Split a total budget into multiple parts based on provided weightings
   */
  splitBudget(total: number, weights: Record<string, number>): Record<string, number> {
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const result: Record<string, number> = {};

    Object.entries(weights).forEach(([key, weight]) => {
      result[key] = Math.floor((weight / totalWeight) * total);
    });

    return result;
  }

  /**
   * Estimate the number of tokens in a string of text
   * Heuristic: 4 characters per token
   */
  estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  /**
   * Estimate tokens for a full AI conversation (messages array)
   */
  estimateConversationTokens(messages: Array<{ role: string; content: string }>): number {
    return messages.reduce((acc, msg) => {
      // Base overhead per message (estimated 4 tokens)
      return acc + this.estimateTokens(msg.content) + 4;
    }, 11); // Initial overhead for conversation
  }
}

export const tokenBudget = new TokenBudget();
