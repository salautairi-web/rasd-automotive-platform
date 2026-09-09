CREATE TABLE `bi_dimensions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dimensionKey` varchar(100) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`dimensionType` varchar(80) NOT NULL,
	`sourceSystem` varchar(80) NOT NULL,
	`scdPolicy` enum('none','type1','type2') NOT NULL DEFAULT 'none',
	`entityScoped` int NOT NULL DEFAULT 1,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`version` int NOT NULL DEFAULT 1,
	`ownerUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_dimensions_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_dimension_key_unique` UNIQUE(`dimensionKey`)
);
--> statement-breakpoint
CREATE TABLE `bi_export_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessEntityId` int,
	`dashboardKey` varchar(100) NOT NULL,
	`format` varchar(20) NOT NULL,
	`filtersJson` text NOT NULL,
	`rowCount` int NOT NULL DEFAULT 0,
	`decision` enum('allowed','denied') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_export_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bi_kpi_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kpiKey` varchar(100) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`definition` text NOT NULL,
	`formulaJson` text NOT NULL,
	`sourceMetricKey` varchar(100) NOT NULL,
	`ownerUserId` int,
	`frequency` varchar(40) NOT NULL,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`entityScopePolicyJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_kpi_definitions_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_kpi_definition_key_unique` UNIQUE(`kpiKey`)
);
--> statement-breakpoint
CREATE TABLE `bi_kpi_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kpiDefinitionId` int NOT NULL,
	`version` int NOT NULL,
	`targetNumeric` decimal(22,4),
	`thresholdNumeric` decimal(22,4),
	`formulaJson` text NOT NULL,
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_kpi_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_kpi_version_unique` UNIQUE(`kpiDefinitionId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `bi_quality_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentKey` varchar(140) NOT NULL,
	`businessEntityId` int,
	`datasetKey` varchar(120) NOT NULL,
	`completenessBps` int NOT NULL,
	`accuracyBps` int NOT NULL,
	`timelinessBps` int NOT NULL,
	`consistencyBps` int NOT NULL,
	`duplicateCount` int NOT NULL DEFAULT 0,
	`reconciliationStatus` varchar(40) NOT NULL,
	`evaluatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_quality_assessments_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_quality_assessment_key_unique` UNIQUE(`assessmentKey`)
);
--> statement-breakpoint
CREATE TABLE `bi_reconciliations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reconciliationKey` varchar(140) NOT NULL,
	`businessEntityId` int,
	`domain` varchar(80) NOT NULL,
	`sourceSystem` varchar(80) NOT NULL,
	`targetSystem` varchar(80) NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`sourceTotal` decimal(22,4) NOT NULL,
	`targetTotal` decimal(22,4) NOT NULL,
	`difference` decimal(22,4) NOT NULL,
	`status` enum('matched','difference','failed','pending') NOT NULL DEFAULT 'pending',
	`evidenceJson` text NOT NULL,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_reconciliations_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_reconciliation_key_unique` UNIQUE(`reconciliationKey`)
);
--> statement-breakpoint
CREATE TABLE `bi_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenarioKey` varchar(120) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`scenarioType` enum('base','upside','downside','custom') NOT NULL,
	`businessEntityId` int,
	`assumptionsJson` text NOT NULL,
	`comparisonJson` text,
	`version` int NOT NULL DEFAULT 1,
	`ownerUserId` int NOT NULL,
	`approvalStatus` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_scenarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_scenario_key_unique` UNIQUE(`scenarioKey`)
);
--> statement-breakpoint
CREATE TABLE `bi_semantic_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricKey` varchar(100) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`definitionJson` text NOT NULL,
	`sourceMartKey` varchar(100) NOT NULL,
	`unit` varchar(40) NOT NULL,
	`scopePolicyJson` text NOT NULL,
	`status` enum('draft','certified','retired') NOT NULL DEFAULT 'draft',
	`version` int NOT NULL DEFAULT 1,
	`ownerUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_semantic_metrics_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_semantic_metric_key_unique` UNIQUE(`metricKey`)
);
--> statement-breakpoint
CREATE TABLE `bi_warehouse_facts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`factKey` varchar(140) NOT NULL,
	`factType` varchar(100) NOT NULL,
	`businessEntityId` int NOT NULL,
	`branchId` int,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`sourceSystem` varchar(80) NOT NULL,
	`sourceRecordRef` varchar(180) NOT NULL,
	`measureJson` text NOT NULL,
	`dimensionKeysJson` text NOT NULL,
	`currency` varchar(8),
	`scenario` enum('actual','budget','forecast_base','forecast_upside','forecast_downside') NOT NULL DEFAULT 'actual',
	`lineageRef` varchar(180) NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_warehouse_facts_id` PRIMARY KEY(`id`),
	CONSTRAINT `bi_warehouse_fact_key_unique` UNIQUE(`factKey`)
);
