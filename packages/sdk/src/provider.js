export class BaseProvider {
  constructor(config = {}) {
    this.config = config;
  }

  async chat() {
    throw new Error('UltraDex SDK: provider must implement chat(messages, opts)');
  }

  async *stream() {
    throw new Error('UltraDex SDK: provider must implement stream(messages, opts)');
  }

  async embed() {
    throw new Error('UltraDex SDK: provider must implement embed(text, opts)');
  }
}

export function assertProviderContract(name, provider) {
  if (!provider || typeof provider !== 'object') {
    throw new Error(`UltraDex SDK: provider "${name}" must be an object instance`);
  }

  const missing = ['chat', 'stream', 'embed'].filter((method) => typeof provider[method] !== 'function');
  if (missing.length > 0) {
    throw new Error(
      `UltraDex SDK: provider "${name}" is missing required methods: ${missing.join(', ')}`
    );
  }
}

export default BaseProvider;
