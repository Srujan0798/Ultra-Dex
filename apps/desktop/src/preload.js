/**
 * @fileoverview Preload module
 * @module src/preload
 */

const { contextBridge } = require('electron');
const { exec } = require('child_process');

contextBridge.exposeInMainWorld('ultraDex', {
  run: (command) =>
    new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(stderr || error.message);
          return;
        }
        resolve(stdout);
      });
    }),
});

/**
 * Error handler for preload
 * @param {Error} error - Error to handle
 */
function handlePreloadError(error) {
  try {
    console.error('[preload]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
