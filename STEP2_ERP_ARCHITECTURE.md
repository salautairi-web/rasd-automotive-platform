# RASD Step 2 — Central ERP and Independent Business Entities

## Architectural correction

The Phase 1 organization scope is retained for platform administration, while operational masters are now additionally scoped by `businessEntityId`. The Central ERP is an administrative, consolidation, investment, reporting, command, and integration boundary. It is not a shared operational customer, vehicle, inventory, sales, or local-ledger database.

> A repeated person, vehicle, product, or supplier may legitimately exist as separate records in separate business entities. No automatic deduplication or global VIN uniqueness is applied.

## Central registry

`business_entities` stores identity metadata only: stable entity ID, code, Arabic/English names, entity type, parent company, currency, timezone, and lifecycle status. Operational detail belongs to the entity boundary and is exchanged through API, Event, Command, and Integration Layer contracts rather than direct database access.

## Accounting boundary

Each entity receives an independent accounting book. Central ERP stores book metadata, chart-of-accounts structure, fiscal-period state, validated journal envelopes, journal lines, portfolio metrics, inter-entity references, and consolidation-run state. A local ledger remains the source of truth for local posting. A posted local entry produces a financial event; consolidation records the central observation without mutating local records.

Journal creation enforces positive `Debit = Credit` totals before writing a validated entry and its lines transactionally. Posted records are intended to be immutable; corrections are represented by reversal entries.

## Security and visibility

All ERP procedures are protected by OAuth-backed session context and backend authorization. Entity reads and module queries must carry an entity scope. Integration views additionally require administrator authorization. Central reporting can expose aggregated portfolio metrics without granting operational permissions inside each entity.

## Phase 2 APIs

| Procedure | Purpose | Protection |
|---|---|---|
| `erp.entities` | List central entity registry records | Protected |
| `erp.createEntity` | Register a business entity | Admin |
| `erp.accountingBooks` | Read books for one entity | Protected |
| `erp.createJournal` | Validate and persist a balanced journal | Protected |
| `erp.portfolio` | Aggregate portfolio metrics for a period | Protected |
| `rasd.moduleRows` | Read scoped operational/ERP workspace rows | Protected; integration admin gate |

## Independence acceptance scenario

Create Sales and Rental entities, create same-name customers independently, create entity-local vehicles and inventory, and record local sales or service activity. Send financial events to Central ERP, then run consolidation. The expected result is separate local identifiers, no cross-entity visibility without scope, no shared VIN constraint, and no mutation of either local ledger during central consolidation.

## Deliberate next increment

The current foundation provides the registry, accounting primitives, balanced journal validation, portfolio read model, and module boundaries. Full AR/AP, bank reconciliation, fixed-asset depreciation, tax calculation, elimination processing, and complete local-entity adapters should be delivered as subsequent vertical slices rather than simulated in the central registry.
