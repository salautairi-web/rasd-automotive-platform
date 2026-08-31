# RASD Step 13 — Procurement & Vendor Management

## Architectural boundary

Corporate Procurement owns policies, approval rules, controls, and consolidated reporting. Each business entity owns its supplier records, contacts, terms, contracts, requests, RFQs, quotations, purchase orders, receipts, invoices, returns, and accounting effects. Purchases between entities route through the Inter-Entity Engine.

## Delivered procurement model

The foundation includes versioned corporate procurement policies; local suppliers with qualification, compliance, risk, payment terms, and masked bank details; supplier documents and versioned contracts; purchase requests and lines; RFQs and responses; purchase orders and lines; goods/service receipts; supplier invoices; approvals; vendor performance; and procurement audit.

## Protected lifecycle

The `procurement` router provides entity-scoped dashboard metrics, supplier creation, idempotent purchase requests, maker/checker approval, purchase-order creation, idempotent receiving, and two-way or three-way invoice matching. Only active, qualified, compliant suppliers may receive purchase orders. Receiving requires an approved/sent purchase order and emits a procurement event.

## Matching and controls

Three-way matching requires a receipt in the same entity and purchase-order scope. Variances are calculated against the approved basis with configurable tolerance. Supplier invoice numbers are unique per supplier and entity. Purchase request approval enforces maker/checker separation and approval limits. Bank details remain masked and bank-change approval has an explicit approval resource type.

## Verification

The release passes TypeScript validation, 52 automated tests, and the production build. Tests cover supplier qualification, deterministic quotation scoring, two/three-way invoice matching, maker/checker separation, and approval limits. Desktop and mobile views are verified on `/procurement`.

## Next vertical slices

Interactive supplier/RFQ/PO forms, supplier response portal, quotation award workflow, budget commitment integration, receipt line allocation, returns, payment batch requests, bank-account change workflow, split-purchase detection, contract expiry schedules, and supplier statement reconciliation remain incremental slices on this foundation.
