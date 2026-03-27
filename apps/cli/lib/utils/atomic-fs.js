import fs from 'fs/promises';
import { existsSync, renameSync } from 'fs';
import path from 'path';
import { CorruptionError } from './errors.js';

function backupPathFor(filepath) {
  return `${filepath}.bak`;
}

function tempPathFor(filepath) {
  return `${filepath}.tmp`;
}

function corruptionSnapshotPathFor(filepath) {
  return `${filepath}.corrupted.${Date.now()}`;
}

function buildRecoverySuggestions(filepath, backupPath) {
  return [
    `Inspect the corrupted file at ${filepath}.`,
    `Restore the backup at ${backupPath} if it contains the last known good state.`,
    'Re-run the previous command after the corrupted file has been repaired or replaced.',
  ];
}

async function snapshotCorruptedFile(filepath) {
  const corruptionSnapshotPath = corruptionSnapshotPathFor(filepath);

  try {
    await fs.copyFile(filepath, corruptionSnapshotPath);
    return corruptionSnapshotPath;
  } catch {
    return null;
  }
}

async function tryRecoverFromBackup(filepath, parser, backupPath) {
  if (!existsSync(backupPath)) {
    return null;
  }

  const backupContent = await fs.readFile(backupPath, 'utf8');
  const parsedBackup = parser(backupContent);
  const tempPath = tempPathFor(filepath);

  await fs.writeFile(tempPath, backupContent);
  renameSync(tempPath, filepath);

  return parsedBackup;
}

async function handleCorruption(filepath, parser, error, formatName) {
  const backupPath = backupPathFor(filepath);
  const corruptionSnapshotPath = await snapshotCorruptedFile(filepath);

  try {
    const recovered = await tryRecoverFromBackup(filepath, parser, backupPath);
    if (recovered !== null) {
      return recovered;
    }
  } catch (backupError) {
    throw new CorruptionError(`Detected ${formatName} corruption in ${filepath} and backup recovery failed.`, {
      cause: backupError,
      details: {
        filepath,
        backupPath,
        corruptionSnapshotPath,
        originalError: error instanceof Error ? error.message : String(error),
      },
      suggestions: buildRecoverySuggestions(filepath, backupPath),
    });
  }

  throw new CorruptionError(`Detected ${formatName} corruption in ${filepath}. No valid backup could be recovered.`, {
    cause: error,
    details: {
      filepath,
      backupPath,
      corruptionSnapshotPath,
    },
    suggestions: buildRecoverySuggestions(filepath, backupPath),
  });
}

/**
 * Write content to a file atomically by writing to a temp file first and renaming.
 *
 * @param {string} filepath
 * @param {string|Buffer} content
 * @returns {Promise<void>}
 */
export async function atomicWriteFile(filepath, content) {
  const tempPath = tempPathFor(filepath);
  const backupPath = backupPathFor(filepath);

  try {
    await fs.mkdir(path.dirname(filepath), { recursive: true });

    if (existsSync(filepath)) {
      await fs.copyFile(filepath, backupPath);
    }

    await fs.writeFile(tempPath, content);
    renameSync(tempPath, filepath);
  } catch (error) {
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup failure
    }

    throw error;
  }
}

/**
 * Safely read a JSON file, attempting backup recovery on corruption.
 *
 * @param {string} filepath
 * @param {any} defaultValue
 * @returns {Promise<any>}
 */
export async function safeJsonRead(filepath, defaultValue = null) {
  let content;

  try {
    content = await fs.readFile(filepath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return defaultValue;
    }

    throw error;
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    return handleCorruption(filepath, (rawContent) => JSON.parse(rawContent), error, 'JSON');
  }
}

/**
 * Safely read a JSONL file, attempting backup recovery on corruption.
 *
 * @param {string} filepath
 * @param {any[]} defaultValue
 * @returns {Promise<any[]>}
 */
export async function safeJsonlRead(filepath, defaultValue = []) {
  const parseJsonl = (content) =>
    content
      .split('\n')
      .filter(Boolean)
      .map((line, index) => {
        try {
          return JSON.parse(line);
        } catch (error) {
          const lineError = new SyntaxError(`Invalid JSONL record at line ${index + 1}`);
          lineError.cause = error;
          throw lineError;
        }
      });

  let content;

  try {
    content = await fs.readFile(filepath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return defaultValue;
    }

    throw error;
  }

  try {
    return parseJsonl(content);
  } catch (error) {
    return handleCorruption(filepath, parseJsonl, error, 'JSONL');
  }
}
