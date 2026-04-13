export interface SSOUser {
  id: string;
  email: string;
  name: string;
  provider: string;
  claims?: Record<string, unknown>;
}

export interface SSOProvider {
  authenticate(token: string): Promise<boolean>;
  getUser(token: string): Promise<SSOUser>;
  refreshToken(token: string): Promise<string>;
}

interface BaseSSOConfig {
  issuer: string;
  clientId: string;
  audience?: string;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length < 2) {
    throw new Error('Invalid token format');
  }
  const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
  return JSON.parse(payload) as Record<string, unknown>;
}

abstract class BaseOIDCProvider implements SSOProvider {
  protected readonly config: BaseSSOConfig;
  protected abstract readonly providerName: string;

  constructor(config: BaseSSOConfig) {
    this.config = config;
  }

  async authenticate(token: string): Promise<boolean> {
    try {
      const payload = decodeJwtPayload(token);
      if (!payload.iss || String(payload.iss) !== this.config.issuer) return false;
      if (!payload.aud) return false;
      return true;
    } catch {
      return false;
    }
  }

  async getUser(token: string): Promise<SSOUser> {
    const payload = decodeJwtPayload(token);
    return {
      id: String(payload.sub || payload.oid || payload.user_id || 'unknown'),
      email: String(payload.email || payload.preferred_username || 'unknown@example.com'),
      name: String(payload.name || payload.given_name || 'Unknown User'),
      provider: this.providerName,
      claims: payload,
    };
  }

  async refreshToken(token: string): Promise<string> {
    const valid = await this.authenticate(token);
    if (!valid) {
      throw new Error(`${this.providerName} token refresh failed: token invalid`);
    }
    return token;
  }
}

export class OktaSSO extends BaseOIDCProvider {
  protected readonly providerName = 'okta';
}

export class AzureADSSO extends BaseOIDCProvider {
  protected readonly providerName = 'azuread';
}

export class Auth0SSO extends BaseOIDCProvider {
  protected readonly providerName = 'auth0';
}

export class GenericOIDC extends BaseOIDCProvider {
  protected readonly providerName = 'oidc';
}

export type SSOProviderType = 'okta' | 'azuread' | 'auth0' | 'oidc';

export interface SSOProviderConfig extends BaseSSOConfig {
  type: SSOProviderType;
}

export function createSSOProvider(config: SSOProviderConfig): SSOProvider {
  switch (config.type) {
    case 'okta':
      return new OktaSSO(config);
    case 'azuread':
      return new AzureADSSO(config);
    case 'auth0':
      return new Auth0SSO(config);
    case 'oidc':
      return new GenericOIDC(config);
    default:
      throw new Error(`Unsupported SSO provider type: ${(config as { type: string }).type}`);
  }
}

