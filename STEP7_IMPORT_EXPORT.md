# RASD Step 7 — Import & Export Independent Entity

## Entity boundary

Import & Export owns its local parties, orders, shipment items, containers, customs declarations, logistics costs, landed-cost runs, payments, and inter-entity transfers. Auto Sales, Spare Parts, Rental, and Central ERP are reached only through protected procedures and integration events.

## Delivered foundation

The schema adds entity-scoped parties, import/export orders and lines, multimodal shipments, containers, customs/clearance costs, shipment items, approved cost components, versioned landed-cost runs and allocations, idempotent payments, and transfers to recipient entities. The `importExport` router exposes live dashboard and shipment reads, shipment creation, cost registration, landed-cost calculation/finalization, and idempotent inter-entity transfer creation.

## Landed Cost invariant

Approved additional costs can be allocated by value, weight, quantity, or volume. The engine assigns rounding residuals to the final item, guaranteeing that allocated additional cost equals the source cost exactly. Finalization is permitted only for a calculated version, preserving finalized history and supporting future adjustment versions.

## Security and audit

All procedures require authentication and `businessEntityId`. Shipment ownership is checked before cost mutation. Local identifiers are unique within an entity. Transfers include target entity/system, correlation ID, idempotency key, currency, and amount, then emit `IMPORT_EXPORT` events without direct database access to recipient systems.

## Verification

The release passes TypeScript validation, 33 automated tests, and the production build. Tests include exact landed-cost allocation, zero-basis rejection, and finalization-state guards. Desktop and mobile views are verified on `/import-export`.

## Next vertical slices

Interactive order/proforma forms, document uploads, detailed customs approval, shipment-item receiving, local accounting journals, transfer reconciliation, supplier performance, and profitability snapshots remain incremental slices on the delivered boundary.
