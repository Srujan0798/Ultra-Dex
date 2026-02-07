const DEFAULT_ATTEMPTS = 3;
const DEFAULT_BACKOFF_MS = 500;
const DEFAULT_TIMEOUT_MS = 5000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postWithTimeout(
  url: string,
  payload: unknown,
  headers: Record<string, string>,
  timeoutMs: number
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    let json: unknown = text;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // Keep raw body if not JSON.
    }

    return { response, body: json };
  } finally {
    clearTimeout(timeout);
  }
}

export async function deliverWebhook(
  url: string,
  payload: unknown,
  options: {
    attempts?: number;
    backoffMs?: number;
    timeoutMs?: number;
    headers?: Record<string, string>;
  } = {}
) {
  const attempts = options.attempts ?? DEFAULT_ATTEMPTS;
  const backoffMs = options.backoffMs ?? DEFAULT_BACKOFF_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const headers = options.headers ?? {};

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const { response, body } = await postWithTimeout(url, payload, headers, timeoutMs);

      if (!response.ok) {
        throw new Error(`Webhook responded with ${response.status}`);
      }

      return {
        url,
        status: 'delivered',
        attempts: attempt,
        statusCode: response.status,
        response: body,
      };
    } catch (error) {
      lastError = error as Error;
      if (attempt < attempts) {
        await sleep(backoffMs * attempt);
      }
    }
  }

  return {
    url,
    status: 'failed',
    attempts,
    error: lastError?.message || 'Unknown error',
  };
}
