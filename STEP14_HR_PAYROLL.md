# RASD Step 14 — HR, Payroll & Workforce Management

## Architectural boundary

Corporate HR owns policies, job architecture, controls, and consolidated reporting. Each business entity owns its employee records, contracts, attendance, leave, payroll, expenses, performance, and employment accounting. Central identity may be referenced by `userId`, but it does not replace the local employee record.

## Delivered workforce model

The foundation includes corporate HR policies; entity-local positions and employees; versioned employment contracts; shifts and idempotent attendance; leave types, balances, and requests; payroll periods, idempotent runs, and employee lines; expense claims; performance reviews; inter-entity service assignments; offboarding controls; and immutable HR audit.

## Protected lifecycle

The `hr` router provides entity-scoped dashboard and employee directory, employee creation, attendance recording, leave requests with balance checks, payroll generation from active local contracts, maker/checker payroll approval, payroll posting events for ERP, and offboarding with access-revocation events.

## Privacy and finance controls

HR procedures currently require administrator privilege, and all operational reads filter by business entity. Dashboard and directory outputs intentionally omit salaries, bank details, payroll lines, and payslips. Payroll approval prevents self-approval, posting requires approved status, and every payroll run is unique by entity and idempotency key.

## Verification

The release passes TypeScript validation, 56 automated tests, and the production build. Tests cover net-pay calculation, non-negative leave rules, payroll maker/checker, approved-only posting, and attendance time ordering. Desktop and mobile views are verified on `/hr`.

## Next vertical slices

Recruitment, onboarding checklists, overtime approvals, benefits, training, asset assignment, expense reimbursement, detailed performance forms, payslips, employee self-service, local payroll journals, statutory calculations, entity HR roles, MFA enforcement, and scheduled contract expiry alerts remain incremental slices on this foundation.
