/**
 * Ultra-Dex Server Client
 * 
 * Handles WebSocket connection to Ultra-Dex server for real-time updates.
 */

import * as vscode from 'vscode';
import WebSocket from 'ws';

export interface WorkflowStatus {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  nodes: number;
  completedNodes: number;
}

export interface ExecutionEvent {
  type: 'workflow.started' | 'task.started' | 'task.completed' | 'workflow.completed' | 'error';
  timestamp: string;
  workflowId: string;
  taskId?: string;
  data?: Record<string, unknown>;
}

export class UltraDexClient implements vscode.Disposable {
  private ws?: WebSocket;
  private reconnectTimer?: NodeJS.Timeout;
  private readonly config: vscode.WorkspaceConfiguration;
  private eventHandlers: ((event: ExecutionEvent) => void)[] = [];
  private statusChangeHandlers: ((status: WorkflowStatus) => void)[] = [];

  constructor() {
    this.config = vscode.workspace.getConfiguration('ultraDex.server');
    this.connect();
  }

  private connect(): void {
    const host = this.config.get<string>('host', 'localhost');
    const port = this.config.get<number>('port', 8080);
    const url = `ws://${host}:${port}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        vscode.window.setStatusBarMessage('$(debug-disconnect) Ultra-Dex connected', 3000);
      });

      this.ws.on('message', (data) => {
        try {
          const event = JSON.parse(data.toString()) as ExecutionEvent;
          this.handleEvent(event);
        } catch {
          console.error('Failed to parse WebSocket message');
        }
      });

      this.ws.on('error', (error) => {
        console.error('Ultra-Dex WebSocket error:', error);
      });

      this.ws.on('close', () => {
        // Reconnect after 5 seconds
        this.reconnectTimer = setTimeout(() => this.connect(), 5000);
      });
    } catch (error) {
      console.error('Failed to connect to Ultra-Dex server:', error);
    }
  }

  private handleEvent(event: ExecutionEvent): void {
    for (const handler of this.eventHandlers) {
      handler(event);
    }

    if (event.type === 'workflow.started' || event.type === 'workflow.completed') {
      const status: WorkflowStatus = {
        id: event.workflowId,
        name: event.data?.name as string || 'Unknown',
        status: event.type === 'workflow.started' ? 'running' : 
                event.data?.status === 'success' ? 'completed' : 'failed',
        progress: event.data?.progress as number || 0,
        nodes: event.data?.totalNodes as number || 0,
        completedNodes: event.data?.completedNodes as number || 0,
      };
      for (const handler of this.statusChangeHandlers) {
        handler(status);
      }
    }
  }

  onEvent(handler: (event: ExecutionEvent) => void): vscode.Disposable {
    this.eventHandlers.push(handler);
    return {
      dispose: () => {
        const index = this.eventHandlers.indexOf(handler);
        if (index > -1) {
          this.eventHandlers.splice(index, 1);
        }
      }
    };
  }

  onStatusChange(handler: (status: WorkflowStatus) => void): vscode.Disposable {
    this.statusChangeHandlers.push(handler);
    return {
      dispose: () => {
        const index = this.statusChangeHandlers.indexOf(handler);
        if (index > -1) {
          this.statusChangeHandlers.splice(index, 1);
        }
      }
    };
  }

  async runWorkflow(workflowPath: string): Promise<void> {
    // TODO: Implement HTTP API call to trigger workflow execution
    vscode.window.showInformationMessage(`Running workflow: ${workflowPath}`);
  }

  dispose(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.ws?.close();
  }
}
