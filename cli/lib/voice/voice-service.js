import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import { AppError } from '../utils/errors.js';
import { printInfo, printSuccess, printError } from '../utils/output.js';

const execAsync = promisify(exec);

/**
 * Voice-to-Code Service using Whisper API
 * Converts spoken commands directly to code implementation
 */
export class VoiceToCodeService {
  constructor() {
    this.recording = false;
    this.audioFile = null;
  }

  /**
   * Start voice recording
   */
  async startRecording() {
    try {
      // Create temporary audio file
      this.audioFile = path.join(process.cwd(), '.ultra-dex', 'temp', `voice-${Date.now()}.wav`);
      await fs.mkdir(path.dirname(this.audioFile), { recursive: true });

      // Start recording using system audio input
      if (process.platform === 'darwin') {
        // macOS
        this.recordingProcess = exec(`rec "${this.audioFile}" silence 1 0.1 3% 1 3.0 3%`);
      } else if (process.platform === 'linux') {
        // Linux with arecord
        this.recordingProcess = exec(`arecord -f cd -d 30 -t wav "${this.audioFile}"`);
      } else {
        // Windows with PowerShell
        const psScript = `
        Add-Type -AssemblyName System.Windows.Forms,System.Drawing
        \$rec = New-Object System.Media.SoundRecorder
        \$rec.Recording = \$true
        Start-Sleep -Seconds 30
        \$rec.Stop()
        `;
        this.recordingProcess = exec(`powershell -Command "${psScript}"`);
      }

      this.recording = true;
      printInfo('🎤 Recording started... Speak your command (will stop after 30 seconds or press Ctrl+C)');
      
      return { success: true, message: 'Recording started' };
    } catch (error) {
      throw new AppError(`Failed to start recording: ${error.message}`);
    }
  }

  /**
   * Stop voice recording
   */
  async stopRecording() {
    try {
      if (this.recordingProcess) {
        this.recordingProcess.kill();
      }
      
      this.recording = false;
      
      if (!this.audioFile || !(await fs.stat(this.audioFile).catch(() => false))) {
        throw new AppError('No audio file recorded');
      }

      printSuccess('✅ Recording stopped');
      return { success: true, audioFile: this.audioFile };
    } catch (error) {
      throw new AppError(`Failed to stop recording: ${error.message}`);
    }
  }

