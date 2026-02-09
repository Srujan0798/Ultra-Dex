# Multi‑Tenancy Strategy

This doc summarizes tenant isolation strategies and recommended defaults for Ultra‑Dex SaaS products.

---

## Options

### 1. Row‑Level Security (RLS) — **Recommended**
- Single shared database
- Strong logical isolation
- Low operational overhead
- Works best with PostgreSQL RLS policies

### 2. Schema‑Per‑Tenant
- Isolated schemas per tenant
- Good for compliance‑heavy customers
- Higher migration complexity

### 3. Database‑Per‑Tenant
- Maximum isolation
- Expensive and operationally heavy
- Best for enterprise regulated sectors

---

## Recommended Approach (Default)

**PostgreSQL + RLS**

Benefits:
- Secure isolation at query level
- Shared infra for cost efficiency
- Simple onboarding for new tenants

Key elements:
- `organization_id` on all tenant‑scoped tables
- Middleware to enforce current tenant
- RLS policy for every tenant‑scoped table

---

## Verification Checklist

- [ ] No cross‑tenant queries possible
- [ ] All tables have `organization_id`
- [ ] Tenant context enforced at API layer
- [ ] Automated tests for isolation

---

## Reference

Full technical spec: `docs/technical/architecture/MULTI-TENANCY.md`
