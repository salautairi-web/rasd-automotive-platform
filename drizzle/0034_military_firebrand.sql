CREATE TABLE `bi_ai_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`modelKey` varchar(100) NOT NULL,
	`modelVersion` varchar(40) NOT NULL,
	`outputType` varchar(80) NOT NULL,
	`inputScopeJson` text NOT NULL,
	`sourceFactsJson` text NOT NULL,
	`outputJson` text NOT NULL,
	`confidenceBps` int,
	`humanReviewStatus` enum('pending','approved','rejected','not_applicable') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_ai_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bi_dashboards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dashboardKey` varchar(100) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`dashboardType` varchar(80) NOT NULL,
	`scopePolicyJson` text NOT NULL,
	`certified` int NOT NULL DEFAULT 0,
	`status` enum('draft','published','retired') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_dashboards_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_dashboard_key_unique` UNIQUE(`dashboardKey`)
);
--> statement-breakpoint
CREATE TABLE `bi_data_marts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`martKey` varchar(100) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`domain` varchar(80) NOT NULL,
	`grain` varchar(120) NOT NULL,
	`metricKeysJson` text NOT NULL,
	`scopePolicyJson` text NOT NULL,
	`status` enum('draft','certified','retired') NOT NULL DEFAULT 'draft',
	`ownerUserId` int,
	`version` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_data_marts_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_data_mart_key_unique` UNIQUE(`martKey`)
);
--> statement-breakpoint
CREATE TABLE `bi_filters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dashboardKey` varchar(100) NOT NULL,
	`filterKey` varchar(100) NOT NULL,
	`filterType` varchar(60) NOT NULL,
	`definitionJson` text NOT NULL,
	`scopePolicyJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_filters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bi_forecasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`forecastKey` varchar(120) NOT NULL,
	`metricKey` varchar(100) NOT NULL,
	`businessEntityId` int,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`scenario` varchar(80) NOT NULL,
	`valueNumeric` decimal(22,4) NOT NULL,
	`lowerBound` decimal(22,4),
	`upperBound` decimal(22,4),
	`modelVersion` varchar(80) NOT NULL,
	`confidenceBps` int,
	`sourceFactsJson` text NOT NULL,
	`humanReviewStatus` enum('not_required','pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_forecasts_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_forecast_key_unique` UNIQUE(`forecastKey`)
);
--> statement-breakpoint
CREATE TABLE `bi_ingestion_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`jobKey` varchar(120) NOT NULL,
	`layer` enum('raw','staging','conformed','warehouse','mart') NOT NULL,
	`status` enum('queued','running','completed','failed','partial') NOT NULL DEFAULT 'queued',
	`sourceWatermark` varchar(160),
	`recordsRead` int NOT NULL DEFAULT 0,
	`recordsAccepted` int NOT NULL DEFAULT 0,
	`recordsRejected` int NOT NULL DEFAULT 0,
	`errorJson` text,
	`correlationId` varchar(80) NOT NULL,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_ingestion_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_ingestion_job_key_unique` UNIQUE(`jobKey`)
);
--> statement-breakpoint
CREATE TABLE `bi_lineage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceSystem` varchar(80) NOT NULL,
	`sourceReference` varchar(160) NOT NULL,
	`transformationJson` text NOT NULL,
	`warehouseField` varchar(160) NOT NULL,
	`metricKey` varchar(100),
	`dashboardKey` varchar(100),
	`ownerUserId` int,
	`version` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_lineage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bi_model_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`modelId` int NOT NULL,
	`version` varchar(40) NOT NULL,
	`featuresJson` text NOT NULL,
	`evaluationJson` text NOT NULL,
	`explainabilityJson` text NOT NULL,
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_model_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_model_version_unique` UNIQUE(`modelId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `bi_models` (
	`id` int AUTO_INCREMENT NOT NULL,
	`modelKey` varchar(100) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`purpose` varchar(120) NOT NULL,
	`status` enum('draft','validated','active','retired') NOT NULL DEFAULT 'draft',
	`ownerUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_models_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_model_key_unique` UNIQUE(`modelKey`)
);
--> statement-breakpoint
CREATE TABLE `bi_refresh_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetType` varchar(80) NOT NULL,
	`targetKey` varchar(120) NOT NULL,
	`cadence` enum('realtime','near_realtime','hourly','daily','monthly') NOT NULL,
	`status` enum('queued','running','completed','failed','stale') NOT NULL DEFAULT 'queued',
	`scheduledAt` timestamp NOT NULL,
	`lastStartedAt` timestamp,
	`completedAt` timestamp,
	`failureJson` text,
	`correlationId` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_refresh_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bi_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceKey` varchar(100) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`systemType` varchar(80) NOT NULL,
	`ownerSystem` varchar(80) NOT NULL,
	`entityScoped` int NOT NULL DEFAULT 1,
	`status` enum('active','paused','retired') NOT NULL DEFAULT 'active',
	`contractVersion` varchar(40) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_source_key_unique` UNIQUE(`sourceKey`)
);
--> statement-breakpoint
CREATE TABLE `bi_staging_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`ingestionJobId` int NOT NULL,
	`sourceRecordKey` varchar(160) NOT NULL,
	`businessEntityId` int,
	`payloadJson` text NOT NULL,
	`schemaVersion` varchar(40) NOT NULL,
	`checksum` varchar(128) NOT NULL,
	`status` enum('received','validated','rejected','conformed') NOT NULL DEFAULT 'received',
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_staging_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_staging_source_record_unique` UNIQUE(`sourceId`,`sourceRecordKey`)
);
