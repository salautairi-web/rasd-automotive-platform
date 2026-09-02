# RASD Step 27B — Operational Completion

## Baseline

This workstream starts from the current `main` branch after the Step 27 merge.

## Completed in 27B so far

- Added explicit Step 27B status tracking and verification policy.
- Added pure entity-scope invariants proving that operational ownership is keyed by `businessEntityId`; matching names do not create shared master data.
- Added `assertSameEntity` helper for linked-record ownership checks.
- Hardened the rental advanced lifecycle with entity-scoped authorization: `rental.read` for reads and `rental.manage` for mutations.
- Added explicit same-entity checks across rental contract, vehicle, customer, rate plan, fine, and deposit relationships.
- Strengthened mutation update predicates so contract and vehicle state changes remain entity-scoped inside transactions.

## Immediate priorities

1. Apply entity-scoped authorization consistently across remaining operational read/mutation procedures.
2. Complete rental settlement and financial-event integration without changing the established entity-owned data model.
3. Build the local accounting posting boundary around the existing accounting tables and shared financial validation primitives.
4. Connect operational financial events to central consolidation through explicit contracts and idempotency.
5. Add focused acceptance tests for isolation, balanced journals, reversal, and replay behavior.

## Verification policy

No build, TypeScript check, or test result is marked as passing unless it is actually produced by the project environment or CI.
