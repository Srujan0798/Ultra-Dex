/**
 * @fileoverview Main module
 * @module desktop/main
 */

import { app, BrowserWindow, ipcMain, Tray, Menu, dialog } from 'electron';
import path from 'path';
import { exec } from 'child_process';
import isDev from 'electron-is-dev';

let mainWindow;
let tray;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the dashboard (served by Vite in dev, or static file in prod)
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  return win;
}

function createTray() {
  tray = new Tray(path.join(__dirname, '../assets/icon.png')); // You'll need to add an icon

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    {
      label: 'Check Status',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('status-update', { status: 'Checking...', timestamp: new Date() });
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Ultra-Dex Desktop');
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });
}

// Function to execute CLI commands securely
function executeCliCommand(command) {
  return new Promise((resolve, reject) => {
    // Validate command to prevent injection
    if (!command.startsWith('ultra-dex')) {
      reject(new Error('Only ultra-dex commands are allowed'));
      return;
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

app.whenReady().then(() => {
  mainWindow = createWindow();
  createTray();

  // Handle IPC calls from renderer
  ipcMain.handle('run-command', async (event, command) => {
    try {
      const result = await executeCliCommand(command);
      return { success: true, output: result.stdout, error: result.stderr };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Periodic status updates
  setInterval(() => {
    if (mainWindow) {
      mainWindow.webContents.send('status-update', {
        status: 'Running',
        timestamp: new Date(),
        version: app.getVersion()
      });
    }
  }, 30000); // Every 30 seconds

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    } else {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Minimize to tray instead of closing
app.on('before-quit', () => {
  if (mainWindow) {
    mainWindow.destroy();
  }
});
