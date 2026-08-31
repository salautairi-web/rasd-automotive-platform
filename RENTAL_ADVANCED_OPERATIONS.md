# RASD — Rental Advanced Operations

## Interactive workflows

The Rental workspace now provides Arabic-first forms for contract creation, driver and licence capture, deposit holding, vehicle checkout, vehicle check-in with damage capture, traffic fines, and insurance policies. All mutations are protected and scoped by `businessEntityId`.

## Contract and handover controls

Contract references must belong to the same Rental entity. Vehicle state and overlapping active contracts are validated. Checkout activates the contract and marks the vehicle rented. Check-in requires an active contract, prevents odometer rollback, records condition/damage, returns the contract, and routes damaged vehicles to inspection.

## Risk and money controls

Damage, fine, insurance, deposit, and deposit-transaction tables preserve local ownership. Deposit hold, deduction, and refund paths use entity-scoped idempotency keys and reject settlement beyond the remaining held balance.

## Profitability

The per-vehicle report combines posted rental invoices, local vehicle expenses, and open maintenance alerts to show revenue, expense, net contribution, and maintenance attention. The period selector establishes the reporting context for future snapshot materialization.

## Automated maintenance alerts

`POST /api/scheduled/rental-maintenance-alerts` is a cron-authenticated, idempotent Heartbeat endpoint. It resolves the Rental entity strictly by the persisted `scheduleCronTaskUid`, evaluates date and odometer thresholds plus insurance expiries, and upserts deduplicated alerts. No in-process timers are used.

## Verification

The release passes TypeScript validation, 30 automated tests, and the production build. Desktop and mobile layouts were visually checked after the responsive form correction.
