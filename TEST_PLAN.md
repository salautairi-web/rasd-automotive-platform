# RASD Test Plan

Phase 1 tests cover authentication logout, protected overview access, administrator-only event intake, and malformed critical payload rejection. Acceptance testing must add tenant-scope, idempotency duplicate, audit creation, workflow transitions, document authorization, and end-to-end cross-module scenarios before production readiness.

## Step 2 tests

The Step 2 suite covers entity-local identifier separation, removal of global VIN uniqueness, balanced journal validation, validated-to-posted and posted-to-reversed lifecycle guards, entity-scoped master creation contracts, and Central ERP registry/portfolio protection. Full AR/AP, reconciliation, elimination, bank, tax, and local-adapter integration tests remain the next vertical slices.
