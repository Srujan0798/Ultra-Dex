# SaaS Starter Kit - Project Context

## Project Overview
**Name**: SaaS Starter Kit with Next.js 15
**Version**: 1.0.0
**Mode**: dev

## Current Focus
Building a comprehensive SaaS starter kit with authentication, payments, analytics, and admin dashboard. This will serve as a foundation for SaaS products with all essential features pre-built.

## Tech Stack
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js + Lucia
- **Payments**: Stripe
- **Analytics**: PostHog
- **Deployment**: Vercel
- **Email**: Resend
- **Monitoring**: Sentry

## Architecture
- **Frontend**: Next.js app with TypeScript and React Server Components
- **API**: Next.js API routes + Server Actions
- **Database**: PostgreSQL with Prisma schema
- **Authentication**: JWT-based with refresh tokens
- **Payments**: Stripe integration for subscriptions
- **Email**: Transactional emails with Resend
- **Analytics**: PostHog for product analytics

## Database Schema
```
users: id, name, email, emailVerified, image, role, createdAt, updatedAt
subscriptions: id, userId, stripeCustomerId, stripeSubscriptionId, status, plan, currentPeriodStart, currentPeriodEnd
products: id, name, description, price, interval, features
analytics: id, userId, eventName, properties, timestamp
```

## API Endpoints
- `GET /api/user` - Get current user
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/stripe/webhook` - Handle Stripe webhooks
- `GET /api/products` - Get available products
- `POST /api/subscriptions` - Create subscription
- `PUT /api/subscriptions/cancel` - Cancel subscription

## Security Considerations
- Input validation and sanitization
- SQL injection prevention via Prisma
- XSS protection with helmet.js
- Rate limiting for API endpoints
- Secure authentication with NextAuth.js
- Payment security with Stripe
- Data encryption for sensitive fields

## Performance Targets
- Page load time: < 1.5s
- API response time: < 150ms
- Bundle size: < 250KB
- Image optimization with Next.js Image
- Core Web Vitals: All green

## Last Updated
January 15, 2026

## Project Phases
1. Setup and authentication
2. Payment integration
3. Admin dashboard
4. Analytics and monitoring
5. Email system
6. Testing and deployment

## Dependencies
- next: ^15.0.0
- react: ^19.0.0
- react-dom: ^19.0.0
- prisma: ^5.0.0
- @prisma/client: ^5.0.0
- next-auth: ^4.24.0
- stripe: ^14.0.0
- resend: ^2.0.0
- posthog-js: ^1.130.0
- tailwindcss: ^3.4.0
- lucia: ^2.0.0