import fs from 'fs/promises';
import path from 'path';

const DEFAULT_PATH = path.join(process.cwd(), '.ultra-dex', 'vector-store.json');

export async function loadVectorStore() {
  try {
    const data = await fs.readFile(DEFAULT_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return { items: [] };
  }
}

export async function saveVectorStore(store) {
  await fs.mkdir(path.dirname(DEFAULT_PATH), { recursive: true });
  await fs.writeFile(DEFAULT_PATH, JSON.stringify(store, null, 2));
}

export async function addVectorItem(item) {
  const store = await loadVectorStore();
  store.items.push(item);
  await saveVectorStore(store);
  return item;
}
