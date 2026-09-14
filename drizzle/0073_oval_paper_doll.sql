CREATE TABLE `trade_customs_61` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`shipmentId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`declarationNo` varchar(100) NOT NULL,
	`classificationReference` varchar(80),
	`declaredValueMinor` int NOT NULL,
	`dutiesMinor` int NOT NULL DEFAULT 0,
	`taxesMinor` int NOT NULL DEFAULT 0,
	`feesMinor` int NOT NULL DEFAULT 0,
	`requiredDocumentsJson` text NOT NULL,
	`missingDocumentsJson` text,
	`status` enum('draft','submitted','under_review','released','rejected') NOT NULL DEFAULT 'draft',
	`releasedAt` timestamp,
	CONSTRAINT `trade_customs_61_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_documents_61` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`tradeOrderId` int NOT NULL,
	`shipmentId` int,
	`documentType` enum('bill_of_lading','commercial_invoice','packing_list','certificate_of_origin','insurance','customs','vehicle','other') NOT NULL,
	`documentRef` varchar(160) NOT NULL,
	`storageKey` varchar(240),
	`checksum` varchar(128),
	`status` enum('missing','uploaded','verified','rejected') NOT NULL DEFAULT 'missing',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trade_documents_61_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_landed_costs_61` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`tradeOrderId` int NOT NULL,
	`shipmentId` int,
	`vehicleId` int,
	`costType` enum('freight','insurance','customs_duty','tax','port','clearing','storage','inspection','other') NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`allocationBasis` enum('per_vehicle','value','weight','equal') NOT NULL,
	`sourceReference` varchar(120),
	`approved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trade_landed_costs_61_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_orders_61` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`tradeNo` varchar(80) NOT NULL,
	`direction` enum('import','export') NOT NULL,
	`supplierId` int,
	`customerId` int,
	`currency` varchar(8) NOT NULL,
	`incoterm` varchar(30),
	`totalValueMinor` int NOT NULL DEFAULT 0,
	`status` enum('draft','pending_approval','approved','in_transit','arrived','closed','cancelled') NOT NULL DEFAULT 'draft',
	`idempotencyKey` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trade_orders_61_id` PRIMARY KEY(`id`),
	CONSTRAINT `trade_orders_61_entity_trade_unique` UNIQUE(`businessEntityId`,`tradeNo`),
	CONSTRAINT `trade_orders_61_entity_idempotency_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `trade_proformas_61` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`tradeOrderId` int NOT NULL,
	`proformaNo` varchar(80) NOT NULL,
	`counterpartyName` varchar(180) NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`paymentTerms` varchar(120),
	`validityUntil` timestamp,
	`documentVersion` int NOT NULL DEFAULT 1,
	`status` enum('draft','pending_approval','approved','rejected') NOT NULL DEFAULT 'draft',
	`checksum` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trade_proformas_61_id` PRIMARY KEY(`id`),
	CONSTRAINT `trade_proformas_61_entity_proforma_unique` UNIQUE(`businessEntityId`,`proformaNo`)
);
--> statement-breakpoint
CREATE TABLE `trade_shipment_vehicles_61` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`shipmentId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`purchaseSaleReference` varchar(120),
	`vinSnapshot` varchar(80),
	`odometer` int,
	`status` enum('booked','loaded','discharged','cleared','received','exception') NOT NULL DEFAULT 'booked',
	`documentsJson` text,
	CONSTRAINT `trade_shipment_vehicles_61_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_shipments_61` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`tradeOrderId` int NOT NULL,
	`shipmentNo` varchar(80) NOT NULL,
	`origin` varchar(120) NOT NULL,
	`destination` varchar(120) NOT NULL,
	`port` varchar(120),
	`carrier` varchar(160),
	`mode` enum('sea','air','land','multimodal') NOT NULL,
	`containerNo` varchar(80),
	`sealNo` varchar(80),
	`etd` timestamp,
	`eta` timestamp,
	`status` enum('booked','loaded','in_transit','at_port','customs','released','arrived','cancelled') NOT NULL DEFAULT 'booked',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trade_shipments_61_id` PRIMARY KEY(`id`),
	CONSTRAINT `trade_shipments_61_entity_shipment_unique` UNIQUE(`businessEntityId`,`shipmentNo`)
);
