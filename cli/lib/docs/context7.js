// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Context7 module
 * @module docs/context7
 */

import fs from 'fs/promises';
import path from 'path';

const CACHE_PATH = path.resolve(process.cwd(), '.ultra-dex', 'context7-cache.json');

async function loadCache() {
  try {
    const content = await fs.readFile(CACHE_PATH, 'utf8');
    return JSON.parse(content);
  } catch {
    return { entries: {} };
  }
}

async function saveCache(cache) {
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
}

export async function fetchContext7Docs(packageName, version = null) {
  const cache = await loadCache();
  const key = `${packageName}@${version || 'latest'}`;
  if (cache.entries[key]) {
    return cache.entries[key];
  }

  const apiUrl = process.env.CONTEXT7_API_URL;
  if (!apiUrl) {
    const fallback = {
      package: packageName,
      version: version || 'latest',
      content: `Docs cache missing for ${packageName}. Set CONTEXT7_API_URL to fetch live docs.`,
    };
    cache.entries[key] = fallback;
    await saveCache(cache);
    return fallback;
  }

  const res = await fetch(
    `${apiUrl}/docs/${packageName}?version=${encodeURIComponent(version || 'latest')}`
  );
  if (!res.ok) {
    throw new Error(`Context7 fetch failed: ${res.status}`);
  }
  const data = await res.json();
  cache.entries[key] = data;
  await saveCache(cache);
  return data;
}

export async function detectDependencies(projectDir = process.cwd()) {
  try {
    const pkg = JSON.parse(await fs.readFile(path.join(projectDir, 'package.json'), 'utf8'));
    return Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) });
  } catch {
    return [];
  }
}

export const context7Paths = {
  cache: CACHE_PATH,
};
