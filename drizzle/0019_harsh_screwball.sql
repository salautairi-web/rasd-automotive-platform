CREATE TABLE `central_change_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestNo` varchar(80) NOT NULL,
	`policyId` int,
	`referenceRegistryId` int,
	`changeType` enum('create','update','merge','deactivate','policy_change') NOT NULL,
	`requestedBy` int NOT NULL,
	`payloadJson` text NOT NULL,
	`status` enum('draft','pending','approved','rejected','applied','cancelled') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `central_change_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_change_request_no_unique` UNIQUE(`requestNo`)
);
--> statement-breakpoint
CREATE TABLE `central_data_mappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceEntityId` int NOT NULL,
	`sourceSystem` varchar(80) NOT NULL,
	`sourceRecordId` varchar(100) NOT NULL,
	`referenceRegistryId` int NOT NULL,
	`mappingType` enum('exact','probable','manual','merged') NOT NULL,
	`confidenceBps` int NOT NULL DEFAULT 10000,
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `central_data_mappings_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_data_mapping_source_unique` UNIQUE(`sourceEntityId`,`sourceSystem`,`sourceRecordId`)
);
--> statement-breakpoint
CREATE TABLE `central_duplicate_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referenceType` varchar(80) NOT NULL,
	`leftMappingId` int NOT NULL,
	`rightMappingId` int NOT NULL,
	`matchScoreBps` int NOT NULL,
	`status` enum('open','confirmed_duplicate','not_duplicate','merged') NOT NULL DEFAULT 'open',
	`decisionReason` text,
	`decidedBy` int,
	`decidedAt` timestamp,
	CONSTRAINT `central_duplicate_cases_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_duplicate_pair_unique` UNIQUE(`leftMappingId`,`rightMappingId`)
);
--> statement-breakpoint
CREATE TABLE `central_governance_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entityId` int,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` varchar(100) NOT NULL,
	`requestId` varchar(80) NOT NULL,
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `central_governance_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `central_inter_entity_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`stage` int NOT NULL DEFAULT 1,
	`approverUserId` int,
	`approverRoleKey` varchar(80),
	`decision` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`comment` text,
	`decidedAt` timestamp,
	CONSTRAINT `central_inter_entity_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `central_inter_entity_disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`openedByEntityId` int NOT NULL,
	`reason` varchar(220) NOT NULL,
	`details` text,
	`status` enum('open','under_review','resolved','rejected') NOT NULL DEFAULT 'open',
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `central_inter_entity_disputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `central_inter_entity_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`lineNo` int NOT NULL,
	`itemType` varchar(80) NOT NULL,
	`sourceRecordId` varchar(100) NOT NULL,
	`referenceRegistryId` int,
	`description` varchar(220) NOT NULL,
	`quantity` decimal(16,4) NOT NULL,
	`unitPriceMinor` int NOT NULL,
	`taxMinor` int NOT NULL DEFAULT 0,
	`lineTotalMinor` int NOT NULL,
	CONSTRAINT `central_inter_entity_lines_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_inter_entity_line_unique` UNIQUE(`transactionId`,`lineNo`)
);
--> statement-breakpoint
CREATE TABLE `central_inter_entity_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`sourceDocumentId` varchar(100) NOT NULL,
	`targetDocumentId` varchar(100) NOT NULL,
	`sourceAmountMinor` int NOT NULL,
	`targetAmountMinor` int NOT NULL,
	`exchangeRate` decimal(18,8) NOT NULL DEFAULT '1',
	`differenceMinor` int NOT NULL,
	`status` enum('match','partial_match','mismatch') NOT NULL,
	`matchedBy` int NOT NULL,
	`matchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `central_inter_entity_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `central_inter_entity_settlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`settlementType` enum('payment','netting','credit_note','debit_note') NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`settlementDate` timestamp NOT NULL,
	`sourceEventId` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `central_inter_entity_settlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_inter_entity_settlement_event_unique` UNIQUE(`sourceEventId`)
);
--> statement-breakpoint
CREATE TABLE `central_inter_entity_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionNo` varchar(80) NOT NULL,
	`transactionType` enum('sale','purchase','service','asset_transfer','vehicle_transfer','inventory_transfer','loan','funding') NOT NULL,
	`sourceEntityId` int NOT NULL,
	`targetEntityId` int NOT NULL,
	`sourceSystem` varchar(80) NOT NULL,
	`targetSystem` varchar(80) NOT NULL,
	`currency` varchar(8) NOT NULL,
	`grossAmountMinor` int NOT NULL,
	`outstandingMinor` int NOT NULL,
	`correlationId` varchar(80) NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	`status` enum('draft','pending_approval','approved','sent','accepted','posted','partially_matched','matched','settled','disputed','cancelled') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `central_inter_entity_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_inter_entity_tx_no_unique` UNIQUE(`transactionNo`),
	CONSTRAINT `central_inter_entity_tx_key_unique` UNIQUE(`sourceEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `central_reference_registry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referenceType` varchar(80) NOT NULL,
	`referenceCode` varchar(100) NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`ownerEntityId` int,
	`sourceSystem` varchar(80) NOT NULL,
	`sourceRecordId` varchar(100) NOT NULL,
	`status` enum('active','inactive','merged','retired') NOT NULL DEFAULT 'active',
	`version` int NOT NULL DEFAULT 1,
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	CONSTRAINT `central_reference_registry_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_reference_source_unique` UNIQUE(`ownerEntityId`,`sourceSystem`,`sourceRecordId`),
	CONSTRAINT `central_reference_code_unique` UNIQUE(`referenceType`,`referenceCode`)
);
--> statement-breakpoint
CREATE TABLE `central_governance_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyKey` varchar(100) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`policyType` enum('ownership','reference','naming','identity','transaction','approval','retention','audit') NOT NULL,
	`ownerRoleKey` varchar(80) NOT NULL,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`currentVersion` int NOT NULL DEFAULT 1,
	CONSTRAINT `central_governance_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `governance_policy_key_unique` UNIQUE(`policyKey`)
);
--> statement-breakpoint
CREATE TABLE `central_policy_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyId` int NOT NULL,
	`version` int NOT NULL,
	`rulesJson` text NOT NULL,
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `central_policy_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `governance_policy_version_unique` UNIQUE(`policyId`,`version`)
);
