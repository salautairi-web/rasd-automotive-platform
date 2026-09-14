CREATE TABLE `asset_components_57` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`parentAssetId` int NOT NULL,
	`componentAssetId` int,
	`componentCode` varchar(80) NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`costMinor` int NOT NULL DEFAULT 0,
	`usefulLifeMonths` int NOT NULL,
	`status` enum('active','replaced','retired') NOT NULL DEFAULT 'active',
	`installedAt` timestamp,
	`removedAt` timestamp,
	`idempotencyKey` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `asset_components_57_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_component_code_57_unique` UNIQUE(`businessEntityId`,`componentCode`),
	CONSTRAINT `asset_component_key_57_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `asset_custody_57` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`assetId` int NOT NULL,
	`employeeId` int,
	`departmentId` int,
	`branchId` int,
	`locationName` varchar(180),
	`conditionCode` varchar(60) NOT NULL,
	`assignedAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`returnedAt` timestamp,
	`acceptanceEvidenceKey` varchar(300),
	`status` enum('assigned','accepted','returned','disputed') NOT NULL DEFAULT 'assigned',
	`correlationId` varchar(80) NOT NULL,
	CONSTRAINT `asset_custody_57_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_insurance_57` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`assetId` int NOT NULL,
	`policyNo` varchar(100) NOT NULL,
	`provider` varchar(180) NOT NULL,
	`coverage` text NOT NULL,
	`premiumMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`startsAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`status` enum('active','expired','cancelled','claimed') NOT NULL DEFAULT 'active',
	`documentKey` varchar(300),
	`idempotencyKey` varchar(120) NOT NULL,
	CONSTRAINT `asset_insurance_57_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_insurance_key_57_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `asset_meters_57` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`assetId` int NOT NULL,
	`metricType` enum('mileage','hours','cycles','other') NOT NULL,
	`valueDecimal` decimal(18,3) NOT NULL,
	`source` varchar(100) NOT NULL,
	`observedAt` timestamp NOT NULL,
	`maintenanceTrigger` varchar(180),
	`correlationId` varchar(80) NOT NULL,
	CONSTRAINT `asset_meters_57_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_revaluations_57` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`assetId` int NOT NULL,
	`valuationDate` timestamp NOT NULL,
	`valuer` varchar(180) NOT NULL,
	`newValueMinor` int NOT NULL,
	`impactMinor` int NOT NULL,
	`status` enum('pending','approved','posted','rejected') NOT NULL DEFAULT 'pending',
	`evidenceKey` varchar(300),
	`approvedBy` int,
	`correlationId` varchar(80) NOT NULL,
	CONSTRAINT `asset_revaluations_57_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_verifications_57` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`assetId` int NOT NULL,
	`verificationMethod` enum('physical','barcode','qr','serial','vin') NOT NULL,
	`observedLocation` varchar(180),
	`observedCustodianId` int,
	`conditionCode` varchar(60),
	`outcome` enum('verified','missing','mismatch','damaged','pending_review') NOT NULL DEFAULT 'pending_review',
	`evidenceKey` varchar(300),
	`verifiedBy` int NOT NULL,
	`verifiedAt` timestamp NOT NULL DEFAULT (now()),
	`correlationId` varchar(80) NOT NULL,
	CONSTRAINT `asset_verifications_57_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_warranties_57` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`assetId` int NOT NULL,
	`provider` varchar(180) NOT NULL,
	`coverage` text NOT NULL,
	`startsAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`claimCount` int NOT NULL DEFAULT 0,
	`status` enum('active','expired','claimed','cancelled') NOT NULL DEFAULT 'active',
	`documentKey` varchar(300),
	`idempotencyKey` varchar(120) NOT NULL,
	CONSTRAINT `asset_warranties_57_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_warranty_key_57_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
