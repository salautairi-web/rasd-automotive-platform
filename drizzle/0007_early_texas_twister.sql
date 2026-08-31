CREATE TABLE `sales_customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`customerNo` varchar(60) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`phone` varchar(40),
	`email` varchar(320),
	`status` enum('lead','qualified','active','inactive') NOT NULL DEFAULT 'lead',
	CONSTRAINT `sales_customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_customers_entity_no_unique` UNIQUE(`businessEntityId`,`customerNo`)
);
--> statement-breakpoint
CREATE TABLE `sales_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`deliveryNo` varchar(80) NOT NULL,
	`salesOrderId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`recipientName` varchar(180) NOT NULL,
	`odometer` int,
	`checklistJson` text,
	`status` enum('pending','approved','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`deliveredAt` timestamp,
	CONSTRAINT `sales_deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_deliveries_entity_no_unique` UNIQUE(`businessEntityId`,`deliveryNo`)
);
--> statement-breakpoint
CREATE TABLE `sales_entities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`salesCode` varchar(40) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	CONSTRAINT `sales_entities_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_entities_entity_code_unique` UNIQUE(`businessEntityId`,`salesCode`)
);
--> statement-breakpoint
CREATE TABLE `sales_invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`invoiceNo` varchar(80) NOT NULL,
	`salesOrderId` int NOT NULL,
	`customerId` int NOT NULL,
	`totalMinor` int NOT NULL,
	`paidMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`status` enum('draft','posted','partially_paid','paid','void') NOT NULL DEFAULT 'draft',
	`postedAt` timestamp,
	CONSTRAINT `sales_invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_invoices_entity_no_unique` UNIQUE(`businessEntityId`,`invoiceNo`)
);
--> statement-breakpoint
CREATE TABLE `sales_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`customerId` int NOT NULL,
	`source` varchar(60),
	`status` enum('new','qualified','converted','lost') NOT NULL DEFAULT 'new',
	`lostReason` varchar(120),
	`assignedTo` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`orderNo` varchar(80) NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`branchId` int,
	`totalMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`status` enum('draft','pending_approval','approved','invoiced','paid','delivered','cancelled') NOT NULL DEFAULT 'draft',
	`correlationId` varchar(80) NOT NULL,
	CONSTRAINT `sales_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_orders_entity_no_unique` UNIQUE(`businessEntityId`,`orderNo`)
);
--> statement-breakpoint
CREATE TABLE `sales_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`invoiceId` int NOT NULL,
	`paymentNo` varchar(80) NOT NULL,
	`amountMinor` int NOT NULL,
	`method` varchar(40) NOT NULL,
	`idempotencyKey` varchar(100) NOT NULL,
	`status` enum('pending','confirmed','failed','refunded') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	CONSTRAINT `sales_payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_payments_entity_no_unique` UNIQUE(`businessEntityId`,`paymentNo`),
	CONSTRAINT `sales_payments_entity_idempotency_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `sales_quotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`quotationNo` varchar(80) NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`targetPriceMinor` int NOT NULL,
	`discountMinor` int NOT NULL DEFAULT 0,
	`taxMinor` int NOT NULL DEFAULT 0,
	`totalMinor` int NOT NULL,
	`validUntil` timestamp NOT NULL,
	`status` enum('draft','pending_approval','approved','rejected','converted','expired') NOT NULL DEFAULT 'draft',
	`correlationId` varchar(80) NOT NULL,
	CONSTRAINT `sales_quotations_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_quotations_entity_no_unique` UNIQUE(`businessEntityId`,`quotationNo`)
);
--> statement-breakpoint
CREATE TABLE `sales_reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`reservationNo` varchar(80) NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`amountMinor` int NOT NULL DEFAULT 0,
	`startsAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`status` enum('pending','confirmed','expired','cancelled','converted') NOT NULL DEFAULT 'pending',
	`idempotencyKey` varchar(100) NOT NULL,
	CONSTRAINT `sales_reservations_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_reservations_entity_no_unique` UNIQUE(`businessEntityId`,`reservationNo`),
	CONSTRAINT `sales_reservations_entity_idempotency_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `sales_vehicle_costs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`costType` varchar(60) NOT NULL,
	`amountMinor` int NOT NULL,
	`sourceSystem` varchar(60) NOT NULL,
	`sourceId` varchar(80),
	`currency` varchar(8) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_vehicle_costs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleNo` varchar(80) NOT NULL,
	`vin` varchar(64) NOT NULL,
	`make` varchar(80) NOT NULL,
	`model` varchar(80) NOT NULL,
	`modelYear` int,
	`branchId` int,
	`status` enum('acquired','in_transit','received','inspection','preparation','ready','reserved','sold','delivered','returned','on_hold') NOT NULL DEFAULT 'acquired',
	`totalCostMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	CONSTRAINT `sales_vehicles_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_vehicles_entity_no_unique` UNIQUE(`businessEntityId`,`vehicleNo`),
	CONSTRAINT `sales_vehicles_entity_vin_unique` UNIQUE(`businessEntityId`,`vin`)
);
