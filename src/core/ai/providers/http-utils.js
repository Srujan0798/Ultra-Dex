// Copyright (c) 2026 Ultra-Dex

const DEFAULT_TIMEOUT_MS = 45000;

export class ProviderError extends Error {
  constructor(provider, message, options = {}) {
    super(`[${provider}] ${message}`);
    this.name = 'ProviderError';
    this.provider = provider;
    this.code = options.code || 'PROVIDER_ERROR';
    this.status = options.status;
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
  }
}

export function normalizeUsage(usage = {}) {
  const inputTokens =
    usage.prompt_tokens ??
    usage.input_tokens ??
    usage.promptTokenCount ??
    usage.prompt_tokens_total ??
    usage.tokens?.input_tokens ??
    usage.token_count?.input_tokens ??
    0;

  const outputTokens =
    usage.completion_tokens ??
    usage.output_tokens ??
    usage.candidatesTokenCount ??
    usage.completion_tokens_total ??
    usage.tokens?.output_tokens ??
    usage.token_count?.output_tokens ??
    0;

  const totalTokens = usage.total_tokens ?? inputTokens + outputTokens;

  return {
    inputTokens,
    outputTokens,
    totalTokens,
  };
}

export function deterministicEmbedding(text, dimensions = 256) {
  const embedding = new Array(dimensions).fill(0);
  const bytes = new TextEncoder().encode(text || '');

  for (let i = 0; i < bytes.length; i++) {
    const index = i % dimensions;
    embedding[index] += (bytes[i] - 128) / 128;
  }

  const norm = Math.sqrt(embedding.reduce((sum, value) => sum + value * value, 0)) || 1;
  for (let i = 0; i < embedding.length; i++) {
    embedding[i] = embedding[i] / norm;
  }

  return embedding;
}

export function normalizeMessages(messages = []) {
  return messages.map((message) => ({
    role: message.role || 'user',
    content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
  }));
}

function withTimeoutSignal(signal, timeoutMs = DEFAULT_TIMEOUT_MS) {
  if (signal) {
    return { signal, cleanup: () => {} };
  }

  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return {
      signal: AbortSignal.timeout(timeoutMs),
      cleanup: () => {},
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error('Request timeout')), timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}

export async function postJson(provider, url, { headers = {}, body = {}, signal, timeoutMs } = {}) {
  const request = withTimeoutSignal(signal, timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
      signal: request.signal,
    });

    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { raw: text };
    }

    if (!response.ok) {
      const message =
        payload?.error?.message ||
        payload?.message ||
        payload?.raw ||
        `HTTP ${response.status}`;
      throw new ProviderError(provider, message, {
        code: 'HTTP_ERROR',
        status: response.status,
        retryable: response.status >= 500,
      });
    }

    return payload;
  } catch (error) {
    if (error instanceof ProviderError) {
      throw error;
    }

    throw new ProviderError(provider, error.message || String(error), {
      code: 'NETWORK_ERROR',
      retryable: true,
      cause: error,
    });
  } finally {
    request.cleanup();
  }
}

export async function* streamSse(provider, url, { headers = {}, body = {}, signal, timeoutMs } = {}) {
  const request = withTimeoutSignal(signal, timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
      signal: request.signal,
    });
  } catch (error) {
    request.cleanup();
    throw new ProviderError(provider, error.message || String(error), {
      code: 'NETWORK_ERROR',
      retryable: true,
      cause: error,
    });
  }

  if (!response.ok) {
    const text = await response.text();
    request.cleanup();
    throw new ProviderError(provider, text || `HTTP ${response.status}`, {
      code: 'HTTP_ERROR',
      status: response.status,
      retryable: response.status >= 500,
    });
  }

  if (!response.body) {
    request.cleanup();
    throw new ProviderError(provider, 'Streaming response has no body', {
      code: 'INVALID_RESPONSE',
    });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split('\n\n');
      buffer = frames.pop() || '';

      for (const frame of frames) {
        const lines = frame
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (!data) continue;

          if (data === '[DONE]') {
            yield { type: 'done', content: '' };
            return;
          }

          let payload;
          try {
            payload = JSON.parse(data);
          } catch {
            yield { type: 'text', content: data, raw: data };
            continue;
          }

          const deltaText =
            payload?.choices?.[0]?.delta?.content ??
            payload?.choices?.[0]?.message?.content ??
            payload?.delta?.text ??
            payload?.text ??
            payload?.candidates?.[0]?.content?.parts
              ?.map((part) => part.text)
              .filter(Boolean)
              .join('') ??
            '';

          const toolCall =
            payload?.choices?.[0]?.delta?.tool_calls?.[0] ||
            payload?.choices?.[0]?.message?.tool_calls?.[0] ||
            payload?.tool_call;

          if (toolCall) {
            yield { type: 'tool_call', content: toolCall, raw: payload };
          }

          if (deltaText) {
            yield { type: 'text', content: deltaText, raw: payload };
          }
        }
      }
    }

    if (buffer.trim()) {
      yield { type: 'text', content: buffer.trim(), raw: buffer.trim() };
    }

    yield { type: 'done', content: '' };
  } finally {
    request.cleanup();
  }
}

export function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
