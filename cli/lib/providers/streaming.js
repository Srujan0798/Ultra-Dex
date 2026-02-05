import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

const PROVIDER_MAP = {
  openai: {
    create: (apiKey) => openai({ apiKey }),
    defaultModel: 'gpt-4o-mini'
  },
  claude: {
    create: (apiKey) => anthropic({ apiKey }),
    defaultModel: 'claude-3-5-sonnet-20240620'
  },
  anthropic: {
    create: (apiKey) => anthropic({ apiKey }),
    defaultModel: 'claude-3-5-sonnet-20240620'
  }
};

function resolveProvider(providerId) {
  const normalized = (providerId || '').toLowerCase();
  return PROVIDER_MAP[normalized] || null;
}

function resolveApiKey(providerId, apiKey) {
  if (apiKey) return apiKey;
  if (providerId === 'openai') return process.env.OPENAI_API_KEY;
  if (providerId === 'claude' || providerId === 'anthropic') return process.env.ANTHROPIC_API_KEY;
  return null;
}

export async function streamWithProvider({
  providerId,
  model,
  systemPrompt,
  prompt,
  apiKey,
  onToken
} = {}) {
  const provider = resolveProvider(providerId);
  if (!provider) {
    throw new Error(`Streaming provider not supported: ${providerId}`);
  }

  const resolvedKey = resolveApiKey(providerId, apiKey);
  if (!resolvedKey) {
    throw new Error(`Missing API key for ${providerId}. Set env var or pass --key.`);
  }

  const modelName = model || provider.defaultModel;
  const modelClient = provider.create(resolvedKey)(modelName);

  const response = await streamText({
    model: modelClient,
    system: systemPrompt,
    prompt
  });

  let output = '';
  for await (const chunk of response.textStream) {
    output += chunk;
    if (onToken) onToken(chunk);
  }

  const usage = response.usage ?? null;
  return { text: output, usage, model: modelName };
}

export function getStreamingProviders() {
  return Object.keys(PROVIDER_MAP);
}
