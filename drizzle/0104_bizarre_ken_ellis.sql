CREATE TABLE `portal_service_access_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portalUserId` int NOT NULL,
	`relationshipId` int NOT NULL,
	`requestedBusinessEntityId` int NOT NULL,
	`requestedServicesJson` text NOT NULL,
	`requesterNote` varchar(1000) NOT NULL,
	`status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `portal_service_access_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_service_access_request_unique` UNIQUE(`portalUserId`,`requestedBusinessEntityId`,`status`)
);
--> statement-breakpoint
ALTER TABLE `vehicles` ADD `odometerValue` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `odometerUnit` enum('km','mile') DEFAULT 'km' NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `nextServiceOdometer` int;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `nextServiceAt` timestamp;