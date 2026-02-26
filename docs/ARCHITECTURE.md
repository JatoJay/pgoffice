# Architecture

## Summary
PG MONITOR is a multi-tenant SaaS platform with a NestJS control plane and a Next.js web app. Tenant isolation is enforced via PostgreSQL Row Level Security (RLS).

For full platform details, see:
- `docs/PGMONITOR_ARCHITECTURE.md`
- `docs/PGMONITOR_ERD.md`
- `docs/PGMONITOR_API_SPEC.md`

## Control Plane
- Next.js UI in `apps/web`
- NestJS API in `apps/api`
- PostgreSQL for tenant data
- Redis for queues and caching
