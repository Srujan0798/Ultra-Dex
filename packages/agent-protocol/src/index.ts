/**
 * @ultra-dex/agent-protocol
 *
 * Standardized protocol for agent-to-agent and agent-to-orchestrator communication.
 * Defines message types, serialization, and the agent lifecycle interface.
 */

export interface AgentMessage {
  id: string;
  type: AgentMessageType;
  from: string;       // Sender agent ID
  to: string;         // Recipient agent ID
  payload: unknown;
  metadata: MessageMetadata;
  timestamp: number;
}

export type AgentMessageType =
  | 'task'            // Assign a task to an agent
  | 'result'          // Return task result
  | 'error'           // Report an error
  | 'status'          // Status update
  | 'heartbeat'       // Keep-alive
  | 'cancel'          // Cancel a task
  | 'query'           // Request information
  | 'response';       // Reply to a query

export interface MessageMetadata {
  priority: 'low' | 'normal' | 'high' | 'critical';
  ttlMs?: number;     // Time-to-live
  correlationId?: string; // Links related messages
  requiresAck?: boolean;
}

export interface AgentTask {
  id: string;
  type: string;
  description: string;
  input: unknown;
  constraints?: Record<string, unknown>;
  deadline?: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface AgentResult {
  taskId: string;
  success: boolean;
  output: unknown;
  error?: string;
  durationMs: number;
  tokensUsed?: number;
  costUsd?: number;
}

export interface AgentDescriptor {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  version: string;
  status: 'idle' | 'busy' | 'error' | 'offline';
}

/**
 * Serialize an AgentMessage to JSON string.
 */
export function serializeMessage(message: AgentMessage): string {
  return JSON.stringify(message);
}

/**
 * Deserialize a JSON string to AgentMessage.
 */
export function deserializeMessage(json: string): AgentMessage {
  const parsed = JSON.parse(json);
  if (!parsed.id || !parsed.type || !parsed.from || !parsed.to) {
    throw new Error('Invalid AgentMessage: missing required fields');
  }
  return parsed as AgentMessage;
}

/**
 * Create a new agent message.
 */
export function createMessage(
  type: AgentMessageType,
  from: string,
  to: string,
  payload: unknown,
  metadata: Partial<MessageMetadata> = {}
): AgentMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    from,
    to,
    payload,
    metadata: {
      priority: metadata.priority || 'normal',
      ttlMs: metadata.ttlMs,
      correlationId: metadata.correlationId,
      requiresAck: metadata.requiresAck ?? false,
    },
    timestamp: Date.now(),
  };
}

/**
 * Check if a message has expired.
 */
export function isExpired(message: AgentMessage): boolean {
  if (!message.metadata.ttlMs) return false;
  return Date.now() - message.timestamp > message.metadata.ttlMs;
}
