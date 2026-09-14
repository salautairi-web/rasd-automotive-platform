CREATE TABLE `fleet_driver_assignments_58` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`driverId` int NOT NULL,
	`branchId` int,
	`purpose` varchar(180) NOT NULL,
	`startAt` timestamp NOT NULL,
	`endAt` timestamp,
	`odometerAtStart` int NOT NULL,
	`odometerAtEnd` int,
	`acknowledgement` boolean NOT NULL DEFAULT false,
	`idempotencyKey` varchar(160) NOT NULL,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fleet_driver_assignments_58_id` PRIMARY KEY(`id`),
	CONSTRAINT `fleet_driver_assignment_idem_58` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `fleet_driver_profiles_58` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`driverId` int NOT NULL,
	`licenseClass` varchar(40) NOT NULL,
	`licenseReference` varchar(120) NOT NULL,
	`licenseExpiresAt` timestamp,
	`trainingStatus` enum('valid','expiring','expired','not_started') NOT NULL DEFAULT 'not_started',
	`status` enum('active','suspended','expired') NOT NULL DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fleet_driver_profiles_58_id` PRIMARY KEY(`id`),
	CONSTRAINT `fleet_driver_entity_driver_58` UNIQUE(`businessEntityId`,`driverId`)
);
--> statement-breakpoint
CREATE TABLE `fleet_fuel_anomalies_58` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`fuelEntryId` int NOT NULL,
	`anomalyType` varchar(60) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`expectedPer100Km` decimal(12,3) NOT NULL,
	`actualPer100Km` decimal(12,3) NOT NULL,
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fleet_fuel_anomalies_58_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fleet_lifecycle_events_58` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`fromStatus` varchar(40) NOT NULL,
	`toStatus` varchar(40) NOT NULL,
	`reason` varchar(240) NOT NULL,
	`source` varchar(80) NOT NULL,
	`idempotencyKey` varchar(160) NOT NULL,
	`actorUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fleet_lifecycle_events_58_id` PRIMARY KEY(`id`),
	CONSTRAINT `fleet_lifecycle_event_idem_58` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `fleet_telemetry_policies_58` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`purpose` enum('maintenance','safety','utilization','incident','rental') NOT NULL,
	`retentionDays` int NOT NULL DEFAULT 90,
	`allowLiveTracking` boolean NOT NULL DEFAULT false,
	`maskCoordinates` boolean NOT NULL DEFAULT true,
	`allowedRoles` text NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fleet_telemetry_policies_58_id` PRIMARY KEY(`id`),
	CONSTRAINT `fleet_telemetry_policy_entity_purpose_58` UNIQUE(`businessEntityId`,`purpose`)
);
--> statement-breakpoint
CREATE TABLE `fleet_utilization_snapshots_58` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`availableDays` decimal(10,2) NOT NULL DEFAULT '0',
	`rentedDays` decimal(10,2) NOT NULL DEFAULT '0',
	`maintenanceDays` decimal(10,2) NOT NULL DEFAULT '0',
	`accidentDays` decimal(10,2) NOT NULL DEFAULT '0',
	`idleDays` decimal(10,2) NOT NULL DEFAULT '0',
	`utilizationPercent` decimal(8,3) NOT NULL DEFAULT '0',
	`availabilityPercent` decimal(8,3) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fleet_utilization_snapshots_58_id` PRIMARY KEY(`id`)
);
