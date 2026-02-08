import { spawn } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { tmpdir } from 'os';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const execPromise = promisify(exec);

interface ComputerUseOptions {
  apiKey?: string;
  model?: string;
  verbose?: boolean;
}

export class ComputerUseAgent {
  private apiKey: string;
  private verbose: boolean;

  constructor(options?: ComputerUseOptions) {
    this.apiKey = options?.apiKey || process.env.OPENAI_API_KEY || '';
    this.verbose = options?.verbose || false;
  }

  /**
   * Execute a computer use command
   */
  async executeCommand(command: string, options?: ComputerUseOptions): Promise<string> {
    try {
      if (this.verbose) {
        console.log(`🤖 Computer Use Agent: Executing "${command}"`);
      }

      // Parse the command to determine action
      const parsedCommand = this.parseCommand(command);
      
      switch (parsedCommand.action) {
        case 'file_operation':
          return await this.handleFileOperation(parsedCommand);
        case 'system_command':
          return await this.handleSystemCommand(parsedCommand);
        case 'web_browsing':
          return await this.handleWebBrowsing(parsedCommand);
        case 'application_control':
          return await this.handleApplicationControl(parsedCommand);
        default:
          return await this.handleGeneralCommand(command);
      }
    } catch (error) {
      throw new Error(`Computer use failed: ${error.message}`);
    }
  }

  /**
   * Parse command into structured format
   */
  private parseCommand(command: string): any {
    const lowerCmd = command.toLowerCase();
    
    // File operations
    if (lowerCmd.includes('create') && (lowerCmd.includes('file') || lowerCmd.includes('folder'))) {
      return {
        action: 'file_operation',
        operation: 'create',
        path: this.extractPath(command),
        content: this.extractContent(command)
      };
    } else if (lowerCmd.includes('read') && lowerCmd.includes('file')) {
      return {
        action: 'file_operation',
        operation: 'read',
        path: this.extractPath(command)
      };
    } else if (lowerCmd.includes('delete') && (lowerCmd.includes('file') || lowerCmd.includes('folder'))) {
      return {
        action: 'file_operation',
        operation: 'delete',
        path: this.extractPath(command)
      };
    } else if (lowerCmd.includes('open') || lowerCmd.includes('launch') || lowerCmd.includes('start')) {
      return {
        action: 'application_control',
        operation: 'open',
        application: this.extractApplication(command)
      };
    } else if (lowerCmd.includes('browse') || lowerCmd.includes('search') || lowerCmd.includes('google')) {
      return {
        action: 'web_browsing',
        operation: 'search',
        query: this.extractSearchQuery(command)
      };
    } else {
      return {
        action: 'system_command',
        command: command
      };
    }
  }

  /**
   * Handle file operations
   */
  private async handleFileOperation(cmd: any): Promise<string> {
    switch (cmd.operation) {
      case 'create':
        return await this.createFile(cmd.path, cmd.content);
      case 'read':
        return await this.readFile(cmd.path);
      case 'delete':
        return await this.deleteFile(cmd.path);
      default:
        throw new Error(`Unsupported file operation: ${cmd.operation}`);
    }
  }

  /**
   * Handle system commands
   */
  private async handleSystemCommand(cmd: any): Promise<string> {
    try {
      const { stdout, stderr } = await execPromise(cmd.command);
      return stdout || stderr || 'Command executed successfully';
    } catch (error) {
      return `Command failed: ${error.message}`;
    }
  }

  /**
   * Handle web browsing
   */
  private async handleWebBrowsing(cmd: any): Promise<string> {
    // In a real implementation, this would use browser automation
    // For now, we'll simulate with search results
    if (cmd.query) {
      return `🔍 Searching for: "${cmd.query}"\nResults would appear here in a real implementation.`;
    }
    return 'Web browsing command processed.';
  }

