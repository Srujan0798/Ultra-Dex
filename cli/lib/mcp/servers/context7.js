// Copyright (c) 2026 Ultra-Dex

/**
 * Context7 MCP server adaptor
 */

import { fetchContext7Docs } from '../../docs/context7.js';

export async function handleContext7Request(params) {
  const { package: pkg, version } = params || {};
  if (!pkg) throw new Error('package name required');
  return fetchContext7Docs(pkg, version);
}

export default {
  handleContext7Request,
};
