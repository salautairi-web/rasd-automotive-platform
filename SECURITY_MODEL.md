# RASD Security Model

Access is layered through OAuth session identity, role checks, permission scopes, and organization/branch context. Sensitive operations require protected procedures, input validation, correlation IDs, idempotency keys, and audit records. Search and future detail procedures must apply the same scope filters; audit logs are append-only from normal application paths.