  /**
   * Transcribe audio using Whisper API
   */
  async transcribeAudio(audioFilePath, apiKey = process.env.OPENAI_API_KEY) {
    if (!apiKey) {
      throw new AppError('OPENAI_API_KEY environment variable required for Whisper API');
    }

    try {
      const FormData = (await import('form-data')).default;
      const axios = (await import('axios')).default;
      
      const formData = new FormData();
      formData.append('file', createReadStream(audioFilePath));
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'text');

      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 30000,
      });

      return response.data.trim();
    } catch (error) {
      throw new AppError(`Transcription failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Convert voice command to code implementation
   */
  async voiceToCode(voiceCommand, options = {}) {
    try {
      // Parse voice command to determine intent
      const parsedCommand = this.parseVoiceCommand(voiceCommand);
      
      if (parsedCommand.action === 'unknown') {
        return {
          success: false,
          message: `Unknown command: "${voiceCommand}". Try phrases like "create a login component" or "add authentication".`
        };
      }

      // Generate code based on parsed command
      const codeGenerationResult = await this.generateCode(parsedCommand, options);
      
      if (codeGenerationResult.success) {
        // Optionally write the generated code to files
        if (options.writeToFiles && codeGenerationResult.files) {
          await this.writeGeneratedFiles(codeGenerationResult.files);
        }
        
        return {
          success: true,
          command: parsedCommand,
          generatedCode: codeGenerationResult.code,
          files: codeGenerationResult.files,
          message: `✅ Voice command processed successfully. ${codeGenerationResult.files?.length || 0} files generated.`
        };
      } else {
        return {
          success: false,
          message: `Failed to generate code: ${codeGenerationResult.error}`
        };
      }
    } catch (error) {
      throw new AppError(`Voice-to-code failed: ${error.message}`);
    }
  }

  /**
   * Parse voice command into structured format
   */
  parseVoiceCommand(command) {
    const lowerCmd = command.toLowerCase();
    
    // Identify action
    let action = 'unknown';
    if (lowerCmd.includes('create') || lowerCmd.includes('make') || lowerCmd.includes('build') || lowerCmd.includes('add')) {
      action = 'create';
    } else if (lowerCmd.includes('update') || lowerCmd.includes('modify') || lowerCmd.includes('change') || lowerCmd.includes('edit')) {
      action = 'update';
    } else if (lowerCmd.includes('delete') || lowerCmd.includes('remove') || lowerCmd.includes('destroy')) {
      action = 'delete';
    } else if (lowerCmd.includes('fix') || lowerCmd.includes('debug') || lowerCmd.includes('repair')) {
      action = 'fix';
    }

    // Identify entity type
    let entityType = 'generic';
    if (lowerCmd.includes('component') || lowerCmd.includes('ui')) {
      entityType = 'component';
    } else if (lowerCmd.includes('api') || lowerCmd.includes('endpoint') || lowerCmd.includes('route')) {
      entityType = 'api';
    } else if (lowerCmd.includes('auth') || lowerCmd.includes('authentication') || lowerCmd.includes('login') || lowerCmd.includes('register')) {
      entityType = 'auth';
    } else if (lowerCmd.includes('database') || lowerCmd.includes('model') || lowerCmd.includes('schema')) {
      entityType = 'database';
    } else if (lowerCmd.includes('test') || lowerCmd.includes('spec')) {
      entityType = 'test';
    } else if (lowerCmd.includes('config') || lowerCmd.includes('setting')) {
      entityType = 'config';
    }

    // Extract entity name
    const nameMatch = command.match(/(?:a|an|the|named|called)\s+([a-zA-Z][a-zA-Z0-9_-]*)/);
    const entityName = nameMatch ? nameMatch[1] : 'unnamed';

    return {
      action,
      entityType,
      entityName,
      originalCommand: command,
      raw: command
    };
  }

  /**
   * Generate code based on parsed command
   */
  async generateCode(parsedCommand, options = {}) {
    try {
      const { createProvider, getDefaultProvider } = await import('../providers/index.js');
      const provider = createProvider(options.provider || getDefaultProvider(), {
        apiKey: options.apiKey,
        maxTokens: 4000,
      });

      // Create system prompt for code generation
      const systemPrompt = `You are an expert voice-to-code AI assistant. Convert the user's spoken command into production-ready code.

Rules:
1. Generate complete, runnable code with no placeholders
2. Follow modern best practices for the specified technology
3. Include proper error handling and validation
4. Use appropriate file structure and naming conventions
5. Include necessary imports and dependencies
6. Add JSDoc comments for public functions
7. Follow security best practices

Context:
- Project is in ${process.cwd()}
- Current files: ${await this.getCurrentFiles()}
- Technology stack: ${await this.detectStack()}`;

      // Create user prompt based on command
      let userPrompt = '';
      switch (parsedCommand.action) {
        case 'create':
          userPrompt = `Create ${parsedCommand.entityType} "${parsedCommand.entityName}" with the following requirements:\n\n${parsedCommand.originalCommand}`;
          break;
        case 'update':
          userPrompt = `Update existing ${parsedCommand.entityType} "${parsedCommand.entityName}" to:\n\n${parsedCommand.originalCommand}`;
          break;
        case 'delete':
          userPrompt = `Generate instructions for safely deleting ${parsedCommand.entityType} "${parsedCommand.entityName}". Include any dependent files that need to be updated.`;
          break;
        case 'fix':
          userPrompt = `Fix the following issue with ${parsedCommand.entityType} "${parsedCommand.entityName}":\n\n${parsedCommand.originalCommand}`;
          break;
        default:
          userPrompt = `Implement the following feature: ${parsedCommand.originalCommand}`;
      }

      // Get AI response
      const response = await provider.chatComplete([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      // Parse the response to extract code and file structure
      const parsedResponse = this.parseCodeResponse(response);

      return {
        success: true,
        code: response,
        files: parsedResponse.files,
        dependencies: parsedResponse.dependencies
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse AI response to extract code files
   */
  parseCodeResponse(response) {
    const files = [];
    const dependencies = [];
    
    // Extract code blocks with file paths
    const codeBlockRegex = /```(?:\w+)?\s*([^\n]+?)\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(response)) !== null) {
      const filePath = match[1].trim();
      const content = match[2].trim();
      
      if (filePath && content) {
        files.push({
          path: filePath,
          content: content
        });
      }
    }
    
    // Extract dependency information if mentioned
    const depRegex = /npm install ([\w@\-_/]+)/g;
    let depMatch;
    while ((depMatch = depRegex.exec(response)) !== null) {
      dependencies.push(depMatch[1]);
    }
    
    return { files, dependencies };
  }

  /**
   * Write generated files to disk
   */
  async writeGeneratedFiles(files) {
    for (const file of files) {
      const fullPath = path.resolve(process.cwd(), file.path);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      // Write file
      await fs.writeFile(fullPath, file.content, 'utf8');
      
      printSuccess(`📝 Created: ${file.path}`);
    }
  }

  /**
   * Detect current project technology stack
   */
  async detectStack() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (await fs.access(packageJsonPath).then(() => true).catch(() => false)) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        const stack = [];
        if (deps.next) stack.push('Next.js');
        if (deps.react) stack.push('React');
        if (deps.vue) stack.push('Vue');
        if (deps.angular) stack.push('Angular');
        if (deps.express) stack.push('Express');
        if (deps.fastify) stack.push('Fastify');
        if (deps.nestjs) stack.push('NestJS');
        if (deps.prisma) stack.push('Prisma');
        if (deps.typeorm) stack.push('TypeORM');
        if (deps.mongodb) stack.push('MongoDB');
        if (deps.pg) stack.push('PostgreSQL');
        
        return stack.join(', ') || 'Unknown';
      }
      return 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Get current project files
   */
  async getCurrentFiles() {
    try {
      const { glob } = await import('glob');
      const files = await glob('**/*.{js,ts,jsx,tsx,json,md}', {
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
        maxDepth: 2
      });
      return files.slice(0, 10).join(', ') + (files.length > 10 ? '...' : '');
    } catch {
      return 'Unable to list files';
    }
  }
}

// Singleton instance
export const voiceToCodeService = new VoiceToCodeService();

export default VoiceToCodeService;