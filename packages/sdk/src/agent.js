export class Agent {
  constructor({ id, name = id, description = '', capabilities = [], meta = {} } = {}) {
    if (!id || typeof id !== 'string') {
      throw new Error('UltraDex SDK: Agent requires a non-empty string id');
    }

    this.id = id;
    this.name = name;
    this.description = description;
    this.capabilities = capabilities;
    this.meta = meta;
    this.memory = new Map();
  }

  describe() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      capabilities: [...this.capabilities],
      meta: { ...this.meta },
    };
  }

  remember(key, value) {
    this.memory.set(key, {
      value,
      storedAt: new Date().toISOString(),
    });
    return this;
  }

  recall(key) {
    return this.memory.get(key)?.value;
  }

  clearMemory() {
    this.memory.clear();
  }

  async run() {
    throw new Error(`UltraDex SDK: Agent "${this.id}" must implement async run(task, context)`);
  }
}

export default Agent;
