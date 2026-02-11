// Copyright (c) 2026 Ultra-Dex

/**
 * History Tracking Instrumentation
 * Wraps fs operations to record write/delete events for Universal Undo.
 */

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { historyManager } from './undo.js';

const original = {
  writeFile: fsPromises.writeFile,
  appendFile: fsPromises.appendFile,
  unlink: fsPromises.unlink,
  rm: fsPromises.rm,
  rename: fsPromises.rename,
  copyFile: fsPromises.copyFile,
  readFile: fsPromises.readFile,
  stat: fsPromises.stat,
  lstat: fsPromises.lstat,
};

function normalizePath(input) {
  if (!input) return null;
  if (input instanceof URL) return fileURLToPath(input);
  if (typeof input === 'string') return input;
  return null;
}

function encodeData(data) {
  if (data == null) return { value: null, binary: false };
  if (Buffer.isBuffer(data)) {
    const binary = isProbablyBinary(data);
    return {
      value: binary ? data.toString('base64') : data.toString('utf8'),
      binary,
    };
  }
  if (data instanceof Uint8Array) {
    const buffer = Buffer.from(data);
    const binary = isProbablyBinary(buffer);
    return {
      value: binary ? buffer.toString('base64') : buffer.toString('utf8'),
      binary,
    };
  }
  return { value: String(data), binary: false };
}

function decodeToBuffer(data, encoding = 'utf8') {
  if (data == null) return null;
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);
  return Buffer.from(String(data), encoding);
}

function isProbablyBinary(buffer) {
  if (!buffer || buffer.length === 0) return false;
  const sample = buffer.subarray(0, Math.min(buffer.length, 128));
  return sample.includes(0);
}

async function readSnapshot(filePath) {
  try {
    const stat = await original.stat(filePath);
    if (!stat.isFile()) return { value: null, binary: false };
  } catch {
    return { value: null, binary: false };
  }

  try {
    const data = await original.readFile(filePath);
    return encodeData(data);
  } catch {
    return { value: null, binary: false };
  }
}

async function recordWrite(filePath, beforeSnapshot, afterData, metadata = {}) {
  if (!historyManager.shouldTrack(filePath)) return;
  const afterSnapshot = encodeData(afterData);
  await historyManager.recordWrite({
    filePath,
    before: beforeSnapshot?.value ?? null,
    after: afterSnapshot.value ?? '',
    actor: metadata.actor || 'system',
    reason: metadata.reason || 'write',
    metadata: {
      ...metadata,
      beforeBinary: beforeSnapshot?.binary || false,
      afterBinary: afterSnapshot.binary || false,
    },
  });
}

async function recordDelete(filePath, beforeSnapshot, metadata = {}) {
  if (!historyManager.shouldTrack(filePath)) return;
  await historyManager.recordDelete({
    filePath,
    before: beforeSnapshot?.value ?? null,
    actor: metadata.actor || 'system',
    reason: metadata.reason || 'delete',
    metadata: {
      ...metadata,
      beforeBinary: beforeSnapshot?.binary || false,
    },
  });
}

