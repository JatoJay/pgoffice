# PG MONITOR API Spec (MVP)

## Conventions
- Base URL: `/api/v1`
- Auth: Bearer JWT for UI; API Key for integrations
- All resources are tenant-scoped with `tenant_id`
- Pagination: `page`, `pageSize`, `total`
- Errors: `{ code, message, details }`

## Auth and Access
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `GET /auth/me`
- `POST /auth/sso/oidc/start`
- `POST /auth/sso/oidc/callback`

Roles
- `SuperAdmin`, `OrgAdmin`, `ProgramManager`, `Contributor`, `Participant`, `Advisor`, `Partner`

## Organizations and Instances
- `GET /organizations`
- `POST /organizations`
- `GET /organizations/:id`
- `PATCH /organizations/:id`

- `GET /instances`
- `POST /instances`
- `GET /instances/:id`
- `PATCH /instances/:id`

- `GET /instances/:id/branding`
- `PATCH /instances/:id/branding`

## Users and Access
- `GET /users`
- `POST /users`
- `GET /users/:id`
- `PATCH /users/:id`

- `GET /roles`
- `POST /roles`
- `PATCH /roles/:id`

- `GET /memberships`
- `POST /memberships`
- `DELETE /memberships/:id`

## Programs and Segments
- `GET /programs`
- `POST /programs`
- `GET /programs/:id`
- `PATCH /programs/:id`
- `POST /programs/:id/activate`
- `POST /programs/:id/archive`

- `GET /programs/:id/phases`
- `POST /programs/:id/phases`
- `PATCH /programs/:id/phases/:phaseId`

- `GET /programs/:id/modules`
- `PATCH /programs/:id/modules`

- `GET /segments`
- `POST /segments`
- `GET /segments/:id`
- `PATCH /segments/:id`

## Projects and Tasks
- `GET /projects`
- `POST /projects`
- `GET /projects/:id`
- `PATCH /projects/:id`

- `GET /milestones`
- `POST /milestones`
- `PATCH /milestones/:id`

- `GET /tasks`
- `POST /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `POST /tasks/:id/dependencies`

- `POST /files`
- `GET /files/:id`

## Events
- `GET /events`
- `POST /events`
- `GET /events/:id`
- `PATCH /events/:id`

- `GET /events/:id/sessions`
- `POST /events/:id/sessions`

- `POST /events/:id/registrations`
- `POST /events/:id/attendance`
- `POST /events/:id/feedback`

## Budgeting
- `GET /budgets`
- `POST /budgets`
- `GET /budgets/:id`
- `PATCH /budgets/:id`

- `GET /budget-items`
- `POST /budget-items`
- `PATCH /budget-items/:id`

- `GET /cost-categories`
- `POST /cost-categories`

- `GET /funding-sources`
- `POST /funding-sources`

## Audience and Network
- `GET /profiles`
- `POST /profiles`
- `GET /profiles/:id`
- `PATCH /profiles/:id`

- `GET /relationships`
- `POST /relationships`
- `POST /interactions`

- `GET /tags`
- `POST /tags`
- `POST /taggings`

## Connection Engine
- `GET /matches`
- `POST /matches`
- `PATCH /matches/:id`

## Pipeline and Opportunities
- `GET /pipelines`
- `POST /pipelines`
- `GET /pipelines/:id`
- `PATCH /pipelines/:id`

- `GET /pipeline-stages`
- `POST /pipeline-stages`

- `GET /opportunities`
- `POST /opportunities`
- `PATCH /opportunities/:id`
- `POST /opportunities/:id/history`

## Surveys and Feedback
- `GET /surveys`
- `POST /surveys`
- `GET /surveys/:id`
- `PATCH /surveys/:id`

- `GET /surveys/:id/questions`
- `POST /surveys/:id/questions`

- `POST /surveys/:id/responses`
- `GET /surveys/:id/responses`

## KPIs and Metrics
- `GET /kpis`
- `POST /kpis`
- `PATCH /kpis/:id`

- `GET /metrics`
- `POST /metrics`
- `GET /metric-values`
- `POST /metric-values`

- `GET /dashboards`
- `POST /dashboards`

## Audit and Admin
- `GET /audit-logs`
- `GET /api-keys`
- `POST /api-keys`
- `DELETE /api-keys/:id`

## Notes
- All create and update endpoints validate tenant scope and RBAC.
- List endpoints support filters by `program_id`, `segment_id`, and `status` where applicable.
- Use API endpoints to integrate external data sources with KPIs.

