# RASD Step 11 — Central Finance, Treasury & Investment

## Architectural boundary

Central Finance manages corporate liquidity, funding, investments, controls, mappings, reconciliation, and oversight. It never replaces an entity's local ledger. Local accounting events remain owned and posted by the originating entity; central records reference and reconcile those events.

## Delivered finance model

The foundation includes a corporate chart of accounts, versioned local-to-corporate mappings, central bank accounts and cash-position snapshots, payment requests, funding requests, investment registry and idempotent investment cashflows, reconciliation records, period-close checklists, and immutable finance audit entries.

## Treasury and investment services

The protected `centralFinance` router provides consolidated cash, available liquidity, committed cash, invested capital, funding/payment queues, reconciliation differences, and investment portfolio rows. It supports idempotent payment requests, maker/checker approval with explicit limits, and entity funding requests.

## Controls

Central Finance APIs require administrator privilege. A payment maker cannot approve the same payment. Approval requires `pending_approval` status and a sufficient approval limit. Payment idempotency prevents duplicate requests. Account mappings retain versions, investment cashflows retain unique source-event IDs, and all approvals write financial audit context.

## Verification

The release passes TypeScript validation, 45 automated tests, and the production build. Tests cover maker/checker separation, reconciliation difference, and investment ROI calculation. Desktop and mobile views are verified on `/finance`.

## Next vertical slices

Bank statement import, payment batches/execution, inter-entity loan schedules, capital calls and contributions, distribution approvals, budget and forecast scenarios, consolidation/eliminations, close orchestration, entity-finance roles, documents, and scheduled liquidity reporting remain incremental slices on this foundation.
