CREATE TABLE `inventory_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` varchar(100) NOT NULL,
	`requestId` varchar(80) NOT NULL,
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_balances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`locationId` int,
	`productId` int NOT NULL,
	`batchId` int,
	`onHandQty` decimal(16,3) NOT NULL DEFAULT '0',
	`reservedQty` decimal(16,3) NOT NULL DEFAULT '0',
	`quarantineQty` decimal(16,3) NOT NULL DEFAULT '0',
	`inTransitQty` decimal(16,3) NOT NULL DEFAULT '0',
	`averageCostMinor` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_balances_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_balance_unique` UNIQUE(`businessEntityId`,`warehouseId`,`locationId`,`productId`,`batchId`)
);
--> statement-breakpoint
CREATE TABLE `inventory_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`productId` int NOT NULL,
	`batchNo` varchar(100) NOT NULL,
	`manufacturedAt` timestamp,
	`expiresAt` timestamp,
	`warrantyUntil` timestamp,
	`status` enum('active','expired','quarantined','depleted') NOT NULL DEFAULT 'active',
	CONSTRAINT `inventory_batches_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_batch_unique` UNIQUE(`businessEntityId`,`productId`,`batchNo`)
);
--> statement-breakpoint
CREATE TABLE `inventory_count_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`countId` int NOT NULL,
	`productId` int NOT NULL,
	`locationId` int,
	`systemQty` decimal(16,3) NOT NULL,
	`countedQty` decimal(16,3),
	`varianceQty` decimal(16,3),
	`unitCostMinor` int NOT NULL DEFAULT 0,
	`evidenceStorageKey` varchar(300),
	CONSTRAINT `inventory_count_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_counts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`countNo` varchar(80) NOT NULL,
	`countType` enum('cycle','full','blind') NOT NULL,
	`status` enum('draft','counting','recount','pending_approval','posted','cancelled') NOT NULL DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_counts_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_count_no_unique` UNIQUE(`businessEntityId`,`countNo`)
);
--> statement-breakpoint
CREATE TABLE `inventory_ledger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`locationId` int,
	`productId` int NOT NULL,
	`batchId` int,
	`serialId` int,
	`movementType` enum('receipt','put_away','issue','transfer_out','transfer_in','return','reservation','release','adjustment','quarantine','quarantine_release') NOT NULL,
	`quantity` decimal(16,3) NOT NULL,
	`unitCostMinor` int NOT NULL DEFAULT 0,
	`sourceSystem` varchar(80) NOT NULL,
	`sourceId` varchar(120) NOT NULL,
	`correlationId` varchar(80) NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_ledger_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_ledger_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `inventory_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`locationCode` varchar(80) NOT NULL,
	`zone` varchar(60),
	`aisle` varchar(60),
	`rack` varchar(60),
	`bin` varchar(60),
	`status` enum('available','quarantine','inspection','blocked','reserved') NOT NULL DEFAULT 'available',
	`capacity` decimal(14,3),
	CONSTRAINT `inventory_locations_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_location_code_unique` UNIQUE(`businessEntityId`,`warehouseId`,`locationCode`)
);
--> statement-breakpoint
CREATE TABLE `inventory_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`sku` varchar(100) NOT NULL,
	`barcode` varchar(100),
	`oemMpn` varchar(100),
	`nameAr` varchar(220) NOT NULL,
	`category` varchar(100),
	`brand` varchar(100),
	`unit` varchar(30) NOT NULL,
	`serialTracking` boolean NOT NULL DEFAULT false,
	`batchTracking` boolean NOT NULL DEFAULT false,
	`expiryTracking` boolean NOT NULL DEFAULT false,
	`costingMethod` enum('fifo','weighted_average','specific_identification') NOT NULL DEFAULT 'weighted_average',
	`minimumQty` decimal(14,3) NOT NULL DEFAULT '0',
	`maximumQty` decimal(14,3) NOT NULL DEFAULT '0',
	`reorderPoint` decimal(14,3) NOT NULL DEFAULT '0',
	`safetyStock` decimal(14,3) NOT NULL DEFAULT '0',
	`leadTimeDays` int NOT NULL DEFAULT 0,
	`status` enum('active','inactive','obsolete') NOT NULL DEFAULT 'active',
	CONSTRAINT `inventory_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_product_sku_unique` UNIQUE(`businessEntityId`,`sku`),
	CONSTRAINT `inventory_product_barcode_unique` UNIQUE(`businessEntityId`,`barcode`)
);
--> statement-breakpoint
CREATE TABLE `inventory_reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` decimal(16,3) NOT NULL,
	`purpose` varchar(80) NOT NULL,
	`sourceSystem` varchar(80) NOT NULL,
	`sourceId` varchar(120) NOT NULL,
	`expiresAt` timestamp,
	`status` enum('active','fulfilled','released','expired','cancelled') NOT NULL DEFAULT 'active',
	`idempotencyKey` varchar(120) NOT NULL,
	CONSTRAINT `inventory_reservations_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_reservation_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `inventory_serials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`productId` int NOT NULL,
	`serialNo` varchar(140) NOT NULL,
	`warehouseId` int NOT NULL,
	`locationId` int,
	`status` enum('available','reserved','issued','quarantined','returned') NOT NULL DEFAULT 'available',
	CONSTRAINT `inventory_serials_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_serial_unique` UNIQUE(`businessEntityId`,`productId`,`serialNo`)
);
--> statement-breakpoint
CREATE TABLE `inventory_transfers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceEntityId` int NOT NULL,
	`targetEntityId` int,
	`sourceWarehouseId` int NOT NULL,
	`targetWarehouseId` int,
	`transferNo` varchar(80) NOT NULL,
	`transferType` enum('internal','branch','inter_entity_sale','inter_entity_transfer') NOT NULL,
	`status` enum('draft','approved','in_transit','received','cancelled') NOT NULL DEFAULT 'draft',
	`correlationId` varchar(80) NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	CONSTRAINT `inventory_transfers_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_transfer_no_unique` UNIQUE(`sourceEntityId`,`transferNo`),
	CONSTRAINT `inventory_transfer_key_unique` UNIQUE(`sourceEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `inventory_valuation_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`warehouseId` int,
	`totalValueMinor` int NOT NULL DEFAULT 0,
	`availableValueMinor` int NOT NULL DEFAULT 0,
	`reservedValueMinor` int NOT NULL DEFAULT 0,
	`quarantineValueMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_valuation_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_valuation_period_unique` UNIQUE(`businessEntityId`,`periodCode`,`warehouseId`)
);
--> statement-breakpoint
CREATE TABLE `inventory_warehouses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`warehouseCode` varchar(60) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`branchId` int,
	`warehouseType` enum('general','parts','vehicles','consumables','quarantine','transit') NOT NULL DEFAULT 'general',
	`status` enum('active','inactive','blocked') NOT NULL DEFAULT 'active',
	CONSTRAINT `inventory_warehouses_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_warehouse_code_unique` UNIQUE(`businessEntityId`,`warehouseCode`)
);
