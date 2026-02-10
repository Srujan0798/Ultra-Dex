/**
 * @fileoverview Main module
 * @module src/main
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const dashboardUrl = process.env.ULTRA_DEX_DASHBOARD_URL || 'http://localhost:5173';

  win.loadURL(dashboardUrl).catch(() => {
    win.loadFile(path.join(__dirname, 'index.html'));
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
