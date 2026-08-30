# Project TODO

- [x] Define the Phase 1 modular-monolith boundaries and shared domain vocabulary.
- [x] Add multi-company, branch, business-unit, department, cost-center, warehouse, and location schema with tenant-scope fields.
- [x] Add centralized customer, vehicle, and product master records with stable RASD identifiers and configurable numbering.
- [x] Add role, permission-scope, organizational-access, and protected audit-log data structures.
- [x] Add event catalog, event persistence, retry state, commands, workflows, tasks, comments, and attachment metadata structures.
- [x] Add secure object-storage metadata integration without storing large file bytes in the database.
- [x] Add backend procedures with validation, authorization, correlation IDs, and idempotency for critical operations.
- [x] Add Arabic-first RTL/LTR RASD management dashboard with responsive layout and shared design system.
- [ ] Replace current scoped module tables with fully tRPC-backed organization, master-data, integration, workflow, task, audit, and document data views.
- [ ] Tie permission-denied state to backend authorization failures; loading, error, empty, and coming-soon states are implemented.
- [ ] Add Phase 1 seed data for organization structure, roles, permissions, and master records without fabricated reviews or testimonials.
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
- [ ] Verify RTL/LTR switching visually across all module workspaces.
- [ ] Replace illustrative module rows and toast-only actions with fully tRPC-backed module data and mutations.
- [ ] Connect the permission-denied frontend state to actual backend authorization failures.

## Verification follow-up

- [x] Implement tenant-scoped numbering and use generated identifiers in customer, vehicle, and product creation flows.
- [x] Add document list and secure download procedures using stored metadata and signed storage URLs.
- [ ] Add integration tests and typed response replay for idempotent event requests; conflict detection is implemented.
- [ ] Persist and apply the RTL/LTR direction across all module pages; visual verification of both modes remains pending.
- [ ] Replace remaining sample datasets and toast-only actions with tRPC-backed module data and mutations.
- [ ] Handle real backend authorization failures in the frontend permission-denied state.

## Final backend correctness

- [x] Scope numbering rules by organizationId and use generated identifiers in master-record creation flows.
- [ ] Implement typed idempotent response replay and add replay/conflict tests.
