CREATE TABLE `workshop_bays_59` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`bayCode` varchar(40) NOT NULL,
	`nameAr` varchar(160) NOT NULL,
	`capacity` int NOT NULL DEFAULT 1,
	`status` enum('active','inactive','maintenance') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workshop_bays_59_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_bay_59_entity_code` UNIQUE(`businessEntityId`,`bayCode`)
);
--> statement-breakpoint
CREATE TABLE `workshop_schedules_59` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`appointmentId` int,
	`jobCardId` int,
	`bayId` int NOT NULL,
	`technicianUserId` int,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`status` enum('planned','confirmed','in_progress','completed','cancelled') NOT NULL DEFAULT 'planned',
	`notes` text,
	`idempotencyKey` varchar(160) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workshop_schedules_59_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_schedule_59_entity_key` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
ALTER TABLE `workshop_operations_59` ADD `laborCostMinor` int DEFAULT 0 NOT NULL;