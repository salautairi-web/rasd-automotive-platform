CREATE TABLE `crm_audit_51` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`actorUserId` int,
	`action` varchar(120) NOT NULL,
	`resourceType` varchar(100) NOT NULL,
	`resourceId` varchar(120) NOT NULL,
	`beforeJson` text,
	`afterJson` text,
	`requestId` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_audit_51_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_cases_51` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`entityCustomerId` int NOT NULL,
	`caseNo` varchar(80) NOT NULL,
	`category` varchar(100) NOT NULL,
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`status` enum('open','in_progress','waiting_customer','resolved','closed') NOT NULL DEFAULT 'open',
	`slaDueAt` timestamp,
	`ownerId` int,
	`resolution` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_cases_51_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_cases_51_no_unique` UNIQUE(`businessEntityId`,`caseNo`)
);
--> statement-breakpoint
CREATE TABLE `crm_consents_51` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`entityCustomerId` int NOT NULL,
	`purpose` varchar(100) NOT NULL,
	`channel` enum('email','sms','phone','whatsapp','portal','all') NOT NULL,
	`granted` int NOT NULL,
	`doNotContact` int NOT NULL DEFAULT 0,
	`source` varchar(80) NOT NULL,
	`version` varchar(40) NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_consents_51_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_entity_customers_51` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`globalCustomerId` int,
	`customerNo` varchar(80) NOT NULL,
	`customerType` enum('individual','company') NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`phone` varchar(40),
	`email` varchar(320),
	`segment` varchar(80),
	`status` enum('lead','active','inactive','blocked') NOT NULL DEFAULT 'lead',
	`creditLimitMinor` int NOT NULL DEFAULT 0,
	`ownerId` int,
	`preferencesJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_entity_customers_51_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_entity_customers_51_no_unique` UNIQUE(`businessEntityId`,`customerNo`)
);
--> statement-breakpoint
CREATE TABLE `crm_global_customers_51` (
	`id` int AUTO_INCREMENT NOT NULL,
	`globalRef` varchar(80) NOT NULL,
	`customerType` enum('individual','company') NOT NULL,
	`displayNameAr` varchar(220) NOT NULL,
	`normalizedPhone` varchar(40),
	`normalizedEmail` varchar(320),
	`duplicateStatus` enum('clear','possible_duplicate','confirmed_duplicate','merged') NOT NULL DEFAULT 'clear',
	`source` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_global_customers_51_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_global_customers_51_ref_unique` UNIQUE(`globalRef`)
);
--> statement-breakpoint
CREATE TABLE `crm_interactions_51` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`entityCustomerId` int NOT NULL,
	`channel` enum('web','mobile','email','sms','whatsapp','phone','branch','portal') NOT NULL,
	`direction` enum('inbound','outbound','internal') NOT NULL,
	`subjectAr` varchar(220) NOT NULL,
	`body` text,
	`sourceRef` varchar(120),
	`consentChecked` int NOT NULL DEFAULT 1,
	`actorUserId` int,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_interactions_51_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_leads_51` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`entityCustomerId` int,
	`source` varchar(80),
	`campaign` varchar(120),
	`interest` varchar(180),
	`score` int NOT NULL DEFAULT 0,
	`nextAction` varchar(220),
	`status` enum('new','qualified','converted','lost') NOT NULL DEFAULT 'new',
	`ownerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_leads_51_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_vehicle_relationships_51` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`entityCustomerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`relationshipType` enum('owner','rental','service','delivery') NOT NULL,
	`sourceSystem` varchar(60) NOT NULL,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_vehicle_relationships_51_id` PRIMARY KEY(`id`)
);
