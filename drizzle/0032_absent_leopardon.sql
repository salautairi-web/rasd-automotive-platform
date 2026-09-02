CREATE TABLE `fleet_fuel_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`liters` decimal(12,3) NOT NULL,
	`unitPriceMinor` int NOT NULL,
	`totalMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`station` varchar(180),
	`fuelType` varchar(40),
	`odometer` int NOT NULL,
	`receiptRef` varchar(120),
	`recordedByUserId` int NOT NULL,
	`idempotencyKey` varchar(140) NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fleet_fuel_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `fleet_fuel_entity_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `fleet_telematics_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`providerKey` varchar(80) NOT NULL,
	`externalDeviceRef` varchar(160) NOT NULL,
	`status` enum('pending','active','paused','revoked') NOT NULL DEFAULT 'pending',
	`lastSeenAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fleet_telematics_devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `fleet_telematics_entity_device_unique` UNIQUE(`businessEntityId`,`externalDeviceRef`)
);
--> statement-breakpoint
CREATE TABLE `fleet_telematics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`deviceId` int NOT NULL,
	`eventType` varchar(60) NOT NULL,
	`occurredAt` timestamp NOT NULL,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`latitudeMasked` varchar(40),
	`longitudeMasked` varchar(40),
	`distanceKm` decimal(12,2),
	`payloadHash` varchar(128) NOT NULL,
	`idempotencyKey` varchar(140) NOT NULL,
	CONSTRAINT `fleet_telematics_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `fleet_telematics_entity_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `fleet_trips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`driverId` int,
	`tripNo` varchar(90) NOT NULL,
	`origin` varchar(240) NOT NULL,
	`destination` varchar(240) NOT NULL,
	`purpose` varchar(180) NOT NULL,
	`scheduledStartAt` timestamp NOT NULL,
	`scheduledEndAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`distanceKm` decimal(12,2) NOT NULL DEFAULT '0',
	`fuelLiters` decimal(12,3) NOT NULL DEFAULT '0',
	`tripCostMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`status` enum('planned','allocated','in_progress','completed','cancelled') NOT NULL DEFAULT 'planned',
	`idempotencyKey` varchar(140) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fleet_trips_id` PRIMARY KEY(`id`),
	CONSTRAINT `fleet_trips_entity_no_unique` UNIQUE(`businessEntityId`,`tripNo`),
	CONSTRAINT `fleet_trips_entity_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `fleet_tyres` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`tyreNo` varchar(80) NOT NULL,
	`position` varchar(40) NOT NULL,
	`brand` varchar(100),
	`size` varchar(60),
	`treadDepth` decimal(8,2),
	`installedAt` timestamp,
	`removedAt` timestamp,
	`costMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`status` enum('installed','removed','disposed') NOT NULL DEFAULT 'installed',
	`idempotencyKey` varchar(140) NOT NULL,
	CONSTRAINT `fleet_tyres_id` PRIMARY KEY(`id`),
	CONSTRAINT `fleet_tyres_entity_no_unique` UNIQUE(`businessEntityId`,`tyreNo`),
	CONSTRAINT `fleet_tyres_entity_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `fleet_vehicle_status_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`fromStatus` varchar(40),
	`toStatus` varchar(40) NOT NULL,
	`reason` varchar(240) NOT NULL,
	`actorUserId` int NOT NULL,
	`correlationId` varchar(96) NOT NULL,
	`idempotencyKey` varchar(140) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fleet_vehicle_status_history_id` PRIMARY KEY(`id`),
	CONSTRAINT `fleet_status_history_entity_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
