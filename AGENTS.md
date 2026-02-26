# AGENTS.md

## Project Overview
PGMonitor is a multi-tenant SaaS impact management platform for programs, networks, and outcomes. The control plane manages organizations, projects, users, and program modules with tenant isolation via PostgreSQL Row Level Security.

## Repository Layout
- `apps/web`: Next.js control-plane UI
- `apps/api`: NestJS control-plane API
- `deploy/compose`: Docker Compose stacks for local infra
- `infra/terraform`: DigitalOcean provisioning scaffold
- `docs`: Architecture and ops documentation

## Local Development
1. Copy `.env.example` to `.env` and fill values.
2. Start infra:
   - `docker compose -f deploy/compose/control-plane/docker-compose.yml up`
3. Start services:
   - `npm run dev:api`
   - `npm run dev:web`

## Environment Variables
Core variables (see `.env.example`):
- Control plane: `API_PORT`, `DATABASE_URL`, `REDIS_URL`, `AUTH_*`
- Web: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Implementation Rules
- Keep tenant isolation strictly enforced by RLS policies.
- Prefer small, composable services over monolith expansion.
- Any production change must include:
  - Updated docs in `docs/`
  - Tests or an explicit reason not to add tests

## Testing Expectations
- API: unit tests for new routes and auth behaviors.
- UI: minimal smoke tests for pages.

## Acceptance Checklist for PRs
- [ ] API returns correct errors for missing or invalid inputs.
- [ ] New configs documented in `.env.example`.
- [ ] Local Docker Compose stacks still boot.
- [ ] README/ARCHITECTURE updated when behavior changes.
