# RASD Security Model

Access is layered through OAuth session identity, role checks, permission scopes, and organization/branch context. Sensitive operations require protected procedures, input validation, correlation IDs, idempotency keys, and audit records. Search and future detail procedures must apply the same scope filters; audit logs are append-only from normal application paths.

## Step 2 boundary

Central ERP access to `business_entities`, portfolio metrics, and accounting-book metadata does not grant operational access to an entity. Customer, vehicle, product, supplier, and inventory operations require an explicit `businessEntityId` scope. Integration administration and entity registration require administrator authorization. The Central ERP stores administrative envelopes and consolidation observations; it does not modify a local entity ledger or inventory directly.
