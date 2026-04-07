import fs from "fs/promises";
import path from "path";
import { logger } from './logging.js';
async function readFileSafe(filePath, label = "") {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return { label, content };
  } catch (err) {
    if (err.code !== "ENOENT") {
      logger.error(`[File] Error reading ${filePath}: ${err.message}`);
    }
    return { label, content: "" };
  }
}
async function pathExists(targetPath, type = "file") {
  try {
    const stats = await fs.stat(targetPath);
    if (type === "file")
      return stats.isFile();
    if (type === "dir")
      return stats.isDirectory();
    return false;
  } catch {
    return false;
  }
}
function resolveAssetPath(basePath, relativePath) {
  try {
    return path.join(basePath, relativePath);
  } catch (err) {
    logger.error(`[File] Error resolving path: ${err.message}`);
    return "";
  }
}
async function copyDirectory(sourceDir, targetDir) {
  try {
    await fs.mkdir(targetDir, { recursive: true });
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    for (const entry of entries) {
      const sourcePath = path.join(sourceDir, entry.name);
      const targetPath = path.join(targetDir, entry.name);
      if (entry.isDirectory()) {
        await copyDirectory(sourcePath, targetPath);
      } else if (entry.isFile()) {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  } catch (err) {
    logger.error(`[File] Error copying directory ${sourceDir} to ${targetDir}: ${err.message}`);
    throw err;
  }
}
export {
  copyDirectory,
  pathExists,
  readFileSafe,
  resolveAssetPath
};
