CREATE TABLE `iam_mfa_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` varchar(120) NOT NULL,
	`userId` int NOT NULL,
	`methodId` int NOT NULL,
	`purpose` enum('enrollment','login','step_up','recovery') NOT NULL,
	`codeHash` varchar(128),
	`challengeHash` varchar(128),
	`status` enum('pending','verified','expired','locked','cancelled') NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`maxAttempts` int NOT NULL DEFAULT 5,
	`expiresAt` timestamp NOT NULL,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iam_mfa_challenges_id` PRIMARY KEY(`id`),
	CONSTRAINT `iam_mfa_challenges_challengeId_unique` UNIQUE(`challengeId`)
);
--> statement-breakpoint
CREATE TABLE `iam_mfa_methods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`methodKey` varchar(160) NOT NULL,
	`methodType` enum('totp','webauthn','push') NOT NULL,
	`secretRef` varchar(240),
	`publicCredentialRef` varchar(240),
	`label` varchar(120),
	`status` enum('pending','active','revoked') NOT NULL DEFAULT 'pending',
	`enrolledAt` timestamp,
	`lastVerifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iam_mfa_methods_id` PRIMARY KEY(`id`),
	CONSTRAINT `iam_mfa_user_method_unique` UNIQUE(`userId`,`methodKey`)
);
--> statement-breakpoint
CREATE TABLE `iam_session_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` int,
	`action` varchar(100) NOT NULL,
	`outcome` enum('success','failure','denied') NOT NULL,
	`correlationId` varchar(100) NOT NULL,
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iam_session_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iam_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionKeyHash` varchar(128) NOT NULL,
	`userId` int NOT NULL,
	`deviceId` int,
	`businessEntityId` int,
	`ipHash` varchar(128),
	`userAgentHash` varchar(128),
	`status` enum('active','rotated','revoked','expired') NOT NULL DEFAULT 'active',
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iam_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `iam_sessions_sessionKeyHash_unique` UNIQUE(`sessionKeyHash`)
);
--> statement-breakpoint
CREATE TABLE `iam_step_up_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyKey` varchar(140) NOT NULL,
	`permissionKey` varchar(160) NOT NULL,
	`sensitivity` enum('sensitive','critical') NOT NULL,
	`maxAgeSeconds` int NOT NULL DEFAULT 300,
	`requireMfa` boolean NOT NULL DEFAULT true,
	`requireFreshSession` boolean NOT NULL DEFAULT true,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iam_step_up_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `iam_step_up_policies_policyKey_unique` UNIQUE(`policyKey`)
);
--> statement-breakpoint
CREATE TABLE `iam_step_up_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` int,
	`challengeId` int,
	`permissionKey` varchar(160) NOT NULL,
	`correlationId` varchar(100) NOT NULL,
	`verifiedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`status` enum('verified','expired','revoked') NOT NULL DEFAULT 'verified',
	CONSTRAINT `iam_step_up_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iam_trusted_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`deviceKeyHash` varchar(128) NOT NULL,
	`label` varchar(120),
	`platform` varchar(40) NOT NULL,
	`trustLevel` enum('untrusted','trusted','step_up_only') NOT NULL DEFAULT 'untrusted',
	`status` enum('active','revoked') NOT NULL DEFAULT 'active',
	`lastVerifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iam_trusted_devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `iam_trusted_devices_deviceKeyHash_unique` UNIQUE(`deviceKeyHash`)
);
