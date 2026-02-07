// Copyright (c) 2026 Ultra-Dex

import { AgentMarketplace } from './index.js';

export async function installAgent(name, options = {}) {
  const marketplace = new AgentMarketplace(options);
  await marketplace.initialize();
  return marketplace.install(name, options);
}

export async function uninstallAgent(name, options = {}) {
  const marketplace = new AgentMarketplace(options);
  await marketplace.initialize();
  return marketplace.uninstall(name);
}

export default {
  installAgent,
  uninstallAgent,
};
