import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const AI_MODELS = {
  GPT4: 'gpt-4',
  GPT4_TURBO: 'gpt-4-turbo-preview',
  GPT35_TURBO: 'gpt-3.5-turbo',
  GPT35_TURBO_16K: 'gpt-3.5-turbo-16k',
} as const;

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const DEFAULT_SYSTEM_PROMPT =
  'You are a helpful AI assistant. Be concise and clear in your responses.';

export async function* streamChatCompletion(
  messages: ChatMessage[],
  model: AIModel = AI_MODELS.GPT35_TURBO,
  temperature: number = 0.7,
  maxTokens: number = 2000
) {
  const stream = await openai.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

export async function calculateTokenCost(messages: ChatMessage[], model: AIModel): Promise<number> {
  // Approximate token counting (1 token ≈ 4 characters)
  const totalChars = messages.reduce((acc, msg) => acc + msg.content.length, 0);
  const estimatedTokens = Math.ceil(totalChars / 4);

  // Cost per 1K tokens (approximate)
  const costs: Record<AIModel, { input: number; output: number }> = {
    [AI_MODELS.GPT4]: { input: 0.03, output: 0.06 },
    [AI_MODELS.GPT4_TURBO]: { input: 0.01, output: 0.03 },
    [AI_MODELS.GPT35_TURBO]: { input: 0.0015, output: 0.002 },
    [AI_MODELS.GPT35_TURBO_16K]: { input: 0.003, output: 0.004 },
  };

  const cost = costs[model];
  const inputCost = (estimatedTokens / 1000) * cost.input;
  const outputCost = (1000 / 1000) * cost.output; // Assume 1000 tokens output

  // Convert to credits (1 credit = $0.01)
  const totalCost = inputCost + outputCost;
  return Math.ceil(totalCost * 100);
}

export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}
