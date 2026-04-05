# NPM Token Setup Guide

## Creating an NPM Access Token

1. Log in to npm: `npm login`
2. Create a token: `npm token create --read-only`
3. Copy the generated token (starts with `npm_`)

## Setting Up for CI/CD

### GitHub Actions
```yaml
env:
  NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Add `NPM_TOKEN` as a repository secret in GitHub Settings → Secrets → Actions.

### Local Publishing
```bash
export NPM_TOKEN=npm_xxxxxxxxxxxx
npm publish
```

### Using .npmrc
```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

## Token Permissions
- **Read-only**: Can install private packages
- **Publish**: Required for `npm publish`
- **Automation**: Recommended for CI/CD (no 2FA required)

## Rotating Tokens
```bash
npm token revoke <token>
npm token create --read-only
```
