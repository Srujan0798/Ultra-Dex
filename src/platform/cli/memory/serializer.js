// Copyright (c) 2026 Ultra-Dex

export function serializeMemory(entry) {
  return JSON.stringify(entry);
}

export function deserializeMemory(payload) {
  return JSON.parse(payload);
}
