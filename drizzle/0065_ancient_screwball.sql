CREATE TABLE `inventory_aging_56` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` decimal(16,3) NOT NULL,
	`valueMinor` int NOT NULL,
	`ageDays` int NOT NULL,
	`risk` enum('normal','slow_moving','dead_stock','expiry_risk') NOT NULL,
	`actionPlan` text,
	`snapshotAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_aging_56_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_inter_entity_transfers_56` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceEntityId` int NOT NULL,
	`targetEntityId` int NOT NULL,
	`sourceWarehouseId` int NOT NULL,
	`targetWarehouseId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` decimal(16,3) NOT NULL,
	`unitValueMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`status` enum('draft','pending_approval','approved','in_transit','received','settled','rejected') NOT NULL DEFAULT 'draft',
	`idempotencyKey` varchar(160) NOT NULL,
	`requestedBy` int NOT NULL,
	`approvedBy` int,
	`sourceTransactionRef` varchar(120),
	`targetTransactionRef` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_inter_entity_transfers_56_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_inter_entity_56_key` UNIQUE(`sourceEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `inventory_issues_56` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`productId` int NOT NULL,
	`locationId` int,
	`quantity` decimal(16,3) NOT NULL,
	`sourceType` varchar(60) NOT NULL,
	`sourceId` varchar(120) NOT NULL,
	`status` enum('requested','approved','picked','issued','cancelled') NOT NULL DEFAULT 'requested',
	`idempotencyKey` varchar(160) NOT NULL,
	`requestedBy` int NOT NULL,
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_issues_56_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_issue_56_key` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `inventory_landed_costs_56` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`receiptId` int NOT NULL,
	`freightMinor` int NOT NULL DEFAULT 0,
	`insuranceMinor` int NOT NULL DEFAULT 0,
	`dutiesMinor` int NOT NULL DEFAULT 0,
	`handlingMinor` int NOT NULL DEFAULT 0,
	`allocationBasis` enum('value','quantity','weight','volume') NOT NULL,
	`status` enum('draft','approved','allocated') NOT NULL DEFAULT 'draft',
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_landed_costs_56_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_receipts_56` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`productId` int NOT NULL,
	`purchaseOrderId` int,
	`supplierId` int,
	`quantity` decimal(16,3) NOT NULL,
	`acceptedQuantity` decimal(16,3) NOT NULL DEFAULT '0',
	`rejectedQuantity` decimal(16,3) NOT NULL DEFAULT '0',
	`inspectionStatus` enum('pending','accepted','partially_accepted','rejected') NOT NULL DEFAULT 'pending',
	`putawayStatus` enum('pending','partial','completed') NOT NULL DEFAULT 'pending',
	`sourceRef` varchar(120) NOT NULL,
	`idempotencyKey` varchar(160) NOT NULL,
	`receivedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_receipts_56_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_receipt_56_key` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `inventory_replenishments_56` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`productId` int NOT NULL,
	`availableQty` decimal(16,3) NOT NULL,
	`reorderPoint` decimal(16,3) NOT NULL,
	`suggestedQty` decimal(16,3) NOT NULL,
	`demandBasisJson` text NOT NULL,
	`status` enum('suggested','approved','converted','dismissed') NOT NULL DEFAULT 'suggested',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_replenishments_56_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_returns_56` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` decimal(16,3) NOT NULL,
	`returnType` enum('customer','supplier','workshop') NOT NULL,
	`disposition` enum('restock','quarantine','scrap','pending_inspection') NOT NULL DEFAULT 'pending_inspection',
	`reason` text NOT NULL,
	`sourceRef` varchar(120) NOT NULL,
	`idempotencyKey` varchar(160) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_returns_56_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_return_56_key` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `inventory_stockouts_56` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`productId` int NOT NULL,
	`demandQty` decimal(16,3) NOT NULL,
	`alternativeProductId` int,
	`status` enum('open','backordered','resolved','dismissed') NOT NULL DEFAULT 'open',
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_stockouts_56_id` PRIMARY KEY(`id`)
);
