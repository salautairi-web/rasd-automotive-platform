CREATE TABLE `trading_contracts_60` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`contractNo` varchar(80) NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`reservationId` int,
	`finalPriceMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`termsJson` text NOT NULL,
	`status` enum('draft','pending_approval','approved','signed','cancelled') NOT NULL DEFAULT 'draft',
	`signedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_contracts_60_id` PRIMARY KEY(`id`),
	CONSTRAINT `trading_contracts_60_entity_contract_unique` UNIQUE(`businessEntityId`,`contractNo`)
);
--> statement-breakpoint
CREATE TABLE `trading_payments_60` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`contractId` int NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`amountMinor` int NOT NULL,
	`method` varchar(40) NOT NULL,
	`reference` varchar(100),
	`status` enum('pending','confirmed','failed','refunded') NOT NULL DEFAULT 'pending',
	`idempotencyKey` varchar(100) NOT NULL,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_payments_60_id` PRIMARY KEY(`id`),
	CONSTRAINT `trading_payments_60_entity_idempotency_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `trading_registrations_60` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`contractId` int NOT NULL,
	`authorityReference` varchar(120),
	`documentsJson` text NOT NULL,
	`feesMinor` int NOT NULL DEFAULT 0,
	`status` enum('pending','submitted','completed','rejected') NOT NULL DEFAULT 'pending',
	`completedAt` timestamp,
	CONSTRAINT `trading_registrations_60_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trading_returns_60` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`returnNo` varchar(80) NOT NULL,
	`vehicleId` int NOT NULL,
	`customerId` int NOT NULL,
	`contractId` int,
	`reason` varchar(240) NOT NULL,
	`inspectionJson` text NOT NULL,
	`refundMinor` int NOT NULL DEFAULT 0,
	`status` enum('requested','approved','rejected','completed') NOT NULL DEFAULT 'requested',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_returns_60_id` PRIMARY KEY(`id`),
	CONSTRAINT `trading_returns_60_entity_return_unique` UNIQUE(`businessEntityId`,`returnNo`)
);
--> statement-breakpoint
CREATE TABLE `trading_warranty_claims_60` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`contractId` int,
	`claimNo` varchar(80) NOT NULL,
	`warrantyType` varchar(80) NOT NULL,
	`coverageJson` text NOT NULL,
	`claimedCostMinor` int NOT NULL DEFAULT 0,
	`responsibility` enum('supplier','company','customer','undetermined') NOT NULL DEFAULT 'undetermined',
	`status` enum('opened','under_review','approved','rejected','closed') NOT NULL DEFAULT 'opened',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_warranty_claims_60_id` PRIMARY KEY(`id`),
	CONSTRAINT `trading_warranty_claims_60_entity_claim_unique` UNIQUE(`businessEntityId`,`claimNo`)
);
