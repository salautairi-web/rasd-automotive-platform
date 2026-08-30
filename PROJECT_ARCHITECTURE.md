# RASD Architecture

Phase 1 uses a modular monolith with explicit boundaries: Identity, Organization, Master Data, Integration, Workflow, Tasks, Documents, Audit, and Reporting foundation. Modules communicate through typed procedures and event/command contracts; no module may query another module's tables directly.

The current managed scaffold uses React, tRPC, Express, Drizzle, and MySQL-compatible storage. The domain boundaries are designed for later extraction into services when scale requires it.

## Step 2 correction — independent business entities

Central ERP is an administrative and consolidation boundary, not a shared operational master. `business_entities` is a registry of entity metadata only. Customers, vehicles, and products now carry `businessEntityId` and local composite identifier uniqueness; global VIN uniqueness has been removed. Central procedures exchange data through API/Event/Command contracts and must not access operational databases directly. Local ledgers remain authoritative, while ERP stores validated envelopes and consolidation observations.
