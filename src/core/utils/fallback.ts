import fs from 'fs/promises';
async function readWithFallback(
  primaryPath: string,
  fallbackPath?: string,
  encoding: BufferEncoding = 'utf-8'
): Promise<string> {
  try {
    return await fs.readFile(primaryPath, encoding);
  } catch (primaryError) {
    if (!fallbackPath) {
      throw primaryError;
    }
    return await fs.readFile(fallbackPath, encoding);
  }
}
async function copyWithFallback(
  primaryPath: string,
  fallbackPath: string | undefined,
  destinationPath: string
): Promise<'primary' | 'fallback'> {
  try {
    await fs.copyFile(primaryPath, destinationPath);
    return 'primary';
  } catch (primaryError) {
    if (!fallbackPath) {
      throw primaryError;
    }
    await fs.copyFile(fallbackPath, destinationPath);
    return 'fallback';
  }
}
async function listWithFallback(
  primaryPath: string,
  fallbackPath?: string
): Promise<{ files: string[]; sourcePath: string }> {
  try {
    const files = await fs.readdir(primaryPath);
    return { files, sourcePath: primaryPath };
  } catch (primaryError) {
    if (!fallbackPath) {
      throw primaryError;
    }
    const files = await fs.readdir(fallbackPath);
    return { files, sourcePath: fallbackPath };
  }
}
export { copyWithFallback, listWithFallback, readWithFallback };
