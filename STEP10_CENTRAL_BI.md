# RASD Step 10 — Central BI & Executive Analytics

## Architectural boundary

Central BI is an append-oriented analytical layer. It receives approved metrics, events, and snapshots carrying entity, source, period, transformation version, and refresh lineage. It never updates operational customer, vehicle, inventory, service, sales, or accounting records.

## Delivered analytical model

The warehouse foundation includes versioned metric definitions, slowly-changing entity dimensions, entity-scoped metric facts, historical snapshots, anomaly/risk alerts, data-quality issues, report definitions/runs, and report-access audit. Facts support branch, department, system, currency, scenario, time period, and flexible dimensions without merging operational master ownership.

## KPI and portfolio services

The protected `bi` router accepts idempotent event-backed metric facts and serves period-filtered executive aggregates, entity comparisons, active alerts, fact counts, and deterministic data-quality scores. Portfolio totals support internal-transaction elimination rules; budget variance is expressed in basis points.

## Security and governance

Central BI access currently requires the platform administrator role. Entity filters are enforced in backend queries, and every dashboard view records the user, entity scope, filters, report key, and request ID. Metric definitions are immutable by version and retain ownership, units, aggregation, and drill-down level.

## Verification

The release passes TypeScript validation, 42 automated tests, and the production build. Tests cover inter-entity elimination semantics, budget variance, and deterministic quality scoring. Desktop and mobile views are verified on `/bi`.

## Next vertical slices

Operational metric adapters, currency conversion tables, consolidated financial statements, forecasts, interactive drill-down, scoped CSV/XLSX/PDF generation, scheduled report delivery, SCD dimensions beyond entity, materialized refresh jobs, and analyst/entity roles remain incremental slices on this foundation.
