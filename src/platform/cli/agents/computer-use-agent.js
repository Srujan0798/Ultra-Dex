// Copyright (c) 2026 Ultra-Dex

import { spawn } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { uuidv4 } from '../../../utils/uuid.js';
import { printInfo, printSuccess, printError, printWarning } from '../utils/output.js';
import { ultraMemory } from '../mcp/memory.js';

const execAsync = promisify(exec);

/**
 * Computer Use Agent - Full desktop automation capabilities
 * Enables AI to interact with the desktop environment like a human developer
 */
export class ComputerUseAgent {
  constructor(options = {}) {
    this.options = {
      enableScreenCapture: options.screenCapture !== false,
      enableFileOperations: options.fileOperations !== false,
      enableAppControl: options.appControl !== false,
      enableSystemCommands: options.systemCommands !== false,
      enableBrowserAutomation: options.browserAutomation !== false,
      sandboxMode: options.sandboxMode || false,
      verbose: options.verbose || false,
      ...options
    };

    this.sessionId = uuidv4();
    this.activeProcesses = new Map();
    this.permissions = new Map();
    this.screenshots = [];
    
    this.initializePermissions();
  }

  /**
   * Initialize default permissions
   */
  initializePermissions() {
    // Define permission levels
    this.permissions.set('file-read', { level: 'low', requiresConfirmation: false });
    this.permissions.set('file-write', { level: 'medium', requiresConfirmation: true });
    this.permissions.set('file-delete', { level: 'high', requiresConfirmation: true });
    this.permissions.set('system-exec', { level: 'high', requiresConfirmation: true });
    this.permissions.set('app-control', { level: 'medium', requiresConfirmation: true });
    this.permissions.set('screen-capture', { level: 'low', requiresConfirmation: false });
    this.permissions.set('browser-automation', { level: 'medium', requiresConfirmation: true });
  }

  /**
   * Check if operation is permitted
   */
  async checkPermission(operation, target) {
    const perm = this.permissions.get(operation);
    if (!perm) {
      return { allowed: false, reason: `Unknown operation: ${operation}` };
    }

    if (perm.requiresConfirmation && this.options.confirmationRequired) {
      return { allowed: await this.requestConfirmation(operation, target), reason: 'User confirmed' };
    }

    return { allowed: true, reason: 'Permission granted' };
  }

  /**
   * Request user confirmation for sensitive operations
   */
  async requestConfirmation(operation, target) {
    // In a real implementation, this would show a UI dialog
    // For now, we'll return true for simulation
    if (this.options.verbose) {
      printInfo(`🔐 Confirmation required for ${operation}: ${target}`);
    }
    return true; // Simulate user confirmation
  }

