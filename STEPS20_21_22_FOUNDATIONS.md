# RASD — Foundations for Steps 20, 21, and 22

## Executive summary

This increment adds the shared platform foundations requested by the three supplied specifications. RASD now has persistent metadata for service and API registration, entity-aware requests, versioned event envelopes, consumer delivery state, webhook delivery tracking, transformations, retries, dead letters, incidents, health checks, and integration audit. The same increment adds IAM/RBAC structures for roles, permissions, role grants, entity memberships, policies, security events, access reviews, and controlled impersonation metadata. Mobile-facing foundations cover device registration, push-token hashes, sync cursors, an idempotent sync queue, conflict records, and mobile audit.

The implementation intentionally reuses the existing OAuth, tRPC, Drizzle, storage, notification, Heartbeat, and DashboardLayout foundations. It does **not** introduce a second operational database, activate external providers, or place secrets in source code, workflow definitions, audit payloads, or fixtures.

## Step 20 — Integration Hub and Event Bus

The integration schema separates the existing legacy event log from the new richer bus envelope. `integration_services` and `integration_apis` provide a versioned registry with owner system, entity scope, capabilities, authentication method, permissions, and rate-limit metadata. `integration_requests` and `integration_audit` preserve correlation and payload hashes without persisting secrets. `integration_bus_events` records source and target context, aggregate and command references, schema/event versions, idempotency, and lifecycle status.

The protected `integrations` tRPC router provides scoped dashboards and reads, service registration, API registration, event publication, dead-letter and incident reads, and request recording. Duplicate idempotency keys replay the original event; reuse with a different payload hash returns a conflict. The Arabic `/integrations-center` workspace exposes live database counts and clear empty, loading, and authorization states.

Webhook metadata, delivery attempts, signature method, replay flags, transformations, retries, health checks, and incidents are persisted as adapter-ready foundations. Provider-specific outbound calls are deliberately deferred until an official endpoint and an approved credential are supplied.

## Step 21 — IAM, RBAC, and entity security

The protected `iam` router adds dashboard metrics, membership and role reads, role creation with permission IDs, entity membership grants, authorization decisions, security-event recording, access-review reads, and review decisions. The default decision is deny. Membership is entity-specific and a central role cannot be granted by a non-central actor. Sensitive approval decisions are represented by pure helpers that enforce permission, scope, amount limit, and maker-checker separation.

Existing Manus OAuth remains the initial identity provider. The data model is ready for OIDC identities, MFA methods, devices, service accounts, session rotation, and attribute-driven policies; provider-specific MFA/WebAuthn wiring is a later slice. The Arabic `/security` workspace provides a protected security overview without implying that unsupported MFA coverage already exists.

## Step 22 — Mobile and responsive experience

The protected `mobile` router supports device registration and revocation, push-token hashing, idempotent sync queue insertion, queue reads, cursor updates, and device ownership checks. Entity membership is rechecked for entity-specific operations. The `/mobile-experience` workspace presents the operational foundation and does not fabricate device, sync, or delivery metrics when the database is empty.

The responsive web experience remains the first mobile deliverable. It uses the shared dashboard shell, Arabic RTL layout, protected data reads, mobile-friendly cards, and explicit empty/error states. Native Expo packaging, camera/barcode/location adapters, push delivery infrastructure, offline conflict resolution, and deep-link authorization are intentionally staged after the API contracts stabilize.

## Security and reliability controls

The shared pure modules implement nested payload transformation, constant-time HMAC-SHA256 webhook verification with timestamp tolerance, schema compatibility checks, capped exponential backoff, entity-scope checks, permission checks, maker-checker approval rules, central-role grant protection, step-up requirements, and explicit default-deny results. These helpers are deterministic and covered by Vitest.

No in-process timer or unbounded background worker was introduced. Scheduled work continues to use the existing platform Heartbeat pattern. No direct database connection between bounded systems was introduced; event and command envelopes remain the integration boundary.

## Verification evidence

The current implementation passes TypeScript validation, **84 Vitest tests**, and the production build. The test suite includes event transformation and signature verification, schema compatibility and backoff, cross-entity denial, maker-checker rules, central-role protection, step-up decisions, and explicit default-deny behavior. The integration, security, and mobile workspaces are registered in the application router and shared navigation.

## Deferred production slices

The following items remain deliberately outside this foundation increment: provider-specific payment/bank/SMS/email/insurance/maps/shipping/e-signature adapters; externally published OpenAPI artifacts; a distributed queue worker and shared circuit-breaker state; production TOTP/WebAuthn and biometric attestation; native Expo distribution; camera/barcode/location permissions; push-provider delivery; full offline conflict resolution; deep-link reauthorization; and full role-specific mobile workspaces for every RASD module.

## Acceptance boundary

The delivered code establishes the contracts and persistence needed for the next slices without claiming that every external provider or native capability is already production-connected. Any promotion of a deferred feature to active scope should first add its provider, credential, security, migration, and end-to-end acceptance requirements to `todo.md`.
