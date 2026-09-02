# Changelog

## Step 27 — production hardening in progress

- Added backend entity-scoped access guards for membership and permission checks.
- Hardened the Fleet overview so entity access is enforced server-side instead of trusting the requested entity ID.
- Added an entity-scoped Fleet vehicle-status mutation with correlation ID support and safe same-state replay behavior.
- Added an explicit membership assertion procedure for entity-scoped clients.

## Phase 1 foundation

- Added RASD organization, master-data, integration, workflow, task, document, audit, permission, and idempotency schema.
- Added protected overview and administrator-only event intake procedures.
- Added Arabic-first RTL dashboard, responsive navigation, module workspaces, loading/error/empty states, and Phase 1 documentation.
- Added Vitest coverage for authentication, authorization, and input validation.
