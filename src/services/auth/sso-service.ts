// Copyright (c) 2026 Ultra-Dex
/**
 * SSO/SAML Authentication Service
 * Enterprise single sign-on integration
 *
 * @module services/auth/sso-service
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { ppmManager } from '../../core/memory/manager.js';
import { auditLogger } from '../audit/audit-logger.js';
import { errorHandler } from '../../../apps/cli/lib/utils/error-handler.js';

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

    console.log('✓ SSO service initialized');
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

    console.log(`✓ SAML SSO configured: ${name}`);
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

    console.log(`✓ OAuth2 SSO configured: ${name}`);
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

    console.log(`✓ OIDC SSO configured: ${name}`);
    return ssoConfig;
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

      // Create session
      const session = await this.createSession(
        userId,
        config.organizationId,
        configId,
        'saml',
        user.email,
        user
      );

      await auditLogger.log({
        type: 'user.login',
        severity: 'info',
        userId,
        action: 'SSO_LOGIN_SUCCESS',
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

    console.log(`✓ SSO configuration disabled: ${config.name}`);
    return true;
  }
}

// Export singleton instance
export const ssoService = new SSOService();
export default ssoService;
