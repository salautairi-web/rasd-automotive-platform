CREATE TABLE `parts_vehicle_compatibility` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`productId` int NOT NULL,
	`make` varchar(80) NOT NULL,
	`model` varchar(80) NOT NULL,
	`yearFrom` int,
	`yearTo` int,
	`engine` varchar(80),
	`region` varchar(60),
	`notes` text,
	CONSTRAINT `parts_vehicle_compatibility_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parts_customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`customerNo` varchar(60) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`customerType` enum('retail','b2b','corporate') NOT NULL DEFAULT 'retail',
	`creditLimitMinor` int NOT NULL DEFAULT 0,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	CONSTRAINT `parts_customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `parts_customers_entity_no_unique` UNIQUE(`businessEntityId`,`customerNo`)
);
--> statement-breakpoint
CREATE TABLE `parts_inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`productId` int NOT NULL,
	`availableQty` int NOT NULL DEFAULT 0,
	`reservedQty` int NOT NULL DEFAULT 0,
	`damagedQty` int NOT NULL DEFAULT 0,
	`reorderPoint` int NOT NULL DEFAULT 0,
	`averageCostMinor` int NOT NULL DEFAULT 0,
	CONSTRAINT `parts_inventory_id` PRIMARY KEY(`id`),
	CONSTRAINT `parts_inventory_entity_balance_unique` UNIQUE(`businessEntityId`,`warehouseId`,`productId`)
);
--> statement-breakpoint
CREATE TABLE `parts_inventory_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`productId` int NOT NULL,
	`movementType` enum('receipt','reservation','release','issue','return','transfer','adjustment') NOT NULL,
	`quantity` int NOT NULL,
	`sourceType` varchar(60) NOT NULL,
	`sourceId` varchar(80) NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parts_inventory_movements_id` PRIMARY KEY(`id`),
	CONSTRAINT `parts_movements_entity_idempotency_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `parts_invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`invoiceNo` varchar(80) NOT NULL,
	`salesOrderId` int NOT NULL,
	`totalMinor` int NOT NULL,
	`paidMinor` int NOT NULL DEFAULT 0,
	`status` enum('draft','posted','partially_paid','paid','void') NOT NULL DEFAULT 'draft',
	CONSTRAINT `parts_invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `parts_invoices_entity_no_unique` UNIQUE(`businessEntityId`,`invoiceNo`)
);
--> statement-breakpoint
CREATE TABLE `parts_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`invoiceId` int NOT NULL,
	`paymentNo` varchar(80) NOT NULL,
	`amountMinor` int NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	`status` enum('confirmed','failed','refunded') NOT NULL DEFAULT 'confirmed',
	`paidAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parts_payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `parts_payments_entity_idempotency_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `parts_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`sku` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`nameEn` varchar(180),
	`category` varchar(80),
	`brand` varchar(80),
	`barcode` varchar(80),
	`oemNo` varchar(80),
	`mpn` varchar(80),
	`unit` varchar(20) NOT NULL,
	`costMinor` int NOT NULL DEFAULT 0,
	`retailPriceMinor` int NOT NULL DEFAULT 0,
	`minimumMarginBps` int NOT NULL DEFAULT 1000,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	CONSTRAINT `parts_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `parts_products_entity_sku_unique` UNIQUE(`businessEntityId`,`sku`)
);
--> statement-breakpoint
CREATE TABLE `parts_purchase_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`purchaseOrderNo` varchar(80) NOT NULL,
	`supplierId` int NOT NULL,
	`totalMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`status` enum('draft','pending_approval','approved','received','closed','cancelled') NOT NULL DEFAULT 'draft',
	CONSTRAINT `parts_purchase_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `parts_purchase_orders_entity_no_unique` UNIQUE(`businessEntityId`,`purchaseOrderNo`)
);
--> statement-breakpoint
CREATE TABLE `parts_reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`salesOrderId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	`status` enum('confirmed','released','issued','cancelled') NOT NULL DEFAULT 'confirmed',
	CONSTRAINT `parts_reservations_id` PRIMARY KEY(`id`),
	CONSTRAINT `parts_reservations_entity_idempotency_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `parts_sales_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`salesOrderNo` varchar(80) NOT NULL,
	`customerId` int NOT NULL,
	`totalMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`sourceEntityId` int,
	`status` enum('draft','reserved','issued','invoiced','paid','cancelled') NOT NULL DEFAULT 'draft',
	CONSTRAINT `parts_sales_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `parts_sales_orders_entity_no_unique` UNIQUE(`businessEntityId`,`salesOrderNo`)
);
--> statement-breakpoint
CREATE TABLE `parts_suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`supplierNo` varchar(60) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`currency` varchar(8) NOT NULL,
	`leadTimeDays` int NOT NULL DEFAULT 0,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	CONSTRAINT `parts_suppliers_id` PRIMARY KEY(`id`),
	CONSTRAINT `parts_suppliers_entity_no_unique` UNIQUE(`businessEntityId`,`supplierNo`)
);
--> statement-breakpoint
CREATE TABLE `parts_warehouses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`warehouseCode` varchar(60) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`branchId` int,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	CONSTRAINT `parts_warehouses_id` PRIMARY KEY(`id`),
	CONSTRAINT `parts_warehouses_entity_code_unique` UNIQUE(`businessEntityId`,`warehouseCode`)
);
