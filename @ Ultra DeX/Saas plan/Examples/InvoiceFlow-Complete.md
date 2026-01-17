# InvoiceFlow - Complete Implementation Plan

> **What is this?** A fully filled Ultra-Dex example for an invoicing SaaS.
> **Purpose:** Show the template works for B2B/financial SaaS.
> **SaaS:** InvoiceFlow - Professional invoicing for freelancers and small businesses.

---

# SECTION 1: PRODUCT DEFINITION

## 1.1 Product Overview

**Product Name:** InvoiceFlow
**Tagline:** "Get paid faster. Look professional."
**One-liner:** A simple invoicing app for freelancers with automatic reminders, payment tracking, and beautiful PDF invoices.

**Problem Statement:**
Freelancers and small businesses struggle with invoicing because:
1. Manual invoicing in Word/Google Docs is slow and unprofessional
2. Enterprise tools (QuickBooks, FreshBooks) are expensive and complex
3. Chasing payments manually is awkward and time-consuming

**Solution:**
InvoiceFlow provides:
- Create professional invoices in 60 seconds
- Automatic payment reminders (no awkward follow-ups)
- Accept online payments (Stripe integration)
- Beautiful, branded PDF invoices
- Simple dashboard to track who owes you money

**Target Audience:**
- Primary: Freelancers (designers, developers, consultants)
- Secondary: Small agencies (2-10 people)
- Tertiary: Small businesses with simple invoicing needs

## 1.2 Core Features (MVP)

| Feature | Priority | Complexity | User Value |
|---------|----------|------------|------------|
| User Authentication | P0 | Medium | Critical |
| Create/Edit Invoices | P0 | Medium | Critical |
| Client Management | P0 | Low | High |
| PDF Generation | P0 | Medium | High |
| Email Invoices | P0 | Medium | High |
| Online Payments (Stripe) | P0 | High | Critical |
| Automatic Reminders | P1 | Medium | High |
| Dashboard/Reports | P1 | Medium | Medium |
| Recurring Invoices | P2 | Medium | Medium |
| Multi-currency | P2 | Medium | Medium |

## 1.3 Success Metrics

| Metric | Target (Month 1) | Target (Month 6) | Target (Year 1) |
|--------|------------------|------------------|-----------------|
| Registered Users | 200 | 2,000 | 15,000 |
| Paid Users | 10 | 150 | 1,500 |
| MRR | $150 | $2,250 | $22,500 |
| Invoices Created | 500 | 10,000 | 100,000 |
| Payment Volume | $10K | $200K | $2M |

---

# SECTION 2: TECH STACK

## 2.1 Frontend Stack

| Layer | Technology | Version | Justification |
|-------|------------|---------|---------------|
| Framework | Next.js | 14.x | App Router, Server Actions |
| Language | TypeScript | 5.3+ | Type safety |
| Styling | Tailwind CSS | 3.4+ | Rapid UI development |
| UI Components | shadcn/ui | Latest | Accessible, customizable |
| Forms | React Hook Form + Zod | 7.x + 3.x | Type-safe validation |
| PDF | @react-pdf/renderer | Latest | Generate PDFs in React |
| Charts | Recharts | 2.x | Dashboard visualizations |

## 2.2 Backend Stack

| Layer | Technology | Version | Justification |
|-------|------------|---------|---------------|
| Runtime | Node.js | 20 LTS | Stable, wide ecosystem |
| Framework | Next.js API Routes | 14.x | Unified codebase |
| Database | PostgreSQL | 16 | ACID, reliable |
| ORM | Prisma | 5.x | Type-safe queries |
| Email | Resend | Latest | Good deliverability |
| Payments | Stripe | Latest | Industry standard |
| PDF Storage | Cloudflare R2 | N/A | S3-compatible, cheap |
| Auth | NextAuth.js | 5.x | Built for Next.js |
| Background Jobs | Trigger.dev | Latest | Serverless cron/jobs |

## 2.3 Infrastructure Costs

| Component | Provider | Plan | Monthly Cost |
|-----------|----------|------|--------------|
| Hosting | Vercel | Pro | $20 |
| Database | Neon | Launch | $19 |
| Email | Resend | Pro (10k/month) | $20 |
| PDF Storage | Cloudflare R2 | Pay-as-you-go | ~$5 |
| Background Jobs | Trigger.dev | Hobby | $0 |
| Monitoring | Sentry | Team | $26 |

