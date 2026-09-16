CREATE TABLE `bi_kpi_publications_73` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`dashboardKey` varchar(100) NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`metricVersionsJson` text NOT NULL,
	`scopeJson` text NOT NULL,
	`dataFreshnessAt` timestamp,
	`reconciliationStatus` enum('pending','passed','failed') NOT NULL DEFAULT 'pending',
	`status` enum('draft','review','published','superseded') NOT NULL DEFAULT 'draft',
	`publishedBy` int,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_kpi_publications_73_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_kpi_publication_73_unique` UNIQUE(`businessEntityId`,`dashboardKey`,`periodCode`)
);
--> statement-breakpoint
CREATE TABLE `bi_reconciliation_checks_73` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`metricKey` varchar(100) NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`sourceSystem` varchar(80) NOT NULL,
	`warehouseValue` decimal(22,4) NOT NULL,
	`sourceValue` decimal(22,4) NOT NULL,
	`difference` decimal(22,4) NOT NULL,
	`status` enum('passed','warning','failed','waived') NOT NULL DEFAULT 'passed',
	`ownerUserId` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_reconciliation_checks_73_id` PRIMARY KEY(`id`)
);
