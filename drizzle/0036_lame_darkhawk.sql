CREATE TABLE `planning_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`varianceId` int,
	`titleAr` varchar(180) NOT NULL,
	`ownerUserId` int,
	`dueDate` timestamp,
	`status` enum('open','in_progress','completed','cancelled') NOT NULL DEFAULT 'open',
	`rootCause` text,
	`correctivePlan` text,
	`evidenceStorageKey` varchar(300),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planning_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planning_actuals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`accountCode` varchar(80) NOT NULL,
	`costCenterCode` varchar(80),
	`amountMinor` int NOT NULL DEFAULT 0,
	`sourceSystem` varchar(80) NOT NULL,
	`sourceReference` varchar(160) NOT NULL,
	`sourceRowHash` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planning_actuals_id` PRIMARY KEY(`id`),
	CONSTRAINT `planning_actual_source_unique` UNIQUE(`businessEntityId`,`sourceSystem`,`sourceReference`,`sourceRowHash`)
);
--> statement-breakpoint
CREATE TABLE `planning_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`versionId` int NOT NULL,
	`stage` int NOT NULL DEFAULT 1,
	`approverUserId` int,
	`approverRoleKey` varchar(80),
	`decision` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`comment` text,
	`decidedAt` timestamp,
	CONSTRAINT `planning_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planning_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` int NOT NULL,
	`action` varchar(60) NOT NULL,
	`actorUserId` int,
	`beforeHash` varchar(128),
	`afterHash` varchar(128),
	`correlationId` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planning_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planning_budget_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`versionId` int NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`accountCode` varchar(80) NOT NULL,
	`costCenterCode` varchar(80),
	`departmentCode` varchar(80),
	`projectCode` varchar(80),
	`vehicleId` int,
	`currency` varchar(10) NOT NULL,
	`amountMinor` int NOT NULL DEFAULT 0,
	`driverKey` varchar(100),
	`sourceReference` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planning_budget_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planning_commitments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`sourceType` varchar(60) NOT NULL,
	`sourceId` int NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`accountCode` varchar(80) NOT NULL,
	`amountMinor` int NOT NULL DEFAULT 0,
	`status` enum('open','consumed','cancelled') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planning_commitments_id` PRIMARY KEY(`id`),
	CONSTRAINT `planning_commitment_source_unique` UNIQUE(`businessEntityId`,`sourceType`,`sourceId`)
);
--> statement-breakpoint
CREATE TABLE `planning_cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleCode` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`fiscalYear` int NOT NULL,
	`status` enum('draft','open','locked','closed') NOT NULL DEFAULT 'draft',
	`ownerUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planning_cycles_id` PRIMARY KEY(`id`),
	CONSTRAINT `planning_cycle_code_unique` UNIQUE(`cycleCode`)
);
--> statement-breakpoint
CREATE TABLE `planning_forecasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`versionId` int NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`metricKey` varchar(100) NOT NULL,
	`scenario` varchar(60) NOT NULL,
	`valueMinor` int NOT NULL DEFAULT 0,
	`lowerMinor` int,
	`upperMinor` int,
	`confidenceBps` int,
	`modelVersion` varchar(80) NOT NULL,
	`reviewStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planning_forecasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planning_variances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`versionId` int NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`accountCode` varchar(80) NOT NULL,
	`budgetMinor` int NOT NULL DEFAULT 0,
	`actualMinor` int NOT NULL DEFAULT 0,
	`commitmentMinor` int NOT NULL DEFAULT 0,
	`varianceMinor` int NOT NULL DEFAULT 0,
	`varianceBps` int NOT NULL DEFAULT 0,
	`status` enum('normal','warning','critical') NOT NULL DEFAULT 'normal',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planning_variances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planning_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`cycleId` int NOT NULL,
	`versionCode` varchar(80) NOT NULL,
	`scenario` enum('base','optimistic','conservative','stress','actual') NOT NULL,
	`status` enum('draft','pending_approval','approved','locked','rejected') NOT NULL DEFAULT 'draft',
	`assumptionsJson` text,
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planning_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `planning_version_unique` UNIQUE(`businessEntityId`,`cycleId`,`versionCode`)
);
