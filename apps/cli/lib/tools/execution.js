/**
 * Tool Execution System for Ultra-Dex
 * Handles the execution of tools called by AI agents
 */

import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

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
    const content = await fs.readFile(fullPath, 'utf8');
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
async function executeSearchCode(args, projectRoot) {
  const { query, filePattern = '*.js' } = args;
  
  try {
    // This is a simplified search - in a real implementation, 
    // you might want to use more sophisticated search like ripgrep
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const results = [];
      
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
  
  try {
    // For security, we'll only allow certain safe commands in a real implementation
    // This is a simplified version
    const { stdout, stderr } = await execAsync(command);
    
    return {
      success: true,
      stdout,
      stderr,
      command
    };
  } catch (error) {
    return {
      success: false,
      error: `Command failed: ${error.message}`,
      stderr: error.stderr || '',
      command
    };
  }
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