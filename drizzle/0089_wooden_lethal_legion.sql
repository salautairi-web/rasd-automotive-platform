CREATE TABLE `rental_contract_charges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`contractId` int NOT NULL,
	`chargeType` enum('fuel','extra_mileage','late_return','additional_driver') NOT NULL,
	`description` varchar(240) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitRateMinor` int NOT NULL,
	`amountMinor` int NOT NULL,
	`status` enum('calculated','approved','void') NOT NULL DEFAULT 'calculated',
	`sourceJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rental_contract_charges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rental_deposit_settlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`depositId` int NOT NULL,
	`contractId` int NOT NULL,
	`settlementNo` varchar(80) NOT NULL,
	`requestedRefundMinor` int NOT NULL DEFAULT 0,
	`requestedDeductionMinor` int NOT NULL DEFAULT 0,
	`reason` text,
	`status` enum('pending_accountant','approved','rejected','applied') NOT NULL DEFAULT 'pending_accountant',
	`approvedBy` int,
	`idempotencyKey` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rental_deposit_settlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_deposit_settlements_entity_no_unique` UNIQUE(`businessEntityId`,`settlementNo`),
	CONSTRAINT `rental_deposit_settlements_entity_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
