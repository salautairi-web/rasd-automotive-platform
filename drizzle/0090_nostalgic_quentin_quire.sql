CREATE TABLE `iam_user_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`membershipId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`status` enum('sent','accepted','expired','revoked') NOT NULL DEFAULT 'sent',
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	CONSTRAINT `iam_user_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `iam_user_invitations_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `rental_oil_catalog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`oilCode` varchar(60) NOT NULL,
	`oilType` varchar(100) NOT NULL,
	`unit` varchar(20) NOT NULL DEFAULT 'liter',
	`stockQuantity` decimal(12,2) NOT NULL DEFAULT '0',
	`reorderLevel` decimal(12,2) NOT NULL DEFAULT '0',
	`unitCostMinor` int NOT NULL DEFAULT 0,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rental_oil_catalog_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_oil_catalog_entity_code_unique` UNIQUE(`businessEntityId`,`oilCode`)
);
--> statement-breakpoint
CREATE TABLE `rental_oil_changes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`taskId` int,
	`changeNo` varchar(80) NOT NULL,
	`oilType` varchar(100) NOT NULL,
	`quantityLiters` decimal(10,2) NOT NULL,
	`odometer` int NOT NULL,
	`costMinor` int NOT NULL DEFAULT 0,
	`nextChangeOdometer` int,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	CONSTRAINT `rental_oil_changes_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_oil_changes_entity_no_unique` UNIQUE(`businessEntityId`,`changeNo`)
);
--> statement-breakpoint
CREATE TABLE `ui_layout_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyKey` varchar(220) NOT NULL,
	`roleKey` varchar(100) NOT NULL,
	`mode` enum('customer','user') NOT NULL DEFAULT 'user',
	`businessEntityId` int,
	`branchId` int,
	`templateId` int,
	`configJson` text NOT NULL,
	`enforced` boolean NOT NULL DEFAULT true,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`createdBy` int NOT NULL,
	`updatedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ui_layout_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `ui_layout_policies_policyKey_unique` UNIQUE(`policyKey`),
	CONSTRAINT `ui_layout_policy_target_unique` UNIQUE(`roleKey`,`mode`,`businessEntityId`,`branchId`)
);
--> statement-breakpoint
CREATE TABLE `ui_layout_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scopeKey` varchar(220) NOT NULL,
	`userId` int NOT NULL,
	`roleKey` varchar(100) NOT NULL,
	`mode` enum('customer','user') NOT NULL DEFAULT 'user',
	`businessEntityId` int,
	`branchId` int,
	`configJson` text NOT NULL,
	`source` enum('personal','template','forced') NOT NULL DEFAULT 'personal',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ui_layout_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `ui_layout_preferences_scopeKey_unique` UNIQUE(`scopeKey`),
	CONSTRAINT `ui_layout_preference_scope_unique` UNIQUE(`userId`,`scopeKey`)
);
--> statement-breakpoint
CREATE TABLE `ui_layout_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateKey` varchar(120) NOT NULL,
	`roleKey` varchar(100) NOT NULL,
	`mode` enum('customer','user') NOT NULL DEFAULT 'user',
	`nameAr` varchar(180) NOT NULL,
	`configJson` text NOT NULL,
	`isSystem` boolean NOT NULL DEFAULT false,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ui_layout_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `ui_layout_templates_templateKey_unique` UNIQUE(`templateKey`)
);
