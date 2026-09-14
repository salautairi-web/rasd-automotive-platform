CREATE TABLE `project_budget_controls_62` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`budgetVersion` int NOT NULL DEFAULT 1,
	`category` enum('capex','opex','labor','procurement','assets','external_services','contingency','revenue') NOT NULL,
	`approvedMinor` int NOT NULL DEFAULT 0,
	`committedMinor` int NOT NULL DEFAULT 0,
	`actualMinor` int NOT NULL DEFAULT 0,
	`forecastMinor` int NOT NULL DEFAULT 0,
	`approvalThresholdBps` int NOT NULL DEFAULT 10000,
	`status` enum('draft','pending_approval','approved','locked') NOT NULL DEFAULT 'draft',
	`checksum` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_budget_controls_62_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_budget_62_project_category_version_unique` UNIQUE(`projectId`,`category`,`budgetVersion`)
);
--> statement-breakpoint
CREATE TABLE `project_wbs_62` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`parentId` int,
	`nodeType` enum('phase','work_package','task','subtask','milestone') NOT NULL,
	`wbsCode` varchar(80) NOT NULL,
	`titleAr` varchar(240) NOT NULL,
	`ownerUserId` int,
	`startDate` timestamp,
	`finishDate` timestamp,
	`baselineFinishDate` timestamp,
	`plannedCostMinor` int NOT NULL DEFAULT 0,
	`actualCostMinor` int NOT NULL DEFAULT 0,
	`completionBps` int NOT NULL DEFAULT 0,
	`status` enum('planned','in_progress','blocked','completed','cancelled') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_wbs_62_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_wbs_62_project_code_unique` UNIQUE(`projectId`,`wbsCode`)
);
--> statement-breakpoint
CREATE TABLE `trade_shipment_events_61` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`shipmentId` int NOT NULL,
	`eventType` enum('booked','loaded','departed','at_port','customs_submitted','customs_blocked','released','arrived','delayed','exception') NOT NULL,
	`eventAt` timestamp NOT NULL,
	`location` varchar(160),
	`note` text,
	`evidenceDocumentId` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trade_shipment_events_61_id` PRIMARY KEY(`id`)
);
