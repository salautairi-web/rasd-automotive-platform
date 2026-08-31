CREATE TABLE `asset_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`assetId` int NOT NULL,
	`employeeId` int,
	`departmentId` int,
	`branchId` int,
	`locationName` varchar(180),
	`assignedAt` timestamp NOT NULL,
	`returnedAt` timestamp,
	`conditionAtAssignment` varchar(100),
	`acceptedBy` int,
	CONSTRAINT `asset_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`assetId` int,
	`requestId` varchar(80) NOT NULL,
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `asset_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_capitalizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`assetId` int NOT NULL,
	`documentStorageKey` varchar(300) NOT NULL,
	`directCostsMinor` int NOT NULL DEFAULT 0,
	`installationMinor` int NOT NULL DEFAULT 0,
	`freightCustomsMinor` int NOT NULL DEFAULT 0,
	`approvedBy` int NOT NULL,
	`capitalizedAt` timestamp NOT NULL,
	`correlationId` varchar(80) NOT NULL,
	CONSTRAINT `asset_capitalizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_capitalization_unique` UNIQUE(`businessEntityId`,`assetId`)
);
--> statement-breakpoint
CREATE TABLE `asset_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`categoryCode` varchar(60) NOT NULL,
	`nameAr` varchar(160) NOT NULL,
	`depreciationMethod` enum('straight_line','declining_balance','units_of_production','none') NOT NULL DEFAULT 'straight_line',
	`defaultUsefulLifeMonths` int NOT NULL,
	`capitalizationThresholdMinor` int NOT NULL DEFAULT 0,
	`assetAccountCode` varchar(60),
	`accumulatedDepreciationAccountCode` varchar(60),
	`depreciationExpenseAccountCode` varchar(60),
	CONSTRAINT `asset_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_category_code_unique` UNIQUE(`businessEntityId`,`categoryCode`)
);
--> statement-breakpoint
CREATE TABLE `asset_cwip` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`projectCode` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`costMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`status` enum('planned','in_progress','ready_for_use','capitalized','cancelled') NOT NULL DEFAULT 'planned',
	`targetAssetId` int,
	CONSTRAINT `asset_cwip_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_cwip_code_unique` UNIQUE(`businessEntityId`,`projectCode`)
);
--> statement-breakpoint
CREATE TABLE `asset_depreciation_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`assetId` int NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`amountMinor` int NOT NULL,
	`openingBookValueMinor` int NOT NULL,
	`closingBookValueMinor` int NOT NULL,
	`status` enum('calculated','approved','posted','reversed') NOT NULL DEFAULT 'calculated',
	`postedBy` int,
	`postedAt` timestamp,
	`correlationId` varchar(80) NOT NULL,
	CONSTRAINT `asset_depreciation_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_depreciation_period_unique` UNIQUE(`businessEntityId`,`assetId`,`periodCode`)
);
--> statement-breakpoint
CREATE TABLE `asset_disposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`assetId` int NOT NULL,
	`method` enum('sale','scrap','write_off') NOT NULL,
	`reason` text NOT NULL,
	`proceedsMinor` int NOT NULL DEFAULT 0,
	`bookValueMinor` int NOT NULL,
	`gainLossMinor` int NOT NULL,
	`status` enum('pending','approved','posted','cancelled') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`disposedAt` timestamp,
	`correlationId` varchar(80) NOT NULL,
	CONSTRAINT `asset_disposals_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_disposal_unique` UNIQUE(`businessEntityId`,`assetId`)
);
--> statement-breakpoint
CREATE TABLE `asset_impairments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`assetId` int NOT NULL,
	`triggerReason` text NOT NULL,
	`recoverableAmountMinor` int NOT NULL,
	`impairmentLossMinor` int NOT NULL,
	`status` enum('pending','approved','posted','reversed') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`correlationId` varchar(80) NOT NULL,
	CONSTRAINT `asset_impairments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_maintenance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`assetId` int NOT NULL,
	`maintenanceType` enum('preventive','corrective','calibration','inspection') NOT NULL,
	`status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`scheduledAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`costMinor` int NOT NULL DEFAULT 0,
	`downtimeMinutes` int NOT NULL DEFAULT 0,
	`provider` varchar(180),
	`nextDueAt` timestamp,
	CONSTRAINT `asset_maintenance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_transfers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceEntityId` int NOT NULL,
	`targetEntityId` int,
	`assetId` int NOT NULL,
	`transferType` enum('internal','inter_entity_sale','inter_entity_transfer') NOT NULL,
	`targetBranchId` int,
	`targetDepartmentId` int,
	`transferValueMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`status` enum('pending','approved','executed','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`correlationId` varchar(80) NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	CONSTRAINT `asset_transfers_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_transfer_key_unique` UNIQUE(`sourceEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `entity_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`assetNo` varchar(80) NOT NULL,
	`categoryId` int NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`description` text,
	`localSourceSystem` varchar(80),
	`localSourceId` varchar(100),
	`branchId` int,
	`departmentId` int,
	`costCenterId` int,
	`custodianEmployeeId` int,
	`locationName` varchar(180),
	`acquisitionDate` timestamp NOT NULL,
	`capitalizationDate` timestamp,
	`acquisitionCostMinor` int NOT NULL,
	`capitalizedCostMinor` int NOT NULL DEFAULT 0,
	`residualValueMinor` int NOT NULL DEFAULT 0,
	`accumulatedDepreciationMinor` int NOT NULL DEFAULT 0,
	`impairmentMinor` int NOT NULL DEFAULT 0,
	`bookValueMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`usefulLifeMonths` int NOT NULL,
	`status` enum('requested','received','capitalized','active','under_maintenance','transferred','impaired','disposed','archived') NOT NULL DEFAULT 'requested',
	`idempotencyKey` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entity_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `entity_asset_no_unique` UNIQUE(`businessEntityId`,`assetNo`),
	CONSTRAINT `entity_asset_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
