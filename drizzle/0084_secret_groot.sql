CREATE TABLE `dms_access_audit_70` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`documentId` int NOT NULL,
	`versionId` int,
	`userId` int NOT NULL,
	`action` enum('view','download','share','edit','approve','reject') NOT NULL,
	`outcome` enum('allowed','denied') NOT NULL,
	`reason` varchar(300),
	`correlationId` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dms_access_audit_70_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dms_source_links_70` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`documentId` int NOT NULL,
	`sourceModule` varchar(80) NOT NULL,
	`sourceRecordType` varchar(80) NOT NULL,
	`sourceRecordId` varchar(120) NOT NULL,
	`linkRole` varchar(80) NOT NULL DEFAULT 'primary',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dms_source_links_70_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dms_workflow_70` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`documentId` int NOT NULL,
	`versionId` int,
	`stage` enum('draft','submitted','review','approved','rejected','published') NOT NULL DEFAULT 'draft',
	`assignedTo` int,
	`comment` text,
	`decidedBy` int,
	`decidedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dms_workflow_70_id` PRIMARY KEY(`id`)
);
