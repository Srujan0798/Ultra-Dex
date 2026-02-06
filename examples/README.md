# Ultra-Dex Examples Repository

Complete, production-ready example applications built with Ultra-Dex methodology.

## Available Examples

### 1. E-Commerce Store 🛍️

**Tech Stack:** Next.js + Stripe + PostgreSQL

Full e-commerce platform with:

- Product catalog with search
- Shopping cart & checkout
- Stripe payments
- Order management
- Admin dashboard

[View Example](./ecommerce-store/)

```bash
cd ecommerce-store
npm install
npm run dev
```

### 2. SaaS Analytics 📊

**Tech Stack:** Next.js + ClickHouse + Redis

Real-time analytics platform with:

- Event tracking SDK
- Live dashboard
- SQL query interface
- Funnel analysis
- Revenue tracking

[View Example](./saas-analytics/)

```bash
cd saas-analytics
npm install
npm run dev
```

### 3. Real-Time Chat 💬

**Tech Stack:** Next.js + Socket.io + PostgreSQL

Team chat application with:

- WebSocket messaging
- Presence indicators
- Typing indicators
- File sharing
- Emoji reactions

[View Example](./realtime-chat/)

```bash
cd realtime-chat
npm install
npm run dev
```

## Using These Examples

### As Templates

All examples use the **Ultra-Dex LITE template** (12 sections) for quick iteration:

```bash
# Clone an example as your starting point
git clone https://github.com/Srujan0798/ultra-dex-examples.git
cp -r ultra-dex-examples/ecommerce-store my-store

# Customize it
cd my-store
# Edit README.md with your idea
# Run Ultra-Dex
npx ultra-dex init
```

### With Ultra-Dex Agents

Each example includes Ultra-Dex integration:

```bash
# Run planner agent
npx ultra-dex run planner "Customize this e-commerce for digital products"

# Start swarm for specific feature
npx ultra-dex swarm "Add subscription billing to checkout"

# Check alignment weekly
npx ultra-dex align
```

### Learning Path

1. **Start with E-Commerce** (Simplest)
   - Learn basic CRUD
   - Payment integration
   - Database design

2. **Try Analytics** (Intermediate)
   - Time-series data
   - Real-time updates
   - SDK design

3. **Build Chat** (Advanced)
   - WebSocket architecture
   - Horizontal scaling
   - Presence management

## Common Patterns

### Authentication (All Examples)

```typescript
// Using NextAuth.js or Clerk
import { auth } from '@clerk/nextjs';

export default async function Dashboard() {
  const { userId } = auth();
  if (!userId) return redirect('/sign-in');
  // ...
}
```

### Database (All Examples)

```typescript
// Using Prisma
import { prisma } from '@/lib/db';

// Type-safe queries
const products = await prisma.product.findMany({
  where: { status: 'active' },
  include: { variants: true },
});
```

### API Routes (All Examples)

```typescript
// Using Next.js App Router
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const data = await fetchData();
  return NextResponse.json(data);
}
```

## Deployment

All examples are configured for:

- **Vercel** (Frontend)
- **Railway** or **Render** (Backend + Database)
- **Supabase** (PostgreSQL)
- **Upstash** (Redis)

See individual example READMEs for deployment instructions.

## Contributing

Want to add an example?

1. Fork this repository
2. Create a new directory with your example
3. Include README.md with Ultra-Dex LITE template
4. Submit a PR

Example categories we're looking for:

- AI/ML application
- Mobile app (React Native)
- DevOps tool
- Browser extension
- Desktop app (Electron)

## Resources

- [Ultra-Dex Documentation](https://github.com/Srujan0798/Ultra-Dex)
- [LITE Template](./lite-template.md)
- [Contributing Guide](../../CONTRIBUTING.md)

## License

All examples are MIT licensed.
