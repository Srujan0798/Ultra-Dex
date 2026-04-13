import fs from 'fs/promises';
import path from 'path';

export async function appendJsonl(filePath: string, data: unknown): Promise<void> {
  const line = JSON.stringify(data) + '\n';
  await fs.appendFile(filePath, line, 'utf8');
}

export async function readJsonl(filePath: string): Promise<unknown[]> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content
      .trim()
      .split('\n')
      .filter((line) => line)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}
