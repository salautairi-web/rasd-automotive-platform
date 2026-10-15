CREATE TABLE `customer_link_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`credentialId` int NOT NULL,
	`userId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`relationshipId` int NOT NULL,
	`customerNo` varchar(32) NOT NULL,
	`requesterNote` varchar(1000) NOT NULL,
	`status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewNote` text,
	`evidenceReference` varchar(180),
	`identityCheckMethod` varchar(80),
	`createdAt` bigint NOT NULL,
	`reviewedAt` bigint,
	CONSTRAINT `customer_link_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_verification_challenges` (
	`id` varchar(40) NOT NULL,
	`credentialId` int,
	`purpose` enum('verify_contact','password_reset') NOT NULL,
	`channel` enum('email','sms') NOT NULL,
	`destination` varchar(320) NOT NULL,
	`codeHash` varchar(64),
	`providerSid` varchar(80),
	`status` enum('sending','active','used','failed','revoked','locked') NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`expiresAt` bigint NOT NULL,
	`createdAt` bigint NOT NULL,
	`consumedAt` bigint,
	`passwordFingerprint` varchar(64),
	CONSTRAINT `customer_verification_challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_verified_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`credentialId` int NOT NULL,
	`userId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`customerId` int NOT NULL,
	`requestId` int NOT NULL,
	`approvedBy` int NOT NULL,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `customer_verified_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_verified_links_requestId_unique` UNIQUE(`requestId`),
	CONSTRAINT `customer_verified_target_unique` UNIQUE(`businessEntityId`,`customerId`),
	CONSTRAINT `customer_verified_owner_unique` UNIQUE(`credentialId`,`businessEntityId`)
);
--> statement-breakpoint
CREATE INDEX `customer_link_requests_credential_idx` ON `customer_link_requests` (`credentialId`);--> statement-breakpoint
CREATE INDEX `customer_link_requests_entity_idx` ON `customer_link_requests` (`businessEntityId`);--> statement-breakpoint
CREATE INDEX `customer_challenges_credential_idx` ON `customer_verification_challenges` (`credentialId`);--> statement-breakpoint
CREATE INDEX `customer_challenges_expiry_idx` ON `customer_verification_challenges` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `customer_sessions_credential_idx` ON `customer_sessions` (`credentialId`);--> statement-breakpoint
CREATE INDEX `customer_sessions_expiry_idx` ON `customer_sessions` (`expiresAt`);