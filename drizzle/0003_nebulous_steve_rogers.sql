CREATE TABLE `accounting_books` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`bookCode` varchar(60) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`currency` varchar(8) NOT NULL,
	`status` enum('active','closed') NOT NULL DEFAULT 'active',
	CONSTRAINT `accounting_books_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`accountCode` varchar(40) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`accountType` varchar(40) NOT NULL,
	`parentAccountId` int,
	`isControl` int NOT NULL DEFAULT 0,
	`isPostable` int NOT NULL DEFAULT 1,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_entities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityId` varchar(40) NOT NULL,
	`code` varchar(40) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`nameEn` varchar(180),
	`entityType` enum('company','subsidiary','business_project','business_activity','investment_vehicle','future') NOT NULL,
	`parentCompanyId` int,
	`currency` varchar(8) NOT NULL DEFAULT 'OMR',
	`timezone` varchar(64) NOT NULL DEFAULT 'Asia/Muscat',
	`status` enum('active','inactive','planned') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_entities_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_entities_entityId_unique` UNIQUE(`entityId`),
	CONSTRAINT `business_entities_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `consolidation_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`status` enum('draft','running','completed','failed') NOT NULL DEFAULT 'draft',
	`missingEvents` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consolidation_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `entity_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	CONSTRAINT `entity_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fiscal_periods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	CONSTRAINT `fiscal_periods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inter_entity_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceEntityId` int NOT NULL,
	`targetEntityId` int NOT NULL,
	`transactionType` varchar(60) NOT NULL,
	`status` enum('draft','pending','matched','eliminated') NOT NULL DEFAULT 'draft',
	`sourceReference` varchar(80),
	`targetReference` varchar(80),
	`amountMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`correlationId` varchar(80) NOT NULL,
	CONSTRAINT `inter_entity_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`entryNo` varchar(60) NOT NULL,
	`sourceSystem` varchar(60) NOT NULL,
	`sourceType` varchar(60) NOT NULL,
	`sourceId` varchar(80) NOT NULL,
	`status` enum('draft','validated','approved','posted','reversed') NOT NULL DEFAULT 'draft',
	`correlationId` varchar(80),
	`postedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `journal_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `journal_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`journalEntryId` int NOT NULL,
	`accountId` int NOT NULL,
	`description` text,
	`debitMinor` int NOT NULL DEFAULT 0,
	`creditMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`costCenterId` int,
	CONSTRAINT `journal_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`revenueMinor` int NOT NULL DEFAULT 0,
	`profitMinor` int NOT NULL DEFAULT 0,
	`capitalInvestedMinor` int NOT NULL DEFAULT 0,
	`roiBps` int NOT NULL DEFAULT 0,
	CONSTRAINT `portfolio_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `vehicles` DROP INDEX `vehicles_vin_unique`;--> statement-breakpoint
ALTER TABLE `customers` ADD `businessEntityId` int;