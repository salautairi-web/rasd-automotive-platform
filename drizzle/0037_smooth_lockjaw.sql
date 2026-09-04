CREATE TABLE `cost_accounting_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` int NOT NULL,
	`action` varchar(60) NOT NULL,
	`actorUserId` int,
	`correlationId` varchar(120) NOT NULL,
	`beforeHash` varchar(128),
	`afterHash` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cost_accounting_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cost_allocation_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`ruleCode` varchar(80) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	`priority` int NOT NULL DEFAULT 1,
	`sourcePoolId` int,
	`driverId` int,
	`targetJson` text NOT NULL,
	`formulaJson` text,
	`status` enum('draft','pending_approval','approved','locked','rejected') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cost_allocation_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `cost_rule_entity_code_version_unique` UNIQUE(`businessEntityId`,`ruleCode`,`version`)
);
--> statement-breakpoint
CREATE TABLE `cost_allocation_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`ruleVersion` int NOT NULL,
	`mode` enum('preview','approved','posted','reversed') NOT NULL DEFAULT 'preview',
	`totalInputMinor` int NOT NULL DEFAULT 0,
	`totalAllocatedMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`sourceHash` varchar(128) NOT NULL,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cost_allocation_runs_id` PRIMARY KEY(`id`),
	CONSTRAINT `cost_allocation_run_unique` UNIQUE(`businessEntityId`,`periodCode`,`ruleVersion`,`sourceHash`)
);
--> statement-breakpoint
CREATE TABLE `cost_allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`runId` int NOT NULL,
	`poolId` int,
	`driverId` int,
	`costObjectType` varchar(60) NOT NULL,
	`costObjectId` int,
	`driverQuantity` decimal(18,4) NOT NULL DEFAULT '0',
	`allocatedMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`sourceReference` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cost_allocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cost_centers_v2` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`code` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`parentId` int,
	`departmentCode` varchar(80),
	`ownerUserId` int,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cost_centers_v2_id` PRIMARY KEY(`id`),
	CONSTRAINT `cost_center_v2_entity_code_unique` UNIQUE(`businessEntityId`,`code`)
);
--> statement-breakpoint
CREATE TABLE `cost_drivers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`driverCode` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`formulaJson` text,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cost_drivers_id` PRIMARY KEY(`id`),
	CONSTRAINT `cost_driver_entity_code_unique` UNIQUE(`businessEntityId`,`driverCode`)
);
--> statement-breakpoint
CREATE TABLE `cost_pools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`poolCode` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`costCenterId` int,
	`classification` enum('direct','indirect','fixed','variable','semi_variable') NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`amountMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`status` enum('draft','approved','locked') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cost_pools_id` PRIMARY KEY(`id`),
	CONSTRAINT `cost_pool_entity_code_period_unique` UNIQUE(`businessEntityId`,`poolCode`,`periodCode`)
);
--> statement-breakpoint
CREATE TABLE `cost_profitability_facts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`objectType` varchar(60) NOT NULL,
	`objectId` int NOT NULL,
	`revenueMinor` int NOT NULL DEFAULT 0,
	`directCostMinor` int NOT NULL DEFAULT 0,
	`allocatedCostMinor` int NOT NULL DEFAULT 0,
	`contributionMinor` int NOT NULL DEFAULT 0,
	`marginBps` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`sourceLineageJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cost_profitability_facts_id` PRIMARY KEY(`id`),
	CONSTRAINT `cost_profitability_fact_unique` UNIQUE(`businessEntityId`,`periodCode`,`objectType`,`objectId`)
);
--> statement-breakpoint
CREATE TABLE `cost_variances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`objectType` varchar(60) NOT NULL,
	`objectId` int NOT NULL,
	`standardMinor` int NOT NULL DEFAULT 0,
	`actualMinor` int NOT NULL DEFAULT 0,
	`priceVarianceMinor` int NOT NULL DEFAULT 0,
	`usageVarianceMinor` int NOT NULL DEFAULT 0,
	`volumeVarianceMinor` int NOT NULL DEFAULT 0,
	`status` enum('normal','warning','critical') NOT NULL DEFAULT 'normal',
	`rootCause` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cost_variances_id` PRIMARY KEY(`id`)
);