**Total MVP Cost: ~$90/month**

---

# SECTION 3: DATABASE SCHEMA

## 3.1 Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      User       │────<│     Invoice     │>────│     Client      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ email           │     │ userId (FK)     │     │ userId (FK)     │
│ name            │     │ clientId (FK)   │     │ name            │
│ businessName    │     │ number          │     │ email           │
│ businessLogo    │     │ status          │     │ company         │
│ address         │     │ issueDate       │     │ address         │
│ taxId           │     │ dueDate         │     │ taxId           │
│ stripeAccountId │     │ subtotal        │     │ notes           │
│ plan            │     │ tax             │     │ createdAt       │
│ createdAt       │     │ total           │     └─────────────────┘
└─────────────────┘     │ currency        │
                        │ notes           │
                        │ pdfUrl          │
                        │ stripePaymentId │
                        │ paidAt          │
                        │ createdAt       │
                        └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │  InvoiceItem    │
                        ├─────────────────┤
                        │ id (PK)         │
                        │ invoiceId (FK)  │
                        │ description     │
                        │ quantity        │
                        │ unitPrice       │
                        │ total           │
                        └─────────────────┘
```

## 3.2 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String?
  businessName    String?
  businessLogo    String?
  address         String?
  taxId           String?
  stripeAccountId String?   @unique
  plan            Plan      @default(FREE)
  invoicePrefix   String    @default("INV")
  nextInvoiceNum  Int       @default(1)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  accounts Account[]
  sessions Session[]
  clients  Client[]
  invoices Invoice[]

  @@map("users")
}

enum Plan {
  FREE      // 5 invoices/month
  PRO       // Unlimited
  BUSINESS  // + Team features
}

model Client {
  id        String   @id @default(cuid())
  userId    String
  name      String
  email     String
  company   String?
  address   String?
  taxId     String?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  invoices Invoice[]

  @@unique([userId, email])
  @@map("clients")
}

model Invoice {
  id              String        @id @default(cuid())
  userId          String
  clientId        String
  number          String
  status          InvoiceStatus @default(DRAFT)
  issueDate       DateTime      @default(now())
  dueDate         DateTime
  subtotal        Decimal       @db.Decimal(10, 2)
  taxRate         Decimal       @default(0) @db.Decimal(5, 2)
  tax             Decimal       @db.Decimal(10, 2)
  total           Decimal       @db.Decimal(10, 2)
  currency        String        @default("USD")
  notes           String?
  pdfUrl          String?
  stripePaymentId String?
  paymentLink     String?
  paidAt          DateTime?
  sentAt          DateTime?
  viewedAt        DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  client    Client        @relation(fields: [clientId], references: [id])
  items     InvoiceItem[]
  reminders Reminder[]

  @@unique([userId, number])
  @@index([userId, status])
  @@index([clientId])
  @@map("invoices")
}

enum InvoiceStatus {
  DRAFT
  SENT
  VIEWED
  PAID
  OVERDUE
  CANCELLED
}

model InvoiceItem {
  id          String  @id @default(cuid())
  invoiceId   String
  description String
  quantity    Decimal @db.Decimal(10, 2)
  unitPrice   Decimal @db.Decimal(10, 2)
  total       Decimal @db.Decimal(10, 2)

  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@map("invoice_items")
}

model Reminder {
  id        String   @id @default(cuid())
  invoiceId String
  sentAt    DateTime @default(now())
  type      String   // 'due_soon', 'overdue', 'follow_up'

  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@map("reminders")
}

// NextAuth models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}
```

---

# SECTION 4: API DESIGN