  /**
   * Take a screenshot of the current screen
   */
  async takeScreenshot(options = {}) {
    try {
      if (!this.options.enableScreenCapture) {
        throw new Error('Screen capture is disabled');
      }

      const permission = await this.checkPermission('screen-capture', 'desktop');
      if (!permission.allowed) {
        throw new Error(`Permission denied: ${permission.reason}`);
      }

      // Platform-specific screenshot capture
      let screenshotPath;
      const timestamp = Date.now();
      const fileName = `screenshot_${timestamp}.png`;
      screenshotPath = path.join(os.tmpdir(), fileName);

      let command;
      if (process.platform === 'darwin') { // macOS
        command = `screencapture -x "${screenshotPath}"`;
      } else if (process.platform === 'win32') { // Windows
        command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $screen = [System.Windows.Forms.Screen]::PrimaryScreen; $bounds = $screen.Bounds; $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height; $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size); $bitmap.Save('${screenshotPath}', [System.Drawing.Imaging.ImageFormat]::Png); $bitmap.Dispose(); $graphics.Dispose(); return"`;
      } else { // Linux
        command = `import -window root "${screenshotPath}"`;
      }

      await execAsync(command);
      
      // Store screenshot reference
      this.screenshots.push({
        path: screenshotPath,
        timestamp,
        sessionId: this.sessionId
      });

      if (this.options.verbose) {
        printSuccess(`📸 Screenshot captured: ${screenshotPath}`);
      }

      return {
        success: true,
        path: screenshotPath,
        timestamp,
        message: `Screenshot captured successfully`
      };
    } catch (error) {
      printError(`Screenshot failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Screenshot failed: ${error.message}`
      };
    }
  }

  /**
   * Analyze screenshot with vision agent
   */
  async analyzeScreenshot(screenshotPath, prompt = "Analyze this UI and describe the elements and functionality") {
    try {
      if (!this.options.enableAppControl) {
        throw new Error('Vision analysis is disabled');
      }

      // This would integrate with the vision agent
      // For now, we'll simulate
      printInfo(`👁️  Analyzing screenshot: ${screenshotPath}`);
      
      // In a real implementation, this would call the vision agent
      // with GPT-4 Vision or similar to analyze the image
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      return {
        success: true,
        analysis: "Screenshot analysis completed (simulated). Contains UI elements that can be converted to code.",
        suggestions: ["Consider converting this UI to React components", "Identify the main interactive elements"],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      printError(`Screenshot analysis failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Analysis failed: ${error.message}`
      };
    }
  }

  /**
   * Read file content
   */
  async readFile(filePath) {
    try {
      const permission = await this.checkPermission('file-read', filePath);
      if (!permission.allowed) {
        throw new Error(`Permission denied: ${permission.reason}`);
      }

      // Security validation
      const normalizedPath = path.normalize(filePath);
      if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
        throw new Error('Path traversal detected');
      }

      const fullPath = path.resolve(process.cwd(), normalizedPath);
      if (!fullPath.startsWith(process.cwd()) && !this.options.sandboxMode) {
        throw new Error('Access outside project directory not allowed');
      }

      const content = await fs.readFile(fullPath, 'utf8');
      
      if (this.options.verbose) {
        printSuccess(`📖 Read file: ${filePath} (${content.length} chars)`);
      }

      return {
        success: true,
        content,
        path: fullPath,
        size: content.length,
        message: `File read successfully`
      };
    } catch (error) {
      printError(`Read file failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Read failed: ${error.message}`
      };
    }
  }

  /**
   * Write file content
   */
  async writeFile(filePath, content) {
    try {
      const permission = await this.checkPermission('file-write', filePath);
      if (!permission.allowed) {
        throw new Error(`Permission denied: ${permission.reason}`);
      }

      // Security validation
      const normalizedPath = path.normalize(filePath);
      if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
        throw new Error('Path traversal detected');
      }

      const fullPath = path.resolve(process.cwd(), normalizedPath);
      if (!fullPath.startsWith(process.cwd()) && !this.options.sandboxMode) {
        throw new Error('Write outside project directory not allowed');
      }

      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      await fs.writeFile(fullPath, content, 'utf8');
      
      if (this.options.verbose) {
        printSuccess(`📝 Wrote file: ${filePath} (${content.length} chars)`);
      }

      // Update memory with file change
      await ultraMemory.remember(`File ${filePath} was updated with ${content.length} characters`, ['file-operation', 'write']);

      return {
        success: true,
        path: fullPath,
        size: content.length,
        message: `File written successfully`
      };
    } catch (error) {
      printError(`Write file failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Write failed: ${error.message}`
      };
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath) {
    try {
      const permission = await this.checkPermission('file-delete', filePath);
      if (!permission.allowed) {
        throw new Error(`Permission denied: ${permission.reason}`);
      }

      const normalizedPath = path.normalize(filePath);
      if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
        throw new Error('Path traversal detected');
      }

      const fullPath = path.resolve(process.cwd(), normalizedPath);
      if (!fullPath.startsWith(process.cwd()) && !this.options.sandboxMode) {
        throw new Error('Delete outside project directory not allowed');
      }

      await fs.unlink(fullPath);
      
      if (this.options.verbose) {
        printSuccess(`🗑️  Deleted file: ${filePath}`);
      }

      // Update memory with file change
      await ultraMemory.remember(`File ${filePath} was deleted`, ['file-operation', 'delete']);

      return {
        success: true,
        path: fullPath,
        message: `File deleted successfully`
      };
    } catch (error) {
      printError(`Delete file failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Delete failed: ${error.message}`
      };
    }
  }

  /**
   * Execute system command
   */
  async executeCommand(command, options = {}) {
    try {
      const permission = await this.checkPermission('system-exec', command);
      if (!permission.allowed) {
        throw new Error(`Permission denied: ${permission.reason}`);
      }

      // Security validation - prevent dangerous commands
      const dangerousPatterns = [
        /rm\s+-rf/,
        /mv\s+.*\s+\/tmp/,
        /dd\s+if=/,
        /mkfs/,
        /shutdown/,
        /reboot/,
        /poweroff/,
        /halt/,
        /kill\s+-9\s+\d+/
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(command)) {
          throw new Error(`Dangerous command blocked: ${command}`);
        }
      }

      if (this.options.verbose) {
        printInfo(`💻 Executing command: ${command}`);
      }

      const result = await execAsync(command, {
        timeout: options.timeout || 30000,
        maxBuffer: options.maxBuffer || 1024 * 1024 // 1MB
      });

      if (this.options.verbose) {
        printSuccess(`✅ Command executed successfully`);
      }

      // Update memory with command execution
      await ultraMemory.remember(`Command executed: ${command}`, ['system-command', 'execution']);

      return {
        success: true,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.code,
        message: `Command executed successfully`
      };
    } catch (error) {
      printError(`Command execution failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        stdout: error.stdout,
        stderr: error.stderr,
        message: `Command failed: ${error.message}`
      };
    }
  }

  /**
   * Open application
   */
  async openApplication(appName, args = []) {
    try {
      const permission = await this.checkPermission('app-control', appName);
      if (!permission.allowed) {
        throw new Error(`Permission denied: ${permission.reason}`);
      }

      let command;
      const appArgs = args.join(' ');

      if (process.platform === 'darwin') { // macOS
        command = `open -a "${appName}" ${appArgs}`;
      } else if (process.platform === 'win32') { // Windows
        command = `start "" "${appName}" ${appArgs}`;
      } else { // Linux
        command = `xdg-open "${appName}" ${appArgs}`;
      }

      if (this.options.verbose) {
        printInfo(`📱 Opening application: ${appName} ${appArgs}`);
      }

      await execAsync(command);
      
      if (this.options.verbose) {
        printSuccess(`✅ Application opened: ${appName}`);
      }

      // Update memory with app opening
      await ultraMemory.remember(`Application opened: ${appName}`, ['app-control', 'open']);

      return {
        success: true,
        app: appName,
        message: `Application opened successfully`
      };
    } catch (error) {
      printError(`Open application failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Open failed: ${error.message}`
      };
    }
  }

  /**
   * Close application
   */
  async closeApplication(appName) {
    try {
      const permission = await this.checkPermission('app-control', `close-${appName}`);
      if (!permission.allowed) {
        throw new Error(`Permission denied: ${permission.reason}`);
      }

      let command;

      if (process.platform === 'darwin') { // macOS
        command = `osascript -e 'quit app "${appName}"'`;
      } else if (process.platform === 'win32') { // Windows
        command = `taskkill /f /im "${appName}.exe"`;
      } else { // Linux
        command = `pkill -f "${appName}"`;
      }

      if (this.options.verbose) {
        printInfo(`⏹️  Closing application: ${appName}`);
      }

      await execAsync(command);
      
      if (this.options.verbose) {
        printSuccess(`✅ Application closed: ${appName}`);
      }

      return {
        success: true,
        app: appName,
        message: `Application closed successfully`
      };
    } catch (error) {
      printError(`Close application failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Close failed: ${error.message}`
      };
    }
  }

  /**
   * List running processes
   */
  async listProcesses() {
    try {
      let command;
      
      if (process.platform === 'win32') {
        command = 'tasklist';
      } else {
        command = 'ps aux';
      }

      const result = await execAsync(command);
      
      if (this.options.verbose) {
        printInfo(`📋 Listed ${result.stdout.split('\n').length - 1} processes`);
      }

      return {
        success: true,
        processes: result.stdout,
        count: result.stdout.split('\n').length - 1,
        message: `Processes listed successfully`
      };
    } catch (error) {
      printError(`List processes failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `List failed: ${error.message}`
      };
    }
  }

  /**
   * Get system information
   */
  async getSystemInfo() {
    try {
      const osInfo = await execAsync('uname -a');
      const diskInfo = await execAsync('df -h');
      const memoryInfo = await execAsync(process.platform === 'win32' ? 'wmic computersystem get TotalPhysicalMemory' : 'free -h');
      const cpuInfo = await execAsync(process.platform === 'win32' ? 'wmic cpu get name' : 'lscpu | head -20');

      const systemInfo = {
        os: osInfo.stdout,
        disk: diskInfo.stdout,
        memory: memoryInfo.stdout,
        cpu: cpuInfo.stdout,
        platform: process.platform,
        arch: process.arch,
        uptime: os.uptime(),
        freemem: os.freemem(),
        totalmem: os.totalmem()
      };

      if (this.options.verbose) {
        printInfo(`🖥️  Retrieved system information`);
      }

      return {
        success: true,
        info: systemInfo,
        message: `System info retrieved successfully`
      };
    } catch (error) {
      printError(`Get system info failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `System info failed: ${error.message}`
      };
    }
  }

  /**
   * Create directory
   */
  async createDirectory(dirPath) {
    try {
      const permission = await this.checkPermission('file-write', dirPath);
      if (!permission.allowed) {
        throw new Error(`Permission denied: ${permission.reason}`);
      }

      const normalizedPath = path.normalize(dirPath);
      if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
        throw new Error('Path traversal detected');
      }

      const fullPath = path.resolve(process.cwd(), normalizedPath);
      if (!fullPath.startsWith(process.cwd()) && !this.options.sandboxMode) {
        throw new Error('Directory creation outside project not allowed');
      }

      await fs.mkdir(fullPath, { recursive: true });
      
      if (this.options.verbose) {
        printSuccess(`📁 Created directory: ${dirPath}`);
      }

      return {
        success: true,
        path: fullPath,
        message: `Directory created successfully`
      };
    } catch (error) {
      printError(`Create directory failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Create directory failed: ${error.message}`
      };
    }
  }

  /**
   * List directory contents
   */
  async listDirectory(dirPath = '.') {
    try {
      const permission = await this.checkPermission('file-read', dirPath);
      if (!permission.allowed) {
        throw new Error(`Permission denied: ${permission.reason}`);
      }

      const normalizedPath = path.normalize(dirPath);
      if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
        throw new Error('Path traversal detected');
      }

      const fullPath = path.resolve(process.cwd(), normalizedPath);
      if (!fullPath.startsWith(process.cwd()) && !this.options.sandboxMode) {
        throw new Error('Directory access outside project not allowed');
      }

      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const contents = entries.map(entry => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: entry.isFile() ? fs.statSync(path.join(fullPath, entry.name)).size : 0,
        path: path.join(fullPath, entry.name)
      }));

      if (this.options.verbose) {
        printInfo(`📋 Listed ${contents.length} items in: ${dirPath}`);
      }

      return {
        success: true,
        contents,
        path: fullPath,
        count: contents.length,
        message: `Directory listed successfully`
      };
    } catch (error) {
      printError(`List directory failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `List directory failed: ${error.message}`
      };
    }
  }

  /**
   * Move/rename file
   */
  async moveFile(sourcePath, destPath) {
    try {
      const permission = await this.checkPermission('file-write', `${sourcePath} -> ${destPath}`);
      if (!permission.allowed) {
        throw new Error(`Permission denied: ${permission.reason}`);
      }

      const normalizedSource = path.normalize(sourcePath);
      const normalizedDest = path.normalize(destPath);

      if (normalizedSource.includes('../') || normalizedSource.includes('..\\') ||
          normalizedDest.includes('../') || normalizedDest.includes('..\\')) {
        throw new Error('Path traversal detected');
      }

      const sourceFullPath = path.resolve(process.cwd(), normalizedSource);
      const destFullPath = path.resolve(process.cwd(), normalizedDest);

      if ((!sourceFullPath.startsWith(process.cwd()) || !destFullPath.startsWith(process.cwd())) && !this.options.sandboxMode) {
        throw new Error('Move operation outside project directory not allowed');
      }

      await fs.rename(sourceFullPath, destFullPath);
      
      if (this.options.verbose) {
        printSuccess(`🔄 Moved file: ${sourcePath} -> ${destPath}`);
      }

      return {
        success: true,
        source: sourceFullPath,
        destination: destFullPath,
        message: `File moved successfully`
      };
    } catch (error) {
      printError(`Move file failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Move failed: ${error.message}`
      };
    }
  }

  /**
   * Copy file
   */
  async copyFile(sourcePath, destPath) {
    try {
      const permission = await this.checkPermission('file-read', sourcePath);
      if (!permission.allowed) {
        throw new Error(`Permission denied: ${permission.reason}`);
      }

      const normalizedSource = path.normalize(sourcePath);
      const normalizedDest = path.normalize(destPath);

      if (normalizedSource.includes('../') || normalizedSource.includes('..\\') ||
          normalizedDest.includes('../') || normalizedDest.includes('..\\')) {
        throw new Error('Path traversal detected');
      }

      const sourceFullPath = path.resolve(process.cwd(), normalizedSource);
      const destFullPath = path.resolve(process.cwd(), normalizedDest);

      if ((!sourceFullPath.startsWith(process.cwd()) || !destFullPath.startsWith(process.cwd())) && !this.options.sandboxMode) {
        throw new Error('Copy operation outside project directory not allowed');
      }

      await fs.copyFile(sourceFullPath, destFullPath);
      
      if (this.options.verbose) {
        printSuccess(`📋 Copied file: ${sourcePath} -> ${destPath}`);
      }

      return {
        success: true,
        source: sourceFullPath,
        destination: destFullPath,
        message: `File copied successfully`
      };
    } catch (error) {
      printError(`Copy file failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Copy failed: ${error.message}`
      };
    }
  }

  /**
   * Search for files
   */
  async searchFiles(pattern, options = {}) {
    try {
      const { glob } = await import('glob');
      
      const searchPath = options.path || process.cwd();
      const ignore = options.ignore || ['node_modules/**', '.git/**', 'dist/**', 'build/**'];
      
      const files = await glob(pattern, {
        cwd: searchPath,
        ignore,
        absolute: true
      });

      if (this.options.verbose) {
        printInfo(`🔍 Found ${files.length} files matching: ${pattern}`);
      }

      return {
        success: true,
        files,
        pattern,
        count: files.length,
        message: `Files searched successfully`
      };
    } catch (error) {
      printError(`Search files failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Search failed: ${error.message}`
      };
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats(filePath) {
    try {
      const permission = await this.checkPermission('file-read', filePath);
      if (!permission.allowed) {
        throw new Error(`Permission denied: ${permission.reason}`);
      }

      const normalizedPath = path.normalize(filePath);
      if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
        throw new Error('Path traversal detected');
      }

      const fullPath = path.resolve(process.cwd(), normalizedPath);
      if (!fullPath.startsWith(process.cwd()) && !this.options.sandboxMode) {
        throw new Error('File access outside project not allowed');
      }

      const stats = await fs.stat(fullPath);
      
      const fileStats = {
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        isSymbolicLink: stats.isSymbolicLink(),
        atime: stats.atime,
        mtime: stats.mtime,
        ctime: stats.ctime,
        birthtime: stats.birthtime,
        mode: stats.mode,
        path: fullPath
      };

      if (this.options.verbose) {
        printInfo(`📊 Stats for: ${filePath} (${stats.size} bytes)`);
      }

      return {
        success: true,
        stats: fileStats,
        message: `File stats retrieved successfully`
      };
    } catch (error) {
      printError(`Get file stats failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Stats failed: ${error.message}`
      };
    }
  }

  /**
   * Monitor file changes
   */
  async monitorFile(filePath, callback) {
    try {
      const { watch } = await import('chokidar');
      
      const watcher = watch(filePath, {
        ignoreInitial: true,
        awaitWriteFinish: true
      });

      watcher.on('change', (changedPath) => {
        if (this.options.verbose) {
          printInfo(`🔄 File changed: ${changedPath}`);
        }
        if (callback) {
          callback('change', changedPath);
        }
      });

      watcher.on('add', (addedPath) => {
        if (this.options.verbose) {
          printInfo(`➕ File added: ${addedPath}`);
        }
        if (callback) {
          callback('add', addedPath);
        }
      });

      watcher.on('unlink', (removedPath) => {
        if (this.options.verbose) {
          printInfo(`➖ File removed: ${removedPath}`);
        }
        if (callback) {
          callback('unlink', removedPath);
        }
      });

      if (this.options.verbose) {
        printSuccess(`👀 Monitoring file: ${filePath}`);
      }

      return {
        success: true,
        watcher,
        message: `File monitoring started`
      };
    } catch (error) {
      printError(`Monitor file failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Monitor failed: ${error.message}`
      };
    }
  }

  /**
   * Execute browser automation (using Playwright)
   */
  async automateBrowser(task, options = {}) {
    try {
      if (!this.options.enableBrowserAutomation) {
        throw new Error('Browser automation is disabled');
      }

      const permission = await this.checkPermission('browser-automation', task);
      if (!permission.allowed) {
        throw new Error(`Permission denied: ${permission.reason}`);
      }

      const { chromium } = await import('playwright');
      
      const browser = await chromium.launch({
        headless: options.headless !== false,
        ...options.browserOptions
      });

      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        ...options.contextOptions
      });

      const page = await context.newPage();

      if (this.options.verbose) {
        printInfo(`🌐 Automating browser task: ${task}`);
      }

      // Execute the browser task
      let result;
      if (task.startsWith('navigate:')) {
        const url = task.replace('navigate:', '');
        await page.goto(url);
        result = { url, title: await page.title() };
      } else if (task.startsWith('click:')) {
        const selector = task.replace('click:', '');
        await page.click(selector);
        result = { action: 'click', selector };
      } else if (task.startsWith('fill:')) {
        const [selector, value] = task.split(':').slice(1);
        await page.fill(selector, value);
        result = { action: 'fill', selector, value };
      } else if (task.startsWith('screenshot:')) {
        const path = task.replace('screenshot:', '');
        await page.screenshot({ path });
        result = { action: 'screenshot', path };
      } else {
        // Generic task execution
        result = await page.evaluate(task);
      }

      await browser.close();

      if (this.options.verbose) {
        printSuccess(`✅ Browser automation completed`);
      }

      return {
        success: true,
        result,
        message: `Browser automation completed successfully`
      };
    } catch (error) {
      printError(`Browser automation failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Browser automation failed: ${error.message}`
      };
    }
  }

  /**
   * Get current session status
   */
  getSessionStatus() {
    return {
      sessionId: this.sessionId,
      activeProcesses: this.activeProcesses.size,
      screenshotsTaken: this.screenshots.length,
      permissions: Object.fromEntries(this.permissions),
      options: this.options,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    // Kill any active processes
    for (const [pid, process] of this.activeProcesses) {
      try {
        process.kill();
      } catch (error) {
        // Process may have already exited
      }
    }
    this.activeProcesses.clear();

    // Clean up old screenshots
    for (const screenshot of this.screenshots) {
      try {
        await fs.unlink(screenshot.path).catch(() => {});
      } catch (error) {
        // File may have already been deleted
      }
    }
    this.screenshots = [];

    if (this.options.verbose) {
      printInfo(`🧹 Computer use agent cleaned up`);
    }
  }
}

// Singleton instance
export const computerUseAgent = new ComputerUseAgent();

export default ComputerUseAgent;
