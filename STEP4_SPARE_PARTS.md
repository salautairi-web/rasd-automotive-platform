# RASD Step 4 — Spare Parts Independent Entity

## Boundary

Spare Parts owns its local customers, suppliers, catalog, vehicle compatibility, warehouses, stock balances, movements, purchasing, sales, invoices, payments, and accounting handoff. Workshop, Auto Sales, Rental, Import/Export, and Central ERP may interact only through protected APIs, events, commands, and inter-entity transactions.

## Delivered foundation

The Step 4 schema adds entity-scoped product and supplier masters, local SKU uniqueness, compatibility records, warehouses, stock balances, immutable idempotent movements, purchase orders, sales orders, reservations, invoices, and payments. The backend exposes live dashboard/catalog reads, conditional stock reservation, scoped stock issue, payment replay, and persistent Integration Layer events.

## Controls

Negative stock is prevented by conditional updates. Reservations require sufficient available stock and atomically move quantity from available to reserved. Every critical movement is entity-scoped and carries an idempotency key. Issue validates the reservation, product, warehouse, and entity. Payment validates invoice ownership. Pricing invariants support minimum-margin approval decisions.

## User experience

The Arabic-first `/parts` workspace presents live inventory value, item count, low-stock alerts, reserved quantities, and the local parts catalog. Empty, loading, and authorization-failure states are explicit and responsive.

## Next vertical slices

Purchase requisitions, receipt/put-away, bins/lots, stocktakes, transfers, warranty and returns, B2B/POS, local accounting books, and the customer portal remain incremental vertical slices on the delivered independent-entity boundary.

## Protected API surface

The `parts` router exposes `dashboard`, `products`, `reserveStock`, `issueStock`, and `postPayment`. Every operation requires authentication and `businessEntityId`. Reservation and payment accept idempotency keys; issue verifies the persisted reservation against entity, product, warehouse, and state.

## Security and audit

Backend queries apply entity scope. Conditional stock updates prevent over-reservation. Movement keys prevent duplicate inventory effects. Parts events record `sourceSystem=SPARE_PARTS`, the local entity, source reference, correlation value, and request hash before Central ERP consumption.

## Test and acceptance evidence

The Step 4 suite verifies availability, negative-stock rejection, and minimum-margin decisions. Platform tests additionally cover authentication, entity-local references, idempotent replay, event conflict handling, and accounting invariants. Acceptance requires successful TypeScript validation, all automated tests, production build, and responsive desktop/mobile rendering of `/parts`.
