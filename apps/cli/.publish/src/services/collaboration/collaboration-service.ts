// Copyright (c) 2026 Ultra-Dex
/**
 * Real-time Collaboration Service
 * WebSocket-based collaborative editing and presence
 *
 * @module services/collaboration/collaboration-service
 */

import { v4 as uuidv4 } from 'uuid';
import { WebSocket, WebSocketServer } from 'ws';
import { ppmManager } from '../../core/memory/manager.js';
import { auditLogger } from '../audit/audit-logger.js';

/**
 * User presence status
 */
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

/**
 * Collaboration session
 */
export interface CollaborationSession {
  id: string;
  projectId: string;
  teamId: string;
  participants: Map<string, Participant>;
  createdAt: Date;
  lastActivity: Date;
  cursors: Map<string, CursorPosition>;
  selections: Map<string, TextSelection>;
}

/**
 * Session participant
 */
export interface Participant {
  userId: string;
  username: string;
  avatar?: string;
  status: PresenceStatus;
  joinedAt: Date;
  lastSeen: Date;
  ws?: WebSocket;
  permissions: string[];
}

/**
 * Cursor position
 */
export interface CursorPosition {
  userId: string;
  username: string;
  fileId: string;
  line: number;
  column: number;
  color: string;
  timestamp: Date;
}

/**
 * Text selection
 */
export interface TextSelection {
  userId: string;
  fileId: string;
  start: { line: number; column: number };
  end: { line: number; column: number };
  timestamp: Date;
}

/**
 * Operation types
 */
export type OperationType = 'insert' | 'delete' | 'replace' | 'cursor' | 'selection' | 'comment';

/**
 * Operation
 */
export interface Operation {
  id: string;
  type: OperationType;
  userId: string;
  fileId: string;
  timestamp: Date;
  data: any;
  version: number;
}

/**
 * Comment
 */
export interface Comment {
  id: string;
  userId: string;
  username: string;
  fileId: string;
  line: number;
  content: string;
  timestamp: Date;
  resolved: boolean;
  replies: CommentReply[];
}

/**
 * Comment reply
 */
export interface CommentReply {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
}

/**
 * Collaboration Service
 */
