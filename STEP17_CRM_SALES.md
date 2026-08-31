# RASD Step 17 — CRM, Sales & Customer Relationship Management

## Architectural boundary

Each business entity owns its customer, contact, lead, opportunity, pipeline, quotation, order, contract, service, and interaction history. Central CRM governance may standardize policies and consume approved indicators, but it does not merge operational customer records between entities.

## Delivered CRM model

The foundation includes idempotent leads with source, score, consent and ownership; entity-local customers and contacts; configurable pipeline stages; opportunities and weighted forecasts; activities; campaigns; versioned quotations; idempotent sales orders; contracts; customer-service tickets; commissions; and immutable CRM audit.

## Protected lifecycle

The `crm` router provides entity-scoped dashboard and pipeline views, idempotent lead creation, guarded opportunity-stage progression, and quotation creation with automatic discount-approval detection. Opportunity and quotation references are checked against the owning entity and customer.

## Privacy and integrations

CRM procedures currently require administrator privilege and apply entity filters in the backend. Identity/portal links are references only. `LeadCreated` events include the source entity and system. The model provides local invoice, payroll-commission, portal, workshop, rental, Auto Sales, Spare Parts, Import/Export, and BI integration anchors without cross-entity operational joins.

## Verification

The release passes TypeScript validation, 68 automated tests, and the production build. Tests cover weighted forecasting, conversion rate, campaign ROI, forward-only stage movement, and discount approval thresholds. Desktop and mobile views are verified on `/crm`.

## Next vertical slices

Lead conversion transaction, interactive Kanban, activities and reminders, quotation/order lines, approvals, campaign members and attribution, ticket SLA/escalation, customer 360 adapters, portal requests, commission posting, accounting events, deduplication, granular sales roles, and field-level masking remain incremental slices.
