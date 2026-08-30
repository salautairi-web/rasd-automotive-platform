# RASD Event Catalog

Event records contain eventId, eventType, version, sourceSystem, entityType, entityId, correlationId, timestamp, payload, status, retryCount, and lastError. Initial catalog examples are CustomerCreated, VehicleCreated, VehicleImported, VehicleSold, WorkOrderCreated, PartIssued, PaymentReceived, InvoicePosted, and JournalPosted.

## Step 2 routing

Central ERP financial events must identify `sourceEntity` and may identify `targetEntity` for inter-entity work. New event families include FinancialEventPosted, InterEntityTransferRequested, InterEntityTransferMatched, CapitalContributionApproved, LoanApproved, ConsolidationRunCompleted, and ConsolidationExceptionRaised. An event is an observation or integration message, not a direct database command; the source entity remains responsible for local posting and the ERP records the central envelope and consolidation status.
