CREATE TABLE `trading_acquisitions_60` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`source` enum('local_purchase','auction','supplier','trade_in','inter_entity','import','other') NOT NULL,
	`sellerName` varchar(180) NOT NULL,
	`purchaseDate` timestamp NOT NULL,
	`purchasePriceMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`odometer` int,
	`condition` varchar(80),
	`approvalStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
	`idempotencyKey` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_acquisitions_60_id` PRIMARY KEY(`id`),
	CONSTRAINT `trading_acq_60_entity_idempotency_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `trading_costs_60` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`acquisitionId` int,
	`costType` varchar(60) NOT NULL,
	`amountMinor` int NOT NULL,
	`sourceSystem` varchar(60) NOT NULL,
	`sourceId` varchar(100),
	`currency` varchar(8) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_costs_60_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trading_deliveries_60` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`deliveryNo` varchar(80) NOT NULL,
	`vehicleId` int NOT NULL,
	`customerId` int NOT NULL,
	`reservationId` int,
	`odometer` int,
	`checklistJson` text NOT NULL,
	`status` enum('pending','approved','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`deliveredAt` timestamp,
	CONSTRAINT `trading_deliveries_60_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trading_deposits_60` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`reservationId` int NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`amountMinor` int NOT NULL,
	`method` varchar(40) NOT NULL,
	`reference` varchar(100),
	`status` enum('pending','confirmed','refunded','allocated') NOT NULL DEFAULT 'pending',
	`idempotencyKey` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_deposits_60_id` PRIMARY KEY(`id`),
	CONSTRAINT `trading_deposits_60_entity_idempotency_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `trading_inspections_60` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`acquisitionId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`findingsJson` text NOT NULL,
	`photosJson` text,
	`estimatedRepairsMinor` int NOT NULL DEFAULT 0,
	`result` enum('pending','pass','pass_with_repairs','fail') NOT NULL DEFAULT 'pending',
	`inspectedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_inspections_60_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trading_leads_60` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int,
	`source` varchar(60),
	`budgetMinor` int,
	`status` enum('new','qualified','converted','lost') NOT NULL DEFAULT 'new',
	`assignedTo` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_leads_60_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trading_pricing_60` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`costBasisMinor` int NOT NULL,
	`targetMarginBps` int NOT NULL,
	`marketReferenceMinor` int,
	`minimumPriceMinor` int NOT NULL,
	`listPriceMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`approvalStatus` enum('not_required','pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`effectiveAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_pricing_60_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trading_profitability_60` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`sellingPriceMinor` int NOT NULL DEFAULT 0,
	`purchasePriceMinor` int NOT NULL DEFAULT 0,
	`acquisitionCostsMinor` int NOT NULL DEFAULT 0,
	`reconditioningMinor` int NOT NULL DEFAULT 0,
	`sellingCostsMinor` int NOT NULL DEFAULT 0,
	`grossProfitMinor` int NOT NULL DEFAULT 0,
	`marginBps` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_profitability_60_id` PRIMARY KEY(`id`),
	CONSTRAINT `trading_profitability_60_entity_vehicle_unique` UNIQUE(`businessEntityId`,`vehicleId`)
);
--> statement-breakpoint
CREATE TABLE `trading_quotes_60` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`quoteNo` varchar(80) NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`listPriceMinor` int NOT NULL,
	`discountMinor` int NOT NULL DEFAULT 0,
	`taxMinor` int NOT NULL DEFAULT 0,
	`finalPriceMinor` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','pending_approval','approved','rejected','expired','converted') NOT NULL DEFAULT 'draft',
	`validUntil` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_quotes_60_id` PRIMARY KEY(`id`),
	CONSTRAINT `trading_quotes_60_entity_quote_unique` UNIQUE(`businessEntityId`,`quoteNo`)
);
--> statement-breakpoint
CREATE TABLE `trading_reservations_60` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`reservationNo` varchar(80) NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`depositMinor` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`status` enum('confirmed','expired','cancelled','converted') NOT NULL DEFAULT 'confirmed',
	`idempotencyKey` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_reservations_60_id` PRIMARY KEY(`id`),
	CONSTRAINT `trading_reservations_60_entity_reservation_unique` UNIQUE(`businessEntityId`,`reservationNo`),
	CONSTRAINT `trading_reservations_60_entity_idempotency_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `trading_stock_60` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`branchId` int,
	`location` varchar(120),
	`status` enum('acquired','inspection','preparation','ready','reserved','sold','delivered','returned','on_hold') NOT NULL DEFAULT 'acquired',
	`acquiredAt` timestamp NOT NULL DEFAULT (now()),
	`readyAt` timestamp,
	`soldAt` timestamp,
	CONSTRAINT `trading_stock_60_id` PRIMARY KEY(`id`),
	CONSTRAINT `trading_stock_60_entity_vehicle_unique` UNIQUE(`businessEntityId`,`vehicleId`)
);
