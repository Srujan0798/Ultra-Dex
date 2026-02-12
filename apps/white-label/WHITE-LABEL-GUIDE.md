# White-Label Guide

> **Version:** 6.0.0  
> **Last Updated:** 2026-02-12

## Overview

This guide explains how to create a white-labeled version of Ultra-Dex for your organization or product.

## Quick Start

```bash
# Clone Ultra-Dex
git clone https://github.com/Srujan0798/Ultra-Dex.git my-branded-product
cd my-branded-product

# Copy white-label template
cp -r apps/white-label/template/* .

# Customize
npm run white-label:init
```

## Branding

### 1. Logo & Visual Identity

Update these files with your branding:

```
apps/dashboard/public/
├── logo.svg              # Main logo
├── logo-dark.svg         # Dark mode logo
├── favicon.ico           # Browser icon
└── branding/
    ├── logo-192.png      # PWA icon
    ├── logo-512.png      # PWA splash
    └── social-card.png   # Social media preview
```

### 2. Colors & Theme

Edit `apps/dashboard/src/styles/theme.css`:

```css
:root {
  /* Primary Brand Colors */
  --brand-primary: #your-color;
  --brand-secondary: #your-secondary;
  --brand-accent: #your-accent;

  /* Semantic Colors */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;

  /* Dark Mode */
  --dark-bg: #0f172a;
  --dark-surface: #1e293b;
}
```

### 3. Typography

Update `apps/dashboard/src/styles/fonts.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Your+Font:wght@400;500;700&display=swap');

:root {
  --font-sans: 'Your Font', system-ui, sans-serif;
  --font-mono: 'Your Mono Font', monospace;
}
```

## Custom Domain

### 1. DNS Configuration

Point your domain to the deployment:

```
Type: CNAME
Name: app
Value: cname.vercel-dns.com (or your host)
TTL: 3600
```

### 2. Environment Configuration

Create `.env.production`:

```env
# Branding
BRAND_NAME=YourBrand
BRAND_TAGLINE="Your Tagline Here"
BRAND_DOMAIN=yourdomain.com
BRAND_SUPPORT_EMAIL=support@yourdomain.com

# Colors (optional, overrides theme.css)
BRAND_PRIMARY_COLOR=#your-color
BRAND_SECONDARY_COLOR=#your-secondary

# Legal
BRAND_COMPANY_NAME="Your Company Inc."
BRAND_LEGAL_ADDRESS="123 Main St, City, Country"
BRAND_PRIVACY_URL=https://yourdomain.com/privacy
BRAND_TERMS_URL=https://yourdomain.com/terms
```

### 3. SSL Certificate

For custom domains:

```bash
# Vercel (automatic)
vercel domains add yourdomain.com

# Manual (AWS, etc.)
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS
```

## Feature Flags

Control features via `config/white-label.json`:

```json
{
  "features": {
    "agents": {
      "architect": true,
      "coder": true,
      "reviewer": true,
      "tester": false
    },
    "providers": {
      "openai": true,
      "anthropic": true,
      "google": false,
      "custom": true
    },
    "integrations": {
      "github": true,
      "gitlab": false,
      "bitbucket": true,
      "docker": true,
      "kubernetes": false
    },
    "billing": {
      "enabled": true,
      "stripe": true,
      "paypal": false
    },
    "team": {
      "enabled": true,
      "maxMembers": 10,
      "roles": ["admin", "developer", "viewer"]
    }
  },
  "ui": {
    "showUltraDexBranding": false,
    "showPowerBy": false,
    "customFooter": true,
    "helpCenterUrl": "https://help.yourdomain.com"
  }
}
```

## Custom Agents

### 1. Define Custom Agents

Create `config/agents/custom-agents.json`:

```json
{
  "agents": [
    {
      "id": "my-custom-architect",
      "name": "Solution Architect",
      "description": "Designs enterprise solutions",
      "icon": "building-2",
      "capabilities": ["architecture", "design", "planning"],
      "systemPrompt": "You are an enterprise solution architect...",
      "defaultProvider": "openai",
      "defaultModel": "gpt-4o"
    }
  ]
}
```

### 2. Register Agents

```javascript
// apps/cli/lib/agents/custom.js
import { Agent } from '@ultra-dex/sdk';

export class CustomArchitect extends Agent {
  constructor() {
    super({
      id: 'my-custom-architect',
      name: 'Solution Architect',
      capabilities: ['architecture', 'design'],
    });
  }

  async execute(task, context) {
    // Custom implementation
    return {
      success: true,
      result: await this.generateArchitecture(task),
    };
  }
}
```

## Custom Providers

Add your own AI provider:

```javascript
// src/core/ai/providers/custom-provider.js
import { OpenAICompatibleProvider } from './openai-compatible-provider.js';

export class MyCompanyProvider extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super('mycompany', {
      apiKey: config.apiKey || process.env.MYCOMPANY_API_KEY,
      baseUrl: config.baseUrl || 'https://api.mycompany.com/v1',
      defaultModel: config.defaultModel || 'mycompany-model',
      timeoutMs: config.timeoutMs,
      extraHeaders: {
        'X-Client-ID': config.clientId,
        ...config.extraHeaders,
      },
    });
  }
}
```

