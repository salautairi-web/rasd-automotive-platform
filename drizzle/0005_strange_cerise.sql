CREATE TABLE `inventory_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`sku` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`unit` varchar(20) NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	CONSTRAINT `inventory_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_entity_sku_unique` UNIQUE(`businessEntityId`,`sku`)
);
--> statement-breakpoint
CREATE TABLE `stock_balances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`warehouseId` int NOT NULL,
	`inventoryItemId` int NOT NULL,
	`quantityMinor` int NOT NULL DEFAULT 0,
	`valuationMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	CONSTRAINT `stock_balances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`supplierNo` varchar(40) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`),
	CONSTRAINT `suppliers_entity_no_unique` UNIQUE(`businessEntityId`,`supplierNo`)
);