## 4.1 API Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/clients | List clients | Yes |
| POST | /api/clients | Create client | Yes |
| GET | /api/clients/[id] | Get client | Yes |
| PATCH | /api/clients/[id] | Update client | Yes |
| DELETE | /api/clients/[id] | Delete client | Yes |
| GET | /api/invoices | List invoices | Yes |
| POST | /api/invoices | Create invoice | Yes |
| GET | /api/invoices/[id] | Get invoice | Yes |
| PATCH | /api/invoices/[id] | Update invoice | Yes |
| DELETE | /api/invoices/[id] | Delete invoice | Yes |
| POST | /api/invoices/[id]/send | Send invoice email | Yes |
| POST | /api/invoices/[id]/pdf | Generate PDF | Yes |
| GET | /api/invoices/[id]/pay | Payment page (public) | No |
| POST | /api/invoices/[id]/mark-paid | Mark as paid | Yes |
| GET | /api/dashboard | Dashboard stats | Yes |
| POST | /api/stripe/connect | Connect Stripe | Yes |
| POST | /api/webhooks/stripe | Stripe webhooks | No |

## 4.2 Request/Response Examples

### Create Invoice

**Request:**
```http
POST /api/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "clientId": "client_abc123",
  "dueDate": "2024-02-28",
  "items": [
    {
      "description": "Website Design",
      "quantity": 1,
      "unitPrice": 2500.00
    },
    {
      "description": "Development (40 hours)",
      "quantity": 40,
      "unitPrice": 150.00
    }
  ],
  "taxRate": 10,
  "notes": "Payment due within 14 days. Thank you for your business!"
}
```

**Response (201 Created):**
```json
{
  "id": "inv_xyz789",
  "number": "INV-0001",
  "status": "DRAFT",
  "client": {
    "id": "client_abc123",
    "name": "Acme Corp",
    "email": "billing@acme.com"
  },
  "issueDate": "2024-02-14",
  "dueDate": "2024-02-28",
  "items": [
    {
      "description": "Website Design",
      "quantity": 1,
      "unitPrice": 2500.00,
      "total": 2500.00
    },
    {
      "description": "Development (40 hours)",
      "quantity": 40,
      "unitPrice": 150.00,
      "total": 6000.00
    }
  ],
  "subtotal": 8500.00,
  "taxRate": 10,
  "tax": 850.00,
  "total": 9350.00,
  "currency": "USD",
  "paymentLink": null,
  "pdfUrl": null
}
```

---

# SECTION 5: AUTHENTICATION

## 5.1 Auth Flow

- **Providers:** Google OAuth, Magic Link Email
- **Session:** JWT stored in HTTP-only cookies
- **Onboarding:** After signup, prompt for business details

## 5.2 Stripe Connect

For receiving payments, users connect their Stripe account:

```typescript
// app/api/stripe/connect/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user?.stripeAccountId) {
    // Already connected, return dashboard link
    const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId);
    return NextResponse.json({ url: loginLink.url });
  }

  // Create new Connect account
  const account = await stripe.accounts.create({
    type: 'express',
    email: session.user.email!,
    capabilities: {
      transfers: { requested: true },
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { stripeAccountId: account.id },
  });

  // Create onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/payments?refresh=true`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/payments?success=true`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: accountLink.url });
}
```

---

# SECTION 6: FRONTEND ARCHITECTURE

## 6.1 Directory Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── invoices/
│   │   │   ├── page.tsx          # List
│   │   │   ├── new/page.tsx      # Create
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # View
│   │   │       └── edit/page.tsx # Edit
│   │   ├── clients/
│   │   └── settings/
│   ├── pay/[invoiceId]/          # Public payment page
│   └── api/
├── components/
│   ├── ui/                       # shadcn
│   ├── invoices/
│   │   ├── invoice-form.tsx
│   │   ├── invoice-preview.tsx
│   │   └── invoice-pdf.tsx
│   └── dashboard/
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   └── stripe.ts
└── types/
```

## 6.2 Invoice Form Component

```typescript
// components/invoices/invoice-form.tsx

'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ClientSelect } from './client-select';

