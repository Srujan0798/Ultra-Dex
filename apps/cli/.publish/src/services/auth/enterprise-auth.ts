// Copyright (c) 2026 Ultra-Dex
/**
 * Enterprise Authentication System
 * Comprehensive authentication with SSO, MFA, RBAC, and security monitoring
 *
 * @module services/auth/enterprise-auth
 */

import { jwtService, TokenPair } from './jwt-service.js';
import { mfaService } from './mfa-service.js';
import { userService, User } from './user-service.js';
import { sessionService, Session } from './session-service.js';
import { ssoService } from './sso-service.js';
import { auditLogger } from '../audit/audit-logger.js';

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  tokens?: TokenPair;
  requiresMFA?: boolean;
  error?: string;
  redirectUrl?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
  mfaToken?: string;
  ipAddress: string;
  userAgent: string;
  organizationId?: string;
}

export interface SSOLoginRequest {
  provider: 'saml' | 'oauth2' | 'oidc';
  configId: string;
  code?: string;
  state?: string;
  samlResponse?: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * Enterprise Authentication System
 */
export class EnterpriseAuthSystem {
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await jwtService.initialize();
    await mfaService.initialize();
    await userService.initialize();
    await sessionService.initialize();
    await ssoService.initialize();

    console.log('✓ Enterprise authentication system initialized');
    this.initialized = true;
  }