function wrapPromiseWrite() {
  fsPromises.writeFile = async (filePath, data, options) => {
    const normalized = normalizePath(filePath);
    const shouldTrack = normalized ? historyManager.shouldTrack(normalized) : false;
    const beforeSnapshot = shouldTrack && normalized ? await readSnapshot(normalized) : null;
    const result = await original.writeFile(filePath, data, options);
    if (normalized && shouldTrack) {
      await recordWrite(normalized, beforeSnapshot, data, { reason: 'writeFile' });
    }
    return result;
  };

  fsPromises.appendFile = async (filePath, data, options) => {
    const normalized = normalizePath(filePath);
    const shouldTrack = normalized ? historyManager.shouldTrack(normalized) : false;
    const beforeSnapshot = shouldTrack && normalized ? await readSnapshot(normalized) : null;
    const result = await original.appendFile(filePath, data, options);
    if (normalized && shouldTrack) {
      const base = beforeSnapshot?.binary
        ? Buffer.from(beforeSnapshot.value || '', 'base64')
        : decodeToBuffer(beforeSnapshot?.value || '');
      const appended = decodeToBuffer(data, beforeSnapshot?.binary ? 'base64' : 'utf8');
      const combined = base && appended ? Buffer.concat([base, appended]) : data;
      await recordWrite(normalized, beforeSnapshot, combined, { reason: 'appendFile' });
    }
    return result;
  };

  fsPromises.unlink = async (filePath) => {
    const normalized = normalizePath(filePath);
    const shouldTrack = normalized ? historyManager.shouldTrack(normalized) : false;
    const beforeSnapshot = shouldTrack && normalized ? await readSnapshot(normalized) : null;
    const result = await original.unlink(filePath);
    if (normalized && shouldTrack) {
      await recordDelete(normalized, beforeSnapshot, { reason: 'unlink' });
    }
    return result;
  };

  fsPromises.rm = async (filePath, options) => {
    const normalized = normalizePath(filePath);
    let beforeSnapshot = null;
    let shouldTrack = false;
    if (normalized) {
      shouldTrack = historyManager.shouldTrack(normalized);
      if (shouldTrack) {
        beforeSnapshot = await readSnapshot(normalized);
      }
    }
    const result = await original.rm(filePath, options);
    if (normalized && shouldTrack && beforeSnapshot?.value !== null) {
      await recordDelete(normalized, beforeSnapshot, { reason: 'rm' });
    }
    return result;
  };

  fsPromises.rename = async (from, to) => {
    const fromPath = normalizePath(from);
    const toPath = normalizePath(to);
    const fromSnapshot =
      fromPath && historyManager.shouldTrack(fromPath) ? await readSnapshot(fromPath) : null;
    const toSnapshot =
      toPath && historyManager.shouldTrack(toPath) ? await readSnapshot(toPath) : null;
    const result = await original.rename(from, to);
    if (fromPath && historyManager.shouldTrack(fromPath) && fromSnapshot?.value !== null) {
      await recordDelete(fromPath, fromSnapshot, { reason: 'rename' });
    }
    if (toPath && historyManager.shouldTrack(toPath)) {
      await recordWrite(
        toPath,
        toSnapshot,
        fromSnapshot?.binary
          ? Buffer.from(fromSnapshot.value || '', 'base64')
          : (fromSnapshot?.value ?? ''),
        { reason: 'rename' }
      );
    }
    return result;
  };

  fsPromises.copyFile = async (src, dest, mode) => {
    const srcPath = normalizePath(src);
    const destPath = normalizePath(dest);
    const destSnapshot =
      destPath && historyManager.shouldTrack(destPath) ? await readSnapshot(destPath) : null;
    let srcBuffer = null;
    if (srcPath && historyManager.shouldTrack(destPath)) {
      try {
        srcBuffer = await original.readFile(src);
      } catch {
        srcBuffer = null;
      }
    }
    const result = await original.copyFile(src, dest, mode);
    if (destPath && historyManager.shouldTrack(destPath)) {
      await recordWrite(destPath, destSnapshot, srcBuffer || '', { reason: 'copyFile' });
    }
    return result;
  };
}

