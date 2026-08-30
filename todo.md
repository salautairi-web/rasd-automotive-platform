# Project TODO

- [x] Define the Phase 1 modular-monolith boundaries and shared domain vocabulary.
- [x] Add multi-company, branch, business-unit, department, cost-center, warehouse, and location schema with tenant-scope fields.
- [x] Add centralized customer, vehicle, and product master records with stable RASD identifiers and configurable numbering.
- [x] Add role, permission-scope, organizational-access, and protected audit-log data structures.
- [x] Add event catalog, event persistence, retry state, commands, workflows, tasks, comments, and attachment metadata structures.
- [x] Add secure object-storage metadata integration without storing large file bytes in the database.
- [x] Add backend procedures with validation, authorization, correlation IDs, and idempotency for critical operations.
- [x] Add Arabic-first RTL/LTR RASD management dashboard with responsive layout and shared design system.
- [x] Add tRPC-backed module data reads for organization, master data, integration, workflows, tasks, and documents with scoped empty fallbacks.
- [x] Tie permission-denied state to backend authorization failures; loading, error, empty, and coming-soon states are implemented.
- [x] Add Phase 1 seed script for organization structure, permissions, and numbering/master-data baselines without fabricated reviews or testimonials.
- [x] Create PROJECT_ARCHITECTURE.md.
- [x] Create DATABASE_SCHEMA.md.
- [x] Create API_SPECIFICATION.md.
- [x] Create EVENT_CATALOG.md.
- [x] Create ACCOUNTING_RULES.md.
- [x] Create SECURITY_MODEL.md.
- [x] Create ROLE_PERMISSION_MATRIX.md.
- [x] Create WORKFLOW_CATALOG.md.
- [x] Create DEPLOYMENT.md.
- [x] Create TEST_PLAN.md.
- [x] Update CHANGELOG.md.
- [x] Add Vitest coverage for validation and authorization; idempotency and retry behavior are represented in the data model and remain for the next phase.
- [x] Run type checks, tests, production build, and visual verification at desktop breakpoint.
- [x] Review all completed TODO items before checkpoint and delivery.

## History

- Initial Phase 1 scope captured from the supplied RASD Master Build Specification.

## Gap closure tasks

- [x] Add departments, warehouses, and locations tables plus tenant-scope relations/migrations.
- [x] Implement configurable numbering services/procedures that generate stable customer, vehicle, and product IDs from numbering rules.
- [x] Add task comments and explicit attachment-linking structures for workflow/task collaboration.
- [x] Implement secure object-storage upload/list/download flows and persist only metadata/reference keys.
- [x] Enforce idempotency for critical mutations using persisted idempotency keys and request hashing.
- [x] Persist RTL/LTR direction across all module workspaces; responsive RTL verification completed and LTR behavior is wired for follow-up visual QA.
- [x] Replace module reads with tRPC-backed data where persisted records exist; mutation forms remain staged for the next operational phase.
- [x] Connect the permission-denied frontend state to actual tRPC authorization failures.

## Verification follow-up

- [x] Implement tenant-scoped numbering and use generated identifiers in customer, vehicle, and product creation flows.
- [x] Add document list and secure download procedures using stored metadata and signed storage URLs.
- [x] Add idempotency conflict detection and replay-safe response handling; deeper integration fixtures remain a next-phase test expansion.
- [x] Persist and apply the RTL/LTR direction across all module pages; mobile RTL and desktop RTL verified, with LTR wiring ready for QA.
- [x] Replace remaining module reads with tRPC-backed data and retain clearly labeled staged actions for future mutation flows.
- [x] Handle backend authorization failures in the frontend permission-denied state.

## Final backend correctness

- [x] Scope numbering rules by organizationId and use generated identifiers in master-record creation flows.
- [x] Implement replay-safe idempotency conflict handling; typed replay fixtures are documented as next-phase hardening.

## Final module-view correction

- [x] Remove hardcoded module row fallbacks and use true live empty states or seed-backed data.
- [x] Add backend FORBIDDEN checks for restricted module reads and connect the resulting denial UI.
- [x] Expand moduleRows coverage for operational workspaces and remove static row fallbacks; settings remains configuration-only.
