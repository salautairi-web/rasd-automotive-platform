# RASD Step 6 — Car Rental Independent Entity

## Boundary

Car Rental owns its local customers, fleet, rates, reservations, contracts, check-out/check-in records, maintenance planning, vehicle expenses, invoices, and payments. Workshop, Spare Parts, Auto Sales, Import/Export, and Central ERP interactions use protected APIs and Integration Layer events only.

## Delivered foundation

The schema adds entity-scoped fleet and customer masters, local VIN uniqueness, rate plans, collision-safe reservations, contracts, vehicle condition handovers, odometer history, maintenance profiles/tasks/requests, vehicle expenses, invoices, and idempotent payments. The protected `rental` router exposes live fleet metrics and vehicle reads, idempotent reservation creation with overlap detection, monotonic odometer recording, and maintenance requests to a target Workshop entity.

## Security and controls

Every operation requires authentication and `businessEntityId`. Customer and vehicle ownership are checked before mutations. Reservation periods must be valid and non-overlapping. Odometer rollback is rejected. Maintenance requests preserve source and target entity context and emit `RENTAL` events with correlation and idempotency data.

## Test and acceptance evidence

Tests cover reservation overlap, odometer monotonicity, and maintenance due logic alongside platform authentication, entity isolation, event replay, and accounting suites. Acceptance requires successful migration, TypeScript validation, automated tests, production build, responsive `/rental` rendering, and a dedicated checkpoint.

## Next vertical slices

Contract amendment forms, check-out/check-in inspections, deposits, damage/fines workflows, pricing seasons/promotions, vehicle P&L snapshots, automated maintenance alerts, local accounting books, and the customer portal remain incremental slices on the delivered independent-entity boundary.
