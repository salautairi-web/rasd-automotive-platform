# RASD API Specification

The typed API is exposed under the tRPC gateway and is versioned conceptually as `/api/v1`. `rasd.overview` is protected and returns scoped operational indicators. `rasd.intakeEvent` is administrator-only, validates the event contract, creates a correlation ID when absent, and rejects duplicate event IDs through the persistence layer.

## Step 2 Central ERP procedures

`erp.entities` lists central entity metadata and `erp.createEntity` registers a new entity for administrators. `erp.accountingBooks` lists books for a selected entity. `erp.createJournal` validates positive debit/credit equality and persists a validated journal envelope and lines transactionally. `erp.postJournal` permits only validated-to-posted transitions, while `erp.reverseJournal` permits only posted-to-reversed transitions. `erp.portfolio` returns period-scoped aggregation over portfolio metrics. Operational master creation procedures require `businessEntityId`; the Central ERP never acts as a shared operational ledger.
