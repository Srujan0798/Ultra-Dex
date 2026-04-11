# Analytics Dashboard - Project Context

## Project Overview

**Name:** Analytics Dashboard
**Type:** SaaS analytics platform
**Goal:** Provide real-time product analytics, dashboards, and reporting for growth teams.

## Architecture Summary

- **Frontend:** Next.js App Router with Tailwind CSS
- **Backend:** Next.js API routes + Prisma ORM
- **Database:** PostgreSQL
- **Realtime:** WebSocket / Socket.io style event streaming
- **Charts:** Recharts with server-driven metrics

## Core Domains

- **Metrics**: Events, dimensions, aggregates, funnels
- **Users**: Workspace members, roles, access control
- **Dashboards**: Widgets, layouts, saved filters
- **Exports**: CSV/PDF report generation

## Data Flow

1. Clients send events to `/api/ingest/metrics`
2. Server persists to PostgreSQL
3. Aggregations queried by dashboard APIs
4. Realtime updates pushed to dashboard clients

## Operational Assumptions

- Multi-tenant workspaces
- Basic RBAC (owner, admin, member)
- Read-heavy analytics queries

## Project Conventions

- TypeScript for all server/client code
- API routes under `app/api`
- Prisma schema in `prisma/schema.prisma`
- UI components in `app/components`
