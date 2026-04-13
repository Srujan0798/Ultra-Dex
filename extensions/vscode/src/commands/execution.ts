/**
 * Workflow Execution Commands
 * 
 * Handles running, debugging, and validating workflows.
 */

import * as vscode from 'vscode';
import * as yaml from 'yaml';
import * as fs from 'fs';
import { UltraDexClient } from '../utils/client.js';

export async function runWorkflow(uri: vscode.Uri, client: UltraDexClient): Promise<void> {
  const terminal = vscode.window.createTerminal('Ultra-Dex');
  terminal.show();
  terminal.sendText(`npx ultra-dex run "${uri.fsPath}"`);
  
  vscode.window.showInformationMessage(`Running workflow: ${path.basename(uri.fsPath)}`);
}

export async function debugWorkflow(uri: vscode.Uri, client: UltraDexClient): Promise<void> {
  vscode.commands.executeCommand('setContext', 'ultraDex.debugging', true);
  
  // TODO: Implement debug session
  vscode.window.showInformationMessage(`Debug mode enabled for: ${path.basename(uri.fsPath)}`);
  
  // Listen for events
  const disposable = client.onEvent((event) => {
    if (event.workflowId === path.basename(uri.fsPath, '.dex')) {
      console.log('Debug event:', event);
    }
  });

  // Clean up after 5 minutes
  setTimeout(() => {
    disposable.dispose();
    vscode.commands.executeCommand('setContext', 'ultraDex.debugging', false);
  }, 300000);
}

export async function validateWorkflow(uri: vscode.Uri): Promise<void> {
  try {
    const content = fs.readFileSync(uri.fsPath, 'utf-8');
    const workflow = yaml.parse(content);
    
    const errors: string[] = [];
    
    // Basic validation
    if (!workflow.name) {
      errors.push('Workflow must have a name');
    }
    
    if (!workflow.nodes || !Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    } else {
      // Validate each node
      for (const node of workflow.nodes) {
        if (!node.id) {
          errors.push('All nodes must have an id');
        }
        if (!node.type) {
          errors.push(`Node ${node.id || '?'} must have a type`);
        }
      }
      
      // Check for duplicate IDs
      const ids = workflow.nodes.map((n: any) => n.id);
      const duplicates = ids.filter((id: string, i: number) => ids.indexOf(id) !== i);
      if (duplicates.length > 0) {
        errors.push(`Duplicate node IDs: ${[...new Set(duplicates)].join(', ')}`);
      }
    }
    
    if (errors.length > 0) {
      vscode.window.showErrorMessage(`Validation failed: ${errors.join(', ')}`);
    } else {
      vscode.window.showInformationMessage('✅ Workflow is valid');
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to validate: ${error}`);
  }
}

import * as path from 'path';
