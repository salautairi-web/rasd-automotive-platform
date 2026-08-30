# RASD Step 2 API and Acceptance Notes

## Central ERP procedures

The current v1 surface exposes `erp.entities`, `erp.createEntity`, `erp.accountingBooks`, `erp.createJournal`, and `erp.portfolio`. Entity registration is administrator-only; reads are protected; journals require positive balanced debit and credit totals and are written transactionally with their lines. The `rasd.moduleRows` procedure supplies scoped workspace data and rejects non-administrator integration reads with `FORBIDDEN`.

## Boundary rules

Operational master identifiers are entity-scoped through `businessEntityId` and composite uniqueness. The global VIN uniqueness index has been removed. The central registry contains entity metadata only. No cross-project direct database access is introduced; inter-system exchange remains represented by events, commands, and integration procedures.

## Acceptance matrix

| Control | Implementation evidence |
|---|---|
| Independent entity registry | `business_entities` schema and `erp.entities` / `erp.createEntity` |
| Local master boundary | `businessEntityId` on customer, vehicle, and product records; composite local identifier indexes |
| Balanced journal | `validateBalancedJournal` and `erp.createJournal` |
| Local-ledger preservation | Central journal records are validated envelopes; no local ledger mutation procedure exists |
| Authorization | Protected procedures and administrator-only entity creation/integration intake |
| Portfolio aggregation | `portfolio_metrics` and `erp.portfolio` period totals |
| Retry/idempotency foundation | Persisted idempotency keys and event envelope intake from Phase 1 |
| Auditability | Existing protected audit log plus correlation IDs on critical flows |

## Known vertical slices for the next increment

AR/AP aging, bank reconciliation, fixed-asset depreciation, tax calculation, consolidation eliminations, inter-entity matching, and complete local-entity adapters require additional domain-specific screens and procedures. They are deliberately not simulated as shared operational data in Central ERP.
