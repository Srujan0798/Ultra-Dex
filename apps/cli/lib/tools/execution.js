/**
 * Tool Execution System for Ultra-Dex
 * Handles the execution of tools called by AI agents
 */

import fs from 'fs/promises';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const _execAsync = promisify(exec);

// Helper to detect binary content
function isBinary(buffer) {
  // Check for null bytes or control characters in the first chunk
  const chunk = buffer.slice(0, 1024);
  for (let i = 0; i < chunk.length; i++) {
    if (chunk[i] === 0) return true;
  }
  return false;
}

/**
 * Execute a tool based on its type and parameters
 * @param {Object} toolCall - The tool call object from the AI response
 * @param {string} projectRoot - The root directory of the project
 * @returns {Promise<any>} - The result of the tool execution
 */
export async function executeTool(toolCall, projectRoot = process.cwd()) {
  const { function: func } = toolCall;
  const { name, arguments: argsStr } = func;
  
  try {
    // Parse the arguments string to get parameters
    const args = JSON.parse(argsStr);
    
    switch (name) {
      case 'read_code':
      case 'read_file':
        return await executeReadFile(args, projectRoot);
        
      case 'write_code':
      case 'write_file':
        return await executeWriteFile(args, projectRoot);
        
      case 'search_code':
        return await executeSearchCode(args, projectRoot);
        
      case 'run_shell':
        return await executeRunShell(args);
        
      case 'delegate_task':
        return await executeDelegateTask(args);
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error.message);
    return {
      error: `Tool execution failed: ${error.message}`,
      success: false
    };
  }
}

/**
 * Execute read file operation
 * @param {Object} args - Arguments for the read operation
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} - Result of the read operation
 */
async function executeReadFile(args, projectRoot) {
  const { filePath } = args;
  
  // Validate file path to prevent directory traversal
  const fullPath = path.resolve(projectRoot, filePath);
  if (!fullPath.startsWith(projectRoot)) {
    throw new Error('Invalid file path: Path traversal detected');
  }
  
  try {
    const buffer = await fs.readFile(fullPath);

    if (isBinary(buffer)) {
      return {
        success: false,
        error: `Cannot read binary file: ${filePath}. Please use specific tools for binary files.`,
        filePath
      };
    }

    const content = buffer.toString('utf8');
    return {
      success: true,
      content,
      filePath
    };
  } catch (error) {
    return {
      success: false,
      error: `Could not read file: ${error.message}`,
      filePath
    };
  }
}

/**
 * Execute write file operation
 * @param {Object} args - Arguments for the write operation
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} - Result of the write operation
 */
async function executeWriteFile(args, projectRoot) {
  const { filePath, content } = args;
  
  // Validate file path to prevent directory traversal
  const fullPath = path.resolve(projectRoot, filePath);
  if (!fullPath.startsWith(projectRoot)) {
    throw new Error('Invalid file path: Path traversal detected');
  }
  
  try {
    // Create directory if it doesn't exist
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    // Write the content to the file
    await fs.writeFile(fullPath, content, 'utf8');
    
    return {
      success: true,
      message: `Successfully wrote to ${filePath}`,
      filePath
    };
  } catch (error) {
    return {
      success: false,
      error: `Could not write file: ${error.message}`,
      filePath
    };
  }
}

/**
 * Execute search code operation
 * @param {Object} args - Arguments for the search operation
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} - Result of the search operation
 */
async function executeSearchCode(args, _projectRoot) {
  const { query, _filePattern = '*.js' } = args;
  
  try {
    // This is a simplified search - in a real implementation, 
    // you might want to use more sophisticated search like ripgrep
    const { _spawn } = await import('child_process');
    
    return new Promise((resolve, _reject) => {
      const _results = [];
      
      // For now, return a mock response
      resolve({
        success: true,
        query,
        results: [`Found matches for "${query}" in mock search`],
        count: 1
      });
    });
  } catch (error) {
    return {
      success: false,
      error: `Could not search code: ${error.message}`,
      query
    };
  }
}

/**
 * Execute shell command
 * @param {Object} args - Arguments for the shell command
 * @returns {Promise<Object>} - Result of the shell command
 */
async function executeRunShell(args) {
  const { command } = args;
  
  return new Promise((resolve) => {
    // Timeout in milliseconds (default: 30 seconds)
    const TIMEOUT_MS = 30000;
    // Max buffer size for output (default: 1MB)
    const MAX_BUFFER = 1024 * 1024;
    
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let truncated = false;

    // Using spawn via shell to allow complex commands
    const child = spawn(command, {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Set up timeout
    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, TIMEOUT_MS);

    child.stdout.on('data', (data) => {
      if (!truncated && stdout.length < MAX_BUFFER) {
        stdout += data.toString();
        if (stdout.length >= MAX_BUFFER) {
          stdout = stdout.substring(0, MAX_BUFFER) + '\n...[Output Truncated]';
          truncated = true;
          child.kill();
        }
      }
    });

    child.stderr.on('data', (data) => {
      if (stderr.length < MAX_BUFFER) {
        stderr += data.toString();
        if (stderr.length >= MAX_BUFFER) {
          stderr = stderr.substring(0, MAX_BUFFER) + '\n...[Output Truncated]';
        }
      }
    });

    child.on('close', (code) => {
      clearTimeout(timeoutId);

      if (timedOut) {
        resolve({
          success: false,
          error: `Command timed out after ${TIMEOUT_MS}ms`,
          stdout,
          stderr,
          command
        });
      } else if (truncated) {
        resolve({
          success: false,
          error: `Output limit exceeded (truncated at ${MAX_BUFFER} bytes)`,
          stdout,
          stderr,
          command
        });
      } else if (code === 0) {
        resolve({
          success: true,
          stdout,
          stderr,
          command
        });
      } else {
        resolve({
          success: false,
          error: `Command failed with exit code ${code}`,
          stdout,
          stderr,
          command
        });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        error: `Command execution error: ${err.message}`,
        stdout,
        stderr,
        command
      });
    });
  });
}

/**
 * Execute task delegation
 * @param {Object} args - Arguments for the delegation
 * @returns {Promise<Object>} - Result of the delegation
 */
async function executeDelegateTask(args) {
  const { agent, task } = args;
  
  // In a real implementation, this would trigger another agent
  // For now, return a mock response
  return {
    success: true,
    message: `Task delegated to @${agent}: ${task}`,
    agent,
    task
  };
}

/**
 * Process tool calls from AI response
 * @param {Array} toolCalls - Array of tool calls from AI response
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Array>} - Array of tool execution results
 */
export async function processToolCalls(toolCalls, projectRoot = process.cwd()) {
  if (!toolCalls || toolCalls.length === 0) {
    return [];
  }
  
  const results = [];
  
  for (const toolCall of toolCalls) {
    const result = await executeTool(toolCall, projectRoot);
    results.push({
      tool_call_id: toolCall.id,
      result
    });
  }
  
  return results;
}

export default {
  executeTool,
  processToolCalls
};