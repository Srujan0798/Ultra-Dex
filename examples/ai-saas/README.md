# AI SaaS Starter

A modern, production-ready AI SaaS template built with Next.js 14, TypeScript, Tailwind CSS, Prisma, and Stripe.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.7-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Stripe](https://img.shields.io/badge/Stripe-Latest-635BFF?style=flat-square&logo=stripe)](https://stripe.com/)

## Features

- **Authentication**: NextAuth.js with email/password and OAuth (Google, GitHub)
- **AI Integration**: OpenAI GPT-4/3.5 with streaming responses
- **Payments**: Stripe subscription billing with credit-based usage
- **Database**: PostgreSQL with Prisma ORM
- **UI Components**: Modern design with shadcn/ui and Tailwind CSS
- **Type Safety**: Full TypeScript support
- **Dark Mode**: Built-in theme switching
- **Rate Limiting**: API protection with Redis
- **Responsive**: Mobile-first design

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or cloud)
- OpenAI API key
- Stripe account (for payments)

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-saas-starter.git
cd ai-saas-starter

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your values
# Required: DATABASE_URL, NEXTAUTH_SECRET, OPENAI_API_KEY
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed database with sample data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── api/               # API routes
│   │   ├── (auth)/            # Auth group (login, register)
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── page.tsx           # Landing page
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── auth/             # Auth components
│   │   ├── dashboard/        # Dashboard components
│   │   └── chat/             # Chat components
│   ├── lib/
│   │   ├── auth.ts           # Auth configuration
│   │   ├── prisma.ts         # Database client
│   │   ├── stripe.ts         # Stripe configuration
│   │   ├── openai.ts         # OpenAI configuration
│   │   └── utils.ts          # Utility functions
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript types
│   └── styles/               # Global styles
├── prisma/
│   └── schema.prisma         # Database schema
├── public/                   # Static assets
└── docs/                     # Documentation
```

## Configuration

### Authentication

Configure NextAuth.js in `src/lib/auth.ts`:
- Email/password authentication (default)
- Google OAuth
- GitHub OAuth

### AI Integration

Set up OpenAI in `src/lib/openai.ts`:
- GPT-4 / GPT-3.5-turbo
- Customizable model parameters
- Streaming responses
- Usage tracking

### Payments

Configure Stripe in `src/lib/stripe.ts`:
- Subscription plans
- Credit-based billing
- Webhook handling

### Database

Update schema in `prisma/schema.prisma`:
- User management
- Credit tracking
- Conversation history
- Subscription management

## Customization

### Branding

1. Update `public/logo.svg` with your logo
2. Modify brand colors in `tailwind.config.ts`
3. Update metadata in `src/app/layout.tsx`
4. Edit landing page content in `src/app/page.tsx`

### Pricing Plans

Edit pricing in `src/lib/stripe.ts` and `src/app/pricing/page.tsx`:

```typescript
export const PLANS = [
  {
    name: 'Basic',
    price: 9,
    credits: 100,
    stripePriceId: process.env.STRIPE_PRICE_ID_BASIC,
  },
  // Add more plans...
];
```

### AI Prompts

Customize prompts in `src/lib/prompts.ts`:

```typescript
export const SYSTEM_PROMPTS = {
  default: 'You are a helpful AI assistant...',
  custom: 'Your custom prompt here...',
};
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Don't forget to:
1. Add environment variables in Vercel dashboard
2. Set up production database
3. Configure Stripe webhooks for production URL

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Railway
- Render
- AWS
- DigitalOcean

## API Routes

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `POST /api/auth/register` - Register new user

### AI
- `POST /api/chat` - Send message to AI (streaming)
- `GET /api/conversations` - Get conversation history
- `DELETE /api/conversations/:id` - Delete conversation

### Billing
- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/portal` - Create customer portal
- `POST /api/stripe/webhook` - Handle Stripe webhooks

### User
- `GET /api/user/credits` - Get credit balance
- `GET /api/user/usage` - Get usage statistics
- `PATCH /api/user/profile` - Update profile

## Database Schema

### User
- id, email, name, image
- credits balance
- subscription status
- created/updated timestamps

### Account (NextAuth)
- OAuth provider accounts

### Session (NextAuth)
- User sessions

### Conversation
- Chat sessions
- Associated messages

### Message
- Individual chat messages
- Role (user/assistant)
- Token usage

### CreditTransaction
- Credit purchases and usage
- Transaction history

### Subscription (Stripe)
- Stripe subscription details
- Payment status

## Security

- Authentication via NextAuth.js
- Database queries protected by Prisma
- API rate limiting
- Input validation with Zod
- CSRF protection
- Secure environment variables

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Development Commands

```bash
# Development
npm run dev              # Start development server

# Database
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format with Prettier
npm run type-check       # TypeScript check

# Testing
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests
```

## Troubleshooting

### Database Connection Issues
```bash
# Verify database URL format
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public

# Test connection
npx prisma db execute --stdin <<< "SELECT 1"
```

### Stripe Webhook Issues
```bash
# Use Stripe CLI for local testing
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Build Errors
```bash
# Clear cache
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

## License

MIT License - feel free to use this template for commercial and personal projects.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](../../issues)
- 💬 [Discussions](../../discussions)

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Prisma](https://www.prisma.io/) - Database ORM
- [Stripe](https://stripe.com/) - Payment processing
- [OpenAI](https://openai.com/) - AI API

---

Built with ❤️ by the AI SaaS Starter team
