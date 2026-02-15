/**
 * Ultra-Dex Enterprise Authentication Module
 * SAML 2.0 and OIDC integration for enterprise SSO
 */

import passport from 'passport';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { EventEmitter } from 'events';

class EnterpriseAuth extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      jwtSecret: options.jwtSecret || process.env.JWT_SECRET || 'ultra-dex-enterprise-secret-change-me',
      jwtExpiration: options.jwtExpiration || '24h',
      enableSSO: options.enableSSO !== false,
      enableMFA: options.enableMFA !== false,
      enableRBAC: options.enableRBAC !== false,
      ssoConfig: options.ssoConfig || {},
      mfaConfig: options.mfaConfig || {
        totp: { enabled: true, window: 1 },
        backupCodes: { count: 10, length: 16 }
      },
      rbacConfig: options.rbacConfig || {
        defaultRole: 'viewer',
        enableHierarchical: true
      },
      ...options
    };

    this.users = new Map(); // userId -> userData
    this.sessions = new Map(); // sessionId -> sessionData
    this.roles = new Map(); // roleId -> roleData
    this.permissions = new Map(); // permissionId -> permissionData
    this.mfaDevices = new Map(); // userId -> mfaData
    this.backupCodes = new Map(); // userId -> [codes]

    this.samlStrategy = null;
    this.oidcStrategy = null;

    this.initializeAuthStrategies();
    this.initializeDefaultRoles();
  }

  /**
   * Initialize authentication strategies
   */
  async initializeAuthStrategies() {
    if (this.options.enableSSO) {
      // SAML Strategy (dynamic import)
      if (this.options.ssoConfig.saml) {
        try {
          const { Strategy: SamlStrategy } = await import('passport-saml');
          this.samlStrategy = new SamlStrategy({
            entryPoint: this.options.ssoConfig.saml.entryPoint,
            issuer: this.options.ssoConfig.saml.issuer || 'ultra-dex-saml',
            callbackUrl: this.options.ssoConfig.saml.callbackUrl || 'http://localhost:4000/auth/saml/callback',
            cert: this.options.ssoConfig.saml.cert,
            signatureAlgorithm: 'sha256',
          }, async (profile, done) => {
            try {
              const user = await this.handleSamlLogin(profile);
              done(null, user);
            } catch (error) {
              done(error);
            }
          });

          passport.use('saml', this.samlStrategy);
        } catch (error) {
          console.warn('SAML strategy not available:', error.message);
        }
      }

      // OIDC Strategy (dynamic import)
      if (this.options.ssoConfig.oidc) {
        try {
          const { Issuer } = await import('openid-client');
          const issuer = await Issuer.discover(this.options.ssoConfig.oidc.issuerUrl);
          const client = new issuer.Client({
            client_id: this.options.ssoConfig.oidc.clientId,
            client_secret: this.options.ssoConfig.oidc.clientSecret,
            redirect_uris: [this.options.ssoConfig.oidc.redirectUri],
            response_types: ['code'],
          });

          this.oidcStrategy = new OIDCStrategy({
            client,
            params: { scope: 'openid profile email' },
          }, async (tokenSet, userinfo, done) => {
            try {
              const user = await this.handleOidcLogin(userinfo, tokenSet);
              done(null, user);
            } catch (error) {
              done(error);
            }
          });

          passport.use('oidc', this.oidcStrategy);
        } catch (error) {
          console.warn('OIDC strategy not available:', error.message);
        }
      }
    }

    // Serialize/deserialize user for session
    passport.serializeUser((user, done) => {
      done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
      try {
        const user = await this.getUserById(id);
        done(null, user);
      } catch (error) {
        done(error);
      }
    });
  }

  /**
   * Initialize default roles
   */
  initializeDefaultRoles() {
    // Define role hierarchy and permissions
    const roles = {
      'viewer': {
        name: 'Viewer',
        description: 'Can view but not modify anything',
        permissions: [
          'system:read',
          'agent:read',
          'memory:read',
          'memory:search',
          'project:read',
          'user:read',
          'config:read',
          'audit:read',
          'security:read'
        ],
        inherits: []
      },
      'developer': {
        name: 'Developer',
        description: 'Can develop and execute agents',
        permissions: [
          'system:read',
          'agent:read',
          'agent:create',
          'agent:execute',
          'memory:read',
          'memory:write',
          'memory:search',
          'project:read',
          'project:create',
          'user:read',
          'config:read',
          'audit:read',
          'security:read'
        ],
        inherits: ['viewer']
      },
      'manager': {
        name: 'Manager',
        description: 'Can manage projects and teams',
        permissions: [
          'system:read',
          'agent:read',
          'agent:create',
          'agent:update',
          'agent:execute',
          'memory:read',
          'memory:write',
          'memory:search',
          'project:read',
          'project:create',
          'project:update',
          'user:read',
          'config:read',
          'audit:read',
          'security:read'
        ],
        inherits: ['developer', 'viewer']
      },
      'admin': {
        name: 'Administrator',
        description: 'Full administrative access',
        permissions: [
          'system:read',
          'system:write',
          'system:admin',
          'agent:read',
          'agent:create',
          'agent:update',
          'agent:delete',
          'agent:execute',
          'memory:read',
          'memory:write',
          'memory:delete',
          'memory:search',
          'project:read',
          'project:create',
          'project:update',
          'project:delete',
          'user:read',
          'user:create',
          'user:update',
          'user:delete',
          'config:read',
          'config:write',
          'config:admin',
          'audit:read',
          'audit:write',
          'audit:admin',
          'security:read',
          'security:write',
          'security:admin',
          'billing:read',
          'billing:write',
          'billing:admin'
        ],
        inherits: ['manager', 'developer', 'viewer']
      },
      'owner': {
        name: 'Owner',
        description: 'Complete system access with no restrictions',
        permissions: ['*:*'], // All permissions
        inherits: ['admin', 'manager', 'developer', 'viewer']
      }
    };

    for (const [roleId, roleData] of Object.entries(roles)) {
      this.roles.set(roleId, roleData);
    }
  }

  /**
   * Handle SAML login
   * @param {object} profile - SAML profile
   * @returns {object} User object
   */
  async handleSamlLogin(profile) {
    const user = {
      id: profile.uid || profile.nameID || crypto.randomUUID(),
      email: profile.email || profile.mail || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      firstName: profile.firstName || profile.givenName || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/firstname'],
      lastName: profile.lastName || profile.surname || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/lastname'],
      displayName: profile.displayName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
      provider: 'saml',
      providerId: profile.uid || profile.nameID,
      roles: this.mapGroupsToRoles(profile.groups || []),
      lastLoginAt: new Date().toISOString(),
      createdAt: profile.createdAt || new Date().toISOString(),
      isActive: true,
      mfaEnabled: false, // Will be set based on org policy
      organizations: [] // Will be populated based on SAML groups
    };

    // Upsert user in our system
    await this.upsertUser(user);
    this.emit('login', { user, provider: 'saml', timestamp: new Date().toISOString() });

    return user;
  }

  /**
   * Handle OIDC login
   * @param {object} userinfo - OIDC user info
   * @param {object} tokenSet - Token set
   * @returns {object} User object
   */
  async handleOidcLogin(userinfo, tokenSet) {
    const user = {
      id: userinfo.sub || crypto.randomUUID(),
      email: userinfo.email,
      firstName: userinfo.given_name,
      lastName: userinfo.family_name,
      displayName: userinfo.name,
      provider: 'oidc',
      providerId: userinfo.sub,
      roles: this.mapGroupsToRoles(userinfo.groups || []),
      lastLoginAt: new Date().toISOString(),
      createdAt: userinfo.created_at || new Date().toISOString(),
      isActive: true,
      mfaEnabled: false,
      organizations: [],
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
    };

    // Upsert user in our system
    await this.upsertUser(user);
    this.emit('login', { user, provider: 'oidc', timestamp: new Date().toISOString() });

    return user;
  }

  /**
   * Map SAML/OIDC groups to Ultra-Dex roles
   * @param {Array<string>} groups - Groups from identity provider
   * @returns {Array<string>} Ultra-Dex roles
   */
  mapGroupsToRoles(groups = []) {
    const roleMappings = {
      'admin': ['Admin', 'Administrator', 'SuperUser', 'IT Admin', 'Admins'],
      'manager': ['Manager', 'Lead', 'Supervisor', 'Team Lead', 'Managers'],
      'developer': ['Developer', 'Engineer', 'Coder', 'Programmer', 'Developers'],
      'viewer': ['Viewer', 'Guest', 'ReadOnly', 'Auditor', 'Readers'],
      'security': ['Security', 'Compliance', 'SOC', 'InfoSec', 'SecurityTeam']
    };

    const roles = new Set();
    for (const [role, groupNames] of Object.entries(roleMappings)) {
      if (groups.some(group => groupNames.some(name =>
        group.toLowerCase().includes(name.toLowerCase())
      ))) {
        roles.add(role);
      }
    }

    // Add default 'viewer' role
    roles.add('viewer');
    return Array.from(roles);
  }

  /**
   * Upsert user in the system
   * @param {object} user - User data
   * @returns {object} User object
   */
  async upsertUser(user) {
    // In production, this would be a database upsert
    this.users.set(user.id, user);
    return user;
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {object} User object
   */
  async getUserById(id) {
    return this.users.get(id);
  }

  /**
   * Generate JWT token for user
   * @param {object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      roles: user.roles,
      provider: user.provider,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    return jwt.sign(payload, this.options.jwtSecret);
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {object} Decoded token and user
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.options.jwtSecret);
      const user = this.users.get(decoded.id);
      if (!user || !user.isActive) {
        throw new Error('User inactive or not found');
      }
      return { user, decoded };
    } catch (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }
  }

  /**
   * Create a session for the user
   * @param {object} user - User object
   * @param {object} deviceInfo - Device information
   * @returns {object} Session object
   */
  async createSession(user, deviceInfo = {}) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const session = {
      id: sessionId,
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      deviceInfo,
      ipAddress: deviceInfo.ip || null,
      userAgent: deviceInfo.userAgent || null,
      mfaVerified: false
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Validate a session
   * @param {string} sessionId - Session ID
   * @returns {object} Session and user objects
   */
  async validateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    if (new Date(session.expiresAt) < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }

    const user = await this.getUserById(session.userId);
    if (!user || !user.isActive) {
      this.sessions.delete(sessionId);
      return null;
    }

    return { session, user };
  }

  /**
   * Logout a session
   * @param {string} sessionId - Session ID
   */
  async logoutSession(sessionId) {
    this.sessions.delete(sessionId);
    this.emit('logout', { sessionId, timestamp: new Date().toISOString() });
  }

  /**
   * Check if user has permission
   * @param {string} userId - User ID
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  async hasPermission(userId, permission) {
    const user = await this.getUserById(userId);
    if (!user) {
      return false;
    }

    // Check all user roles and their inherited permissions
    for (const userRole of user.roles) {
      const role = this.roles.get(userRole);
      if (role) {
        // Check direct permissions
        if (role.permissions.includes(permission) || role.permissions.includes('*:*')) {
          return true;
        }

        // Check wildcard permissions (e.g., 'agent:*' matches 'agent:read')
        const [resource, action] = permission.split(':');
        if (resource && action) {
          if (role.permissions.includes(`${resource}:*`) || role.permissions.includes('*:*')) {
            return true;
          }
        }

        // Check inherited roles if enabled
        if (this.options.rbacConfig.enableHierarchical) {
          const inheritedRoles = this.getInheritedRoles(userRole);
          for (const inheritedRole of inheritedRoles) {
            const inheritedRoleData = this.roles.get(inheritedRole);
            if (inheritedRoleData &&
              (inheritedRoleData.permissions.includes(permission) ||
                inheritedRoleData.permissions.includes('*:*'))) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Get all roles inherited by a role
   * @param {string} roleId - Role ID
   * @returns {Array<string>} Inherited role IDs
   */
  getInheritedRoles(roleId) {
    const role = this.roles.get(roleId);
    if (!role) return [];

    const inherited = [...role.inherits];
    for (const inheritId of role.inherits) {
      inherited.push(...this.getInheritedRoles(inheritId));
    }
    return inherited;
  }

  /**
   * Enable MFA for a user
   * @param {string} userId - User ID
   * @returns {object} MFA setup data
   */
  async enableMFA(userId) {
    if (!this.options.enableMFA) {
      throw new Error('MFA not enabled in configuration');
    }

    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate TOTP secret
    const secret = crypto.randomBytes(32).toString('hex');
    const device = {
      userId,
      type: 'totp',
      secret,
      enabled: true,
      createdAt: new Date().toISOString()
    };

    this.mfaDevices.set(userId, device);

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < this.options.mfaConfig.backupCodes.count; i++) {
      backupCodes.push(crypto.randomBytes(this.options.mfaConfig.backupCodes.length).toString('hex'));
    }
    this.backupCodes.set(userId, backupCodes);

    // Update user
    user.mfaEnabled = true;
    this.users.set(userId, user);

    return {
      secret,
      backupCodes,
      qrCode: `otpauth://totp/Ultra-Dex:${user.email}?secret=${secret}&issuer=Ultra-Dex`
    };
  }

  /**
   * Verify MFA code
   * @param {string} userId - User ID
   * @param {string} code - MFA code
   * @returns {boolean} True if code is valid
   */
  async verifyMFA(userId, code) {
    if (!this.options.enableMFA) {
      return true; // MFA not required
    }

    const device = this.mfaDevices.get(userId);
    if (!device || !device.enabled) {
      return !this.users.get(userId)?.mfaRequired; // Allow if MFA not required for user
    }

    // In a real implementation, this would validate the TOTP code
    // For now, we'll just return true for demo purposes
    return true;
  }

  /**
   * Get user's organizations
   * @param {string} userId - User ID
   * @returns {Array<object>} Organizations
   */
  async getUserOrganizations(userId) {
    const user = await this.getUserById(userId);
    if (!user) {
      return [];
    }

    // In a real implementation, this would query the organizations database
    // For now, return mock data
    return [
      {
        id: 'org_ultra_dex_enterprise',
        name: 'Ultra-Dex Enterprise',
        role: 'admin',
        permissions: ['read', 'write', 'admin']
      },
      {
        id: 'org_client_project',
        name: 'Client Project',
        role: 'developer',
        permissions: ['read', 'write']
      }
    ];
  }

  /**
   * Get all available roles
   * @returns {Array<string>} Array of role names
   */
  getAllRoles() {
    return Array.from(this.roles.keys());
  }

  /**
   * Get role definition
   * @param {string} roleId - Role ID
   * @returns {object} Role definition
   */
  getRole(roleId) {
    return this.roles.get(roleId);
  }

  /**
   * Get all permissions for a user (including inherited)
   * @param {string} userId - User ID
   * @returns {Array<string>} Array of permissions
   */
  getUserPermissions(userId) {
    const user = this.users.get(userId);
    if (!user) {
      return [];
    }

    const permissions = new Set();

    // Add permissions from direct roles
    for (const roleName of user.roles) {
      const role = this.roles.get(roleName);
      if (role) {
        role.permissions.forEach(perm => permissions.add(perm));
      }

      // Add permissions from inherited roles
      const hierarchy = this.getInheritedRoles(roleName);
      for (const inheritedRole of hierarchy) {
        const inheritedRoleData = this.roles.get(inheritedRole);
        if (inheritedRoleData) {
          inheritedRoleData.permissions.forEach(perm => permissions.add(perm));
        }
      }
    }

    return Array.from(permissions);
  }

  /**
   * Get system health information
   * @returns {object} Health information
   */
  getHealth() {
    return {
      status: 'healthy',
      ssoEnabled: this.options.enableSSO,
      mfaEnabled: this.options.enableMFA,
      rbacEnabled: this.options.enableRBAC,
      userCount: this.users.size,
      sessionCount: this.sessions.size,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const enterpriseAuth = new EnterpriseAuth();

// Export class for instantiation with custom options
export default EnterpriseAuth;