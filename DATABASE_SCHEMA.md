# RASD Database Schema

Phase 1 tables cover organizations, branches, business units, cost centers, users, permissions, access grants, customers, vehicles, products, numbering rules, integration events, commands, workflows, tasks, documents, audit logs, and idempotency keys. Every business-owned record includes organizationId for tenant scoping. Large files are represented by storageKey and storageUrl only.

## Step 2 independent-entity correction

`business_entities` stores registry metadata only. Operational customers, vehicles, and products carry a nullable `businessEntityId` during the safe migration window and use composite entity-local identifier uniqueness; suppliers, inventory items, and stock balances are entity-bound. The global VIN unique index is removed. Central ERP tables include entity settings, accounting books, accounts, fiscal periods, journal entries/lines, inter-entity transactions/reconciliations, capital contributions, entity loans, portfolio metrics, consolidation runs, and consolidation exceptions. Existing organization-owned rows are preserved and must be backfilled by an explicit entity mapping before columns become non-null.
