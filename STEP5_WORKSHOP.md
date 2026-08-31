# RASD Step 5 — Workshop Independent Entity

## Boundary

Workshop owns its local customers, vehicles, technicians, appointments, inspections, estimates, work orders, labor, parts-request context, invoices, payments, quality records, and deliveries. Vehicle entry never transfers ownership. Spare Parts, Auto Sales, Rental, and Central ERP integrations use protected APIs, events, commands, and inter-entity envelopes only.

## Delivered foundation

The schema adds entity-scoped Workshop masters and the appointment-to-delivery lifecycle. The protected `workshop` router exposes live dashboard/work-order reads, entity-validated appointment creation, and idempotent parts requests to a target Spare Parts entity. Events include the source system, source entity, correlation value, request hash, and stable idempotency key.

## API and security

All procedures require authentication and `businessEntityId`. Appointment creation verifies that both customer and vehicle belong to the Workshop entity. Parts requests verify the work order, preserve the target Parts entity, and replay safely. No procedure accesses another entity's operational inventory.

## Test and acceptance evidence

Lifecycle tests cover valid status transitions, estimate approval thresholds, and delivery safeguards. Acceptance requires entity-local persistence, successful migration, TypeScript validation, automated tests, production build, responsive `/workshop` rendering, and a dedicated checkpoint.

## Next vertical slices

Configurable inspection checklists, estimate lines, technician/bay scheduling, labor time capture, quality-check mutations, warranty, invoice/payment forms, local accounting books, customer portal, and full Rental/Auto Sales reconciliation remain incremental vertical slices on this boundary.
