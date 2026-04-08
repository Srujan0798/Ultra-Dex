# Deployment Guide (Root Quick Ops)

This root guide is optimized for fast deployment and verification.  
For platform-specific depth, use `docs/DEPLOYMENT.md`.

## 1. Runtime baseline

| Requirement | Value |
| --- | --- |
| Node.js | `22.12+` (or `20.19+`) |
| npm | `10+` |
| Build artifacts | CLI + dashboard via `npm run build` |
| Optional infra | Redis (`REDIS_URL`) for distributed caching/metering paths |

## 2. Fast local/prod startup

```bash
npm install
cp .env.example .env
npm run build
npm run start:server
```

Default address: `http://localhost:3000`

## 3. Environment variable checklist

### Required (minimum)

At least one provider key:

```bash
OPENAI_API_KEY=...
# or ANTHROPIC_API_KEY / GOOGLE_API_KEY / others
```

Core runtime:

```bash
NODE_ENV=production
PORT=3000
```

### Recommended production

```bash
REDIS_URL=redis://127.0.0.1:6379
LOG_LEVEL=info
```

### If auth + billing are enabled

```bash
CLERK_SECRET_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

## 4. Post-deploy health checks

Run these checks after each deploy:

1. `GET /api/status` returns healthy payload.
2. API routes require auth where expected.
3. Billing webhook endpoint responds on `POST /api/billing/webhook`.
4. Dashboard static assets load from `apps/dashboard/dist`.
5. Logs appear in your configured monitoring stack.

## 5. Release quality gates

Before promoting a build:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

## 6. Operational references

| Need | File |
| --- | --- |
| Full deployment flows | `docs/DEPLOYMENT.md` |
| Ops procedures | `docs/OPERATIONS.md` |
| Security process | `SECURITY.md` |
| Integration dependencies | `INTEGRATIONS.md` |

## 7. Known pitfalls

- Running Node below `22.12` may trigger Vite engine warnings.
- Missing `REDIS_URL` is supported, but Redis-backed features become best-effort/fallback.
- Missing Stripe/Clerk variables will break billing/auth routes if those features are enabled.
