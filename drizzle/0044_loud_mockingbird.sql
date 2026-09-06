CREATE TABLE `asset_components` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`assetId` int NOT NULL,
	`componentCode` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`costMinor` int NOT NULL,
	`residualValueMinor` int NOT NULL DEFAULT 0,
	`usefulLifeMonths` int NOT NULL,
	`accumulatedDepreciationMinor` int NOT NULL DEFAULT 0,
	`status` enum('active','replaced','disposed') NOT NULL DEFAULT 'active',
	CONSTRAINT `asset_components_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_component_code_unique` UNIQUE(`businessEntityId`,`assetId`,`componentCode`)
);
--> statement-breakpoint
CREATE TABLE `asset_depreciation_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`runNo` varchar(80) NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`bookCode` varchar(60) NOT NULL,
	`methodScope` varchar(100),
	`totalAmountMinor` int NOT NULL DEFAULT 0,
	`status` enum('draft','calculated','pending_approval','approved','posted','reversed') NOT NULL DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`approvedBy` int,
	`correlationId` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `asset_depreciation_runs_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_depreciation_run_unique` UNIQUE(`businessEntityId`,`bookCode`,`periodCode`)
);
--> statement-breakpoint
CREATE TABLE `asset_insurances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`assetId` int NOT NULL,
	`provider` varchar(180) NOT NULL,
	`policyNo` varchar(100) NOT NULL,
	`coverageMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`startsAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`documentStorageKey` varchar(300),
	`status` enum('active','expired','cancelled') NOT NULL DEFAULT 'active',
	CONSTRAINT `asset_insurances_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_insurance_policy_unique` UNIQUE(`businessEntityId`,`policyNo`)
);
--> statement-breakpoint
CREATE TABLE `asset_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`assetId` int NOT NULL,
	`verificationNo` varchar(80) NOT NULL,
	`verifiedBy` int NOT NULL,
	`verifiedAt` timestamp NOT NULL,
	`locationConfirmed` boolean NOT NULL DEFAULT false,
	`custodianConfirmed` boolean NOT NULL DEFAULT false,
	`condition` varchar(100),
	`exceptionNotes` text,
	`evidenceStorageKey` varchar(300),
	`status` enum('verified','exception','resolved') NOT NULL DEFAULT 'verified',
	CONSTRAINT `asset_verifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_verification_no_unique` UNIQUE(`businessEntityId`,`verificationNo`)
);
--> statement-breakpoint
CREATE TABLE `asset_warranties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`assetId` int NOT NULL,
	`provider` varchar(180) NOT NULL,
	`warrantyNo` varchar(100),
	`startsAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`coverageJson` text,
	`status` enum('active','expired','void') NOT NULL DEFAULT 'active',
	CONSTRAINT `asset_warranties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_consent_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`customerId` int NOT NULL,
	`purpose` enum('service','transactional','marketing','profiling') NOT NULL,
	`channel` enum('email','sms','whatsapp','phone','push','portal') NOT NULL,
	`decision` enum('granted','withdrawn','opted_out') NOT NULL,
	`source` varchar(120) NOT NULL,
	`evidenceRef` varchar(300),
	`effectiveAt` timestamp NOT NULL,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_consent_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`customerId` int NOT NULL,
	`channel` enum('portal','mobile','email','sms','whatsapp','phone','in_person','web') NOT NULL,
	`direction` enum('inbound','outbound') NOT NULL,
	`subject` varchar(220),
	`summary` text,
	`sourceSystem` varchar(100) NOT NULL,
	`sourceRecordId` varchar(120),
	`consentVerified` boolean NOT NULL DEFAULT false,
	`occurredAt` timestamp NOT NULL,
	`correlationId` varchar(100) NOT NULL,
	CONSTRAINT `crm_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_loyalty_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`programId` int NOT NULL,
	`customerId` int NOT NULL,
	`accountNo` varchar(100) NOT NULL,
	`tier` varchar(80),
	`pointsBalance` int NOT NULL DEFAULT 0,
	`lifetimePoints` int NOT NULL DEFAULT 0,
	`status` enum('active','suspended','closed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_loyalty_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_loyalty_account_unique` UNIQUE(`businessEntityId`,`programId`,`customerId`),
	CONSTRAINT `crm_loyalty_account_no_unique` UNIQUE(`businessEntityId`,`accountNo`)
);
--> statement-breakpoint
CREATE TABLE `crm_loyalty_programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`programCode` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`currencyNameAr` varchar(80) NOT NULL,
	`rulesJson` text NOT NULL,
	`status` enum('draft','active','paused','retired') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_loyalty_programs_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_loyalty_program_entity_code_unique` UNIQUE(`businessEntityId`,`programCode`)
);
--> statement-breakpoint
CREATE TABLE `crm_loyalty_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`accountId` int NOT NULL,
	`transactionType` enum('earn','redeem','expire','adjust','reverse') NOT NULL,
	`points` int NOT NULL,
	`sourceSystem` varchar(100) NOT NULL,
	`sourceRecordId` varchar(120) NOT NULL,
	`idempotencyKey` varchar(160) NOT NULL,
	`balanceAfter` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_loyalty_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_loyalty_transaction_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `crm_segments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`segmentCode` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`criteriaJson` text NOT NULL,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_segments_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_segment_entity_code_unique` UNIQUE(`businessEntityId`,`segmentCode`)
);
--> statement-breakpoint
CREATE TABLE `inventory_adjustments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`productId` int NOT NULL,
	`locationId` int,
	`quantity` decimal(16,3) NOT NULL,
	`unitCostMinor` int NOT NULL DEFAULT 0,
	`reasonCode` varchar(80) NOT NULL,
	`evidenceStorageKey` varchar(300),
	`status` enum('draft','pending_approval','approved','posted','rejected') NOT NULL DEFAULT 'draft',
	`requestedBy` int NOT NULL,
	`approvedBy` int,
	`idempotencyKey` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_adjustments_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_adjustment_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `inventory_reorder_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`productId` int NOT NULL,
	`minimumQty` decimal(16,3) NOT NULL,
	`maximumQty` decimal(16,3) NOT NULL,
	`reorderPoint` decimal(16,3) NOT NULL,
	`reorderQty` decimal(16,3) NOT NULL,
	`leadTimeDays` int NOT NULL DEFAULT 0,
	`status` enum('active','paused') NOT NULL DEFAULT 'active',
	CONSTRAINT `inventory_reorder_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_reorder_rule_unique` UNIQUE(`businessEntityId`,`warehouseId`,`productId`)
);
--> statement-breakpoint
CREATE TABLE `inventory_transfer_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transferId` int NOT NULL,
	`productId` int NOT NULL,
	`batchId` int,
	`serialId` int,
	`requestedQty` decimal(16,3) NOT NULL,
	`shippedQty` decimal(16,3) NOT NULL DEFAULT '0',
	`receivedQty` decimal(16,3) NOT NULL DEFAULT '0',
	`unitCostMinor` int NOT NULL DEFAULT 0,
	CONSTRAINT `inventory_transfer_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `procurement_negotiations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`eventId` int NOT NULL,
	`supplierId` int NOT NULL,
	`roundNo` int NOT NULL,
	`openingAmountMinor` int NOT NULL,
	`finalAmountMinor` int,
	`termsJson` text,
	`savingsMinor` int NOT NULL DEFAULT 0,
	`status` enum('planned','active','agreed','failed','cancelled') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procurement_negotiations_id` PRIMARY KEY(`id`),
	CONSTRAINT `procurement_negotiation_round_unique` UNIQUE(`eventId`,`supplierId`,`roundNo`)
);
--> statement-breakpoint
CREATE TABLE `procurement_sourcing_bids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`eventId` int NOT NULL,
	`supplierId` int NOT NULL,
	`bidNo` varchar(80) NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`technicalScoreBps` int NOT NULL DEFAULT 0,
	`commercialScoreBps` int NOT NULL DEFAULT 0,
	`riskScoreBps` int NOT NULL DEFAULT 0,
	`totalScoreBps` int NOT NULL DEFAULT 0,
	`status` enum('submitted','shortlisted','selected','rejected','withdrawn') NOT NULL DEFAULT 'submitted',
	`submittedAt` timestamp NOT NULL,
	CONSTRAINT `procurement_sourcing_bids_id` PRIMARY KEY(`id`),
	CONSTRAINT `procurement_sourcing_bid_supplier_unique` UNIQUE(`eventId`,`supplierId`)
);
--> statement-breakpoint
CREATE TABLE `procurement_sourcing_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`eventNo` varchar(80) NOT NULL,
	`category` varchar(120) NOT NULL,
	`titleAr` varchar(220) NOT NULL,
	`eventType` enum('rfi','rfq','rfp','auction','negotiation') NOT NULL,
	`budgetMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`evaluationModelJson` text NOT NULL,
	`deadline` timestamp NOT NULL,
	`status` enum('draft','approved','open','evaluating','awarded','closed','cancelled') NOT NULL DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procurement_sourcing_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `procurement_sourcing_event_no_unique` UNIQUE(`businessEntityId`,`eventNo`)
);
--> statement-breakpoint
CREATE TABLE `procurement_supplier_risks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`supplierId` int NOT NULL,
	`riskType` enum('financial','operational','compliance','quality','delivery','concentration','geographic') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`evidenceJson` text,
	`mitigationPlan` text,
	`ownerUserId` int,
	`status` enum('open','mitigating','accepted','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procurement_supplier_risks_id` PRIMARY KEY(`id`)
);
