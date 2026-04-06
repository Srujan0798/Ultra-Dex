// Copyright (c) 2026 Ultra-Dex
/**
 * JWT Token Management Service
 * Handles access tokens, refresh tokens, and token validation
 *
 * @module services/auth/jwt-service
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { ppmManager } from '../../core/memory/manager.js';
import { auditLogger } from '../audit/audit-logger.js';
import { errorHandler } from '../../../apps/cli/lib/utils/error-handler.js';

export interface JWTPayload {
  userId: string;
  organizationId?: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface RefreshTokenData {
  id: string;
  userId: string;
  sessionId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revoked: boolean;
}

/**
 * JWT Token Service
 */
export class JWTService {
  private initialized: boolean = false;
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string = '15m'; // 15 minutes
  private refreshTokenExpiry: string = '7d'; // 7 days

  constructor() {
    this.accessTokenSecret =
      process.env.JWT_ACCESS_SECRET || crypto.randomBytes(32).toString('hex');
    this.refreshTokenSecret =
      process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString('hex');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await ppmManager.init();
    await auditLogger.initialize();

    process.stdout.write('✓ JWT service initialized\n');
    this.initialized = true;
  }

  /**
   * Generate access and refresh token pair
   */
  async generateTokenPair(
    userId: string,
    organizationId: string | undefined,
    roles: string[],
    permissions: string[],
    sessionId: string
  ): Promise<TokenPair> {
    await this.initialize();

    const payload: JWTPayload = {
      userId,
      organizationId,
      roles,
      permissions,
      sessionId,
    };

    // Generate access token
    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'ultra-dex',
      audience: 'api',
    });

    // Generate refresh token
    const refreshTokenId = uuidv4();
    const refreshPayload = {
      tokenId: refreshTokenId,
      userId,
      sessionId,
      type: 'refresh',
    };

    const refreshToken = jwt.sign(refreshPayload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'ultra-dex',
      audience: 'api',
    });

    // Store refresh token securely
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const refreshTokenData: RefreshTokenData = {
      id: refreshTokenId,
      userId,
      sessionId,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
      revoked: false,
    };

    await this.storeRefreshToken(refreshTokenData);

    await auditLogger.log({
      type: 'security.event',
      severity: 'info',
      action: 'TOKEN_ISSUED',
      userId,
      resource: 'authentication',
      resourceId: sessionId,
      details: {
        tokenType: 'access_refresh_pair',
        sessionId,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      refreshExpiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    };
  }

  /**
   * Validate access token
   */
  async validateAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      const verified = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'ultra-dex',
        audience: 'api',
      });
      const payload = verified as unknown as JWTPayload;

      // Check if session is still valid
      if (!(await this.isSessionValid(payload.sessionId))) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
    await this.initialize();

    try {
      // Verify refresh token
      const refreshPayload = jwt.verify(refreshToken, this.refreshTokenSecret, {
        issuer: 'ultra-dex',
        audience: 'api',
      }) as any;

      if (refreshPayload.type !== 'refresh') {
        return null;
      }

      // Check if refresh token exists and is not revoked
      const storedToken = await this.getRefreshToken(refreshPayload.tokenId);
      if (!storedToken || storedToken.revoked || new Date() > storedToken.expiresAt) {
        return null;
      }

      // Verify token hash
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      if (tokenHash !== storedToken.tokenHash) {
        return null;
      }

      // Check session validity
      if (!(await this.isSessionValid(storedToken.sessionId))) {
        return null;
      }

      // Get user data (simplified - would fetch from user service)
      const userData = await this.getUserData(storedToken.userId);
      if (!userData) {
        return null;
      }

      // Revoke old refresh token
      await this.revokeRefreshToken(refreshPayload.tokenId);

      // Generate new token pair
      return await this.generateTokenPair(
        userData.userId,
        userData.organizationId,
        userData.roles,
        userData.permissions,
        storedToken.sessionId
      );
    } catch (error) {
      return null;
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(tokenId: string): Promise<boolean> {
    await this.initialize();

    const token = await this.getRefreshToken(tokenId);
    if (!token) return false;

    token.revoked = true;

    await ppmManager.add({
      content: `Refresh token revoked: ${tokenId}`,
      type: 'token-revoked',
      importance: 7,
      metadata: {
        tokenId,
        userId: token.userId,
      },
    });

    await auditLogger.log({
      type: 'security.event',
      severity: 'warning',
      action: 'TOKEN_REVOKED',
      userId: token.userId,
      resource: 'authentication',
      resourceId: tokenId,
      details: {
        tokenType: 'refresh',
      },
    });

    return true;
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.initialize();

    // Find all refresh tokens for user
    const tokens = await this.getUserRefreshTokens(userId);

    for (const token of tokens) {
      if (!token.revoked) {
        await this.revokeRefreshToken(token.id);
      }
    }

    await auditLogger.log({
      type: 'security.alert',
      severity: 'warning',
      action: 'ALL_USER_TOKENS_REVOKED',
      userId,
      resource: 'authentication',
      details: {
        reason: 'security_action',
      },
    });
  }

  /**
   * Check if session is valid
   */
  private async isSessionValid(sessionId: string): Promise<boolean> {
    // Implementation would check session store
    // For now, assume valid
    return true;
  }

  /**
   * Get user data (simplified)
   */
  private async getUserData(userId: string): Promise<any> {
    // Would fetch from user service
    const results = await ppmManager.search(`user:${userId}`);
    if (results && results.length > 0) {
      return results[0].metadata;
    }
    return null;
  }

  /**
   * Store refresh token
   */
  private async storeRefreshToken(token: RefreshTokenData): Promise<void> {
    await ppmManager.add({
      content: `Refresh token stored: ${token.id}`,
      type: 'refresh-token-stored',
      importance: 5,
      metadata: token,
    });
  }

  /**
   * Get refresh token
   */
  private async getRefreshToken(tokenId: string): Promise<RefreshTokenData | null> {
    const results = await ppmManager.search(`refresh-token:${tokenId}`);
    if (results && results.length > 0) {
      return results[0].metadata as RefreshTokenData;
    }
    return null;
  }

  /**
   * Get all refresh tokens for user
   */
  private async getUserRefreshTokens(userId: string): Promise<RefreshTokenData[]> {
    const results = await ppmManager.search(`user-refresh-tokens:${userId}`);
    return results?.map((r) => r.metadata as RefreshTokenData) || [];
  }
}

// Export singleton instance
export const jwtService = new JWTService();
export default jwtService;
