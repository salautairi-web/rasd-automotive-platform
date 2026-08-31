# RASD Step 12 — Master Data Governance & Inter-Entity Engine

## Ownership boundary

Each business entity remains the owner of its operational customers, vehicles, products, services, documents, invoices, and accounting entries. Central governance stores references, mappings, policies, match decisions, and transaction envelopes; it does not copy records into a shared operational master or write directly to entity databases.

## Delivered governance model

The foundation includes versioned governance policies, a central reference registry with explicit source ownership, entity-to-reference mappings, duplicate cases, change requests, and immutable governance audit. Record mappings can be exact, probable, manual, or merged while the source record retains its local identity.

## Inter-entity engine

Transactions support sale, purchase, service, asset/vehicle/inventory transfer, loan, and funding types. Headers carry source and target entity/system, currency, amount, correlation ID, and entity-scoped idempotency key. Lines reference local source records and optionally the central registry. Staged approvals, matching, settlements, disputes, and outstanding balances preserve the full lifecycle.

## Controls and APIs

The protected `governance` router exposes dashboard metrics, reference creation, mapping, transaction creation, approval, document-value matching, settlement, and dispute opening. Central governance currently requires the administrator role. Source and target entities must differ, duplicate source requests replay safely, settlement cannot exceed outstanding value, and disputes must originate from a transaction participant.

## Consolidation hooks

Matched internal transactions retain source and target values before elimination. Status, difference, settlement method, currency, and event identifiers provide the hooks required for Central Finance and Central BI to eliminate internal revenue, expense, and AR/AP without deleting local ledger evidence.

## Verification

The release passes TypeScript validation, 48 automated tests, and the production build. Tests cover matching results, legal state transitions, partial settlement, and over-settlement rejection. Desktop and mobile views are verified on `/governance`.

## Next vertical slices

Interactive transaction forms, target-entity acceptance, document uploads, matching recommendations, duplicate-resolution workflows, data-quality scoring, change-request approval, entity-scoped governance roles, callback processing, and full consolidation posting remain incremental slices on this foundation.
