CREATE TABLE `mobile_field_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`assignedUserId` int NOT NULL,
	`deviceId` int,
	`workType` varchar(80) NOT NULL,
	`titleAr` varchar(220) NOT NULL,
	`sourceSystem` varchar(100) NOT NULL,
	`sourceRecordId` varchar(120) NOT NULL,
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`status` enum('assigned','accepted','in_progress','paused','completed','cancelled','blocked') NOT NULL DEFAULT 'assigned',
	`dueAt` timestamp,
	`checklistJson` text,
	`locationJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `mobile_field_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `mobile_field_assignment_source_unique` UNIQUE(`businessEntityId`,`sourceSystem`,`sourceRecordId`)
);
--> statement-breakpoint
CREATE TABLE `mobile_field_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`clientEventId` varchar(160) NOT NULL,
	`payloadJson` text,
	`locationJson` text,
	`occurredAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mobile_field_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `mobile_field_event_client_unique` UNIQUE(`businessEntityId`,`clientEventId`)
);
--> statement-breakpoint
CREATE TABLE `mobile_field_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`userId` int NOT NULL,
	`evidenceType` enum('photo','document','signature','note','location') NOT NULL,
	`storageKey` varchar(320),
	`checksum` varchar(128) NOT NULL,
	`metadataJson` text,
	`uploadStatus` enum('queued','uploading','uploaded','failed') NOT NULL DEFAULT 'queued',
	`capturedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mobile_field_evidence_id` PRIMARY KEY(`id`),
	CONSTRAINT `mobile_field_evidence_checksum_unique` UNIQUE(`businessEntityId`,`checksum`)
);
--> statement-breakpoint
CREATE TABLE `mobile_location_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessEntityId` int,
	`deviceId` int NOT NULL,
	`decision` enum('granted','withdrawn') NOT NULL,
	`purpose` varchar(160) NOT NULL,
	`effectiveAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `mobile_location_consents_id` PRIMARY KEY(`id`)
);
