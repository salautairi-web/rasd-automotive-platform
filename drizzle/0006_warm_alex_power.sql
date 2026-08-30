CREATE TABLE `capital_contributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`contributionDate` timestamp NOT NULL,
	`status` enum('draft','approved','posted') NOT NULL DEFAULT 'draft',
	`correlationId` varchar(80),
	CONSTRAINT `capital_contributions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consolidation_exceptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`exceptionType` varchar(60) NOT NULL,
	`entityId` int,
	`message` text,
	`status` enum('open','resolved') NOT NULL DEFAULT 'open',
	CONSTRAINT `consolidation_exceptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `entity_loans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lenderEntityId` int NOT NULL,
	`borrowerEntityId` int NOT NULL,
	`principalMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`status` enum('draft','approved','active','settled') NOT NULL DEFAULT 'draft',
	`correlationId` varchar(80),
	CONSTRAINT `entity_loans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inter_entity_reconciliations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`status` enum('open','matched','exception') NOT NULL DEFAULT 'open',
	`differenceMinor` int NOT NULL DEFAULT 0,
	`note` text,
	CONSTRAINT `inter_entity_reconciliations_id` PRIMARY KEY(`id`)
);
