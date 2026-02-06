// Copyright (c) 2026 Ultra-Dex

/**
 * Agent handshake and registration
 */

import { createMessage } from './protocol.js';

export function registerAgent({ id, name, capabilities = [], status = 'idle' }) {
  return createMessage('agent.register', {
    id,
    name,
    capabilities,
    status,
  });
}

export function updateAvailability({ id, status = 'idle' }) {
  return createMessage('agent.status', {
    id,
    status,
  });
}

export function advertiseCapabilities({ id, capabilities = [] }) {
  return createMessage('agent.capabilities', {
    id,
    capabilities,
  });
}

export default {
  registerAgent,
  updateAvailability,
  advertiseCapabilities,
};
