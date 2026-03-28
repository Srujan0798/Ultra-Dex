
import fs from 'fs/promises';
import path from 'path';

/**
 * Write content to a file atomically by writing to a temp file first and renaming.
 * This prevents partial writes if the process crashes during write.
 * 
 * @param {string} filepath - The destination file path.
 * @param {string|Buffer} content - The content to write.
 * @returns {Promise<void>}
 */
export async function atomicWriteFile(filepath, content) {
  const tempPath = `${filepath}.tmp.${Date.now()}`;
  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    
    // Write to temp file
    await fs.writeFile(tempPath, content);
    
    // Rename temp file to target file (atomic operation on POSIX)
    await fs.rename(tempPath, filepath);
  } catch (error) {
    // Clean up temp file if write/rename fails
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup error, it might not exist
    }
    throw error;
  }
}

/**
 * Safely read a JSON file. 
 * If parsing fails (SyntaxError), it backs up the corrupted file 
 * (e.g., to .corrupted.<timestamp>) before returning the default value.
 * This prevents data loss on the next write cycle where the application 
 * would otherwise overwrite the corrupted file with an empty state.
 * 
 * @param {string} filepath - The file path to read.
 * @param {any} defaultValue - The value to return if file is missing or corrupted.
 * @returns {Promise<any>} The parsed JSON or the default value.
 */
export async function safeJsonRead(filepath, defaultValue = null) {
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return defaultValue;
    }
    
    if (error instanceof SyntaxError) {
      const backupPath = `${filepath}.corrupted.${Date.now()}`;
      try {
        await fs.copyFile(filepath, backupPath);
        console.error(`[DataIntegrity] Corrupted JSON file detected at ${filepath}. Backed up to ${backupPath}`);
      } catch (backupError) {
        console.error(`[DataIntegrity] Failed to backup corrupted file ${filepath}: ${backupError.message}`);
      }
      return defaultValue;
    }
    
    throw error;
  }
}
