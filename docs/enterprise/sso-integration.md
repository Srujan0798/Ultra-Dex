# Ultra-Dex SSO Integration Guide

> Configure Single Sign-On for Ultra-Dex Enterprise using Okta, Azure AD, Auth0, or any OIDC provider.

---

## Table of Contents

- [Okta SAML Setup](#okta-saml-setup)
- [Azure AD OIDC Setup](#azure-ad-oidc-setup)
- [Auth0 Configuration](#auth0-configuration)
- [Generic OIDC Provider](#generic-oidc-provider)
- [Troubleshooting SSO](#troubleshooting-sso)

---

## Okta SAML Setup

### Step 1: Create Okta Application

1. Log in to your Okta Admin Console
2. Navigate to **Applications → Applications**
3. Click **Create App Integration**
4. Select **SAML 2.0** → **Next**

![Okta app creation placeholder](./assets/okta-create-app.png)

### Step 2: Configure SAML Settings

**General Settings:**

| Field | Value |
|---|---|
| App name | Ultra-Dex |
| App logo | Upload Ultra-Dex logo (optional) |

**SAML Settings:**

| Field | Value |
|---|---|
| Single sign-on URL | `https://your-ultradex-domain.com/auth/saml/callback` |
| Audience URI (SP Entity ID) | `urn:ultra-dex:enterprise` |
| Name ID format | EmailAddress |
| Application username | Email |

**Attribute Statements:**

| Name | Namespace | Value |
|---|---|---|
| email | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress` | user.email |
| firstName | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname` | user.firstName |
| lastName | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname` | user.lastName |

### Step 3: Configure Ultra-Dex

```bash
ultra-dex config set sso.provider okta
ultra-dex config set sso.saml.entryPoint "https://your-org.okta.com/app/ultra-dex/abc123/sso/saml"
ultra-dex config set sso.saml.issuer "urn:ultra-dex:enterprise"
ultra-dex config set sso.saml.cert "-----BEGIN CERTIFICATE-----\n..."
```

### Step 4: Test SSO

```bash
ultra-dex auth test-sso
# Should redirect to Okta login → callback → authenticated session
```

---

## Azure AD OIDC Setup

### Step 1: Register Application in Azure AD

1. Navigate to **Azure Active Directory → App registrations**
2. Click **New registration**
3. Configure:

| Field | Value |
|---|---|
| Name | Ultra-Dex |
| Supported account types | Accounts in this organizational directory only |
| Redirect URI | Web: `https://your-ultradex-domain.com/auth/oidc/callback` |

### Step 2: Configure API Permissions

Add the following permissions:

- `openid` (OpenID Connect)
- `profile` (User profile)
- `email` (User email)

### Step 3: Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Copy the secret value (you won't see it again)

### Step 4: Configure Ultra-Dex

```bash
ultra-dex config set sso.provider azure-ad
ultra-dex config set sso.oidc.clientId "your-application-id"
ultra-dex config set sso.oidc.clientSecret "your-client-secret"
ultra-dex config set sso.oidc.issuer "https://login.microsoftonline.com/your-tenant-id/v2.0"
ultra-dex config set sso.oidc.redirectUri "https://your-ultradex-domain.com/auth/oidc/callback"
```

### Step 5: Enable Group-Based Access (Optional)

```bash
ultra-dex config set sso.azure-ad.groups.enabled true
ultra-dex config set sso.azure-ad.groups.allowed "Ultra-Dex-Users,Ultra-Dex-Admins"
```

---

## Auth0 Configuration

### Step 1: Create Auth0 Application

1. Navigate to **Applications → Create Application**
2. Select **Regular Web Applications**
3. Configure settings:

| Field | Value |
|---|---|
| Name | Ultra-Dex |
| Application Type | Regular Web App |

### Step 2: Configure Allowed Callback URLs

In **Application Settings → Allowed Callback URLs**:

```
https://your-ultradex-domain.com/auth/oidc/callback
```

### Step 3: Configure Ultra-Dex

```bash
ultra-dex config set sso.provider auth0
ultra-dex config set sso.oidc.clientId "your-auth0-client-id"
ultra-dex config set sso.oidc.clientSecret "your-auth0-client-secret"
ultra-dex config set sso.oidc.issuer "https://your-domain.auth0.com/"
ultra-dex config set sso.oidc.redirectUri "https://your-ultradex-domain.com/auth/oidc/callback"
```

---

## Generic OIDC Provider

For any OpenID Connect compatible identity provider:

```bash
ultra-dex config set sso.provider oidc
ultra-dex config set sso.oidc.clientId "your-client-id"
ultra-dex config set sso.oidc.clientSecret "your-client-secret"
ultra-dex config set sso.oidc.issuer "https://your-idp.com/.well-known/openid-configuration"
ultra-dex config set sso.oidc.redirectUri "https://your-ultradex-domain.com/auth/oidc/callback"
```

### Required OIDC Scopes

Ultra-Dex requires these scopes from your OIDC provider:

- `openid` — Required for OIDC flow
- `profile` — User display name
- `email` — User email address

### Custom Claim Mapping

If your IdP uses non-standard claim names:

```json
{
  "sso": {
    "claimMapping": {
      "email": "custom_email_claim",
      "name": "custom_name_claim",
      "groups": "custom_groups_claim"
    }
  }
}
```

---

## Troubleshooting SSO

### "Invalid SAML Response"

- Verify the SAML certificate hasn't expired
- Check that the Audience URI matches exactly: `urn:ultra-dex:enterprise`
- Ensure the clock on your server is synchronized (NTP)

### "OIDC Authentication Failed"

- Verify `client_id` and `client_secret` are correct
- Check that the redirect URI exactly matches what's registered in your IdP
- Ensure the issuer URL returns a valid `.well-known/openid-configuration`

### "User Not Found After SSO"

- Verify the email claim is being returned by your IdP
- Check that the user exists in Ultra-Dex's user directory
- For auto-provisioning, enable `sso.autoProvision: true`

### "Session Expires Too Quickly"

```bash
# Increase session lifetime
ultra-dex config set auth.sessionMaxAge 86400  # 24 hours

# Enable refresh tokens
ultra-dex config set auth.refreshTokens true
```

### Debug Mode

```bash
# Enable verbose SSO logging
ULTRA_DEX_DEBUG_SSO=1 ultra-dex auth login

# Check SSO configuration
ultra-dex config get sso
```
