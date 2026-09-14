CREATE TABLE `workshop_dtc_59` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`jobCardId` int NOT NULL,
	`inspectionId` int,
	`code` varchar(40) NOT NULL,
	`system` varchar(80),
	`description` text NOT NULL,
	`severity` enum('info','low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`rootCause` text,
	`recommendation` text,
	`evidenceJson` text,
	`status` enum('open','confirmed','resolved','deferred') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workshop_dtc_59_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workshop_estimate_consents_59` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`estimateId` int NOT NULL,
	`customerId` int NOT NULL,
	`decision` enum('approved','rejected','change_requested') NOT NULL,
	`version` int NOT NULL,
	`estimateChecksum` varchar(128) NOT NULL,
	`reason` text,
	`consentedAt` timestamp NOT NULL DEFAULT (now()),
	`channel` varchar(40) NOT NULL DEFAULT 'portal',
	`ipHash` varchar(128),
	CONSTRAINT `workshop_estimate_consents_59_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workshop_inspections_59` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`jobCardId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`inspectorUserId` int NOT NULL,
	`templateCode` varchar(80) NOT NULL,
	`findingsJson` text NOT NULL,
	`mediaRefsJson` text,
	`summary` text,
	`status` enum('draft','completed','customer_shared','superseded') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `workshop_inspections_59_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workshop_part_requests_59` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`jobCardId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`lotCode` varchar(100),
	`serialNo` varchar(120),
	`status` enum('requested','reserved','issued','returned','substituted','cancelled') NOT NULL DEFAULT 'requested',
	`reservationId` int,
	`issueMovementId` int,
	`returnMovementId` int,
	`idempotencyKey` varchar(160) NOT NULL,
	`requestedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workshop_part_requests_59_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_part_request_59_key` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `workshop_road_tests_59` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`jobCardId` int NOT NULL,
	`driverUserId` int NOT NULL,
	`authorizedBy` int NOT NULL,
	`startMileage` int NOT NULL,
	`endMileage` int,
	`routeJson` text,
	`evidenceJson` text,
	`findings` text,
	`incident` boolean NOT NULL DEFAULT false,
	`status` enum('authorized','in_progress','completed','cancelled') NOT NULL DEFAULT 'authorized',
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workshop_road_tests_59_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workshop_warranties_59` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`jobCardId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`warrantyType` varchar(80) NOT NULL,
	`coverageJson` text NOT NULL,
	`claimNo` varchar(100),
	`comebackOfJobCardId` int,
	`rootCause` text,
	`responsibility` varchar(80),
	`correctiveAction` text,
	`status` enum('eligible','submitted','approved','rejected','closed') NOT NULL DEFAULT 'eligible',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	CONSTRAINT `workshop_warranties_59_id` PRIMARY KEY(`id`)
);
