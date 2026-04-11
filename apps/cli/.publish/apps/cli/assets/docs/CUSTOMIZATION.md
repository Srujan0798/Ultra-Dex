# How to Customize Ultra-Dex

> Ultra-Dex is a **skeleton, not a cage**. Add, remove, and modify as needed.

---

## 🗑️ Remove Sections You Don't Need

### Solo Developer / Side Project

Skip these entirely:

- Sections 23-26: Stakeholder management (no stakeholders!)
- Section 30: i18n (if English-only)
- Section 28: Legal & Compliance (if not handling sensitive data)

### Free Tool (No Monetization)

Remove:

- Section 12: Payment Integration
- Section 25: Cost Estimation (no revenue tracking)

### Internal Tool

Remove:

- Section 29: SEO (internal tools don't need SEO)
- Section 26: Customer Support (internal users = Slack)

---

## ➕ Add Sections for Your Domain

### Healthcare App

Add:

- **Section 35: HIPAA Compliance** - PHI handling, audit logs, encryption
- **Section 36: Clinical Workflows** - Provider/patient interactions

### Fintech App

Add:

- **Section 35: Financial Regulations** - PCI-DSS, SOC2
- **Section 36: Transaction Audit Trail** - Every money movement logged

### Marketplace

Add:

- **Section 35: Dual-Sided UX** - Buyer vs. seller experiences
- **Section 36: Trust & Safety** - Fraud prevention, dispute resolution

---

## 📝 Simplify for Solo Projects

**Minimal viable planning (2 hours):**

| Fill This                         | Time   |
| --------------------------------- | ------ |
| Section 1: What are you building? | 10 min |
| Section 2: Top 3 features         | 20 min |
| Section 10: Core data model       | 30 min |
| Section 11: Main API endpoints    | 30 min |
| Section 15: Tech stack            | 10 min |
| Section 16: First 10 tasks        | 20 min |

**Then START CODING.** Fill other sections when you hit problems.

---

## 🔄 Adapt the 21-Step

### For Small Fixes

Use 5-step mini:

1. Plan (5 min)
2. Code (done when tested)
3. Test (quick manual check)
4. Document (if needed)
5. Deploy (push to prod)

### For Large Features

Add to 21-step:

- **Step 22:** Load test endpoint (for API changes)
- **Step 23:** UAT with real user (for UI changes)

---

## 🛠️ Customize Cursor Rules

### Using Supabase instead of Prisma?

Replace `01-database.mdc` content with Supabase patterns.

### Using Clerk instead of NextAuth?

Replace `03-auth.mdc` content with Clerk patterns.

### Using Paddle instead of Stripe?

Replace `05-payments.mdc` content with Paddle patterns.

**How to customize:**

1. Copy the `.mdc` file to your project
2. Edit to match your conventions
3. Cursor loads from `.cursor/rules/` automatically

---

## 📊 Examples of Real Modifications

### Example 1: E-commerce SaaS

**Added:**

- Section 35: Inventory Management
- Section 36: Shipping Integrations

**Removed:**

- Section 14: Realtime (not needed for simple catalog)

### Example 2: Dev Tool CLI

**Added:**

- Section 35: CLI UX Patterns
- Section 36: Plugin Architecture

**Removed:**

- Sections 6-9: Screen Map & UI (no UI, just CLI)
- Section 12: Payments (open source)

### Example 3: AI Agent Platform

**Added:**

- Section 35: LLM Selection & Prompts
- Section 36: Agent Memory Architecture
- Section 37: Guardrails & Safety

**Kept everything else** — needed full production planning.

---

> **Remember:** These 34 sections are a maximum, not a minimum. Use what you need.
