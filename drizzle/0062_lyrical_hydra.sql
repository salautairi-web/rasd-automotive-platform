CREATE TABLE `dms_chain_of_custody_53` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`documentId` int NOT NULL,
	`versionId` int,
	`fromCustodian` int,
	`toCustodian` int,
	`purpose` varchar(240) NOT NULL,
	`integrityHash` varchar(128),
	`transferredAt` timestamp NOT NULL DEFAULT (now()),
	`auditRequestId` varchar(80) NOT NULL,
	CONSTRAINT `dms_chain_of_custody_53_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dms_disposition_reviews_53` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`documentId` int NOT NULL,
	`decision` enum('pending','archive','secure_dispose','retain') NOT NULL DEFAULT 'pending',
	`reason` text,
	`legalHoldChecked` boolean NOT NULL DEFAULT false,
	`approvedBy` int,
	`decidedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dms_disposition_reviews_53_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dms_provider_events_53` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`signatureRequestId` int NOT NULL,
	`provider` varchar(100) NOT NULL,
	`providerEventId` varchar(180) NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`payloadHash` varchar(64) NOT NULL,
	`processedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dms_provider_events_53_id` PRIMARY KEY(`id`),
	CONSTRAINT `dms_provider_event_unique_53` UNIQUE(`businessEntityId`,`provider`,`providerEventId`)
);
--> statement-breakpoint
CREATE TABLE `dms_record_declarations_53` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`documentId` int NOT NULL,
	`recordClass` varchar(120) NOT NULL,
	`retentionPolicyId` int,
	`triggerAt` timestamp,
	`retentionUntil` timestamp,
	`status` enum('active','review_due','held','disposed') NOT NULL DEFAULT 'active',
	`declaredBy` int NOT NULL,
	`declaredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dms_record_declarations_53_id` PRIMARY KEY(`id`)
);
