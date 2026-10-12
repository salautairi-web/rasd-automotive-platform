CREATE TABLE `customer_auth_limits` (
	`keyHash` varchar(64) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`expiresAt` bigint NOT NULL,
	CONSTRAINT `customer_auth_limits_keyHash` PRIMARY KEY(`keyHash`)
);
--> statement-breakpoint
CREATE TABLE `customer_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`passwordHash` varchar(500) NOT NULL,
	`status` enum('active','suspended') NOT NULL DEFAULT 'active',
	`emailVerifiedAt` timestamp,
	`phoneVerifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_credentials_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `customer_credentials_email_unique` UNIQUE(`email`),
	CONSTRAINT `customer_credentials_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `customer_registration_settings` (
	`businessEntityId` int NOT NULL,
	`organizationId` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	CONSTRAINT `customer_registration_settings_businessEntityId` PRIMARY KEY(`businessEntityId`)
);
--> statement-breakpoint
CREATE TABLE `customer_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`credentialId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`expiresAt` bigint NOT NULL,
	`revokedAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_sessions_tokenHash_unique` UNIQUE(`tokenHash`)
);
