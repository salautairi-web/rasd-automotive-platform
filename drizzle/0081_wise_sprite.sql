CREATE TABLE `fpna_capital_allocations_67` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`scenarioId` int NOT NULL,
	`allocationCode` varchar(80) NOT NULL,
	`targetType` varchar(60) NOT NULL,
	`targetReference` varchar(160) NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`expectedReturnBps` int NOT NULL DEFAULT 0,
	`status` enum('draft','challenged','approved','frozen') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fpna_capital_allocations_67_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fpna_drivers_67` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenarioId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`driverKey` varchar(100) NOT NULL,
	`driverValueMinor` int NOT NULL,
	`unit` varchar(40) NOT NULL,
	`sourceReference` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fpna_drivers_67_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fpna_reviews_67` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`scenarioId` int NOT NULL,
	`stage` enum('submission','review','challenge','approval','freeze') NOT NULL,
	`reviewerUserId` int,
	`decision` enum('pending','approved','rejected','returned') NOT NULL DEFAULT 'pending',
	`comment` text,
	`decidedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fpna_reviews_67_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fpna_scenarios_67` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`scenarioCode` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`planningVersionId` int NOT NULL,
	`status` enum('draft','submitted','approved','frozen') NOT NULL DEFAULT 'draft',
	`assumptionsHash` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fpna_scenarios_67_id` PRIMARY KEY(`id`),
	CONSTRAINT `fpna_scenario_entity_code_unique` UNIQUE(`businessEntityId`,`scenarioCode`)
);