const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(0.01),
    unitPrice: z.number().min(0),
  })).min(1, 'At least one item is required'),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export function InvoiceForm({ onSubmit, defaultValues }: {
  onSubmit: (data: InvoiceFormData) => void;
  defaultValues?: Partial<InvoiceFormData>;
}) {
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      taxRate: 0,
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchItems = form.watch('items');
  const watchTaxRate = form.watch('taxRate');

  const subtotal = watchItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );
  const tax = subtotal * (watchTaxRate / 100);
  const total = subtotal + tax;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <ClientSelect
        value={form.watch('clientId')}
        onChange={(value) => form.setValue('clientId', value)}
        error={form.formState.errors.clientId?.message}
      />

      <div>
        <label className="text-sm font-medium">Due Date</label>
        <Input type="date" {...form.register('dueDate')} />
      </div>

      <div className="space-y-4">
        <label className="text-sm font-medium">Line Items</label>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-4 items-start">
            <Input
              placeholder="Description"
              className="flex-1"
              {...form.register(`items.${index}.description`)}
            />
            <Input
              type="number"
              placeholder="Qty"
              className="w-20"
              {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
            />
            <Input
              type="number"
              placeholder="Price"
              className="w-28"
              {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
            />
            <div className="w-28 text-right pt-2">
              ${((watchItems[index]?.quantity || 0) * (watchItems[index]?.unitPrice || 0)).toFixed(2)}
            </div>
            {fields.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Item
        </Button>
      </div>

      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Tax (%)</span>
            <Input
              type="number"
              className="w-20"
              {...form.register('taxRate', { valueAsNumber: true })}
            />
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Textarea placeholder="Notes (optional)" {...form.register('notes')} />

      <div className="flex gap-4">
        <Button type="submit">Save as Draft</Button>
        <Button type="submit" variant="default">Save & Send</Button>
      </div>
    </form>
  );
}
```

---

# SECTION 7: PDF GENERATION

## 7.1 Invoice PDF Template

```typescript
// lib/pdf/invoice-template.tsx

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  logo: { width: 120, height: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#6366f1' },
  invoiceInfo: { textAlign: 'right' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, color: '#374151' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 8 },
  headerRow: { backgroundColor: '#f9fafb', fontWeight: 'bold' },
  col: { flex: 1 },
  colDescription: { flex: 3 },
  colRight: { flex: 1, textAlign: 'right' },
  totals: { marginTop: 20, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 200, justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontWeight: 'bold' },
  grandTotal: { fontSize: 14, fontWeight: 'bold', borderTopWidth: 2, borderTopColor: '#6366f1', paddingTop: 8 },
  notes: { marginTop: 40, padding: 16, backgroundColor: '#f9fafb', borderRadius: 4 },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, textAlign: 'center', color: '#9ca3af' },
});

interface InvoicePDFProps {
  invoice: {
    number: string;
    issueDate: string;
    dueDate: string;
    items: { description: string; quantity: number; unitPrice: number; total: number }[];
    subtotal: number;
    taxRate: number;
    tax: number;
    total: number;
    currency: string;
    notes?: string;
  };
  business: {
    name: string;
    logo?: string;
    address?: string;
    taxId?: string;
  };
  client: {
    name: string;
    email: string;
    company?: string;
    address?: string;
  };
}

