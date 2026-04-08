# Deployment Quick Guide

This root file is the compact deployment entrypoint.  
For full details, use `docs/DEPLOYMENT.md`.

## 1) Runtime requirements

- Node.js `22.12+` (or `20.19+` for Vite compatibility)
- npm `10+`
- Optional for scale: Redis (`REDIS_URL`)

## 2) Build and run

```bash
npm install
npm run build
npm run start:server
```

Server default: `http://localhost:3000`

## 3) Minimum environment variables

At least one AI provider key:

```bash
OPENAI_API_KEY=...
# or ANTHROPIC_API_KEY=..., GOOGLE_API_KEY=..., etc.
```

Core production settings:

```bash
NODE_ENV=production
PORT=3000
REDIS_URL=redis://127.0.0.1:6379
```

If using auth/billing:

```bash
CLERK_SECRET_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

## 4) Verify deployment

- `GET /api/status` returns healthy response
- Billing webhook endpoint reachable: `POST /api/billing/webhook`
- Dashboard assets serve correctly from `apps/dashboard/dist`

## 5) Canonical deployment docs

- `docs/DEPLOYMENT.md` — full deployment guide
- `docs/OPERATIONS.md` — operations, monitoring, maintenance
- `SECURITY.md` — security and disclosure policy

## Historical deployment docs

Previous long-form deployment notes are archived in:

`docs/internal/archive/root-status/`