function wrapSyncWrite() {
  const originalSync = {
    writeFileSync: fs.writeFileSync.bind(fs),
    appendFileSync: fs.appendFileSync.bind(fs),
    unlinkSync: fs.unlinkSync.bind(fs),
    rmSync: fs.rmSync.bind(fs),
    renameSync: fs.renameSync.bind(fs),
    copyFileSync: fs.copyFileSync.bind(fs),
    readFileSync: fs.readFileSync.bind(fs),
    statSync: fs.statSync.bind(fs),
  };

  fs.writeFileSync = (filePath, data, options) => {
    const normalized = normalizePath(filePath);
    const shouldTrack = normalized ? historyManager.shouldTrack(normalized) : false;
    let beforeSnapshot = null;
    if (shouldTrack && normalized) {
      try {
        const stat = originalSync.statSync(normalized);
        if (stat.isFile()) {
          const buffer = originalSync.readFileSync(normalized);
          beforeSnapshot = encodeData(buffer);
        }
      } catch {
        beforeSnapshot = { value: null, binary: false };
      }
    }
    const result = originalSync.writeFileSync(filePath, data, options);
    if (normalized && shouldTrack) {
      recordWrite(normalized, beforeSnapshot, data, { reason: 'writeFileSync' }).catch(() => {});
    }
    return result;
  };

  fs.appendFileSync = (filePath, data, options) => {
    const normalized = normalizePath(filePath);
    const shouldTrack = normalized ? historyManager.shouldTrack(normalized) : false;
    let beforeSnapshot = null;
    if (shouldTrack && normalized) {
      try {
        const stat = originalSync.statSync(normalized);
        if (stat.isFile()) {
          const buffer = originalSync.readFileSync(normalized);
          beforeSnapshot = encodeData(buffer);
        }
      } catch {
        beforeSnapshot = { value: null, binary: false };
      }
    }
    const result = originalSync.appendFileSync(filePath, data, options);
    if (normalized && shouldTrack) {
      recordWrite(normalized, beforeSnapshot, data, { reason: 'appendFileSync' }).catch(() => {});
    }
    return result;
  };

  fs.unlinkSync = (filePath) => {
    const normalized = normalizePath(filePath);
    const shouldTrack = normalized ? historyManager.shouldTrack(normalized) : false;
    let beforeSnapshot = null;
    if (shouldTrack && normalized) {
      try {
        const stat = originalSync.statSync(normalized);
        if (stat.isFile()) {
          const buffer = originalSync.readFileSync(normalized);
          beforeSnapshot = encodeData(buffer);
        }
      } catch {
        beforeSnapshot = { value: null, binary: false };
      }
    }
    const result = originalSync.unlinkSync(filePath);
    if (normalized && shouldTrack) {
      recordDelete(normalized, beforeSnapshot, { reason: 'unlinkSync' }).catch(() => {});
    }
    return result;
  };

  fs.rmSync = (filePath, options) => {
    const normalized = normalizePath(filePath);
    const shouldTrack = normalized ? historyManager.shouldTrack(normalized) : false;
    let beforeSnapshot = null;
    if (shouldTrack && normalized) {
      try {
        const stat = originalSync.statSync(normalized);
        if (stat.isFile()) {
          const buffer = originalSync.readFileSync(normalized);
          beforeSnapshot = encodeData(buffer);
        }
      } catch {
        beforeSnapshot = { value: null, binary: false };
      }
    }
    const result = originalSync.rmSync(filePath, options);
    if (normalized && shouldTrack && beforeSnapshot?.value !== null) {
      recordDelete(normalized, beforeSnapshot, { reason: 'rmSync' }).catch(() => {});
    }
    return result;
  };

  fs.renameSync = (from, to) => {
    const fromPath = normalizePath(from);
    const toPath = normalizePath(to);
    let fromSnapshot = null;
    let toSnapshot = null;
    if (fromPath && historyManager.shouldTrack(fromPath)) {
      try {
        const stat = originalSync.statSync(fromPath);
        if (stat.isFile()) {
          const buffer = originalSync.readFileSync(fromPath);
          fromSnapshot = encodeData(buffer);
        }
      } catch {
        fromSnapshot = { value: null, binary: false };
      }
    }
    if (toPath && historyManager.shouldTrack(toPath)) {
      try {
        const stat = originalSync.statSync(toPath);
        if (stat.isFile()) {
          const buffer = originalSync.readFileSync(toPath);
          toSnapshot = encodeData(buffer);
        }
      } catch {
        toSnapshot = { value: null, binary: false };
      }
    }
    const result = originalSync.renameSync(from, to);
    if (fromPath && historyManager.shouldTrack(fromPath) && fromSnapshot?.value !== null) {
      recordDelete(fromPath, fromSnapshot, { reason: 'renameSync' }).catch(() => {});
    }
    if (toPath && historyManager.shouldTrack(toPath)) {
      recordWrite(
        toPath,
        toSnapshot,
        fromSnapshot?.binary
          ? Buffer.from(fromSnapshot.value || '', 'base64')
          : (fromSnapshot?.value ?? ''),
        { reason: 'renameSync' }
      ).catch(() => {});
    }
    return result;
  };

  fs.copyFileSync = (src, dest, mode) => {
    const destPath = normalizePath(dest);
    let destSnapshot = null;
    if (destPath && historyManager.shouldTrack(destPath)) {
      try {
        const stat = originalSync.statSync(destPath);
        if (stat.isFile()) {
          const buffer = originalSync.readFileSync(destPath);
          destSnapshot = encodeData(buffer);
        }
      } catch {
        destSnapshot = { value: null, binary: false };
      }
    }
    let srcBuffer = null;
    try {
      srcBuffer = originalSync.readFileSync(src);
    } catch {
      srcBuffer = null;
    }
    const result = originalSync.copyFileSync(src, dest, mode);
    if (destPath && historyManager.shouldTrack(destPath)) {
      recordWrite(destPath, destSnapshot, srcBuffer || '', { reason: 'copyFileSync' }).catch(
        () => {}
      );
    }
    return result;
  };
}

export async function installHistoryTracking() {
  await historyManager.init();
  wrapPromiseWrite();
  wrapSyncWrite();
}

export default { installHistoryTracking };
