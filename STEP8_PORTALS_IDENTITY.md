# RASD Step 8 — Central Identity and Entity Portals

## Architectural boundary

RASD keeps one authenticated platform identity while every operational customer, supplier, partner, contract, invoice, vehicle, and service remains owned by its business entity. Access requires an active `entity_membership`; a central account alone grants no operational visibility.

## Delivered foundation

The schema adds identity security profiles and session metadata, entity memberships with roles/scopes/dates, optional links to local entity records, invitations, notifications, tickets/messages, entity-scoped payment sessions, optional disabled relationship references, and immutable portal audit entries. Passwords are not stored by the portal layer; the existing OAuth/JWT identity flow remains authoritative.

## Authorization

The `portal` router resolves memberships using the authenticated user ID, target `businessEntityId`, active status, and expiry. Portal context, notifications, tickets, profiles, and payment sessions are filtered server-side. Payment idempotency is scoped by entity. Membership revocation or expiry immediately prevents context access.

## User experience

`/portal` provides an Arabic-first responsive portal shell, secure login state, entity switcher, explicit no-membership and denied-access states, profile/notification/ticket/permission summaries, and entry cards for invoices, documents, and support.

## Verification

The release passes TypeScript validation, 36 automated tests, and the production build. Tests cover membership expiry/revocation, entity plus local-profile ownership, and scope normalization. Desktop and mobile portal layouts are visually verified.

## Next vertical slices

Entity-specific vehicle/product listings, invoice adapters, document upload/versioning, MFA challenge enrollment, device revocation UI, invitation acceptance, real payment gateway checkout, SMS/push channels, and public SEO pages remain incremental slices on the delivered secure framework.
