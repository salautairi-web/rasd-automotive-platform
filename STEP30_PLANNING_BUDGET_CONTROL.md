# STEP 30 — Planning, Budgeting, Forecasting & Management Control

## Delivered foundation

RASD now has a planning and management-control projection that remains separate from operational ledgers. Planning cycles are versioned by fiscal year and scenario, while entity-owned versions and budget lines carry account, period, cost-center, department, project, vehicle, currency, driver, and source metadata.

The protected `planning` tRPC router exposes entity-scoped cycle, version, budget-line, variance, forecast, and corrective-action reads. It also supports creating cycles and versions, adding budget lines, submitting and approving versions with maker-checker separation, recording idempotent actuals using source-row identity, calculating variances, creating reviewed forecasts, and recording management actions. Approval and status data are persisted rather than inferred in the UI.

The model includes actuals, commitments, variance status, forecast bounds and confidence, assumptions, model version, review state, and audit-ready identifiers. Empty dashboards remain empty when no records exist; no budget, actual, forecast, or variance figures are invented.

## UI and controls

The Arabic-first workspace is available at `/planning`. It presents cycles, budget versions, pending approvals, critical variances, forecast counts, corrective actions, and a clear statement that operational ledgers remain the source of truth. The layout supports RTL on desktop and mobile and exposes scoped empty states for each planning view.

## Deferred boundaries

Full ERP posting, distributed planning workers, external planning integrations, and predictive models requiring sufficient historical data remain deferred. Forecast records require an explicit model version and review status; this foundation does not claim that forecasts are authoritative without human review.

## Verification

The work was validated with TypeScript, the full Vitest suite, production build, and desktop/mobile visual QA. Planning tests cover variance thresholds, maker-checker, deterministic period spreading, forecast confidence bounds, and entity isolation.
