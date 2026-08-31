# RASD Step 3 — Auto Sales Independent Business Entity

## Boundary

Auto Sales is a separate business entity operating under the Central ERP registry. Its customer, vehicle, inventory, quotation, reservation, order, invoice, payment, and delivery records are entity-scoped and are not shared with Rental, Workshop, Parts, or other activities. Cross-entity work is represented through events, commands, and inter-entity transactions rather than direct database access.

## Implemented operating foundation

The schema includes `sales_entities`, `sales_customers`, `sales_vehicles`, `sales_vehicle_costs`, `sales_leads`, `sales_quotations`, `sales_reservations`, `sales_orders`, `sales_invoices`, `sales_payments`, and `sales_deliveries`. VIN uniqueness is local to the Auto Sales entity. Reservations and payments have entity-scoped idempotency keys.

## Lifecycle controls

A vehicle can be reserved only while its local state is `ready`; the state transition is conditional and therefore prevents concurrent reservation of the same vehicle. Quotation discounts above the ten-percent threshold enter `pending_approval`. Delivery requires a reserved vehicle and a financially approved or paid order. Payment replay returns the original local payment number for the same entity and idempotency key.

## Procedures

The protected `sales` router provides dashboard indicators, vehicle and quotation reads, local customer and vehicle creation, quotation creation, reservation, payment posting, and delivery. Every procedure accepts `businessEntityId`. Reservation and payment operations use idempotency keys; quotation creation writes an audit entry; delivery changes the local vehicle state and returns a delivery result suitable for publishing as `VehicleDelivered`.

## Security and integration

Entity scope is enforced server-side and is not a frontend-only visibility rule. Financial events should be emitted from local Auto Sales accounting to Central ERP, where they become consolidation observations. Workshop, Parts, and Import/Export integrations must exchange service requests, invoices, transfer events, and costs through the Integration Layer. No customer, vehicle, or inventory table is shared across those systems.

## Delivered versus next vertical slices

The current step establishes the independent Auto Sales data boundary and the critical sales lifecycle foundation. Full purchasing/acquisition, trade-in, branch-level permissions, price lists/promotions, customer portal, complete local accounting books, reports, and end-to-end Workshop/Parts/Import-Export adapters should be implemented as subsequent vertical slices on the same boundary.
