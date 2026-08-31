# RASD Step 16 — Inventory & Warehouse Management

## Architectural boundary

Each business entity owns its products, warehouses, bins, balances, costs, movements, reservations, counts, and valuation. Central reporting consumes approved events and snapshots only. Movement between entities must use the Inter-Entity Transaction Engine and cannot mutate another entity's inventory directly.

## Delivered inventory model

The foundation includes entity warehouses and structured locations; local SKUs with barcode, OEM/MPN, serial/batch/expiry flags, costing policy and reorder controls; batches and serials; stock balances; append-only movement ledger; reservations; internal/branch/inter-entity transfers; stock counts and lines; valuation snapshots; and immutable inventory audit.

## Protected operations

The `inventory` router provides entity-scoped dashboard and stock views, idempotent receiving, and idempotent reservation. Receiving recalculates weighted-average cost and writes `StockReceived`. Reservation uses a conditional availability check excluding reserved and quarantined quantity, updates the balance atomically, and writes a reservation ledger movement.

## Controls

All procedures currently require administrator privilege and filter by business entity. Local SKUs, barcodes, warehouses, locations, batches, serials, movement keys, reservation keys, transfer numbers, and transfer keys are unique within the owning boundary. The ledger is the source of movement truth and prevents duplicate effects.

## Verification

The release passes TypeScript validation, 64 automated tests, and the production build. Tests cover available quantity, negative-stock prevention, weighted-average cost, and count variance. Desktop and mobile views are verified on `/inventory`.

## Next vertical slices

Put-away/picking/packing/dispatch, FIFO and specific-identification layers, serial/batch movement enforcement, count posting and adjustment approval, returns/quarantine, transfer receive workflow, mobile scanning/offline queue, reorder requests, aging/expiry analytics, COGS journals, entity inventory roles, and full financial events remain incremental slices.
