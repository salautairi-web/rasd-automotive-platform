CREATE TABLE `rental_contract_amendments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`contractId` int NOT NULL,
	`amendmentNo` varchar(80) NOT NULL,
	`changeType` varchar(60) NOT NULL,
	`oldValueJson` text,
	`newValueJson` text NOT NULL,
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rental_contract_amendments_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_contract_amendments_entity_no_unique` UNIQUE(`businessEntityId`,`amendmentNo`)
);
--> statement-breakpoint
CREATE TABLE `rental_deposits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`contractId` int NOT NULL,
	`depositNo` varchar(80) NOT NULL,
	`amountMinor` int NOT NULL,
	`deductedMinor` int NOT NULL DEFAULT 0,
	`refundedMinor` int NOT NULL DEFAULT 0,
	`status` enum('pending','held','partially_deducted','refunded','forfeited') NOT NULL DEFAULT 'pending',
	`idempotencyKey` varchar(120) NOT NULL,
	CONSTRAINT `rental_deposits_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_deposits_entity_no_unique` UNIQUE(`businessEntityId`,`depositNo`),
	CONSTRAINT `rental_deposits_entity_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `rental_drivers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`customerId` int NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`licenseNo` varchar(80) NOT NULL,
	`licenseExpiry` timestamp NOT NULL,
	`status` enum('active','expired','blocked') NOT NULL DEFAULT 'active',
	CONSTRAINT `rental_drivers_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_drivers_entity_license_unique` UNIQUE(`businessEntityId`,`licenseNo`)
);
--> statement-breakpoint
CREATE TABLE `rental_insurance_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`policyId` int NOT NULL,
	`damageId` int,
	`claimNo` varchar(100) NOT NULL,
	`claimedMinor` int NOT NULL,
	`approvedMinor` int NOT NULL DEFAULT 0,
	`status` enum('submitted','under_review','approved','rejected','settled') NOT NULL DEFAULT 'submitted',
	CONSTRAINT `rental_insurance_claims_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_claims_entity_no_unique` UNIQUE(`businessEntityId`,`claimNo`)
);
--> statement-breakpoint
CREATE TABLE `rental_insurance_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`policyNo` varchar(100) NOT NULL,
	`provider` varchar(180) NOT NULL,
	`startsAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`premiumMinor` int NOT NULL,
	`deductibleMinor` int NOT NULL DEFAULT 0,
	`status` enum('draft','active','expired','cancelled') NOT NULL DEFAULT 'active',
	CONSTRAINT `rental_insurance_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_insurance_entity_policy_unique` UNIQUE(`businessEntityId`,`policyNo`)
);
--> statement-breakpoint
CREATE TABLE `rental_maintenance_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`alertType` enum('due_soon','due_today','overdue','odometer_threshold','insurance_expiry') NOT NULL,
	`dueDate` timestamp,
	`dueOdometer` int,
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`dedupeKey` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rental_maintenance_alerts_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_maintenance_alerts_dedupe_unique` UNIQUE(`businessEntityId`,`dedupeKey`)
);
--> statement-breakpoint
CREATE TABLE `rental_maintenance_automations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`alertDaysBefore` int NOT NULL DEFAULT 15,
	`alertKmBefore` int NOT NULL DEFAULT 1000,
	`enabled` int NOT NULL DEFAULT 1,
	`lastRunAt` timestamp,
	CONSTRAINT `rental_maintenance_automations_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_maintenance_automation_task_uid_unique` UNIQUE(`scheduleCronTaskUid`)
);
--> statement-breakpoint
CREATE TABLE `rental_fines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`contractId` int,
	`fineNo` varchar(80) NOT NULL,
	`violationDate` timestamp NOT NULL,
	`amountMinor` int NOT NULL,
	`authority` varchar(120),
	`status` enum('recorded','customer_notified','charged','paid','disputed') NOT NULL DEFAULT 'recorded',
	CONSTRAINT `rental_fines_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_fines_entity_no_unique` UNIQUE(`businessEntityId`,`fineNo`)
);
--> statement-breakpoint
CREATE TABLE `rental_vehicle_damage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`contractId` int,
	`damageNo` varchar(80) NOT NULL,
	`severity` enum('minor','moderate','major','total_loss') NOT NULL,
	`description` text NOT NULL,
	`estimatedCostMinor` int NOT NULL DEFAULT 0,
	`chargedToCustomerMinor` int NOT NULL DEFAULT 0,
	`status` enum('reported','assessed','approved','repaired','closed') NOT NULL DEFAULT 'reported',
	`reportedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rental_vehicle_damage_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_damage_entity_no_unique` UNIQUE(`businessEntityId`,`damageNo`)
);
--> statement-breakpoint
CREATE TABLE `rental_vehicle_pnl_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`periodCode` varchar(24) NOT NULL,
	`revenueMinor` int NOT NULL DEFAULT 0,
	`expenseMinor` int NOT NULL DEFAULT 0,
	`maintenanceMinor` int NOT NULL DEFAULT 0,
	`netContributionMinor` int NOT NULL DEFAULT 0,
	`utilizationBps` int NOT NULL DEFAULT 0,
	`rentalDays` int NOT NULL DEFAULT 0,
	`downtimeDays` int NOT NULL DEFAULT 0,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rental_vehicle_pnl_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_pnl_entity_vehicle_period_unique` UNIQUE(`businessEntityId`,`vehicleId`,`periodCode`)
);
