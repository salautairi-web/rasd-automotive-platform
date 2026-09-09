CREATE TABLE `integration_api_versions_44` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiId` int NOT NULL,
	`version` varchar(40) NOT NULL,
	`lifecycle` enum('draft','beta','published','deprecated','retired') NOT NULL DEFAULT 'draft',
	`openApiJson` text NOT NULL,
	`compatibilityJson` text,
	`effectiveAt` timestamp,
	`deprecatedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_api_versions_44_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_api_version_44` UNIQUE(`apiId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `integration_connectors_44` (
	`id` int AUTO_INCREMENT NOT NULL,
	`connectorKey` varchar(140) NOT NULL,
	`providerName` varchar(140) NOT NULL,
	`nameAr` varchar(200) NOT NULL,
	`connectorType` enum('bank','payment','messaging','esignature','government','maps','accounting','storage','custom') NOT NULL,
	`credentialRef` varchar(240),
	`version` varchar(40) NOT NULL,
	`configJson` text,
	`mappingVersion` varchar(40),
	`status` enum('draft','active','degraded','disabled') NOT NULL DEFAULT 'draft',
	`lastHealthAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_connectors_44_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_connectors_44_connectorKey_unique` UNIQUE(`connectorKey`)
);
--> statement-breakpoint
CREATE TABLE `integration_event_schemas_44` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(140) NOT NULL,
	`version` varchar(40) NOT NULL,
	`lifecycle` enum('draft','approved','published','deprecated','retired') NOT NULL DEFAULT 'draft',
	`schemaJson` text NOT NULL,
	`requiredFieldsJson` text,
	`producerSystem` varchar(100) NOT NULL,
	`ownerUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_event_schemas_44_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_event_schema_44` UNIQUE(`eventType`,`version`)
);
--> statement-breakpoint
CREATE TABLE `integration_health_44` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceKey` varchar(140) NOT NULL,
	`businessEntityId` int,
	`status` enum('healthy','degraded','down','unknown') NOT NULL DEFAULT 'unknown',
	`latencyMs` int,
	`throughputPerMinute` int,
	`errorRateBps` int,
	`retryRateBps` int,
	`queueDepth` int,
	`eventLagSeconds` int,
	`redactedDetailsJson` text,
	`checkedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_health_44_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_idempotency_44` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scopeKey` varchar(160) NOT NULL,
	`idempotencyKey` varchar(180) NOT NULL,
	`requestFingerprint` varchar(128) NOT NULL,
	`resultStatus` varchar(60) NOT NULL,
	`resultJson` text,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_idempotency_44_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_idempotency_44` UNIQUE(`scopeKey`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `integration_mappings_44` (
	`id` int AUTO_INCREMENT NOT NULL,
	`connectorId` int NOT NULL,
	`mappingKey` varchar(140) NOT NULL,
	`sourceSchemaVersion` varchar(40) NOT NULL,
	`targetSchemaVersion` varchar(40) NOT NULL,
	`mappingJson` text NOT NULL,
	`validationJson` text,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_mappings_44_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_mapping_44` UNIQUE(`connectorId`,`mappingKey`,`sourceSchemaVersion`,`targetSchemaVersion`)
);
--> statement-breakpoint
CREATE TABLE `integration_queues_44` (
	`id` int AUTO_INCREMENT NOT NULL,
	`queueKey` varchar(140) NOT NULL,
	`nameAr` varchar(200) NOT NULL,
	`purpose` varchar(240),
	`entityScope` enum('central','entity','cross_entity') NOT NULL DEFAULT 'entity',
	`retentionHours` int NOT NULL DEFAULT 168,
	`maxAttempts` int NOT NULL DEFAULT 5,
	`status` enum('active','paused','disabled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_queues_44_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_queues_44_queueKey_unique` UNIQUE(`queueKey`)
);
--> statement-breakpoint
CREATE TABLE `integration_saga_steps_44` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sagaId` int NOT NULL,
	`stepKey` varchar(140) NOT NULL,
	`sequence` int NOT NULL,
	`targetSystem` varchar(100) NOT NULL,
	`status` enum('pending','running','completed','retrying','failed','compensated') NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`errorCode` varchar(100),
	`compensationJson` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_saga_steps_44_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_saga_step_44` UNIQUE(`sagaId`,`stepKey`)
);
--> statement-breakpoint
CREATE TABLE `integration_sagas_44` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sagaId` varchar(120) NOT NULL,
	`sagaType` varchar(140) NOT NULL,
	`sourceEntityId` int,
	`targetEntityId` int,
	`correlationId` varchar(100) NOT NULL,
	`currentStep` varchar(140),
	`status` enum('started','running','waiting','completed','compensating','compensated','failed','manual_intervention') NOT NULL DEFAULT 'started',
	`stateJson` text NOT NULL,
	`timeoutAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_sagas_44_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_sagas_44_sagaId_unique` UNIQUE(`sagaId`)
);
--> statement-breakpoint
CREATE TABLE `integration_subscriptions_44` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`eventType` varchar(140) NOT NULL,
	`consumerSystem` varchar(100) NOT NULL,
	`endpoint` varchar(500),
	`deliveryMode` enum('at_least_once','best_effort') NOT NULL DEFAULT 'at_least_once',
	`status` enum('active','paused','disabled') NOT NULL DEFAULT 'active',
	`maxAttempts` int NOT NULL DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_subscriptions_44_id` PRIMARY KEY(`id`)
);
