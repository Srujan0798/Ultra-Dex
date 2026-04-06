// Type declarations for modules without type definitions

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: unknown;
    iat?: number;
    exp?: number;
  }

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string | Buffer,
    options?: {
      expiresIn?: string | number;
      issuer?: string;
      audience?: string;
      [key: string]: unknown;
    }
  ): string;

  export function verify(
    token: string,
    secretOrPublicKey: string | Buffer,
    options?: {
      issuer?: string;
      audience?: string;
      [key: string]: unknown;
    }
  ): JwtPayload | string;
}

declare module 'speakeasy' {
  export function generateSecret(options?: {
    name?: string;
    issuer?: string;
    length?: number;
  }): {
    base32: string;
    otpauth_url?: string;
  };

  export const totp: {
    (options: {
      secret: string;
      encoding: 'base32' | 'ascii' | 'hex';
    }): string;
    verify(options: {
      secret: string;
      encoding: 'base32' | 'ascii' | 'hex';
      token: string;
      window?: number;
    }): boolean;
  };

  export function verify(options: {
    secret: string;
    encoding: 'base32' | 'ascii' | 'hex';
    token: string;
    window?: number;
  }): boolean;
}

declare module 'qrcode' {
  export function toDataURL(text: string): Promise<string>;
}

declare module 'bcryptjs' {
  export function hash(s: string, salt: number | string): Promise<string>;
  export function compare(s: string, hash: string): Promise<boolean>;
}

// Declarations for local JS modules
declare module '../../../apps/cli/lib/utils/error-handler.js' {
  export type ErrorCode = 
    | 'VALIDATION_ERROR'
    | 'AUTHENTICATION_ERROR'
    | 'AUTHORIZATION_ERROR'
    | 'NOT_FOUND'
    | 'RESOURCE_NOT_FOUND'
    | 'CONFLICT'
    | 'INTERNAL_ERROR'
    | 'SERVICE_UNAVAILABLE'
    | 'TIMEOUT_ERROR';

  export interface AppError extends Error {
    code: ErrorCode;
    statusCode: number;
    details?: Record<string, unknown>;
  }

  export interface ErrorHandler {
    createError(code: ErrorCode, message: string, details?: Record<string, unknown>): AppError;
    handleError(error: Error | AppError): { code: ErrorCode; message: string; statusCode: number };
  }

  export const errorHandler: ErrorHandler;
  export default errorHandler;
}

declare module '../../core/auth/rbac-manager.js' {
  const ROLE_PERMISSIONS: { [key: string]: string[] };
  export { ROLE_PERMISSIONS };
}

declare module '../audit/audit-logger.js' {
  import type { AuditEvent, AuditEventType, AuditSeverity, AuditFilter, AuditStats } from '../audit/audit-logger';
  
  export type { AuditEvent, AuditEventType, AuditSeverity, AuditFilter, AuditStats };
  
  export class AuditLogger {
    initialize(): Promise<void>;
    log(event: Omit<AuditEvent, 'id' | 'timestamp' | 'metadata'>): Promise<AuditEvent>;
  }
  
  export const auditLogger: AuditLogger;
  export default auditLogger;
}

declare module '../../core/memory/manager.js' {
  export interface MemoryEntry {
    id: string;
    content: string;
    type: string;
    importance: number;
    metadata?: unknown;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface SearchResult {
    id: string;
    content: string;
    type: string;
    importance: number;
    metadata?: unknown;
    score: number;
  }

  export interface MemoryManager {
    init(): Promise<void>;
    add(entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<MemoryEntry>;
    update(id: string, updates: Partial<MemoryEntry>): Promise<MemoryEntry | null>;
    get(id: string): Promise<MemoryEntry | null>;
    delete(id: string): Promise<boolean>;
    remove(id: string): Promise<boolean>;
    search(query: string, limit?: number): Promise<SearchResult[]>;
    clear(): Promise<void>;
  }

  export const ppmManager: MemoryManager;
  export default ppmManager;
}
