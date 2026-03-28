/**
 * @fileoverview Preload module
 * @module desktop/preload
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('ultraDex', {
    runCommand: (command) => ipcRenderer.invoke('run-command', command),
    onStatusUpdate: (callback) => ipcRenderer.on('status-update', (event, data) => callback(data)),
    removeStatusUpdateListener: () => ipcRenderer.removeAllListeners('status-update'),
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
