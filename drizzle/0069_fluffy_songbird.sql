CREATE TABLE `workshop_checkins_59` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`workshopCenterId` int,
	`customerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`appointmentId` int,
	`mileage` int NOT NULL,
	`fuelLevel` varchar(40),
	`complaint` text NOT NULL,
	`consent` boolean NOT NULL DEFAULT false,
	`existingDamageJson` text,
	`evidenceJson` text,
	`status` enum('checked_in','inspecting','converted','cancelled') NOT NULL DEFAULT 'checked_in',
	`idempotencyKey` varchar(160) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workshop_checkins_59_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_checkin_59_key` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `workshop_deliveries_59` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`jobCardId` int NOT NULL,
	`customerId` int NOT NULL,
	`invoiceStatus` enum('pending','issued','paid') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('pending','partial','paid','waived') NOT NULL DEFAULT 'pending',
	`customerAcknowledgement` boolean NOT NULL DEFAULT false,
	`mileage` int NOT NULL,
	`documentsJson` text,
	`deliveredAt` timestamp,
	`deliveredBy` int,
	`idempotencyKey` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workshop_deliveries_59_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_delivery_59_key` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `workshop_estimates_59` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`checkinId` int,
	`vehicleId` int NOT NULL,
	`customerId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`laborMinor` int NOT NULL DEFAULT 0,
	`partsMinor` int NOT NULL DEFAULT 0,
	`subcontractMinor` int NOT NULL DEFAULT 0,
	`consumablesMinor` int NOT NULL DEFAULT 0,
	`taxMinor` int NOT NULL DEFAULT 0,
	`discountMinor` int NOT NULL DEFAULT 0,
	`totalMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL DEFAULT 'OMR',
	`status` enum('draft','issued','approved','partially_approved','rejected','expired') NOT NULL DEFAULT 'draft',
	`validUntil` timestamp,
	`approvalAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workshop_estimates_59_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_estimate_59_version` UNIQUE(`businessEntityId`,`vehicleId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `workshop_job_cards_59` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`jobNo` varchar(100) NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`estimateId` int,
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`promisedAt` timestamp,
	`status` enum('received','diagnosing','awaiting_approval','awaiting_parts','in_progress','qc','road_test','ready','delivered','closed','warranty_repeat') NOT NULL DEFAULT 'received',
	`advisorUserId` int,
	`bayId` int,
	`idempotencyKey` varchar(160) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workshop_job_cards_59_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_job_card_59_no` UNIQUE(`businessEntityId`,`jobNo`),
	CONSTRAINT `workshop_job_card_59_key` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `workshop_operations_59` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`jobCardId` int NOT NULL,
	`technicianUserId` int,
	`operation` varchar(180) NOT NULL,
	`standardHours` decimal(10,2) NOT NULL DEFAULT '0',
	`actualHours` decimal(10,2) NOT NULL DEFAULT '0',
	`status` enum('planned','in_progress','paused','completed','rework') NOT NULL DEFAULT 'planned',
	`startedAt` timestamp,
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workshop_operations_59_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workshop_quality_59` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`jobCardId` int NOT NULL,
	`inspectorUserId` int NOT NULL,
	`result` enum('pending','passed','failed','rework') NOT NULL DEFAULT 'pending',
	`checklistJson` text NOT NULL,
	`evidenceJson` text,
	`defect` text,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workshop_quality_59_id` PRIMARY KEY(`id`)
);