  /**
   * Authenticate user with email/password
   */
  async login(request: LoginRequest): Promise<AuthResult> {
    await this.initialize();

    try {
      // Authenticate with password
      const user = await userService.authenticateUser(request.email, request.password || '');
      if (!user) {
        await auditLogger.log({
          type: 'security.alert',
          severity: 'warning',
          action: 'LOGIN_FAILED',
          resource: 'authentication',
          details: {
            method: 'password',
            email: request.email,
          },
        });
        return { success: false, error: 'Invalid credentials' };
      }

      // Check MFA requirement
      const org = await userService.getOrganization(user.organizationId);
      const mfaRequired = org?.settings.mfaRequired || false;
      const mfaStatus = await mfaService.getMFAStatus(user.id);

      if (mfaRequired && mfaStatus !== 'enabled') {
        return {
          success: false,
          error: 'MFA required',
          redirectUrl: `/auth/mfa/setup?userId=${user.id}`,
        };
      }

      // If MFA is required, check MFA token
      if (mfaRequired && request.mfaToken) {
        const mfaResult = await mfaService.verifyMFAToken(user.id, request.mfaToken);
        if (!mfaResult.success) {
          return { success: false, error: mfaResult.error || 'Invalid MFA token' };
        }
      } else if (mfaRequired) {
        return { success: false, requiresMFA: true };
      }

      // Create session
      const session = await sessionService.createSession(
        user.id,
        user.organizationId,
        request.ipAddress,
        request.userAgent
      );

      // Generate JWT tokens
      const tokens = await jwtService.generateTokenPair(
        user.id,
        user.organizationId,
        [user.role],
        user.permissions,
        session.id
      );

      await auditLogger.log({
        type: 'user.login',
        severity: 'info',
        action: 'LOGIN_SUCCESS',
        userId: user.id,
        resource: 'authentication',
        details: {
          method: 'password',
          email: user.email,
        },
      });

      return {
        success: true,
        user,
        session,
        tokens,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return { success: false, error: message };
    }
  }

  /**
   * SSO login
   */
  async ssoLogin(request: SSOLoginRequest): Promise<AuthResult> {
    await this.initialize();

    try {
      let result;

      switch (request.provider) {
        case 'saml':
          if (!request.samlResponse) {
            return { success: false, error: 'SAML response required' };
          }
          result = await ssoService.processSAMLResponse(request.configId, request.samlResponse);
          break;

        case 'oauth2':
          if (!request.code || !request.state) {
            return { success: false, error: 'Authorization code and state required' };
          }
          result = await ssoService.processOAuth2Callback(
            request.configId,
            request.code,
            request.state,
            request.ipAddress,
            request.userAgent
          );
          break;

        case 'oidc':
          if (!request.code || !request.state) {
            return { success: false, error: 'Authorization code and state required' };
          }
          result = await ssoService.processOIDCCallback(
            request.configId,
            request.code,
            request.state,
            request.ipAddress,
            request.userAgent
          );
          break;

        default:
          return { success: false, error: 'Unsupported SSO provider' };
      }

      if (!result.success) {
        return result;
      }

      // Generate JWT tokens if not already done
      if (!result.tokens && result.session && result.user) {
        const user = result.user;
        const tokens = await jwtService.generateTokenPair(
          user.id,
          user.organizationId,
          [user.role || 'member'],
          user.permissions,
          result.session.id
        );
        result.tokens = tokens;
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SSO login failed';
      return { success: false, error: message };
    }
  }

  /**
   * Validate JWT token and get user context
   */
  async validateToken(
    token: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: User; session: Session; permissions: string[]; roles: string[] } | null> {
    await this.initialize();

    const payload = await jwtService.validateAccessToken(token);
    if (!payload) return null;

    // Validate session
    const session = await sessionService.validateSession(payload.sessionId, ipAddress, userAgent);
    if (!session) return null;

    // Get current user data
    const user = await userService.getUser(payload.userId);
    if (!user || user.status !== 'active') return null;

    return {
      user,
      session,
      permissions: payload.permissions,
      roles: payload.roles,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair | null> {
    await this.initialize();

    return await jwtService.refreshAccessToken(refreshToken);
  }

  /**
   * Logout user
   */
  async logout(userId: string, sessionId?: string): Promise<boolean> {
    await this.initialize();

    if (sessionId) {
      await sessionService.terminateSession(sessionId, 'user_logout');
    } else {
      // Terminate all user sessions
      await sessionService.terminateAllUserSessions(userId, 'user_logout');
    }

    // Revoke all refresh tokens
    await jwtService.revokeAllUserTokens(userId);

    await auditLogger.log({
      type: 'user.logout',
      severity: 'info',
      action: 'LOGOUT',
      userId,
      resource: 'authentication',
      details: {
        sessionId,
      },
    });

    return true;
  }

  /**
   * Setup MFA for user
   */
  async setupMFA(
    userId: string,
    type: 'totp' | 'sms' | 'email' = 'totp',
    contact?: string
  ): Promise<{ success: boolean; error?: string; secret?: string; qrCodeUrl?: string }> {
    await this.initialize();

    if (type === 'totp') {
      return await mfaService.setupTOTP(userId);
    } else if (type === 'sms' && contact) {
      // Would setup SMS MFA
      return { success: false, error: 'SMS MFA not implemented' };
    } else if (type === 'email' && contact) {
      // Would setup email MFA
      return { success: false, error: 'Email MFA not implemented' };
    }

    return { success: false, error: 'Invalid MFA type' };
  }

  /**
   * Verify MFA setup
   */
  async verifyMFASetup(userId: string, token: string): Promise<boolean> {
    await this.initialize();

    return await mfaService.verifyTOTPSetup(userId, token);
  }

  /**
   * Get SSO login URL
   */
  async getSSOLoginUrl(provider: 'saml' | 'oauth2' | 'oidc', configId: string): Promise<string> {
    await this.initialize();

    switch (provider) {
      case 'saml':
        return await ssoService.generateSAMLRequest(configId);
      case 'oauth2':
        return await ssoService.generateOAuth2AuthUrl(configId);
      case 'oidc':
        return await ssoService.generateOIDCAuthUrl(configId);
      default:
        throw new Error('Unsupported SSO provider');
    }
  }

  /**
   * Create organization
   */
  async createOrganization(
    name: string,
    settings?: Partial<{
      ssoEnabled: boolean;
      mfaRequired: boolean;
      defaultRole: string;
    }>
  ): Promise<import('./user-service.js').Organization> {
    await this.initialize();

    return await userService.createOrganization(name, undefined, undefined, settings);
  }

  /**
   * Create user
   */
  async createUser(
    email: string,
    firstName: string,
    lastName: string,
    organizationId: string,
    password?: string
  ): Promise<User> {
    await this.initialize();

    return await userService.createUser(email, firstName, lastName, organizationId, password);
  }

  /**
   * Check permission
   */
  async hasPermission(
    userId: string,
    permission: string,
    organizationId?: string
  ): Promise<boolean> {
    await this.initialize();

    return await userService.userHasPermission(userId, permission, organizationId);
  }
}

// Export singleton instance
export const enterpriseAuth = new EnterpriseAuthSystem();
export default enterpriseAuth;
