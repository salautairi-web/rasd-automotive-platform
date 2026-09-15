CREATE TABLE `consolidation_entities_66` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`groupId` int NOT NULL,
	`ownershipBps` int NOT NULL,
	`control` enum('subsidiary','associate','excluded') NOT NULL DEFAULT 'subsidiary',
	`functionalCurrency` varchar(3) NOT NULL,
	`included` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consolidation_entities_66_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consolidation_groups_66` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupCode` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`reportingCurrency` varchar(3) NOT NULL,
	`reportingCalendar` varchar(80) NOT NULL,
	`status` enum('draft','active','closed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consolidation_groups_66_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consolidation_mappings_66` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`entityAccountRef` varchar(100) NOT NULL,
	`groupAccountRef` varchar(100) NOT NULL,
	`accountType` varchar(80) NOT NULL,
	`version` varchar(40) NOT NULL,
	`effectiveDate` timestamp NOT NULL,
	`status` enum('draft','validated','approved') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consolidation_mappings_66_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consolidation_matches_66` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`periodId` int NOT NULL,
	`sourceEntityId` int NOT NULL,
	`targetEntityId` int NOT NULL,
	`transactionReference` varchar(160) NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`status` enum('matched','exception','eliminated') NOT NULL DEFAULT 'matched',
	`exceptionNote` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consolidation_matches_66_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consolidation_periods_66` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`periodCode` varchar(30) NOT NULL,
	`status` enum('open','review','locked','closed') NOT NULL DEFAULT 'open',
	`lateEntriesAllowed` enum('yes','no') NOT NULL DEFAULT 'no',
	`lockedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consolidation_periods_66_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consolidation_snapshots_66` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`periodId` int NOT NULL,
	`revenueMinor` int NOT NULL DEFAULT 0,
	`assetsMinor` int NOT NULL DEFAULT 0,
	`liabilitiesMinor` int NOT NULL DEFAULT 0,
	`cashMinor` int NOT NULL DEFAULT 0,
	`interEntityEliminationsMinor` int NOT NULL DEFAULT 0,
	`status` enum('draft','review','approved') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consolidation_snapshots_66_id` PRIMARY KEY(`id`)
);
