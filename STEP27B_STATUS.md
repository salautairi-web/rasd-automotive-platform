# RASD Step 27B — Operational Completion

## Baseline

This workstream starts from the current `main` branch after the Step 27 merge.

## Immediate priorities

1. Apply entity-scoped authorization consistently across operational read/mutation procedures.
2. Complete rental lifecycle hardening without changing the established entity-owned data model.
3. Build the local accounting posting boundary around the existing accounting tables and shared financial validation primitives.
4. Connect operational financial events to central consolidation through explicit contracts and idempotency.
5. Add focused acceptance tests for isolation, balanced journals, reversal, and replay behavior.

## Verification policy

No build, TypeScript check, or test result is marked as passing unless it is actually produced by the project environment or CI.
