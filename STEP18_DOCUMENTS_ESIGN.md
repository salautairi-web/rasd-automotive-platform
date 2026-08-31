# RASD Step 18 — Documents, eSignature & Records

## Boundary and storage

The platform is technically centralized while every document remains owned by its business entity and source transaction. File bytes are stored in object storage; the database stores metadata, immutable version references, checksums, ownership, classifications, retention dates, and access evidence.

## Delivered foundation

The model includes document types, entity documents, immutable version chains, templates, approvals, provider-neutral signature requests and ordered signers, evidence events, legal holds, expiring secure shares, access logs, and audit. Signed versions are marked immutable instead of overwritten.

## Protected services

The `documentManagement` router provides entity-scoped dashboard/search, object-storage upload with SHA-256 integrity, and idempotent signature request creation. Document/version/signature references are validated against the owning entity. Secure share tokens are stored only as hashes.

## Records controls

Disposal is blocked while an active legal hold exists or retention has not expired. Signature-order rules require preceding signers. Share access requires an unexpired, non-revoked token below its usage limit. The adapter remains provider-neutral and does not claim jurisdiction-specific legal validity.

## Verification

The release passes TypeScript validation, 72 automated tests, and the production build. Tests cover immutable versioning, legal-hold disposal blocking, ordered signing, and secure-share validity. Desktop and mobile views are verified on `/documents-center`.

## Next vertical slices

Interactive upload/version forms, malware scanning, document approval, signature provider callbacks, final signed-file ingestion, retention scheduler, secure-share public endpoint, OCR review, templates/PDF generation, portal adapters, granular document roles, and disposal workflow remain incremental slices.
