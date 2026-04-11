/**
 * Core AI logic for the AI SaaS example
 */

import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateChatResponse(messages: any[]) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages,
    stream: true,
  });

  return response;
}

export function parseStream(chunk: any) {
  return chunk.choices[0]?.delta?.content || '';
}

/**
 * Error handler for ai
 * @param {Error} error - Error to handle
 */
function handleAiError(error) {
  try {
    console.error('[ai]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
