CREATE TABLE `rental_deposit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`depositId` int NOT NULL,
	`transactionType` enum('hold','deduction','refund') NOT NULL,
	`amountMinor` int NOT NULL,
	`reason` text,
	`idempotencyKey` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rental_deposit_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_deposit_transactions_entity_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
