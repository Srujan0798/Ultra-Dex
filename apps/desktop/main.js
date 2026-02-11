// Copyright (c) 2026 Ultra-Dex
import { app, BrowserWindow, ipcMain, Tray, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Points to our React 19 Dashboard
  const startUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../dashboard/dist/index.html')}`;

  mainWindow.loadURL(startUrl);
  return mainWindow;
}

app.whenReady().then(() => {
  createWindow();
  
  ipcMain.handle('ultra-dex:get-status', async () => {
    return { status: 'ONLINE', version: '6.0.0', tier: 'PRO' };
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});