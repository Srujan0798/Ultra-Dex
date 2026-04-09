// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Screen module
 * @module ghost/screen
 */
// Project Ghost: Screen System
// Dedicated screen capture helpers for Computer Use workflows.

import os from 'os';
import path from 'path';
import fs from 'fs/promises';

let screenshot;
try {
  screenshot = (await import('screenshot-desktop')).default;
} catch {
  screenshot = null;
}

function assertScreenshotDependency() {
  if (!screenshot) {
    throw new Error(
      'Missing optional dependency "screenshot-desktop". Install it to enable Ghost screen capture.'
    );
  }
}

export class ScreenSystem {
  async capture(options = {}) {
    assertScreenshotDependency();
    const { format = 'png', screen, filename } = options;

    const image = await screenshot({
      format,
      ...(screen ? { screen } : {}),
      ...(filename ? { filename } : {}),
    });

    if (Buffer.isBuffer(image)) {
      return image;
    }

    // Some implementations can return a path when filename is set.
    if (typeof image === 'string') {
      return fs.readFile(image);
    }

    throw new Error('Unexpected screenshot response type');
  }

  async captureBase64(options = {}) {
    const buffer = await this.capture(options);
    return buffer.toString('base64');
  }

  async captureToTempFile(prefix = 'ultra-dex-ghost') {
    const tempPath = path.join(os.tmpdir(), `${prefix}-${Date.now()}.png`);
    await this.capture({ filename: tempPath });
    return tempPath;
  }

  async listDisplays() {
    assertScreenshotDependency();
    if (typeof screenshot.listDisplays !== 'function') {
      return [];
    }
    return screenshot.listDisplays();
  }
}

export const screenSystem = new ScreenSystem();
export default screenSystem;
