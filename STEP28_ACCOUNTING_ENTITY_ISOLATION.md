# Step 28 — Accounting Entity Isolation

## Step 28A — Accounting boundary contract

This step applies the existing RASD entity-isolation model to local accounting without changing financial semantics.

### Rules

1. Every operational accounting book belongs to exactly one `businessEntityId`.
2. Journal headers and journal lines must remain inside the same business entity.
3. An account referenced by a journal must belong to the journal's entity/book.
4. Financial events published to Central ERP must carry the originating `businessEntityId`.
5. Cross-entity posting is rejected at the application boundary; central consolidation is aggregation-oriented and is not an operational bypass.
6. Posted journals are immutable. Corrections use reversal plus corrected entry.
7. Every journal must balance before publication.
8. Idempotency keys are scoped to the originating business entity and operation.

## Implementation sequence

- Step 28A: establish pure accounting ownership invariants and tests.
- Step 28B: apply the invariants to existing ERP journal procedures.
- Step 28C: enforce account/book/event ownership in transactional writes.
- Step 28D: add cross-entity authorization and regression tests.
- Step 28E: connect rental settlement to the local accounting book.
- Step 28F: publish financial events to the central ingestion boundary with replay protection.

## Validation policy

`pnpm check`, `pnpm test`, and `pnpm build` are only marked passing after actual project execution or CI output. Documentation and static review do not count as a successful build.
