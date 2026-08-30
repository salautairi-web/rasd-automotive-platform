# RASD Architecture

Phase 1 uses a modular monolith with explicit boundaries: Identity, Organization, Master Data, Integration, Workflow, Tasks, Documents, Audit, and Reporting foundation. Modules communicate through typed procedures and event/command contracts; no module may query another module's tables directly.

The current managed scaffold uses React, tRPC, Express, Drizzle, and MySQL-compatible storage. The domain boundaries are designed for later extraction into services when scale requires it.