  /**
   * Handle application control
   */
  private async handleApplicationControl(cmd: any): Promise<string> {
    // Determine OS and execute appropriate command
    const platform = process.platform;
    
    try {
      let command;
      if (platform === 'darwin') { // macOS
        command = `open -a "${cmd.application}"`;
      } else if (platform === 'win32') { // Windows
        command = `start "" "${cmd.application}"`;
      } else { // Linux
        command = `xdg-open "${cmd.application}"`;
      }
      
      await execPromise(command);
      return `✅ Application "${cmd.application}" launched successfully`;
    } catch (error) {
      return `❌ Failed to launch application "${cmd.application}": ${error.message}`;
    }
  }

  /**
   * Handle general commands with AI assistance
   */
  private async handleGeneralCommand(command: string): Promise<string> {
    // Use AI to interpret and execute complex commands
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a computer use agent. Interpret the user's command and provide the appropriate action or response. Respond with a JSON object containing the action and parameters.`
        },
        {
          role: 'user',
          content: `Command: "${command}". What should I do?`
        }
      ],
      temperature: 0.3,
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const interpretation = response.data.choices[0].message.content;
    return `🤖 AI interpretation: ${interpretation}`;
  }

  /**
   * Create a file
   */
  private async createFile(path: string, content: string = ''): Promise<string> {
    const fs = await import('fs');
    const pathModule = await import('path');
    
    try {
      // Ensure directory exists
      const dir = pathModule.dirname(path);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(path, content);
      return `✅ File created: ${path}`;
    } catch (error) {
      return `❌ Failed to create file: ${error.message}`;
    }
  }

  /**
   * Read a file
   */
  private async readFile(path: string): Promise<string> {
    const fs = await import('fs');
    
    try {
      const content = fs.readFileSync(path, 'utf8');
      return `📄 Contents of ${path}:\n${content}`;
    } catch (error) {
      return `❌ Failed to read file: ${error.message}`;
    }
  }

  /**
   * Delete a file
   */
  private async deleteFile(path: string): Promise<string> {
    const fs = await import('fs');
    
    try {
      fs.unlinkSync(path);
      return `🗑️ File deleted: ${path}`;
    } catch (error) {
      return `❌ Failed to delete file: ${error.message}`;
    }
  }

  /**
   * Extract path from command
   */
  private extractPath(command: string): string {
    // Simple path extraction (in reality, this would be more sophisticated)
    const pathRegex = /(?:file|folder|directory)\s+([^\s]+)/i;
    const match = command.match(pathRegex);
    return match ? match[1] : './unnamed';
  }

  /**
   * Extract content from command
   */
  private extractContent(command: string): string {
    // Simple content extraction
    const contentRegex = /(?:containing|with)\s+(.*)/i;
    const match = command.match(contentRegex);
    return match ? match[1] : '';
  }

  /**
   * Extract application name
   */
  private extractApplication(command: string): string {
    const appRegex = /(?:open|launch|start)\s+(.+?)(?:\s|$)/i;
    const match = command.match(appRegex);
    return match ? match[1].trim() : 'default';
  }

  /**
   * Extract search query
   */
  private extractSearchQuery(command: string): string {
    const queryRegex = /(?:search|browse|google)\s+(.+?)(?:\s|$)/i;
    const match = command.match(queryRegex);
    return match ? match[1].trim() : command;
  }

  /**
   * Take screenshot of current screen
   */
  async takeScreenshot(filename?: string): Promise<string> {
    const fs = await import('fs');
    const pathModule = await import('path');
    
    try {
      const screenshotName = filename || `screenshot_${Date.now()}.png`;
      const screenshotPath = pathModule.join(tmpdir(), screenshotName);
      
      // This is a simplified approach - in reality, you'd use a proper screenshot library
      // For now, we'll just return the path where a screenshot would be saved
      return screenshotPath;
    } catch (error) {
      throw new Error(`Screenshot failed: ${error.message}`);
    }
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<any> {
    const os = await import('os');
    
    return {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      userInfo: os.userInfo(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
      loadAverage: os.loadavg()
    };
  }
}

export default ComputerUseAgent;