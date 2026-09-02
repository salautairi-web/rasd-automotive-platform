# Changelog

## Phase 1 foundation

- Added RASD organization, master-data, integration, workflow, task, document, audit, permission, and idempotency schema.
- Added protected overview and administrator-only event intake procedures.
- Added Arabic-first RTL dashboard, responsive navigation, module workspaces, loading/error/empty states, and Phase 1 documentation.
- Added Vitest coverage for authentication, authorization, and input validation.

## Step 27 — Production completion hardening

- Added entity-scoped authorization helpers with default-deny behavior for operational access.
- Hardened Fleet reads and vehicle-status mutations with business-entity ownership checks.
- Added shared idempotency hashing/read/write helpers for sensitive mutations and hardened concurrent replay handling.
- Added correlation-aware audit/security events for Fleet vehicle lifecycle changes.
- Added entity-scoped financial event contract and validation before publication to central workflows.
- Added Step 27 production scope and acceptance criteria for finance, automotive lifecycle, rental/fleet, integrations, security, and QA.
