// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';

const STORE_FILE = path.join(process.cwd(), '.ultra-dex', 'credentials.json');
const SERVICE = 'ultra-dex';

async function loadRegistry() {
  try {
    const data = await fs.readFile(STORE_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return { keys: [] };
  }
}

async function saveRegistry(registry) {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(registry, null, 2));
}

async function getKeytar() {
  try {
    const mod = await import('keytar');
    return mod.default || mod;
  } catch (error) {
    throw new Error(
      'keytar is not installed. Add it as an optional dependency to use credential storage.'
    );
  }
}

export async function setCredential(name, value) {
  const keytar = await getKeytar();
  await keytar.setPassword(SERVICE, name, value);
  const registry = await loadRegistry();
  if (!registry.keys.includes(name)) registry.keys.push(name);
  await saveRegistry(registry);
}

export async function listCredentials() {
  const registry = await loadRegistry();
  return registry.keys || [];
}

export async function getCredential(name) {
  const keytar = await getKeytar();
  return keytar.getPassword(SERVICE, name);
}

export async function deleteCredential(name) {
  const keytar = await getKeytar();
  await keytar.deletePassword(SERVICE, name);
  const registry = await loadRegistry();
  registry.keys = (registry.keys || []).filter((k) => k !== name);
  await saveRegistry(registry);
}
