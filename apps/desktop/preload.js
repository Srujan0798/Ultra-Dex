const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ultraDex', {
    runCommand: (command) => ipcRenderer.invoke('run-command', command),
    onStatusUpdate: (callback) => ipcRenderer.on('status-update', (event, data) => callback(data)),
    removeStatusUpdateListener: () => ipcRenderer.removeAllListeners('status-update'),
});
