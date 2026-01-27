import fs from 'fs/promises';

export async function readWithFallback(primaryPath, fallbackPath, encoding = 'utf-8') {
  try {
    return await fs.readFile(primaryPath, encoding);
  } catch (primaryError) {
    if (!fallbackPath) {
      throw primaryError;
    }
    return await fs.readFile(fallbackPath, encoding);
  }
}

export async function copyWithFallback(primaryPath, fallbackPath, destinationPath) {
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

export async function listWithFallback(primaryPath, fallbackPath) {
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
