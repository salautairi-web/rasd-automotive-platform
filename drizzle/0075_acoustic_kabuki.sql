CREATE TABLE `project_commitments_62` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`sourceSystem` varchar(80) NOT NULL,
	`sourceReference` varchar(160) NOT NULL,
	`committedMinor` int NOT NULL DEFAULT 0,
	`actualMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL DEFAULT 'OMR',
	`reconciliationStatus` enum('unmatched','matched','exception') NOT NULL DEFAULT 'unmatched',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_commitments_62_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_commitment_62_source_unique` UNIQUE(`businessEntityId`,`sourceSystem`,`sourceReference`)
);
--> statement-breakpoint
CREATE TABLE `project_schedule_baselines_62` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`baselineName` varchar(160) NOT NULL,
	`baselineJson` text NOT NULL,
	`checksum` varchar(128) NOT NULL,
	`status` enum('draft','approved','superseded') NOT NULL DEFAULT 'draft',
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_schedule_baselines_62_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_schedule_baseline_62_project_version_unique` UNIQUE(`projectId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `trade_shipment_alerts_61` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`shipmentId` int NOT NULL,
	`alertType` enum('eta_overdue','delay','missing_document','customs_blocker','unverified_document') NOT NULL,
	`message` varchar(300) NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'warning',
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `trade_shipment_alerts_61_id` PRIMARY KEY(`id`)
);
