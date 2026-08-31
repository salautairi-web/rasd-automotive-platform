CREATE TABLE `bi_access_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessEntityScopeJson` text NOT NULL,
	`action` enum('view','drilldown','export','schedule') NOT NULL,
	`reportKey` varchar(100) NOT NULL,
	`filtersJson` text NOT NULL,
	`requestId` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_access_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bi_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`metricDefinitionId` int,
	`alertType` varchar(100) NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'warning',
	`titleAr` varchar(220) NOT NULL,
	`detailsJson` text NOT NULL,
	`dedupeKey` varchar(160) NOT NULL,
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `bi_alerts_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_alert_dedupe_unique` UNIQUE(`businessEntityId`,`dedupeKey`)
);
--> statement-breakpoint
CREATE TABLE `bi_data_quality_issues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`sourceSystem` varchar(80) NOT NULL,
	`issueType` enum('missing_entity','duplicate_event','missing_financial_event','unbalanced_journal','reconciliation_difference','stale_data') NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'warning',
	`sourceReference` varchar(120),
	`detailsJson` text NOT NULL,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `bi_data_quality_issues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bi_dim_entity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`entityCode` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`validFrom` timestamp NOT NULL,
	`validTo` timestamp,
	`isCurrent` int NOT NULL DEFAULT 1,
	`sourceUpdatedAt` timestamp NOT NULL,
	CONSTRAINT `bi_dim_entity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bi_metric_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricKey` varchar(100) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`category` enum('financial','operational','investment','risk','quality') NOT NULL,
	`unit` enum('amount_minor','count','percent_bps','days','hours','ratio_bps') NOT NULL,
	`aggregation` enum('sum','average','last','min','max','ratio') NOT NULL,
	`ownerSystem` varchar(80) NOT NULL,
	`drilldownLevel` varchar(80) NOT NULL,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`currentVersion` int NOT NULL DEFAULT 1,
	CONSTRAINT `bi_metric_definitions_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_metric_key_unique` UNIQUE(`metricKey`)
);
--> statement-breakpoint
CREATE TABLE `bi_metric_facts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricDefinitionId` int NOT NULL,
	`metricVersion` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`branchId` int,
	`departmentId` int,
	`sourceSystem` varchar(80) NOT NULL,
	`sourceType` varchar(80) NOT NULL,
	`sourceId` varchar(100) NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`currency` varchar(8),
	`scenario` enum('actual','budget','forecast_base','forecast_upside','forecast_downside') NOT NULL DEFAULT 'actual',
	`valueNumeric` decimal(22,4) NOT NULL,
	`dimensionsJson` text,
	`sourceTimestamp` timestamp NOT NULL,
	`transformationVersion` varchar(40) NOT NULL,
	`refreshedAt` timestamp NOT NULL DEFAULT (now()),
	`eventId` varchar(80) NOT NULL,
	CONSTRAINT `bi_metric_facts_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_fact_event_metric_unique` UNIQUE(`eventId`,`metricDefinitionId`,`businessEntityId`)
);
--> statement-breakpoint
CREATE TABLE `bi_metric_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricDefinitionId` int NOT NULL,
	`version` int NOT NULL,
	`formulaJson` text NOT NULL,
	`dimensionsJson` text NOT NULL,
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_metric_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_metric_version_unique` UNIQUE(`metricDefinitionId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `bi_report_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportKey` varchar(100) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`reportType` enum('executive','financial','operational','investment','audit') NOT NULL,
	`scopePolicyJson` text NOT NULL,
	`metricKeysJson` text NOT NULL,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`scheduleCronTaskUid` varchar(65),
	CONSTRAINT `bi_report_definitions_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_report_key_unique` UNIQUE(`reportKey`),
	CONSTRAINT `bi_report_task_uid_unique` UNIQUE(`scheduleCronTaskUid`)
);
--> statement-breakpoint
CREATE TABLE `bi_report_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportDefinitionId` int NOT NULL,
	`requestedBy` int,
	`businessEntityScopeJson` text NOT NULL,
	`filtersJson` text NOT NULL,
	`metricVersionsJson` text NOT NULL,
	`format` enum('screen','csv','xlsx','pdf') NOT NULL DEFAULT 'screen',
	`status` enum('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
	`storageKey` varchar(300),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `bi_report_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bi_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`snapshotType` varchar(80) NOT NULL,
	`businessEntityId` int,
	`periodCode` varchar(20) NOT NULL,
	`currency` varchar(8) NOT NULL,
	`payloadJson` text NOT NULL,
	`sourceWatermark` varchar(120) NOT NULL,
	`status` enum('building','ready','failed','superseded') NOT NULL DEFAULT 'building',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_snapshot_watermark_unique` UNIQUE(`snapshotType`,`businessEntityId`,`periodCode`,`sourceWatermark`)
);
