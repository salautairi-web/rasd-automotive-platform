# RASD Step 9 — Central Operations

## Boundary

Central Operations creates decisions, commands, tasks, approvals, dispatch envelopes, and escalation records. It never writes operational customer, vehicle, inventory, service, or accounting records in a target entity. Execution is delegated through events carrying target entity, target system, command, task, and correlation identifiers.

## Delivered foundation

The data model includes idempotent commands, staged approvals, dispatch attempts, central tasks, dependencies, comments, versioned workflows and runs, temporary delegations, SLA rules, escalations, and operation audit entries. The `centralOperations` router provides executive metrics, command/task reads, command creation, approval, dispatch, task creation/completion, and SLA evaluation.

## Security

Central command and dashboard mutations require the platform `admin` role. Target entity and system are mandatory. Dispatch writes only to the integration event infrastructure. Task completion requires the assignee or central administrator, satisfied dependencies, an allowed state, and completion evidence.

## Idempotency and lifecycle

Command idempotency is unique per target entity. Approval is accepted only from `pending_approval`. Dispatch is accepted only after approval or from a non-approval draft. Dispatch events and attempt numbers are unique. Duplicate escalation levels are updated rather than duplicated.

## Verification

The release passes TypeScript validation, 39 automated tests, and the production build. Tests cover approval and dispatch guards, dependency/evidence completion rules, and escalation-level timing. Desktop and mobile views are verified on `/operations`.

## Next vertical slices

Visual workflow editing, parallel approvals, delegation resolution, end-user recurring-task schedules, automated Heartbeat SLA evaluation, notification channels, attachment evidence, entity completion callbacks, retry/dead-letter operations, and performance reports remain incremental slices on this foundation.
