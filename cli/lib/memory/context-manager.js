// Copyright (c) 2026 Ultra-Dex

import { PersistentMemoryStore } from './persistent-store.js';

export class ContextManager {
  constructor(store = new PersistentMemoryStore()) {
    this.store = store;
  }

  async remember(entry) {
    return this.store.add(entry);
  }

  async search(query) {
    return this.store.query(query);
  }
}
