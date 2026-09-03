# STEP 29 — Treasury, Cash, Banking & Payments

## Delivered foundation

RASD now has an entity-scoped Treasury foundation layered beside the existing finance and accounting modules. It keeps operational entity ledgers as the source of truth and provides protected treasury views and workflows without enabling direct external money movement.

The database model covers masked bank accounts, cash and petty-cash accounts, payment methods, beneficiaries, payment requests, maker-checker approvals, payment batches, receipts, bank transactions, reconciliation headers and matches, cash forecasts, collections, risk alerts, gateway transaction metadata, transfers, inter-entity funding, financing, investments, and treasury audit records.

The protected `treasury` tRPC router exposes entity-scoped reads and controlled procedures for bank accounts, payment requests, receipts, statement transactions, reconciliations, forecasts, and inter-entity funding. Payment requests use entity-scoped idempotency and require a different checker plus an approval limit. Bank and beneficiary values are masked references only. No credentials, account secrets, or fabricated balances are stored in source or UI.

## UI and controls

The Arabic-first Treasury workspace is available at `/treasury`. It presents cash-relevant operational counts, pending and failed payment states, unmatched transactions, collections due, bank accounts, reconciliations, risk alerts, and a clear source-of-truth statement. Empty states are shown when the database contains no records; the interface does not invent balances or transactions. The layout supports RTL and the mobile breakpoint without horizontal overflow.

## Deferred boundaries

Official bank feeds, payment gateway execution, card/wallet provider adapters, bank statement credentials, production beneficiary verification, distributed fraud detection, and jurisdiction-specific payment controls remain adapter-ready but inactive. Activation requires owner approval of the provider, endpoint/authentication model, and segregation-of-duties policy.

## Verification

The foundation was checked with TypeScript, Vitest, production build, and desktop/mobile visual review. The Treasury-specific tests cover maker-checker, forecast arithmetic, reconciliation difference, risk signals, and entity filtering.
