# Enterprise Authentication System

A comprehensive, enterprise-grade authentication system with SSO, MFA, RBAC, and security monitoring.

## Features

### 🔐 Authentication Methods

- **Password Authentication**: Secure bcrypt hashing with configurable rounds
- **OAuth 2.0 / OpenID Connect**: Full support for enterprise identity providers
- **SAML 2.0**: Legacy system integration
- **Multi-Factor Authentication**: TOTP, SMS, and email-based MFA

### 🏢 Organization & User Management

- **Hierarchical Organizations**: Parent-child organization structures
- **User Lifecycle**: Complete CRUD operations with audit trails
- **Role-Based Access Control**: Flexible permission system
- **Organization Settings**: SSO enablement, MFA requirements

### 🔒 Security Features

- **JWT Tokens**: Access and refresh token management with rotation
- **Session Management**: Active session tracking and monitoring
- **Security Monitoring**: Real-time alerts for suspicious activities
- **Audit Logging**: Comprehensive security event logging

### 🔗 SSO Providers

- **Azure AD**: Microsoft enterprise integration
- **Okta**: Workforce identity platform
- **Auth0**: Universal identity platform
- **Google Workspace**: G Suite integration
- **OneLogin**: Unified access management

## Architecture

```
Enterprise Auth System
├── JWT Service          # Token management & validation
├── MFA Service          # Multi-factor authentication
├── User Service         # User & organization management
├── Session Service      # Session tracking & monitoring
├── SSO Service          # Single sign-on integration
└── Audit Logger         # Security event logging
```

## Quick Start

```typescript
import { enterpriseAuth } from './services/auth/enterprise-auth';

// Initialize the system
await enterpriseAuth.initialize();

// Create organization
const org = await enterpriseAuth.createOrganization('Acme Corp', {
  ssoEnabled: true,
  mfaRequired: true,
});

// Create user
const user = await enterpriseAuth.createUser(
  'john.doe@acme.com',
  'John',
  'Doe',
  org.id,
  'securePassword123'
);

// Login
const result = await enterpriseAuth.login({
  email: 'john.doe@acme.com',
  password: 'securePassword123',
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
});

if (result.success) {
  console.log('Login successful:', result.tokens);
}
```

## SSO Configuration

### SAML 2.0 Setup

```typescript
const samlConfig = await ssoService.configureSAML(
  org.id,
  'Azure AD',
  {
    entryPoint: 'https://login.microsoftonline.com/.../saml2',
    issuer: 'your-app-id',
    cert: fs.readFileSync('azure-cert.pem', 'utf8'),
    callbackUrl: 'https://yourapp.com/auth/sso/callback',
  },
  {
    email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
    firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
    groups: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/groups',
  }
);
```

### OAuth 2.0 Setup

```typescript
const oauthConfig = await ssoService.configureOAuth2(
  org.id,
  'Google',
  {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    authorizationURL: 'https://accounts.google.com/o/oauth2/auth',
    tokenURL: 'https://oauth2.googleapis.com/token',
    userInfoURL: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: ['openid', 'profile', 'email'],
  },
  {
    email: 'email',
    firstName: 'given_name',
    lastName: 'family_name',
  }
);
```

## MFA Setup

```typescript
// Setup TOTP
const setupResult = await enterpriseAuth.setupMFA(user.id, 'totp');
console.log('QR Code:', setupResult.qrCode);
console.log('Secret:', setupResult.secret);

// Verify setup
const verified = await enterpriseAuth.verifyMFASetup(user.id, '123456');
```

## API Reference

### Authentication

- `login(request)`: Authenticate user
- `ssoLogin(request)`: SSO authentication
- `validateToken(token)`: Validate JWT token
- `refreshToken(refreshToken)`: Refresh access token
- `logout(userId, sessionId?)`: Logout user

### User Management

- `createUser(email, firstName, lastName, orgId, password?)`: Create user
- `createOrganization(name, settings?)`: Create organization
- `hasPermission(userId, permission, orgId?)`: Check permissions

### MFA

- `setupMFA(userId, type, contact?)`: Setup MFA
- `verifyMFASetup(userId, token)`: Verify MFA setup

### SSO

- `getSSOLoginUrl(provider, configId)`: Get SSO login URL

## Security Best Practices

1. **Token Security**: Use HTTPS, rotate refresh tokens regularly
2. **Session Management**: Monitor for suspicious activity, enforce timeouts
3. **MFA Enforcement**: Require MFA for sensitive operations
4. **Audit Logging**: Log all authentication events
5. **Rate Limiting**: Implement login attempt limits
6. **Password Policies**: Enforce strong password requirements

## Monitoring & Alerts

The system provides real-time security monitoring with alerts for:

- Multiple failed login attempts
- Suspicious session activity
- Unusual login locations
- MFA bypass attempts
- Token abuse detection

## Compliance

Supports compliance requirements for:

- **GDPR**: User data protection and consent
- **SOX**: Audit trails and access controls
- **HIPAA**: Secure healthcare data access
- **PCI DSS**: Payment data security

## Enterprise Integrations

- **LDAP/Active Directory**: Directory service integration
- **SIEM Systems**: Security event forwarding
- **Identity Governance**: Automated provisioning
- **Risk Analytics**: Behavioral analysis