export class CollaborationService {
  private initialized: boolean = false;
  private wss?: WebSocketServer;
  private sessions: Map<string, CollaborationSession> = new Map();
  private userColors: Map<string, string> = new Map();
  private availableColors: string[] = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
    '#F8B739',
    '#52BE80',
  ];

  async initialize(port: number = 8867): Promise<void> {
    if (this.initialized) return;

    await ppmManager.init();
    await auditLogger.initialize();

    // Initialize WebSocket server
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws: WebSocket, req) => {
      this.handleConnection(ws, req);
    });

    console.log(`✓ Collaboration service initialized on port ${port}`);
    this.initialized = true;
  }

  /**
   * Handle WebSocket connection
   */
  private handleConnection(ws: WebSocket, req: any): void {
    const url = new URL(req.url || '', 'http://localhost');
    const sessionId = url.searchParams.get('session');
    const userId = url.searchParams.get('user');
    const token = url.searchParams.get('token');

    if (!sessionId || !userId) {
      ws.close(1008, 'Missing session or user ID');
      return;
    }

    // Authenticate user
    this.authenticateUser(token).then((isValid) => {
      if (!isValid) {
        ws.close(1008, 'Authentication failed');
        return;
      }

      // Get or create session
      const session = this.getOrCreateSession(sessionId);

      // Add participant
      this.addParticipant(session, userId, ws);

      // Handle messages
      ws.on('message', (data: Buffer) => {
        this.handleMessage(session, userId, data);
      });

      // Handle disconnect
      ws.on('close', () => {
        this.removeParticipant(session, userId);
      });

      // Send initial state
      this.sendInitialState(ws, session, userId);
    });
  }

  /**
   * Authenticate user
   */
  private async authenticateUser(token: string | null): Promise<boolean> {
    if (!token) return false;
    // In real implementation, validate JWT or session token
    return true;
  }

  /**
   * Get or create session
   */
  private getOrCreateSession(sessionId: string): CollaborationSession {
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = {
        id: sessionId,
        projectId: sessionId.split(':')[0] || sessionId,
        teamId: sessionId.split(':')[1] || '',
        participants: new Map(),
        createdAt: new Date(),
        lastActivity: new Date(),
        cursors: new Map(),
        selections: new Map(),
      };
      this.sessions.set(sessionId, session);
    }

    return session;
  }

  /**
   * Add participant to session
   */
  private async addParticipant(
    session: CollaborationSession,
    userId: string,
    ws: WebSocket
  ): Promise<void> {
    // Get user info from database
    const userInfo = await this.getUserInfo(userId);

    // Assign color
    const color = this.getUserColor(userId);

    const participant: Participant = {
      userId,
      username: userInfo.username || userId,
      avatar: userInfo.avatar,
      status: 'online',
      joinedAt: new Date(),
      lastSeen: new Date(),
      ws,
      permissions: userInfo.permissions || [],
    };

    session.participants.set(userId, participant);
    session.lastActivity = new Date();

    // Broadcast user joined
    this.broadcastToSession(
      session,
      {
        type: 'user-joined',
        user: {
          id: userId,
          username: participant.username,
          avatar: participant.avatar,
          color,
          status: participant.status,
        },
      },
      userId
    );

    await auditLogger.log({
      type: 'security.alert',
      severity: 'info',
      userId,
      action: 'COLLABORATION_JOINED',
      resource: 'collaboration',
      resourceId: session.id,
      details: { sessionId: session.id },
    });

    console.log(`✓ User ${userId} joined session ${session.id}`);
  }

  /**
   * Remove participant from session
   */
  private async removeParticipant(session: CollaborationSession, userId: string): Promise<void> {
    session.participants.delete(userId);
    session.cursors.delete(userId);
    session.selections.delete(userId);
    session.lastActivity = new Date();

    // Release color
    this.userColors.delete(userId);

    // Broadcast user left
    this.broadcastToSession(session, {
      type: 'user-left',
      userId,
    });

    // Clean up empty sessions
    if (session.participants.size === 0) {
      this.sessions.delete(session.id);
    }

    await auditLogger.log({
      type: 'security.alert',
      severity: 'info',
      userId,
      action: 'COLLABORATION_LEFT',
      resource: 'collaboration',
      resourceId: session.id,
    });

    console.log(`✓ User ${userId} left session ${session.id}`);
  }

  /**
   * Handle incoming message
   */
  private handleMessage(session: CollaborationSession, userId: string, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());
      const participant = session.participants.get(userId);

      if (!participant) return;

      participant.lastSeen = new Date();
      session.lastActivity = new Date();

      switch (message.type) {
        case 'cursor':
          this.handleCursorMove(session, userId, message);
          break;
        case 'selection':
          this.handleSelection(session, userId, message);
          break;
        case 'operation':
          this.handleOperation(session, userId, message);
          break;
        case 'comment':
          this.handleComment(session, userId, message);
          break;
        case 'status':
          this.handleStatusChange(session, userId, message);
          break;
        case 'ping':
          participant.ws?.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Handle cursor move
   */
  private handleCursorMove(session: CollaborationSession, userId: string, message: any): void {
    const color = this.getUserColor(userId);
    const participant = session.participants.get(userId);

    const cursor: CursorPosition = {
      userId,
      username: participant?.username || userId,
      fileId: message.fileId,
      line: message.line,
      column: message.column,
      color,
      timestamp: new Date(),
    };

    session.cursors.set(userId, cursor);

    // Broadcast to other participants
    this.broadcastToSession(
      session,
      {
        type: 'cursor',
        cursor,
      },
      userId
    );
  }

  /**
   * Handle selection
   */
  private handleSelection(session: CollaborationSession, userId: string, message: any): void {
    const selection: TextSelection = {
      userId,
      fileId: message.fileId,
      start: message.start,
      end: message.end,
      timestamp: new Date(),
    };

    session.selections.set(userId, selection);

    this.broadcastToSession(
      session,
      {
        type: 'selection',
        selection,
      },
      userId
    );
  }

  /**
   * Handle operation
   */
  private async handleOperation(
    session: CollaborationSession,
    userId: string,
    message: any
  ): Promise<void> {
    const operation: Operation = {
      id: uuidv4(),
      type: message.operation.type,
      userId,
      fileId: message.fileId,
      timestamp: new Date(),
      data: message.operation.data,
      version: message.version || 1,
    };

    // Store operation
    await this.storeOperation(session, operation);

    // Broadcast to other participants
    this.broadcastToSession(
      session,
      {
        type: 'operation',
        operation,
      },
      userId
    );
  }

  /**
   * Handle comment
   */
  private async handleComment(
    session: CollaborationSession,
    userId: string,
    message: any
  ): Promise<void> {
    const participant = session.participants.get(userId);

    const comment: Comment = {
      id: uuidv4(),
      userId,
      username: participant?.username || userId,
      fileId: message.fileId,
      line: message.line,
      content: message.content,
      timestamp: new Date(),
      resolved: false,
      replies: [],
    };

    // Store comment
    await this.storeComment(session, comment);

    // Broadcast to all participants
    this.broadcastToSession(session, {
      type: 'comment',
      comment,
    });
  }

  /**
   * Handle status change
   */
  private handleStatusChange(session: CollaborationSession, userId: string, message: any): void {
    const participant = session.participants.get(userId);
    if (participant) {
      participant.status = message.status;

      this.broadcastToSession(session, {
        type: 'status-change',
        userId,
        status: message.status,
      });
    }
  }

  /**
   * Broadcast message to session participants
   */
  private broadcastToSession(
    session: CollaborationSession,
    message: any,
    excludeUserId?: string
  ): void {
    const messageStr = JSON.stringify(message);

    for (const [userId, participant] of session.participants) {
      if (userId !== excludeUserId && participant.ws?.readyState === WebSocket.OPEN) {
        participant.ws.send(messageStr);
      }
    }
  }

  /**
   * Send initial state to new participant
   */
  private sendInitialState(ws: WebSocket, session: CollaborationSession, userId: string): void {
    const color = this.getUserColor(userId);

    // Get other participants
    const otherParticipants = Array.from(session.participants.values())
      .filter((p) => p.userId !== userId)
      .map((p) => ({
        id: p.userId,
        username: p.username,
        avatar: p.avatar,
        color: this.getUserColor(p.userId),
        status: p.status,
      }));

    // Get cursors
    const cursors = Array.from(session.cursors.values()).filter((c) => c.userId !== userId);

    // Send state
    ws.send(
      JSON.stringify({
        type: 'initial-state',
        data: {
          sessionId: session.id,
          userId,
          color,
          participants: otherParticipants,
          cursors,
          selections: Array.from(session.selections.values()),
        },
      })
    );
  }

  /**
   * Get user color
   */
  private getUserColor(userId: string): string {
    if (!this.userColors.has(userId)) {
      const colorIndex = this.userColors.size % this.availableColors.length;
      this.userColors.set(userId, this.availableColors[colorIndex]);
    }
    return this.userColors.get(userId)!;
  }

  /**
   * Get user info from database
   */
  private async getUserInfo(userId: string): Promise<any> {
    const results = await ppmManager.search(`user:${userId}`);
    return results?.[0]?.metadata || { username: userId };
  }

  /**
   * Store operation
   */
  private async storeOperation(session: CollaborationSession, operation: Operation): Promise<void> {
    await ppmManager.add({
      content: `Collaboration operation: ${operation.type}`,
      type: 'collaboration-operation',
      importance: 3,
      metadata: {
        sessionId: session.id,
        operation,
      },
    });
  }

  /**
   * Store comment
   */
  private async storeComment(session: CollaborationSession, comment: Comment): Promise<void> {
    await ppmManager.add({
      content: `Comment by ${comment.username}: ${comment.content}`,
      type: 'collaboration-comment',
      importance: 4,
      metadata: {
        sessionId: session.id,
        comment,
      },
    });
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalSessions: number;
    totalParticipants: number;
    activeSessions: number;
  } {
    let totalParticipants = 0;
    let activeSessions = 0;

    for (const session of this.sessions.values()) {
      totalParticipants += session.participants.size;
      if (session.participants.size > 0) {
        activeSessions++;
      }
    }

    return {
      totalSessions: this.sessions.size,
      totalParticipants,
      activeSessions,
    };
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    if (this.wss) {
      // Close all connections
      for (const session of this.sessions.values()) {
        for (const participant of session.participants.values()) {
          participant.ws?.close(1000, 'Server shutting down');
        }
      }

      this.wss.close();
    }

    console.log('✓ Collaboration service shut down');
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();
export default collaborationService;
