# RASD Step 19 — Workflow, Notifications & Automation Engine

## Architecture and boundaries

The automation platform is technically centralized while every entity workflow retains an owner entity. Central and cross-entity workflows may orchestrate commands, but they never write directly into operational tables owned by another system. External effects are emitted as commands to the authorized owner API.

## Delivered workflow model

The model includes versioned workflows, event/time/condition/approval/schedule/threshold/exception/document triggers, AND/OR rule groups, ordered actions, live and dry-run executions, persisted run steps, approvals, tasks, notification deliveries, SLA escalations, retry schedules, failures, dead letters, Heartbeat schedules, and immutable audit records.

## Runtime controls

Every run carries a run ID, event ID, correlation ID, entity scope, mode, parent run, and idempotency key. Duplicate events replay the stored run. Maximum workflow depth prevents recursive loops. Workflow definitions reject credential-like keys. Actions create local automation artifacts or owner-API commands rather than bypassing authorization.

## Notifications and scheduling

Notification rows support in-app, email, SMS, push, and webhook adapters with recipient/channel deduplication and priority. Project-owner in-app alerts use the platform notification helper. End-user notifications remain in the application delivery queue. Heartbeat callbacks authenticate cron identity, look up the schedule by task UID, trigger the workflow idempotently, and evaluate due SLA escalations.

## Verification

The release passes TypeScript validation, 76 automated tests, and the production build. Tests cover compound rules, exponential retry backoff, dead-letter decisions, loop-depth protection, and overnight quiet hours. Desktop and mobile views are verified on `/automation`.

## Next vertical slices

The visual drag-and-drop builder, full retry worker execution, notification provider adapters, quiet-hour preferences, granular workflow roles, approval continuation, wait-node resumption, compensation orchestration, and schedule lifecycle UI remain incremental slices.
