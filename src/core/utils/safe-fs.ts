var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "fs";
import path from "path";
let DataCorruptionError = class extends Error {
  constructor(filePath, cause, details = {}) {
    super(
      `Data corruption detected in ${filePath}. Backup recovery was attempted. Manual recovery may be needed.`
    );
    this.name = "CorruptionError";
    this.filePath = filePath;
    this.cause = cause;
    this.details = details;
    this.recoveryInstructions = [
      `Inspect the corrupted file at ${filePath}.`,
      `Check the backup at ${filePath}.bak.`,
      "Restore or repair the file, then retry the command."
    ];
  }
};
DataCorruptionError = __decorateClass([
  singleton()
], DataCorruptionError);
function atomicWriteSync(filePath, data) {
  const directory = path.dirname(filePath);
  const tmpPath = `${filePath}.tmp`;
  const backupPath = `${filePath}.bak`;
  mkdirSync(directory, { recursive: true });
  if (existsSync(filePath)) {
    copyFileSync(filePath, backupPath);
  }
  writeFileSync(tmpPath, data, "utf8");
  renameSync(tmpPath, filePath);
}
function safeReadJSON(filePath, defaultValue = null) {
  try {
    const data = readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return defaultValue;
    }
    const backupPath = `${filePath}.bak`;
    if (existsSync(backupPath)) {
      try {
        const backup = readFileSync(backupPath, "utf8");
        const recovered = JSON.parse(backup);
        atomicWriteSync(filePath, backup);
        return recovered;
      } catch (backupError) {
        throw new DataCorruptionError(filePath, error, {
          backupPath,
          backupError: backupError instanceof Error ? backupError.message : String(backupError)
        });
      }
    }
    throw new DataCorruptionError(filePath, error, { backupPath });
  }
}
function safeReadJSONL(filePath, defaultValue = []) {
  try {
    const data = readFileSync(filePath, "utf8");
    const validEntries = [];
    let corruptedLines = 0;
    for (const [index, line] of data.split("\n").filter(Boolean).entries()) {
      try {
        validEntries.push(JSON.parse(line));
      } catch (error) {
        corruptedLines += 1;
        console.warn(`[safe-fs] Skipping corrupt JSONL line ${index + 1} in ${filePath}: ${error.message}`);
      }
    }
    if (corruptedLines > 0 && validEntries.length === 0) {
      throw new SyntaxError("All JSONL lines are corrupted");
    }
    return validEntries;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return defaultValue;
    }
    const backupPath = `${filePath}.bak`;
    if (existsSync(backupPath)) {
      try {
        const backup = readFileSync(backupPath, "utf8");
        const recovered = backup.split("\n").filter(Boolean).map((line) => JSON.parse(line));
        atomicWriteSync(filePath, backup);
        return recovered;
      } catch (backupError) {
        throw new DataCorruptionError(filePath, error, {
          backupPath,
          backupError: backupError instanceof Error ? backupError.message : String(backupError)
        });
      }
    }
    throw new DataCorruptionError(filePath, error, { backupPath });
  }
}
export {
  DataCorruptionError as CorruptionError,
  DataCorruptionError,
  atomicWriteSync,
  safeReadJSON,
  safeReadJSONL
};
