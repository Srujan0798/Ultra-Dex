const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('ultraDex', {
  // Placeholder bridge for future CLI interactions
  ping: () => 'Ultra-Dex Desktop Ready',
});
