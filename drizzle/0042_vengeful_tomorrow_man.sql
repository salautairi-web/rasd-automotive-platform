CREATE TABLE `dms_contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`documentId` int NOT NULL,
	`contractNo` varchar(100) NOT NULL,
	`contractType` varchar(100) NOT NULL,
	`partyRefsJson` text NOT NULL,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`noticeDays` int NOT NULL DEFAULT 30,
	`valueMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`obligationsJson` text,
	`renewalMode` enum('none','manual','automatic') NOT NULL DEFAULT 'none',
	`status` enum('draft','active','expired','terminated') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dms_contracts_id` PRIMARY KEY(`id`),
	CONSTRAINT `dms_contracts_documentId_unique` UNIQUE(`documentId`),
	CONSTRAINT `dms_contract_no_unique` UNIQUE(`businessEntityId`,`contractNo`)
);
--> statement-breakpoint
CREATE TABLE `dms_document_expiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`documentId` int NOT NULL,
	`expiryType` enum('document','license','insurance','contract') NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`reminderDays` int NOT NULL DEFAULT 30,
	`status` enum('scheduled','notified','expired','resolved') NOT NULL DEFAULT 'scheduled',
	`escalationLevel` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dms_document_expiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dms_document_metadata` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`documentId` int NOT NULL,
	`metadataKey` varchar(120) NOT NULL,
	`metadataValue` text,
	`pii` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dms_document_metadata_id` PRIMARY KEY(`id`),
	CONSTRAINT `dms_document_metadata_key_unique` UNIQUE(`businessEntityId`,`documentId`,`metadataKey`)
);
--> statement-breakpoint
CREATE TABLE `dms_ocr_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`documentId` int NOT NULL,
	`versionId` int NOT NULL,
	`language` enum('ar','en','ar_en') NOT NULL DEFAULT 'ar_en',
	`extractedText` text,
	`confidenceBps` int NOT NULL DEFAULT 0,
	`status` enum('queued','processing','completed','needs_review','failed') NOT NULL DEFAULT 'queued',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dms_ocr_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dms_retention_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`documentTypeId` int,
	`policyKey` varchar(100) NOT NULL,
	`retentionMonths` int NOT NULL,
	`startEvent` enum('created','approved','signed','expired','closed') NOT NULL DEFAULT 'created',
	`reviewRequired` boolean NOT NULL DEFAULT true,
	`dispositionMode` enum('archive','secure_dispose','review') NOT NULL DEFAULT 'review',
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dms_retention_policies_id` PRIMARY KEY(`id`)
);
