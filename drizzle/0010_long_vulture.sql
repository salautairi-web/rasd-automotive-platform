CREATE TABLE `workshop_appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`appointmentNo` varchar(80) NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`serviceType` varchar(120) NOT NULL,
	`status` enum('scheduled','checked_in','cancelled','completed') NOT NULL DEFAULT 'scheduled',
	CONSTRAINT `workshop_appointments_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_appointments_entity_no_unique` UNIQUE(`businessEntityId`,`appointmentNo`)
);
--> statement-breakpoint
CREATE TABLE `workshop_customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`customerNo` varchar(60) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`customerType` enum('individual','corporate','fleet','inter_entity') NOT NULL DEFAULT 'individual',
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	CONSTRAINT `workshop_customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_customers_entity_no_unique` UNIQUE(`businessEntityId`,`customerNo`)
);
--> statement-breakpoint
CREATE TABLE `workshop_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`workOrderId` int NOT NULL,
	`recipientName` varchar(180) NOT NULL,
	`odometer` int,
	`deliveredAt` timestamp NOT NULL DEFAULT (now()),
	`acknowledgement` text,
	CONSTRAINT `workshop_deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workshop_estimates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`estimateNo` varchar(80) NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`laborMinor` int NOT NULL DEFAULT 0,
	`partsMinor` int NOT NULL DEFAULT 0,
	`discountMinor` int NOT NULL DEFAULT 0,
	`totalMinor` int NOT NULL,
	`status` enum('draft','pending_customer','pending_internal','approved','rejected','expired') NOT NULL DEFAULT 'draft',
	CONSTRAINT `workshop_estimates_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_estimates_entity_no_unique` UNIQUE(`businessEntityId`,`estimateNo`)
);
--> statement-breakpoint
CREATE TABLE `workshop_inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`appointmentId` int,
	`checklistJson` text NOT NULL,
	`findings` text,
	`status` enum('draft','completed') NOT NULL DEFAULT 'draft',
	`completedAt` timestamp,
	CONSTRAINT `workshop_inspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workshop_invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`invoiceNo` varchar(80) NOT NULL,
	`workOrderId` int NOT NULL,
	`totalMinor` int NOT NULL,
	`paidMinor` int NOT NULL DEFAULT 0,
	`status` enum('draft','posted','partially_paid','paid','void') NOT NULL DEFAULT 'draft',
	CONSTRAINT `workshop_invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_invoices_entity_no_unique` UNIQUE(`businessEntityId`,`invoiceNo`)
);
--> statement-breakpoint
CREATE TABLE `workshop_labor_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`workOrderId` int NOT NULL,
	`technicianId` int NOT NULL,
	`operationName` varchar(180) NOT NULL,
	`minutes` int NOT NULL,
	`costMinor` int NOT NULL DEFAULT 0,
	`revenueMinor` int NOT NULL DEFAULT 0,
	CONSTRAINT `workshop_labor_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workshop_parts_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`workOrderId` int NOT NULL,
	`targetPartsEntityId` int NOT NULL,
	`requestNo` varchar(80) NOT NULL,
	`payloadJson` text NOT NULL,
	`status` enum('draft','sent','accepted','received','cancelled') NOT NULL DEFAULT 'draft',
	`idempotencyKey` varchar(120) NOT NULL,
	CONSTRAINT `workshop_parts_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_parts_requests_entity_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `workshop_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`invoiceId` int NOT NULL,
	`paymentNo` varchar(80) NOT NULL,
	`amountMinor` int NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	`paidAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workshop_payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_payments_entity_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `workshop_quality_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`workOrderId` int NOT NULL,
	`checklistJson` text NOT NULL,
	`result` enum('passed','failed','recheck') NOT NULL,
	`approvedBy` int,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workshop_quality_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workshop_technicians` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`technicianNo` varchar(60) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`department` varchar(40) NOT NULL,
	`laborRateMinor` int NOT NULL DEFAULT 0,
	`available` int NOT NULL DEFAULT 1,
	CONSTRAINT `workshop_technicians_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_technicians_entity_no_unique` UNIQUE(`businessEntityId`,`technicianNo`)
);
--> statement-breakpoint
CREATE TABLE `workshop_customer_vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`customerId` int NOT NULL,
	`vehicleNo` varchar(80) NOT NULL,
	`vin` varchar(64) NOT NULL,
	`plateNo` varchar(40),
	`make` varchar(80) NOT NULL,
	`model` varchar(80) NOT NULL,
	`modelYear` int,
	`odometer` int NOT NULL DEFAULT 0,
	`status` enum('checked_in','inspection','estimate_pending','awaiting_approval','in_repair','waiting_parts','quality_check','ready','delivered','returned') NOT NULL DEFAULT 'checked_in',
	CONSTRAINT `workshop_customer_vehicles_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_vehicles_entity_no_unique` UNIQUE(`businessEntityId`,`vehicleNo`),
	CONSTRAINT `workshop_vehicles_entity_vin_unique` UNIQUE(`businessEntityId`,`vin`)
);
--> statement-breakpoint
CREATE TABLE `workshop_work_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`workOrderNo` varchar(80) NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`estimateId` int,
	`technicianId` int,
	`branchId` int,
	`status` enum('draft','approved','in_progress','waiting_parts','waiting_approval','quality_check','ready','delivered','cancelled') NOT NULL DEFAULT 'draft',
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	CONSTRAINT `workshop_work_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `workshop_work_orders_entity_no_unique` UNIQUE(`businessEntityId`,`workOrderNo`)
);
