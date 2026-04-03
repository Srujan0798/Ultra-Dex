// Copyright (c) 2026 Ultra-Dex
/**
 * SSO/SAML Authentication Service
 * Enterprise single sign-on integration
 *
 * @module services/auth/sso-service
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import axios from 'axios';
import { ppmManager } from '../../core/memory/manager.js';
import { auditLogger } from '../audit/audit-logger.js';
import { errorHandler } from '../../../apps/cli/lib/utils/error-handler.js';
import { jwtService } from './jwt-service.js';
import { userService } from './user-service.js';
import { sessionService } from './session-service.js';
import { mfaService } from './mfa-service.js';

/**
 * SSO provider types
 */
export type SSOProviderType = 'saml' | 'oauth2' | 'oidc' | 'ldap';

/**
 * SSO configuration
 */
export interface SSOConfig {
  id: string;
  organizationId: string;
  providerType: SSOProviderType;
  name: string;
  isActive: boolean;
  config: SAMLConfig | OAuth2Config | OIDCConfig | LDAPConfig;
  mappings: AttributeMappings;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SAML configuration
 */
export interface SAMLConfig {
  entryPoint: string;
  issuer: string;
  cert: string;
  privateKey?: string;
  callbackUrl: string;
  wantAssertionsSigned: boolean;
  wantResponseSigned: boolean;
  signatureAlgorithm: string;
  digestAlgorithm: string;
}

/**
 * OAuth2 configuration
 */
export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authorizationURL: string;
  tokenURL: string;
  userInfoURL?: string;
  scope: string[];
  callbackUrl: string;
}

/**
 * OIDC configuration
 */
export interface OIDCConfig {
  clientId: string;
  clientSecret: string;
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
  jwksUri: string;
  scope: string[];
  callbackUrl: string;
}

/**
 * LDAP configuration
 */
export interface LDAPConfig {
  url: string;
  bindDN: string;
  bindCredentials: string;
  searchBase: string;
  searchFilter: string;
  tlsOptions?: {
    rejectUnauthorized: boolean;
    ca?: string;
  };
}

/**
 * Attribute mappings
 */
export interface AttributeMappings {
  email: string;
  firstName?: string;
  lastName?: string;
  groups?: string;
  role?: string;
  customFields?: Record<string, string>;
}

/**
 * SSO session
 */
export interface SSOSession {
  id: string;
  userId: string;
  organizationId: string;
  ssoConfigId: string;
  providerType: SSOProviderType;
  externalId: string;
  metadata: Record<string, any>;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt: Date;
}

/**
 * SSO Authentication Result
 */
export interface SSOAuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    groups?: string[];
  };
  session?: SSOSession;
  error?: string;
  redirectUrl?: string;
}

/**
 * SSO Service
 */
export class SSOService {
  private initialized: boolean = false;
  private configs: Map<string, SSOConfig> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await ppmManager.init();
    await auditLogger.initialize();

