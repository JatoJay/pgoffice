# PGMonitor

Multi-tenant SaaS impact management platform for programs, networks, and outcomes.

## Structure
- `apps/web`: Next.js control plane UI
- `apps/api`: NestJS control plane API
- `deploy/compose`: Docker Compose stacks for control plane
- `infra/terraform`: Infrastructure scaffolding for DigitalOcean
- `docs`: Architecture and ops docs

## Quickstart (local)
1. Copy `.env.example` to `.env` and fill values.
2. Start control plane: `docker compose -f deploy/compose/control-plane/docker-compose.yml up`
3. Run services locally:
   - `npm run dev:api`
   - `npm run dev:web`

This repo is a scaffold. Production hardening is tracked in `docs/ARCHITECTURE.md`.
