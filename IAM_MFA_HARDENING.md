# RASD — IAM/MFA Hardening

## Scope

This increment strengthens the existing Manus OAuth-backed identity layer without replacing its callback or session flow. The platform now persists provider-neutral MFA method metadata, one-time challenge state, hashed challenge material, authenticated session metadata, trusted-device state, step-up policies, step-up verifications, and session audit records.

> **Security boundary:** RASD stores references and hashes, not plaintext MFA secrets, one-time codes, bearer tokens, or recovery credentials.

## MFA lifecycle

Users can start enrollment for TOTP, WebAuthn, or push as a provider-neutral method. Enrollment creates a pending method and a time-limited challenge. Verification checks ownership, expiry, attempt count, and challenge status before atomically activating the method. Invalid attempts increment the persisted counter and lock the challenge at the configured maximum. A verified method records enrollment and last-verification timestamps.

The initial implementation does not pretend to generate or deliver TOTP, WebAuthn, or push assertions. Provider-specific cryptographic registration and delivery remain adapter work. The current challenge path is therefore a safe contract and state machine, not a claim of completed external MFA delivery.

## Sessions and trusted devices

The IAM router lists only the current user's sessions and trusted devices, and revocation requires ownership. Session records retain hashes and lifecycle timestamps rather than raw session values. Revocation writes an audit record with a correlation ID. Device trust is explicit and supports untrusted, trusted, and step-up-only states. Existing mobile device records remain separate from IAM trust records so device enrollment cannot silently grant authorization.

## Step-up policy

Sensitive and critical permissions can be associated with an active policy defining MFA and fresh-session requirements. `evaluateStepUp` returns an explicit required/verified decision and checks the most recent verified step-up window. Normal actions do not require a step-up. The existing entity authorization layer remains default-deny and checks active membership, active role, and actual role-permission grant.

## Audit and privacy

Security and session events include user/entity/resource context, outcome, correlation ID, and bounded JSON details. Values that could identify a secret are not accepted as MFA storage fields; UI lists metadata only. Production logging must continue to use the existing redaction conventions. Access-review and membership changes remain auditable.

## Recovery and provider boundary

Recovery is represented as a challenge purpose but no recovery channel is activated automatically. Before production activation, the owner must select an approved provider, configure its connector through the project settings, define recovery ownership and support procedures, and complete an end-to-end test for enrollment, lost-device recovery, revocation, and audit evidence. No external MFA credentials were added in this increment.

## Verification

The implementation adds deterministic tests for one-way hashing, constant-time comparison, expiry, attempt limits, step-up freshness, session expiry, and existing RBAC cross-entity denial. TypeScript and the complete Vitest suite must pass before the IAM/MFA checkpoint is created; desktop and mobile security workspaces must show protected loading, empty, error, and action states.
