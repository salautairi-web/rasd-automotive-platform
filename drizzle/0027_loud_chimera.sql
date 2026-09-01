CREATE TABLE `integration_api_clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`clientKey` varchar(120) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`allowedSystemsJson` text NOT NULL,
	`allowedOperationsJson` text NOT NULL,
	`scopesJson` text NOT NULL,
	`status` enum('active','revoked','expired') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_api_clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_client_entity_key_unique` UNIQUE(`businessEntityId`,`clientKey`)
);
--> statement-breakpoint
CREATE TABLE `integration_apis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`apiKey` varchar(120) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`version` varchar(40) NOT NULL DEFAULT 'v1',
	`method` enum('GET','POST','PUT','PATCH','DELETE') NOT NULL,
	`endpoint` varchar(240) NOT NULL,
	`scope` enum('central','entity','cross_entity') NOT NULL DEFAULT 'entity',
	`schemaJson` text NOT NULL,
	`permissionsJson` text NOT NULL,
	`rateLimitPerMinute` int NOT NULL DEFAULT 60,
	`deprecationDate` timestamp,
	`status` enum('draft','active','deprecated') NOT NULL DEFAULT 'draft',
	CONSTRAINT `integration_apis_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_api_service_key_version_unique` UNIQUE(`serviceId`,`apiKey`,`version`)
);
--> statement-breakpoint
CREATE TABLE `integration_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`requestId` varchar(80) NOT NULL,
	`correlationId` varchar(100) NOT NULL,
	`sourceSystem` varchar(100) NOT NULL,
	`targetSystem` varchar(100) NOT NULL,
	`actorRef` varchar(120) NOT NULL,
	`operation` varchar(120) NOT NULL,
	`result` enum('accepted','succeeded','failed','rejected') NOT NULL,
	`errorCode` varchar(80),
	`payloadHash` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_bus_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` varchar(100) NOT NULL,
	`eventType` varchar(120) NOT NULL,
	`eventVersion` varchar(40) NOT NULL DEFAULT '1',
	`sourceSystem` varchar(100) NOT NULL,
	`sourceEntityId` int,
	`targetSystem` varchar(100),
	`targetEntityId` int,
	`aggregateId` varchar(120),
	`commandId` varchar(100),
	`correlationId` varchar(100) NOT NULL,
	`payload` text NOT NULL,
	`payloadHash` varchar(128),
	`idempotencyKey` varchar(180) NOT NULL,
	`status` enum('queued','processing','processed','failed','dead_lettered') NOT NULL DEFAULT 'queued',
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `integration_bus_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_bus_events_eventId_unique` UNIQUE(`eventId`),
	CONSTRAINT `integration_bus_events_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `integration_dead_letters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int,
	`requestId` int,
	`businessEntityId` int,
	`reason` varchar(240) NOT NULL,
	`payloadHash` varchar(128),
	`status` enum('open','replayed','discarded') NOT NULL DEFAULT 'open',
	`replayedBy` int,
	`replayedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_dead_letters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_event_consumers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`consumerKey` varchar(120) NOT NULL,
	`consumerGroup` varchar(120) NOT NULL,
	`status` enum('pending','processing','succeeded','failed','dead_lettered') NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`lastError` text,
	`nextAttemptAt` timestamp,
	`processedAt` timestamp,
	CONSTRAINT `integration_event_consumers_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_event_consumer_unique` UNIQUE(`eventId`,`consumerKey`)
);
--> statement-breakpoint
CREATE TABLE `integration_health_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`status` enum('healthy','degraded','offline') NOT NULL,
	`latencyMs` int,
	`checkedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_health_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`serviceId` int,
	`incidentKey` varchar(120) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`titleAr` varchar(220) NOT NULL,
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `integration_incidents_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_incidents_incidentKey_unique` UNIQUE(`incidentKey`)
);
--> statement-breakpoint
CREATE TABLE `integration_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` varchar(80) NOT NULL,
	`businessEntityId` int,
	`sourceSystem` varchar(100) NOT NULL,
	`targetSystem` varchar(100) NOT NULL,
	`apiKey` varchar(120),
	`method` varchar(10) NOT NULL,
	`endpoint` varchar(500) NOT NULL,
	`correlationId` varchar(100) NOT NULL,
	`idempotencyKey` varchar(180),
	`requestHash` varchar(128),
	`status` enum('received','validated','routed','succeeded','failed','timeout','rate_limited') NOT NULL DEFAULT 'received',
	`latencyMs` int,
	`errorCode` varchar(80),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_requests_requestId_unique` UNIQUE(`requestId`),
	CONSTRAINT `integration_request_entity_idempotency_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `integration_retries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int,
	`requestId` int,
	`attemptNo` int NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`backoffSeconds` int NOT NULL,
	`status` enum('scheduled','running','succeeded','failed','cancelled') NOT NULL DEFAULT 'scheduled',
	`errorMessage` text,
	CONSTRAINT `integration_retries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`serviceKey` varchar(100) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`ownerSystem` varchar(100) NOT NULL,
	`baseUrl` varchar(500),
	`version` varchar(40) NOT NULL DEFAULT 'v1',
	`capabilitiesJson` text NOT NULL,
	`authMethod` enum('oauth2','oidc','api_key','jwt','mtls','internal') NOT NULL DEFAULT 'internal',
	`healthStatus` enum('unknown','healthy','degraded','offline') NOT NULL DEFAULT 'unknown',
	`status` enum('draft','active','paused','deprecated') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_services_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_service_entity_key_unique` UNIQUE(`businessEntityId`,`serviceKey`)
);
--> statement-breakpoint
CREATE TABLE `integration_transformations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transformationKey` varchar(120) NOT NULL,
	`version` varchar(40) NOT NULL,
	`sourceSchema` varchar(120) NOT NULL,
	`targetSchema` varchar(120) NOT NULL,
	`mappingsJson` text NOT NULL,
	`status` enum('draft','active','deprecated') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_transformations_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_transformation_version_unique` UNIQUE(`transformationKey`,`version`)
);
--> statement-breakpoint
CREATE TABLE `integration_webhook_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`webhookId` int NOT NULL,
	`eventId` int,
	`deliveryId` varchar(100) NOT NULL,
	`timestampMs` int NOT NULL,
	`signatureValid` boolean NOT NULL DEFAULT false,
	`replayDetected` boolean NOT NULL DEFAULT false,
	`status` enum('received','queued','delivered','failed','rejected') NOT NULL DEFAULT 'received',
	`attempts` int NOT NULL DEFAULT 0,
	`responseCode` int,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_webhook_deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_webhook_deliveries_deliveryId_unique` UNIQUE(`deliveryId`)
);
--> statement-breakpoint
CREATE TABLE `integration_webhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`providerKey` varchar(100) NOT NULL,
	`endpoint` varchar(500) NOT NULL,
	`direction` enum('inbound','outbound') NOT NULL,
	`signatureMethod` enum('hmac_sha256','jwt','none') NOT NULL DEFAULT 'hmac_sha256',
	`secretMetadataJson` text,
	`eventTypesJson` text NOT NULL,
	`status` enum('active','paused','failed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_webhooks_id` PRIMARY KEY(`id`)
);
