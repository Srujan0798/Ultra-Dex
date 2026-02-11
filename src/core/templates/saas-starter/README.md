# SaaS Starter (Next.js 15)

A production-ready SaaS starter for Ultra-Dex templates.

## Features

- Next.js 15 App Router
- Prisma + PostgreSQL
- NextAuth authentication
- Stripe checkout integration
- Tailwind + shadcn/ui starter

## Usage

```
ultra-dex template saas-starter
```

## Notes

- Configure `.env` with `DATABASE_URL`, `NEXTAUTH_SECRET`, `STRIPE_SECRET_KEY`.
- `app/api/stripe/checkout/route.ts` includes a basic checkout flow.
