# Integrations Guide (Root Summary)

This file gives a high-density integration map across auth, billing, providers, telemetry, and plugin surfaces.

## Integration matrix

| Domain | Status | Key env vars | Main code paths |
| --- | --- | --- | --- |
| AI providers | Active | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, etc. | `src/services/ai-providers/`, `src/core/ai/` |
| Auth (Clerk) | Active | `CLERK_SECRET_KEY` | `src/core/auth/`, `src/core/server/production-server.ts` |
| Billing (Stripe) | Active | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | `src/core/billing/`, `/api/billing/webhook` |
| Usage metering | Active | `REDIS_URL` (recommended) | `src/core/billing/usage-meter.ts`, `src/core/ai/ai-meta-layer.ts` |
| Observability | Active | Better Stack / Sentry / PostHog vars | `src/core/monitoring/` |
| MCP / plugins | Active | Feature-specific | `src/core/mcp/`, `src/core/marketplace/` |
| Dashboard/API | Active | `PORT`, CORS-related vars | `apps/dashboard/`, `src/core/server/` |

## Billing + metering flow

1. Authenticated request enters protected route.
2. Plan and usage limits are checked.
3. AI call executes through provider layer.
4. Usage counters are updated (requests/tokens).
5. Stripe webhook events update plan state and usage lifecycle.

Core billing files:

- `src/core/billing/pricing-tiers.ts`
- `src/core/billing/usage-meter.ts`
- `src/core/billing/webhook-handler.ts`
- `src/core/billing/billing-service.ts`

## External service requirements

### Must-have for full production billing/auth

```bash
CLERK_SECRET_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

### Recommended for robust scale behavior

```bash
REDIS_URL=redis://127.0.0.1:6379
```

## Integration validation checklist

- Provider call works with configured API key.
- Authenticated endpoint rejects unauthenticated traffic.
- Stripe webhook signature verification passes with valid signature.
- Usage limits return expected 429 behavior on exceed.
- Logs/telemetry appear in configured sinks.

## Canonical deeper docs

| Topic | File |
| --- | --- |
| Integration history and notes | `docs/INTEGRATION-LOG.md` |
| Agent integration patterns | `docs/AGENT_INTEGRATION_GUIDE.md` |
| Provider contract/spec | `docs/specs/PROVIDER-SPEC.md` |
| Deployment dependencies | `docs/DEPLOYMENT.md` |
