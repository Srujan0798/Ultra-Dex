// Copyright (c) 2026 Ultra-Dex

/**
 * Shared helpers for LangChain graph-based agents
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { StateGraph, START, END } from '@langchain/langgraph';

export const GraphState = {
  messages: {
    value: (x, y) => x.concat(y),
    default: () => [],
  },
  output: {
    value: (_x, y) => y,
    default: () => '',
  },
};

export function createSimpleGraph({
  nodeName,
  systemPrompt,
  model = 'gpt-4o-mini',
  temperature = 0.2,
  maxTokens,
  apiKey,
} = {}) {
  const llm = new ChatOpenAI({
    modelName: model,
    temperature,
    maxTokens,
    openAIApiKey: apiKey || process.env.OPENAI_API_KEY,
  });

  const workflow = new StateGraph({ channels: GraphState })
    .addNode(nodeName, async (state) => {
      const last = state.messages[state.messages.length - 1];
      const input = last?.content || '';
      const response = await llm.invoke([new SystemMessage(systemPrompt), new HumanMessage(input)]);
      return { output: response.content, messages: [response] };
    })
    .addEdge(START, nodeName)
    .addEdge(nodeName, END);

  return workflow.compile();
}

export async function runSimpleGraph(createGraph, input, options = {}) {
  const graph = createGraph(options);
  const messages = Array.isArray(input) ? input : [new HumanMessage(input ?? '')];
  return graph.invoke({ messages });
}

/**
 * Safe execution wrapper with error handling for graph-utils
 * @param {Function} fn - Async function to execute
 * @param {string} [context='graph-utils'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'graph-utils') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
