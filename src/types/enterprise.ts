// Copyright (c) 2026 Ultra-Dex
/**
 * Type Declarations for Enterprise Services
 *
 * @module types/enterprise
 */

import { ppmManager } from '../../src/core/memory/manager.js';
import { auditLogger } from '../../src/services/audit/audit-logger.js';

/**
 * Team member status
 */
export type TeamMemberStatus = 'pending' | 'active' | 'inactive';

/**
 * Team role
 */
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Team member interface
 */
export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  joinedAt: Date;
  invitedBy: string;
  status: TeamMemberStatus;
}

/**
 * Team interface
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  settings: TeamSettings;
  members: TeamMember[];
}

/**
 * Team settings
 */
export interface TeamSettings {
  maxProjects: number;
  maxMembers: number;
  allowGuestAccess: boolean;
  requireApprovalForProjects: boolean;
  defaultProjectVisibility: 'private' | 'team' | 'public';
}

/**
 * Re-export common dependencies
 */
export { ppmManager, auditLogger };
