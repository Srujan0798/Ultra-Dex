/**
 * Ultra-Dex Security
 *
 * RBAC, encryption, and security utilities.
 */

// RBAC
export {
  RBAC,
  PolicyEngine,
  AuthorizationError,
  createUser,
  createResource,
} from './rbac.js';

export type {
  Role,
  Permission,
  User,
  Resource,
  AccessRequest,
  Policy,
} from './rbac.js';

// Encryption
export {
  EncryptionService,
  TokenService,
  SecretManager,
  sanitizeInput,
  generateId,
  constantTimeCompare,
} from './encryption.js';

export type {
  EncryptedData,
  TokenPayload,
  EncryptionConfig,
} from './encryption.js';
