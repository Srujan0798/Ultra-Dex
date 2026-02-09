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