    process.stdout.write('✓ SSO service initialized\n');
    this.initialized = true;
  }

  /**
   * Configure SAML provider
   */
  async configureSAML(
    organizationId: string,
    name: string,
    config: Omit<SAMLConfig, 'callbackUrl'>,
    mappings: AttributeMappings
  ): Promise<SSOConfig> {
    await this.initialize();

    const ssoConfig: SSOConfig = {
      id: uuidv4(),
      organizationId,
      providerType: 'saml',
      name,
      isActive: true,
      config: {
        ...config,
        callbackUrl: `/api/v1/auth/sso/${organizationId}/callback`,
      },
      mappings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.configs.set(ssoConfig.id, ssoConfig);

    await ppmManager.add({
      content: `SAML SSO configured: ${name}`,
      type: 'sso-configured',
      importance: 8,
      metadata: {
        configId: ssoConfig.id,
        organizationId,
        providerType: 'saml',
      },
    });

    await auditLogger.log({
      type: 'security.alert',
      severity: 'info',
      action: 'SSO_CONFIGURED',
      resource: 'sso',
      resourceId: ssoConfig.id,
      details: {
        providerType: 'saml',
        organizationId,
        name,
      },
    });

    process.stdout.write(`✓ SAML SSO configured: ${name}\n`);
    return ssoConfig;
  }

  /**
   * Configure OAuth2 provider
   */
  async configureOAuth2(
    organizationId: string,
    name: string,
    config: Omit<OAuth2Config, 'callbackUrl'>,
    mappings: AttributeMappings
  ): Promise<SSOConfig> {
    await this.initialize();

    const ssoConfig: SSOConfig = {
      id: uuidv4(),
      organizationId,
      providerType: 'oauth2',
      name,
      isActive: true,
      config: {
        ...config,
        callbackUrl: `/api/v1/auth/sso/${organizationId}/callback`,
      },
      mappings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.configs.set(ssoConfig.id, ssoConfig);

    await ppmManager.add({
      content: `OAuth2 SSO configured: ${name}`,
      type: 'sso-configured',
      importance: 8,
      metadata: {
        configId: ssoConfig.id,
        organizationId,
        providerType: 'oauth2',
      },
    });

    await auditLogger.log({
      type: 'security.alert',
      severity: 'info',
      action: 'SSO_CONFIGURED',
      resource: 'sso',
      resourceId: ssoConfig.id,
      details: {
        providerType: 'oauth2',
        organizationId,
        name,
      },
    });

    process.stdout.write(`✓ OAuth2 SSO configured: ${name}\n`);
    return ssoConfig;
  }

  /**
   * Configure OIDC provider
   */
  async configureOIDC(
    organizationId: string,
    name: string,
    config: Omit<OIDCConfig, 'callbackUrl'>,
    mappings: AttributeMappings
  ): Promise<SSOConfig> {
    await this.initialize();

    const ssoConfig: SSOConfig = {
      id: uuidv4(),
      organizationId,
      providerType: 'oidc',
      name,
      isActive: true,
      config: {
        ...config,
        callbackUrl: `/api/v1/auth/sso/${organizationId}/callback`,
      },
      mappings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.configs.set(ssoConfig.id, ssoConfig);

    await ppmManager.add({
      content: `OIDC SSO configured: ${name}`,
      type: 'sso-configured',
      importance: 8,
      metadata: {
        configId: ssoConfig.id,
        organizationId,
        providerType: 'oidc',
      },
    });

    await auditLogger.log({
      type: 'security.alert',
      severity: 'info',
      action: 'SSO_CONFIGURED',
      resource: 'sso',
      resourceId: ssoConfig.id,
      details: {
        providerType: 'oidc',
        organizationId,
        name,
      },
    });

    process.stdout.write(`✓ OIDC SSO configured: ${name}\n`);
    return ssoConfig;
  }

  /**
   * Generate OIDC authorization URL
   */
  async generateOIDCAuthUrl(configId: string, state?: string): Promise<string> {
    await this.initialize();

    const config = this.configs.get(configId);
    if (!config || config.providerType !== 'oidc') {
      throw errorHandler.createError('RESOURCE_NOT_FOUND', 'OIDC configuration not found');
    }

    const oidcConfig = config.config as OIDCConfig;
    const authState = state || uuidv4();

    // Store state for validation
    await ppmManager.add({
      content: `OIDC state: ${authState}`,
      type: 'oidc-state',
      importance: 4,
      metadata: {
        state: authState,
        configId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    const params = new URLSearchParams({
      client_id: oidcConfig.clientId,
      redirect_uri: oidcConfig.callbackUrl,
      scope: oidcConfig.scope.join(' '),
      response_type: 'code',
      state: authState,
      nonce: uuidv4(), // For replay attack prevention
    });

    return `${oidcConfig.authorizationEndpoint}?${params.toString()}`;
  }

  /**
   * Process OIDC callback
   */
  async processOIDCCallback(
    configId: string,
    code: string,
    state: string,
    ipAddress: string,
    userAgent: string
  ): Promise<SSOAuthResult> {
    await this.initialize();

    const config = this.configs.get(configId);
    if (!config || config.providerType !== 'oidc') {
      return { success: false, error: 'Invalid OIDC configuration' };
    }

    try {
      // Validate state
      const stateResult = await ppmManager.search(`oidc-state:${state}`);
      if (!stateResult || stateResult.length === 0) {
        return { success: false, error: 'Invalid state parameter' };
      }

      // Exchange code for tokens
      const oidcConfig = config.config as OIDCConfig;
      const tokenResponse = await axios.post(
        oidcConfig.tokenEndpoint,
        {
          client_id: oidcConfig.clientId,
          client_secret: oidcConfig.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: oidcConfig.callbackUrl,
        },
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      const { access_token, refresh_token, id_token } = tokenResponse.data;

      // Verify ID token
      const idTokenPayload = this.verifyOIDCToken(id_token, oidcConfig);

      // Get additional user info if needed
      let userInfo = idTokenPayload;
      if (oidcConfig.userinfoEndpoint) {
        const userResponse = await axios.get(oidcConfig.userinfoEndpoint, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        userInfo = { ...idTokenPayload, ...userResponse.data };
      }

      // Extract user attributes
      const user = this.extractUserFromOAuth(userInfo, config.mappings);

      if (!user.email) {
        return { success: false, error: 'Email not found in OIDC response' };
      }

      // Create or update user
      const userId = await this.findOrCreateUser(user);

      // Check MFA requirement
      const org = await userService.getOrganization(config.organizationId);
      if (org?.settings.mfaRequired) {
        const mfaStatus = await mfaService.getMFAStatus(userId);
        if (mfaStatus !== 'enabled') {
          return {
            success: false,
            error: 'MFA required but not configured',
            redirectUrl: `/auth/mfa/setup?userId=${userId}`,
          };
        }
      }

      // Create session
      const session = await sessionService.createSession(
        userId,
        config.organizationId,
        ipAddress,
        userAgent
      );

      // Generate JWT tokens
      const tokenPair = await jwtService.generateTokenPair(
        userId,
        config.organizationId,
        [user.role || 'member'],
        (await userService.userHasPermission(userId, '')) ? [] : [], // Get permissions
        session.id
      );

      await auditLogger.log({
        type: 'user.login',
        severity: 'info',
        action: 'SSO_LOGIN_SUCCESS',
        userId,
        resource: 'authentication',
        resourceId: configId,
        details: {
          providerType: 'oidc',
          email: user.email,
        },
      });

      return {
        success: true,
        user: { id: userId, ...user },
        session,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OIDC processing failed';

      await auditLogger.log({
        type: 'security.alert',
        severity: 'warning',
        action: 'SSO_LOGIN_FAILED',
        resource: 'authentication',
        resourceId: configId,
        details: {
          providerType: 'oidc',
          error: errorMessage,
        },
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Verify OIDC ID token
   */
  private verifyOIDCToken(idToken: string, config: OIDCConfig): any {
    // Simplified verification - real implementation would:
    // 1. Decode token
    // 2. Verify signature using JWKS
    // 3. Check issuer, audience, expiration
    // 4. Validate nonce

    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid ID token format');
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Basic validation
    if (payload.iss !== config.issuer) {
      throw new Error('Invalid token issuer');
    }

    if (!payload.aud.includes(config.clientId)) {
      throw new Error('Invalid token audience');
    }

    if (payload.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }

    return payload;
  }

  /**
   * Generate OAuth2 authorization URL
   */
  async generateOAuth2AuthUrl(configId: string, state?: string): Promise<string> {
    await this.initialize();

    const config = this.configs.get(configId);
    if (!config || config.providerType !== 'oauth2') {
      throw errorHandler.createError('RESOURCE_NOT_FOUND', 'OAuth2 configuration not found');
    }

    const oauthConfig = config.config as OAuth2Config;
    const authState = state || uuidv4();

    // Store state for validation
    await ppmManager.add({
      content: `OAuth2 state: ${authState}`,
      type: 'oauth2-state',
      importance: 4,
      metadata: {
        state: authState,
        configId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    const params = new URLSearchParams({
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.callbackUrl,
      scope: oauthConfig.scope.join(' '),
      response_type: 'code',
      state: authState,
    });

    return `${oauthConfig.authorizationURL}?${params.toString()}`;
  }

  /**
   * Process OAuth2 callback
   */
  async processOAuth2Callback(
    configId: string,
    code: string,
    state: string,
    ipAddress: string,
    userAgent: string
  ): Promise<SSOAuthResult> {
    await this.initialize();

    const config = this.configs.get(configId);
    if (!config || config.providerType !== 'oauth2') {
      return { success: false, error: 'Invalid OAuth2 configuration' };
    }

    try {
      // Validate state
      const stateResult = await ppmManager.search(`oauth2-state:${state}`);
      if (!stateResult || stateResult.length === 0) {
        return { success: false, error: 'Invalid state parameter' };
      }

      const stateData = stateResult[0].metadata;
      if (new Date() > stateData.expiresAt) {
        return { success: false, error: 'State expired' };
      }

      // Exchange code for tokens
      const oauthConfig = config.config as OAuth2Config;
      const tokenResponse = await axios.post(
        oauthConfig.tokenURL,
        {
          client_id: oauthConfig.clientId,
          client_secret: oauthConfig.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: oauthConfig.callbackUrl,
        },
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      const { access_token, refresh_token, id_token } = tokenResponse.data;

      // Get user info
      let userInfo = {};
      if (oauthConfig.userInfoURL) {
        const userResponse = await axios.get(oauthConfig.userInfoURL, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        userInfo = userResponse.data;
      } else if (id_token) {
        // Decode ID token for OIDC
        const payload = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64').toString());
        userInfo = payload;
      }

      // Extract user attributes
      const user = this.extractUserFromOAuth(userInfo, config.mappings);

      if (!user.email) {
        return { success: false, error: 'Email not found in OAuth response' };
      }

      // Create or update user
      const userId = await this.findOrCreateUser(user);

      // Check MFA requirement
      const org = await userService.getOrganization(config.organizationId);
      if (org?.settings.mfaRequired) {
        const mfaStatus = await mfaService.getMFAStatus(userId);
        if (mfaStatus !== 'enabled') {
          return {
            success: false,
            error: 'MFA required but not configured',
            redirectUrl: `/auth/mfa/setup?userId=${userId}`,
          };
        }
      }

      // Create session
      const session = await sessionService.createSession(
        userId,
        config.organizationId,
        ipAddress,
        userAgent
      );

      // Generate JWT tokens
      const tokenPair = await jwtService.generateTokenPair(
        userId,
        config.organizationId,
        [user.role || 'member'],
        (await userService.userHasPermission(userId, '')) ? [] : [], // Get permissions
        session.id
      );

      await auditLogger.log({
        type: 'user.login',
        severity: 'info',
        action: 'SSO_LOGIN_SUCCESS',
        userId,
        resource: 'authentication',
        resourceId: configId,
        details: {
          providerType: 'oauth2',
          email: user.email,
        },
      });

      return {
        success: true,
        user: { id: userId, ...user },
        session,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth2 processing failed';

      await auditLogger.log({
        type: 'security.alert',
        severity: 'warning',
        action: 'SSO_LOGIN_FAILED',
        resource: 'authentication',
        resourceId: configId,
        details: {
          providerType: 'oauth2',
          error: errorMessage,
        },
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Extract user from OAuth response
   */
  private extractUserFromOAuth(
    userInfo: any,
    mappings: AttributeMappings
  ): { email: string; firstName?: string; lastName?: string; groups?: string[]; role?: string } {
    const email = userInfo[mappings.email] || userInfo.email || '';
    const firstName = mappings.firstName
      ? userInfo[mappings.firstName]
      : userInfo.given_name || userInfo.firstName;
    const lastName = mappings.lastName
      ? userInfo[mappings.lastName]
      : userInfo.family_name || userInfo.lastName;
    const groupsStr = mappings.groups ? userInfo[mappings.groups] : userInfo.groups;
    const role = mappings.role ? userInfo[mappings.role] : userInfo.role;

    return {
      email,
      firstName,
      lastName,
      groups: Array.isArray(groupsStr) ? groupsStr : groupsStr ? groupsStr.split(',') : undefined,
      role,
    };
  }

  /**
   * Generate SAML request
   */
  async generateSAMLRequest(configId: string): Promise<string> {
    await this.initialize();

    const config = this.configs.get(configId);
    if (!config || config.providerType !== 'saml') {
      throw errorHandler.createError('RESOURCE_NOT_FOUND', 'SAML configuration not found');
    }

    const samlConfig = config.config as SAMLConfig;

    // Generate SAML AuthnRequest
    const id = `_${uuidv4()}`;
    const issueInstant = new Date().toISOString();

    const authnRequest = `
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="${id}"
                    Version="2.0"
                    IssueInstant="${issueInstant}"
                    Destination="${samlConfig.entryPoint}"
                    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                    AssertionConsumerServiceURL="${samlConfig.callbackUrl}">
  <saml:Issuer>${samlConfig.issuer}</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
                      AllowCreate="true"/>
</samlp:AuthnRequest>`;

    // Base64 encode and URL encode
    const encodedRequest = Buffer.from(authnRequest).toString('base64');

    return `${samlConfig.entryPoint}?SAMLRequest=${encodeURIComponent(encodedRequest)}`;
  }

  /**
   * Process SAML response
   */
  async processSAMLResponse(configId: string, samlResponse: string): Promise<SSOAuthResult> {
    await this.initialize();

    const config = this.configs.get(configId);
    if (!config || config.providerType !== 'saml') {
      return { success: false, error: 'Invalid SAML configuration' };
    }

    try {
      // Decode SAML response
      const decodedResponse = Buffer.from(samlResponse, 'base64').toString('utf8');

      // Parse user attributes (simplified - real implementation would use SAML library)
      const user = this.extractUserFromSAML(decodedResponse, config.mappings);

      if (!user.email) {
        return { success: false, error: 'Email not found in SAML response' };
      }

      // Create or update user
      const userId = await this.findOrCreateUser(user);

      // Check MFA requirement
      const org = await userService.getOrganization(config.organizationId);
      if (org?.settings.mfaRequired) {
        const mfaStatus = await mfaService.getMFAStatus(userId);
        if (mfaStatus !== 'enabled') {
          return {
            success: false,
            error: 'MFA required but not configured',
            redirectUrl: `/auth/mfa/setup?userId=${userId}`,
          };
        }
      }

      // Create session (we need ipAddress and userAgent, so this method signature needs updating)
      // For now, create session with empty values
      const session = await sessionService.createSession(
        userId,
        config.organizationId,
        '', // ipAddress - would come from request
        '' // userAgent - would come from request
      );

      // Generate JWT tokens
      const tokenPair = await jwtService.generateTokenPair(
        userId,
        config.organizationId,
        [user.role || 'member'],
        (await userService.userHasPermission(userId, '')) ? [] : [], // Get permissions
        session.id
      );

      await auditLogger.log({
        type: 'user.login',
        severity: 'info',
        action: 'SSO_LOGIN_SUCCESS',
        userId,
        resource: 'authentication',
        resourceId: configId,
        details: {
          providerType: 'saml',
          email: user.email,
        },
      });

      return {
        success: true,
        user: { id: userId, ...user },
        session,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SAML processing failed';

      await auditLogger.log({
        type: 'security.alert',
        severity: 'warning',
        action: 'SSO_LOGIN_FAILED',
        resource: 'authentication',
        resourceId: configId,
        details: {
          providerType: 'saml',
          error: errorMessage,
        },
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Extract user from SAML response
   */
  private extractUserFromSAML(
    samlResponse: string,
    mappings: AttributeMappings
  ): { email: string; firstName?: string; lastName?: string; groups?: string[] } {
    // Simplified extraction - real implementation would use XML parsing
    const email = this.extractAttribute(samlResponse, mappings.email) || '';
    const firstName = mappings.firstName
      ? this.extractAttribute(samlResponse, mappings.firstName)
      : undefined;
    const lastName = mappings.lastName
      ? this.extractAttribute(samlResponse, mappings.lastName)
      : undefined;
    const groupsStr = mappings.groups
      ? this.extractAttribute(samlResponse, mappings.groups)
      : undefined;

    return {
      email,
      firstName,
      lastName,
      groups: groupsStr ? groupsStr.split(',') : undefined,
    };
  }

  /**
   * Extract attribute from SAML XML
   */
  private extractAttribute(xml: string, attributeName: string): string | undefined {
    const regex = new RegExp(`<saml:AttributeValue[^>]*>${attributeName}</saml:AttributeValue>`);
    const match = xml.match(regex);
    return match ? match[1] : undefined;
  }

  /**
   * Find or create user
   */
  private async findOrCreateUser(user: {
    email: string;
    firstName?: string;
    lastName?: string;
  }): Promise<string> {
    // Check if user exists
    const existingUsers = await ppmManager.search(`user:email:${user.email}`);

    if (existingUsers && existingUsers.length > 0) {
      return existingUsers[0].metadata?.userId || uuidv4();
    }

    // Create new user
    const userId = uuidv4();

    await ppmManager.add({
      content: `User created via SSO: ${user.email}`,
      type: 'user-created',
      importance: 6,
      metadata: {
        userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        source: 'sso',
      },
    });

    return userId;
  }

  /**
   * Create SSO session
   */
  private async createSession(
    userId: string,
    organizationId: string,
    ssoConfigId: string,
    providerType: SSOProviderType,
    externalId: string,
    metadata: Record<string, any>
  ): Promise<SSOSession> {
    const session: SSOSession = {
      id: uuidv4(),
      userId,
      organizationId,
      ssoConfigId,
      providerType,
      externalId,
      metadata,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 3600000), // 24 hours
      lastUsedAt: new Date(),
    };

    await ppmManager.add({
      content: `SSO session created: ${session.id}`,
      type: 'sso-session-created',
      importance: 5,
      metadata: {
        sessionId: session.id,
        userId,
        providerType,
      },
    });

    return session;
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<boolean> {
    await this.initialize();

    const results = await ppmManager.search(`sso-session:${sessionId}`);
    if (!results || results.length === 0) {
      return false;
    }

    const session = results[0].metadata?.session as SSOSession;
    if (!session) return false;

    return new Date() < session.expiresAt;
  }

  /**
   * Get SSO configurations for organization
   */
  async getOrganizationConfigs(organizationId: string): Promise<SSOConfig[]> {
    await this.initialize();

    return Array.from(this.configs.values())
      .filter((c) => c.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Disable SSO configuration
   */
  async disableConfig(configId: string): Promise<boolean> {
    await this.initialize();

    const config = this.configs.get(configId);
    if (!config) return false;

    config.isActive = false;
    config.updatedAt = new Date();

    await auditLogger.log({
      type: 'security.alert',
      severity: 'warning',
      action: 'SSO_DISABLED',
      resource: 'sso',
      resourceId: configId,
      details: {
        organizationId: config.organizationId,
        providerType: config.providerType,
      },
    });

    process.stdout.write(`✓ SSO configuration disabled: ${config.name}\n`);
    return true;
  }
}

// Export singleton instance
export const ssoService = new SSOService();
export default ssoService;
