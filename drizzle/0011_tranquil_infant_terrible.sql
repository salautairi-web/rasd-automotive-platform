CREATE TABLE `rental_checkins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`contractId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`odometer` int NOT NULL,
	`fuelLevel` int NOT NULL,
	`damageMinor` int NOT NULL DEFAULT 0,
	`conditionJson` text,
	`checkedInAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rental_checkins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rental_checkouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`contractId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`odometer` int NOT NULL,
	`fuelLevel` int NOT NULL,
	`conditionJson` text,
	`checkedOutAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rental_checkouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rental_contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`contractNo` varchar(80) NOT NULL,
	`reservationId` int,
	`customerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`ratePlanId` int NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`allowedMileage` int,
	`depositMinor` int NOT NULL DEFAULT 0,
	`totalMinor` int NOT NULL,
	`status` enum('draft','active','extended','returned','closed','cancelled') NOT NULL DEFAULT 'draft',
	CONSTRAINT `rental_contracts_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_contracts_entity_no_unique` UNIQUE(`businessEntityId`,`contractNo`)
);
--> statement-breakpoint
CREATE TABLE `rental_customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`customerNo` varchar(60) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`customerType` enum('individual','corporate') NOT NULL DEFAULT 'individual',
	`creditLimitMinor` int NOT NULL DEFAULT 0,
	`status` enum('active','inactive','blocked') NOT NULL DEFAULT 'active',
	CONSTRAINT `rental_customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_customers_entity_no_unique` UNIQUE(`businessEntityId`,`customerNo`)
);
--> statement-breakpoint
CREATE TABLE `rental_invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`invoiceNo` varchar(80) NOT NULL,
	`contractId` int NOT NULL,
	`totalMinor` int NOT NULL,
	`paidMinor` int NOT NULL DEFAULT 0,
	`status` enum('draft','posted','partially_paid','paid','void') NOT NULL DEFAULT 'draft',
	CONSTRAINT `rental_invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_invoices_entity_no_unique` UNIQUE(`businessEntityId`,`invoiceNo`)
);
--> statement-breakpoint
CREATE TABLE `rental_maintenance_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`lastServiceDate` timestamp,
	`nextServiceDate` timestamp,
	`nextServiceOdometer` int,
	`intervalDays` int,
	`intervalKilometers` int,
	`status` enum('healthy','due_soon','due','overdue') NOT NULL DEFAULT 'healthy',
	CONSTRAINT `rental_maintenance_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_maintenance_profiles_entity_vehicle_unique` UNIQUE(`businessEntityId`,`vehicleId`)
);
--> statement-breakpoint
CREATE TABLE `rental_maintenance_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`targetWorkshopEntityId` int NOT NULL,
	`requestNo` varchar(80) NOT NULL,
	`payloadJson` text NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	`status` enum('draft','sent','accepted','completed','cancelled') NOT NULL DEFAULT 'draft',
	CONSTRAINT `rental_maintenance_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_maintenance_requests_entity_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `rental_maintenance_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`taskNo` varchar(80) NOT NULL,
	`type` varchar(60) NOT NULL,
	`dueDate` timestamp,
	`dueOdometer` int,
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`status` enum('planned','approved','sent_to_workshop','in_progress','waiting_parts','completed','cancelled') NOT NULL DEFAULT 'planned',
	CONSTRAINT `rental_maintenance_tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_maintenance_tasks_entity_no_unique` UNIQUE(`businessEntityId`,`taskNo`)
);
--> statement-breakpoint
CREATE TABLE `rental_vehicle_odometer_readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`reading` int NOT NULL,
	`source` varchar(60) NOT NULL,
	`recordedBy` int,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rental_vehicle_odometer_readings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rental_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`invoiceId` int NOT NULL,
	`paymentNo` varchar(80) NOT NULL,
	`amountMinor` int NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	`paidAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rental_payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_payments_entity_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `rental_rate_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`planCode` varchar(60) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`vehicleClass` varchar(60) NOT NULL,
	`dailyMinor` int NOT NULL,
	`weeklyMinor` int,
	`monthlyMinor` int,
	`minimumDailyMinor` int NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	CONSTRAINT `rental_rate_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_rate_plans_entity_code_unique` UNIQUE(`businessEntityId`,`planCode`)
);
--> statement-breakpoint
CREATE TABLE `rental_reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`reservationNo` varchar(80) NOT NULL,
	`customerId` int NOT NULL,
	`vehicleId` int,
	`vehicleClass` varchar(60) NOT NULL,
	`ratePlanId` int NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`depositMinor` int NOT NULL DEFAULT 0,
	`totalMinor` int NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	`status` enum('pending','confirmed','cancelled','expired','converted') NOT NULL DEFAULT 'pending',
	CONSTRAINT `rental_reservations_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_reservations_entity_no_unique` UNIQUE(`businessEntityId`,`reservationNo`),
	CONSTRAINT `rental_reservations_entity_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `rental_vehicle_expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`category` varchar(60) NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`sourceType` varchar(60),
	`sourceId` varchar(80),
	`incurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rental_vehicle_expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rental_vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleNo` varchar(80) NOT NULL,
	`vin` varchar(64) NOT NULL,
	`plateNo` varchar(40),
	`make` varchar(80) NOT NULL,
	`model` varchar(80) NOT NULL,
	`modelYear` int,
	`vehicleClass` varchar(60) NOT NULL,
	`branchId` int,
	`locationId` int,
	`odometer` int NOT NULL DEFAULT 0,
	`status` enum('available','reserved','rented','maintenance','accident','inspection','ready','out_of_service','sold_transferred') NOT NULL DEFAULT 'available',
	CONSTRAINT `rental_vehicles_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_vehicles_entity_no_unique` UNIQUE(`businessEntityId`,`vehicleNo`),
	CONSTRAINT `rental_vehicles_entity_vin_unique` UNIQUE(`businessEntityId`,`vin`)
);
