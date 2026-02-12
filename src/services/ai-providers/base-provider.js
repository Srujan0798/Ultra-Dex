// Copyright (c) 2026 Ultra-Dex — Base Provider Interface

export class BaseProvider {
  constructor(name, config = {}) {
    this.name = name;
    this.apiKey = config.apiKey || process.env[`${name.toUpperCase()}_API_KEY`] || '';
    this.baseUrl = config.baseUrl || '';
    this.defaultModel = config.defaultModel || '';
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
  }

  async _request(endpoint, body, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this._authHeaders(),
      ...options.headers,
    };

    let lastError;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeout);
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`[${this.name}] ${res.status}: ${errBody}`);
        }
        return res.json();
      } catch (err) {
        lastError = err;
        if (attempt < this.maxRetries - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  }

  async *_streamRequest(endpoint, body, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this._authHeaders(),
      ...options.headers,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`[${this.name}] ${res.status}: ${errBody}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;
          try {
            yield JSON.parse(data);
          } catch {
            /* skip malformed */
          }
        }
      }
    }
  }

  _authHeaders() {
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  async chat() {
    throw new Error(`chat() not implemented for ${this.name}`);
  }
  async *stream() {
    yield* [];
    throw new Error(`stream() not implemented for ${this.name}`);
  }
  async embed() {
    throw new Error(`embed() not implemented for ${this.name}`);
  }
}
