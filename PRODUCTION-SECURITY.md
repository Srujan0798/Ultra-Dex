# Ultra-Dex Production Security & Deployment Guide

## Overview

This document covers security hardening and production deployment for Ultra-Dex. Competing with YC-funded startups requires enterprise-grade security and reliability.

---

## Critical Security Fixes Applied

### 1. Command Injection Vulnerabilities ✅ FIXED

**Issue:** Self-healing.js used `execSync` with user-controlled input from regex matches.

**Before:**

```javascript
// VULNERABLE - Shell injection possible
execSync(`chmod +x "${fileMatch[1]}"`);
execSync(`lsof -ti:${portMatch[1]} | xargs kill -9`);
```

**After:**

- Path validation before file operations
- Port number validation (0-65535)
- Use of `execFileSync` instead of `execSync` to avoid shell interpretation

### 2. SSL Verification Bypass ✅ REMOVED

**Issue:** Self-healing rule disabled SSL verification globally.

**Before:**

```javascript
case 'disable-ssl-verification':
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```

**After:**

```javascript
case 'disable-ssl-verification': {
  // SECURITY: Never disable SSL verification in production
  console.error('[SelfHealing] SSL verification cannot be disabled');
  return { applied: false, error: 'Not allowed' };
}
```

### 3. Hardcoded Password ✅ FIXED

**Issue:** SSO temp password was hardcoded.

**Before:**

```javascript
password: 'sso_temp_password',
```

**After:**

```javascript
// Generate cryptographically secure random password
function generateSecurePassword() {
  return randomBytes(32).toString('base64');
}
const secureTempPassword = generateSecurePassword();
```

### 4. Insecure Random Number Generation ✅ FIXED

**Issue:** `Math.random()` used for security-sensitive lock IDs.

**Before:**

```javascript
const lockId = Math.random().toString(36).slice(2, 15);
```

**After:**

```javascript
import { randomBytes } from 'crypto';
const lockId = randomBytes(16).toString('hex');
```

### 5. Empty Catch Blocks ✅ FIXED

**Issue:** 7+ files had empty catch blocks swallowing errors.

**Files Fixed:**

- `apps/cli/lib/ui/components/Thinking.js`
- `apps/cli/lib/ui/components/Shimmer.js`
- `apps/cli/lib/ui/components/LoadingSpinner.js`
- `apps/cli/lib/ui/components/icons.js`
- `apps/cli/lib/ui/components/FileSelector.js`
- `apps/cli/lib/ui/components/CollapsibleDiff.js`
- `apps/cli/lib/ui/components/ArrowMenu.js`

---

## Production Network Security

### HTTP Client with Timeout & Retry

**File:** `src/core/utils/network.ts`

```typescript
import { fetchWithRetry, CircuitBreaker } from './network.js';

// Automatic timeout (30s default), retry with exponential backoff
const response = await fetchWithRetry(
  'https://api.example.com',
  {
    timeout: 30000,
  },
  3,
  400
);

// Circuit breaker for external APIs
const breaker = new CircuitBreaker(5, 60000);
const result = await breaker.execute(() => fetchExternalAPI());
```

Features:

- ✅ Request timeout with AbortController
- ✅ Exponential backoff (400ms, 800ms, 1600ms)
- ✅ Circuit breaker pattern
- ✅ Automatic retry with logging

---

## Required Environment Variables

### Critical (Must be set in production)

```bash
# JWT Secret (generate with: openssl rand -base64 64)
JWT_SECRET="your-64-char-secret-here"

# Database (PostgreSQL recommended for production)
DATABASE_URL="postgresql://user:pass@localhost:5432/ultra-dex"
REDIS_URL="redis://localhost:6379"

# AI Provider Keys (at least one required)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_API_KEY="..."

# Audit & Compliance
AUDIT_LOG_LEVEL="info"
AUDIT_RETENTION_DAYS="90"
```

### Security Headers

```bash
# Never disable in production
NODE_TLS_REJECT_UNAUTHORIZED="1"

# Content Security Policy
ULTRA_DEX_CSP="default-src 'self'; script-src 'self' 'unsafe-inline'"
```

---

## Production Checklist

### Pre-Deployment

- [ ] All secrets stored in environment variables (not in code)
- [ ] JWT secret is 64+ characters, cryptographically random
- [ ] Database uses SSL/TLS connections
- [ ] Redis uses authentication and SSL
- [ ] API keys have minimal required permissions
- [ ] Rate limiting enabled
- [ ] Audit logging configured

### Runtime Security

- [ ] Process runs as non-root user
- [ ] File system permissions are restrictive (644 for files, 755 for dirs)
- [ ] Network egress restricted to required endpoints only
- [ ] Container security scanning performed
- [ ] Dependency vulnerabilities checked (`npm audit`)

### Monitoring

- [ ] Structured logging enabled (JSON format)
- [ ] Error tracking integrated (Sentry/DataDog)
- [ ] Metrics exposed for Prometheus
- [ ] Health check endpoint configured
- [ ] Alerting rules for critical errors

---

## Security Best Practices

### Input Validation

```typescript
// Always validate user input
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']),
});

const result = userSchema.safeParse(userInput);
if (!result.success) {
  throw new ValidationError(result.error);
}
```

### SQL Injection Prevention

```typescript
// Use parameterized queries
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// NEVER concatenate strings
// ❌ const query = `SELECT * FROM users WHERE id = ${userId}`;
```

### Path Traversal Prevention

```typescript
import path from 'path';

function sanitizePath(userInput: string): string {
  const normalized = path.normalize(userInput);
  if (normalized.includes('..')) {
    throw new SecurityError('Invalid path');
  }
  return normalized;
}
```

---

## Deployment Configuration

### Docker

```dockerfile
FROM node:20-alpine

# Security: Run as non-root
USER node

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY --chown=node:node . .

# Security: Don't run as root
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "apps/cli/bin/ultra-dex.js", "serve"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  ultra-dex:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:5432/ultra-dex
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ultra-dex
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ultra-dex
  template:
    metadata:
      labels:
        app: ultra-dex
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
        - name: ultra-dex
          image: ultra-dex:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: 'production'
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: ultra-dex-secrets
                  key: jwt-secret
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
```

---

## Security Incident Response

### If You Suspect a Breach

1. **Immediate**
   - Revoke all active sessions
   - Rotate JWT secrets
   - Disable external integrations

2. **Investigation**
   - Review audit logs (`~/.ultra-dex/audit/`)
   - Check for unauthorized plugin installations
   - Scan for malicious file uploads

3. **Recovery**
   - Restore from known-good backup
   - Re-scan all dependencies
   - Re-enable services gradually

---

## Compliance

### SOC 2 Requirements

Ultra-Dex audit module provides:

- ✅ Immutable audit logs (append-only)
- ✅ Structured event logging
- ✅ Export to SOC2 format
- ✅ Retention policies (90 days active, 365 archive)
- ✅ Access control logging

### GDPR

- Data retention policies configurable
- Personal data encryption at rest
- Right to deletion supported
- Data export functionality

---

## Testing Security

```bash
# Run security-focused tests
npm test -- tests/security/

# Check for vulnerabilities
npm audit

# Static analysis
npm run lint:security

# Dependency check
npm outdated
```

---

## Contact & Support

For security issues:

- Email: security@ultra-dex.ai
- Do not disclose publicly until patched

---

_Last Updated: 2026-04-12_
_Version: 5.0.0_
