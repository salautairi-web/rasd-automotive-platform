CREATE TABLE `access_grants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`organizationId` int NOT NULL,
	`branchId` int,
	`businessUnitId` int,
	`permissionKey` varchar(100) NOT NULL,
	CONSTRAINT `access_grants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`organizationId` int,
	`systemKey` varchar(48) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` varchar(80) NOT NULL,
	`action` varchar(80) NOT NULL,
	`oldValue` text,
	`newValue` text,
	`requestId` varchar(80),
	`correlationId` varchar(80),
	`ipAddress` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`nameEn` varchar(180),
	`city` varchar(100),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	CONSTRAINT `branches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`nameEn` varchar(180),
	`systemKey` varchar(48) NOT NULL,
	CONSTRAINT `business_units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commandId` varchar(80) NOT NULL,
	`commandType` varchar(100) NOT NULL,
	`targetSystem` varchar(48) NOT NULL,
	`correlationId` varchar(80) NOT NULL,
	`status` enum('queued','completed','failed') NOT NULL DEFAULT 'queued',
	`payload` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commands_id` PRIMARY KEY(`id`),
	CONSTRAINT `commands_commandId_unique` UNIQUE(`commandId`)
);
--> statement-breakpoint
CREATE TABLE `cost_centers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`nameEn` varchar(180),
	CONSTRAINT `cost_centers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerNo` varchar(32) NOT NULL,
	`organizationId` int NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`nameEn` varchar(180),
	`phone` varchar(40),
	`email` varchar(320),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_customerNo_unique` UNIQUE(`customerNo`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` varchar(80) NOT NULL,
	`fileName` varchar(220) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`storageKey` varchar(400) NOT NULL,
	`storageUrl` varchar(800),
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `idempotency_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(160) NOT NULL,
	`operation` varchar(120) NOT NULL,
	`requestHash` varchar(128) NOT NULL,
	`responsePayload` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `idempotency_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `idempotency_keys_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `integration_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` varchar(80) NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`version` varchar(20) NOT NULL DEFAULT 'v1',
	`sourceSystem` varchar(48) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` varchar(80) NOT NULL,
	`correlationId` varchar(80) NOT NULL,
	`payload` text NOT NULL,
	`status` enum('pending','processed','failed') NOT NULL DEFAULT 'pending',
	`retryCount` int NOT NULL DEFAULT 0,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_events_eventId_unique` UNIQUE(`eventId`)
);
--> statement-breakpoint
CREATE TABLE `numbering_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`entityKey` varchar(48) NOT NULL,
	`prefix` varchar(20) NOT NULL,
	`includeYear` int NOT NULL DEFAULT 1,
	`sequence` int NOT NULL DEFAULT 0,
	CONSTRAINT `numbering_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`nameEn` varchar(180),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`permissionKey` varchar(100) NOT NULL,
	`labelAr` varchar(180) NOT NULL,
	`systemKey` varchar(48) NOT NULL,
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_permissionKey_unique` UNIQUE(`permissionKey`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productNo` varchar(32) NOT NULL,
	`organizationId` int NOT NULL,
	`sku` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`nameEn` varchar(180),
	`category` varchar(80),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_productNo_unique` UNIQUE(`productNo`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`titleAr` varchar(220) NOT NULL,
	`taskType` varchar(80) NOT NULL,
	`assigneeUserId` int,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('open','in_progress','done','escalated') NOT NULL DEFAULT 'open',
	`dueAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleNo` varchar(32) NOT NULL,
	`organizationId` int NOT NULL,
	`vin` varchar(64) NOT NULL,
	`make` varchar(80) NOT NULL,
	`model` varchar(80) NOT NULL,
	`modelYear` int,
	`lifecycleStatus` varchar(40) NOT NULL DEFAULT 'imported',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicles_vehicleNo_unique` UNIQUE(`vehicleNo`),
	CONSTRAINT `vehicles_vin_unique` UNIQUE(`vin`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`workflowKey` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`triggerDescription` text,
	`status` enum('active','draft','inactive') NOT NULL DEFAULT 'draft',
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`)
);
