# Ultra-Dex v6.0.0 Cloud

Hosted SaaS dashboard for Ultra-Dex.

## Features

- Next.js dashboard UI
- Team management (invites, roles)
- Stripe billing integration
- Usage metrics dashboard
- API key management

## Local Development

```bash
cd cloud
npm install
npm run dev
```

## Deploy to Vercel

```bash
cd cloud
vercel deploy
```

Set the following environment variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`
