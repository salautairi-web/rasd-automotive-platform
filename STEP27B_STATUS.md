# RASD Step 27B — Operational Completion

## Baseline

This workstream starts from the current `main` branch after the Step 27 merge.

## Completed in 27B so far

- Added explicit Step 27B status tracking and verification policy.
- Added pure entity-scope invariants and a reusable same-entity ownership guard.
- Hardened the rental advanced lifecycle with entity-scoped authorization: `rental.read` for reads and `rental.manage` for mutations.
- Enforced same-entity relationships across rental customers, vehicles, rate plans, contracts, fines, reservations, and deposits.
- Preserved reservation → contract linkage and converted the source reservation inside the same transaction.
- Strengthened entity-scoped state-update predicates for rental checkout/check-in.
- Hardened the ERP local-accounting boundary: entity ledger reads require entity scope; journal creation, posting, and reversal require explicit `accounting.manage` access and verify journal ownership before mutation.

## Immediate priorities

1. Apply entity-scoped authorization consistently across remaining operational read/mutation procedures.
2. Complete rental settlement and financial-event integration without changing the established entity-owned data model.
3. Build the local accounting posting boundary around the existing accounting tables and shared financial validation primitives.
4. Connect operational financial events to central consolidation through explicit contracts and idempotency.
5. Add focused acceptance tests for isolation, balanced journals, reversal, and replay behavior.

## Verification policy

No build, TypeScript check, or test result is marked as passing unless it is actually produced by the project environment or CI.
