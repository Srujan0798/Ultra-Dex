// Copyright (c) 2026 Ultra-Dex

import { AgentMarketplace } from './index.js';

export async function searchAgents(query, options = {}) {
  const marketplace = new AgentMarketplace(options);
  await marketplace.initialize();
  return marketplace.search(query, options);
}

export default {
  searchAgents,
};
