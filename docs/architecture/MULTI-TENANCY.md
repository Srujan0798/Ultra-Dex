# Multi-Tenancy Architecture Strategy

## Options
1. **Row-Level Security (RLS)**
   - Single schema with tenant_id on every table
   - Postgres RLS policies enforce isolation
   - Lower operational overhead

2. **Schema-per-tenant**
   - Dedicated schema per tenant
   - Strong isolation, higher operational cost
   - Best for regulated enterprise customers

## Recommended Strategy
**Postgres RLS + strict tenant context** for most SaaS workloads.

## Implementation Plan (RLS)
- Add `tenant_id` to all multi-tenant tables
- Create `current_setting('app.tenant_id')` guard
- Use `set_config('app.tenant_id', <tenant>, true)` per request
- Define RLS policies per table

## Tenant Lifecycle Management
- **Onboard:** create tenant row, default roles, seed data
- **Suspend:** disable auth tokens + webhook calls
- **Offboard:** archive data, export, delete after retention

## Isolation Verification Tests
- Ensure queries cannot access other tenant data
- Run RLS policy tests in CI
- Include negative tests for cross-tenant access

## Operational Considerations
- Backup per-tenant exports
- Reporting/analytics via read replicas
- Tenant-aware caching and rate limits