## Email Templates

Customize transactional emails in `templates/emails/`:

### Welcome Email

```html
<!-- templates/emails/welcome.html -->
<!DOCTYPE html>
<html>
  <head>
    <title>Welcome to {{brand.name}}</title>
  </head>
  <body>
    <div class="header">
      <img src="{{brand.logo}}" alt="{{brand.name}}" />
    </div>
    <div class="content">
      <h1>Welcome to {{brand.name}}!</h1>
      <p>Get started with your AI-powered development.</p>
      <a href="{{cta.url}}" class="button">Get Started</a>
    </div>
    <div class="footer">
      <p>{{brand.company}} | {{brand.address}}</p>
    </div>
  </body>
</html>
```

## Legal Pages

### Required Pages

Create these in `apps/web/pages/legal/`:

1. **Privacy Policy** (`privacy.md`)
2. **Terms of Service** (`terms.md`)
3. **Cookie Policy** (`cookies.md`)
4. **GDPR Compliance** (`gdpr.md`)

### Template Variables

Use these variables in legal documents:

```markdown
---
company: { { brand.company } }
domain: { { brand.domain } }
updated: { { date } }
---

# Privacy Policy

{{brand.company}} ("we", "us", "our") operates {{brand.domain}}...
```

## Deployment

### Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel --prod

# 3. Add custom domain
vercel domains add yourdomain.com
```

### Docker

```dockerfile
# Dockerfile.white-label
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps
RUN npm run build:custom
ENV BRAND_NAME=YourBrand
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -f Dockerfile.white-label -t my-branded-app .
docker run -p 3000:3000 my-branded-app
```

### AWS

```bash
# Deploy to ECS
aws ecs create-service \
  --cluster ultra-dex \
  --service-name my-branded-app \
  --task-definition ultra-dex:1 \
  --desired-count 2
```

## Multi-Tenant Setup

For SaaS white-label offerings:

```javascript
// src/core/multi-tenant/index.js
export class TenantManager {
  async getTenantConfig(tenantId) {
    return {
      id: tenantId,
      branding: await this.getBranding(tenantId),
      features: await this.getFeatures(tenantId),
      limits: await this.getLimits(tenantId),
    };
  }

  async resolveTenant(request) {
    // By subdomain: tenant.yourdomain.com
    const subdomain = request.headers.host.split('.')[0];

    // By header: X-Tenant-ID
    const headerId = request.headers['x-tenant-id'];

    // By path: /t/tenant-id/
    const pathMatch = request.path.match(/\/t\/([^\/]+)/);

    return this.getTenantConfig(subdomain || headerId || pathMatch?.[1]);
  }
}
```

## Custom CLI

Create a branded CLI wrapper:

```javascript
#!/usr/bin/env node
// bin/mybrand.js

import { UltraDexCLI } from '@ultra-dex/cli';

const cli = new UltraDexCLI({
  brand: {
    name: 'MyBrand',
    command: 'mybrand',
    description: 'MyBrand AI Development Platform',
  },
  features: {
    'my-custom-command': './commands/custom.js',
  },
});

cli.run();
```

```json
{
  "name": "mybrand-cli",
  "bin": {
    "mybrand": "./bin/mybrand.js"
  }
}
```

## Testing

### Branding Tests

```javascript
// tests/white-label/branding.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('White-Label Branding', () => {
  it('should use custom logo', async () => {
    const response = await fetch('/logo.svg');
    assert.strictEqual(response.status, 200);
  });

  it('should apply custom colors', async () => {
    const styles = await fetch('/styles/theme.css');
    const css = await styles.text();
    assert.ok(css.includes('--brand-primary: #your-color'));
  });

  it('should show custom brand name', async () => {
    const response = await fetch('/');
    const html = await response.text();
    assert.ok(html.includes('YourBrand'));
  });
});
```

## Checklist

Before launching your white-label product:

- [ ] Logo uploaded and displayed correctly
- [ ] Colors match brand guidelines
- [ ] Typography using brand fonts
- [ ] Custom domain configured and SSL working
- [ ] Feature flags set correctly
- [ ] Legal pages published
- [ ] Email templates customized
- [ ] Support contact information updated
- [ ] Help center/knowledge base linked
- [ ] Analytics tracking implemented
- [ ] Multi-tenant isolation tested (if applicable)
- [ ] Performance benchmarks met
- [ ] Security audit passed

## Support

For white-label implementation support:

- Documentation: https://docs.ultra-dex.ai/white-label
- Enterprise Support: enterprise@ultra-dex.ai
- Community: https://community.ultra-dex.ai

---

**Note:** White-label licensing may require an Enterprise agreement. Contact sales@ultra-dex.ai for details.