export function InvoicePDF({ invoice, business, client }: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {business.logo ? (
              <Image src={business.logo} style={styles.logo} />
            ) : (
              <Text style={styles.title}>{business.name}</Text>
            )}
            {business.address && <Text>{business.address}</Text>}
            {business.taxId && <Text>Tax ID: {business.taxId}</Text>}
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.title}>INVOICE</Text>
            <Text>{invoice.number}</Text>
            <Text>Issued: {invoice.issueDate}</Text>
            <Text>Due: {invoice.dueDate}</Text>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BILL TO</Text>
          <Text>{client.name}</Text>
          {client.company && <Text>{client.company}</Text>}
          <Text>{client.email}</Text>
          {client.address && <Text>{client.address}</Text>}
        </View>

        {/* Items */}
        <View style={styles.section}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={styles.colDescription}>Description</Text>
            <Text style={styles.col}>Qty</Text>
            <Text style={styles.colRight}>Price</Text>
            <Text style={styles.colRight}>Total</Text>
          </View>
          {invoice.items.map((item, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.col}>{item.quantity}</Text>
              <Text style={styles.colRight}>${item.unitPrice.toFixed(2)}</Text>
              <Text style={styles.colRight}>${item.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>${invoice.subtotal.toFixed(2)}</Text>
          </View>
          {invoice.taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text>Tax ({invoice.taxRate}%)</Text>
              <Text>${invoice.tax.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>Total ({invoice.currency})</Text>
            <Text>${invoice.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>NOTES</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Thank you for your business! • Generated by InvoiceFlow
        </Text>
      </Page>
    </Document>
  );
}
```

---

# SECTION 8: PAYMENT INTEGRATION

## 8.1 Payment Flow

```
1. User creates invoice → status: DRAFT
2. User sends invoice → status: SENT, generates paymentLink
3. Client clicks payment link → sees public payment page
4. Client pays via Stripe Checkout
5. Webhook received → status: PAID, paidAt set
6. User notified of payment
```

## 8.2 Payment Link Generation

```typescript
// app/api/invoices/[id]/send/route.ts

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { client: true, user: true, items: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (!invoice.user.stripeAccountId) {
    return NextResponse.json({ error: 'Connect Stripe first' }, { status: 400 });
  }

  // Generate PDF
  const pdfBuffer = await generateInvoicePDF(invoice);
  const pdfUrl = await uploadToR2(`invoices/${invoice.id}.pdf`, pdfBuffer);

  // Create Stripe Checkout session
  const stripeSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: invoice.items.map(item => ({
      price_data: {
        currency: invoice.currency.toLowerCase(),
        product_data: { name: item.description },
        unit_amount: Math.round(Number(item.unitPrice) * 100),
      },
      quantity: Number(item.quantity),
    })),
    payment_intent_data: {
      application_fee_amount: Math.round(Number(invoice.total) * 0.02 * 100), // 2% fee
      transfer_data: {
        destination: invoice.user.stripeAccountId,
      },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoice.id}?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoice.id}`,
    metadata: { invoiceId: invoice.id },
  });

  // Update invoice
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: 'SENT',
      pdfUrl,
      paymentLink: stripeSession.url,
      sentAt: new Date(),
    },
  });

  // Send email to client
  await resend.emails.send({
    from: 'InvoiceFlow <invoices@invoiceflow.app>',
    to: invoice.client.email,
    subject: `Invoice ${invoice.number} from ${invoice.user.businessName || invoice.user.name}`,
    html: invoiceEmailTemplate(invoice, stripeSession.url!),
    attachments: [{ filename: `${invoice.number}.pdf`, content: pdfBuffer }],
  });

  return NextResponse.json({ success: true });
}
```

---

# SECTION 9: AUTOMATIC REMINDERS

## 9.1 Reminder Job (Trigger.dev)

```typescript
// jobs/send-reminders.ts

import { cronTrigger } from '@trigger.dev/sdk';
import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/resend';

export const sendReminders = client.defineJob({
  id: 'send-invoice-reminders',
  name: 'Send Invoice Reminders',
  version: '1.0.0',
  trigger: cronTrigger({ cron: '0 9 * * *' }), // 9 AM daily
  run: async (payload, io) => {
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find invoices due in 3 days (due soon reminder)
    const dueSoon = await prisma.invoice.findMany({
      where: {
        status: 'SENT',
        dueDate: {
          gte: today,
          lte: threeDaysFromNow,
        },
      },
      include: { client: true, user: true },
    });

    for (const invoice of dueSoon) {
      const alreadySent = await prisma.reminder.findFirst({
        where: { invoiceId: invoice.id, type: 'due_soon' },
      });

      if (!alreadySent) {
        await resend.emails.send({
          from: 'InvoiceFlow <reminders@invoiceflow.app>',
          to: invoice.client.email,
          subject: `Reminder: Invoice ${invoice.number} due soon`,
          html: dueSoonEmailTemplate(invoice),
        });

        await prisma.reminder.create({
          data: { invoiceId: invoice.id, type: 'due_soon' },
        });

        await io.logger.info(`Sent due soon reminder for ${invoice.number}`);
      }
    }

    // Find overdue invoices
    const overdue = await prisma.invoice.findMany({
      where: {
        status: 'SENT',
        dueDate: { lt: today },
      },
      include: { client: true, user: true },
    });

    for (const invoice of overdue) {
      // Update status to OVERDUE
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'OVERDUE' },
      });

      // Send overdue reminder (max once per week)
      const lastReminder = await prisma.reminder.findFirst({
        where: { invoiceId: invoice.id, type: 'overdue' },
        orderBy: { sentAt: 'desc' },
      });

      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (!lastReminder || lastReminder.sentAt < oneWeekAgo) {
        await resend.emails.send({
          from: 'InvoiceFlow <reminders@invoiceflow.app>',
          to: invoice.client.email,
          subject: `Overdue: Invoice ${invoice.number}`,
          html: overdueEmailTemplate(invoice),
        });

        await prisma.reminder.create({
          data: { invoiceId: invoice.id, type: 'overdue' },
        });
      }
    }

    return { dueSoonSent: dueSoon.length, overdueProcessed: overdue.length };
  },
});
```

---

# SECTION 10: TASK BREAKDOWN

## 10.1 Epic Overview

| Epic | Tasks | Hours |
|------|-------|-------|
| E1: Setup & Auth | 6 | 30 |
| E2: Client Management | 4 | 18 |
| E3: Invoice CRUD | 6 | 32 |
| E4: PDF Generation | 3 | 15 |
| E5: Email & Sending | 4 | 20 |
| E6: Payments | 5 | 28 |
| E7: Reminders | 3 | 14 |
| E8: Dashboard | 4 | 18 |
| E9: Testing & Deploy | 5 | 24 |
| **Total** | **40** | **199** |

## 10.2 Detailed Tasks

### Epic 1: Setup & Auth

| ID | Task | Hours | Acceptance Criteria |
|----|------|-------|---------------------|
| E1-T1 | Initialize Next.js with TypeScript, Tailwind | 4 | Project runs, linting passes |
| E1-T2 | Set up Prisma with PostgreSQL | 5 | Migrations work, schema deployed |
| E1-T3 | Configure NextAuth (Google + Email) | 6 | Can sign in with both methods |
| E1-T4 | Build login/signup pages | 5 | Forms work, errors displayed |
| E1-T5 | Create user settings page | 5 | Can update business details |
| E1-T6 | Set up Sentry monitoring | 5 | Errors captured in dashboard |

### Epic 3: Invoice CRUD

| ID | Task | Hours | Acceptance Criteria |
|----|------|-------|---------------------|
| E3-T1 | Create invoice API routes | 6 | CRUD endpoints work |
| E3-T2 | Build invoice list page | 5 | Pagination, filtering, sorting |
| E3-T3 | Build invoice form | 7 | Line items, calculations work |
| E3-T4 | Build invoice preview | 5 | Real-time preview updates |
| E3-T5 | Invoice number generation | 4 | Auto-increment, prefix support |
| E3-T6 | Invoice status management | 5 | Status transitions work |

### Epic 6: Payments

| ID | Task | Hours | Acceptance Criteria |
|----|------|-------|---------------------|
| E6-T1 | Stripe Connect onboarding | 6 | Users can connect accounts |
| E6-T2 | Payment link generation | 5 | Links created for sent invoices |
| E6-T3 | Public payment page | 6 | Clients can view and pay |
| E6-T4 | Webhook handler | 6 | Payment status updates |
| E6-T5 | Manual mark as paid | 5 | For offline payments |

---

# SECTION 11: PRICING MODEL

## 11.1 Plans

| Plan | Price | Invoices/Month | Features |
|------|-------|----------------|----------|
| Free | $0 | 5 | Basic invoicing, email support |
| Pro | $15/month | Unlimited | Reminders, custom branding, priority support |
| Business | $39/month | Unlimited | + Team members, API access |

## 11.2 Break-Even Analysis

**Monthly Costs:** ~$90
**Price per User:** $15
**Break-Even:** 6 paid users

---

# SECTION 12: SECURITY

## 12.1 Security Measures

| Measure | Implementation |
|---------|----------------|
| Invoice Access | Only owner can access their invoices |
| Payment Links | UUID-based, no guessable IDs |
| Stripe | Using Connect for PCI compliance |
| PDF Storage | Signed URLs with expiration |
| Rate Limiting | 100 requests/minute per user |

---

# SECTION 13: DEPLOYMENT

## 13.1 Environment Variables

```bash
# App
NEXT_PUBLIC_APP_URL=https://invoiceflow.app
NODE_ENV=production

# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_URL=https://invoiceflow.app
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email
RESEND_API_KEY=re_...

# Storage
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=invoiceflow-pdfs

# Monitoring
SENTRY_DSN=...
```

---

# END OF INVOICEFLOW IMPLEMENTATION PLAN

**Total Development Hours:** 199
**Estimated Cost:** ~$90/month
**Break-even:** 6 paid users ($90 revenue)
**Target:** 150 paid users = $2,250 MRR by month 6
