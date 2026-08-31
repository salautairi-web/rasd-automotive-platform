# RASD Step 15 — Asset & Fixed Asset Management

## Architectural boundary

Each business entity owns its local asset register, cost basis, depreciation, maintenance, assignments, transfers, impairment, disposal, and accounting effects. Central reporting may reference entity assets but does not replace the local asset master or write into local ledgers.

## Delivered asset model

The foundation includes entity asset categories with accounting mappings and depreciation defaults; idempotent local asset records; approved capitalization with source documents and direct/installation/freight costs; assignments; maintenance and downtime; depreciation entries; internal and inter-entity transfers; impairment; disposal; CWIP; and immutable asset audit.

## Protected lifecycle

The `assets` router provides entity-scoped dashboard and register reads, idempotent asset creation, capitalization, depreciation posting, and disposal. Capitalization requires a received asset and source document. Depreciation is unique per asset and period, cannot reduce book value below residual value, and emits `DepreciationPosted`. Disposal is single-use and emits gain/loss information.

## Financial controls

All asset procedures currently require administrator privilege. Asset reads and mutations filter by owner entity. Capitalization, depreciation, and disposal preserve source entity, source system `FIXED_ASSETS`, asset reference, correlation ID, currency, and financial values for Central ERP/Finance/BI integration.

## Verification

The release passes TypeScript validation, 60 automated tests, and the production build. Tests cover straight-line depreciation, residual value, disposal gain/loss, capitalization evidence, and approved-only depreciation posting. Desktop and mobile views are verified on `/assets`.

## Next vertical slices

Declining-balance and units-of-production execution, period close, asset approvals, assignment/return forms, inventory counts, maintenance mutations, impairment posting, inter-entity transfer acceptance, CWIP capitalization, documents, local journals, central asset references, ROI/utilization, and granular asset roles remain incremental slices.
