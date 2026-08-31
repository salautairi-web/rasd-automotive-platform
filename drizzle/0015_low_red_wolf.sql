CREATE TABLE `central_relationship_references` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`relationshipKey` varchar(100) NOT NULL,
	`enabled` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `central_relationship_references_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_relationship_user_key_unique` UNIQUE(`userId`,`relationshipKey`)
);
--> statement-breakpoint
CREATE TABLE `entity_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`roleKey` varchar(80) NOT NULL,
	`branchId` int,
	`departmentId` int,
	`scopesJson` text NOT NULL,
	`status` enum('invited','active','suspended','revoked','expired') NOT NULL DEFAULT 'invited',
	`startsAt` timestamp NOT NULL DEFAULT (now()),
	`endsAt` timestamp,
	`revokedAt` timestamp,
	CONSTRAINT `entity_memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `entity_memberships_user_entity_role_unique` UNIQUE(`userId`,`businessEntityId`,`roleKey`)
);
--> statement-breakpoint
CREATE TABLE `identity_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phone` varchar(32),
	`preferredLanguage` enum('ar','en') NOT NULL DEFAULT 'ar',
	`mfaStatus` enum('disabled','pending','enabled','locked') NOT NULL DEFAULT 'disabled',
	`marketingConsent` int NOT NULL DEFAULT 0,
	`privacyConsentAt` timestamp,
	`recoveryStatus` enum('none','pending','verified') NOT NULL DEFAULT 'none',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `identity_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `identity_profiles_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `identity_security_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`eventType` varchar(80) NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`ipAddress` varchar(64),
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `identity_security_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `identity_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionRef` varchar(120) NOT NULL,
	`deviceLabel` varchar(120),
	`ipAddress` varchar(64),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	CONSTRAINT `identity_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `identity_sessions_ref_unique` UNIQUE(`sessionRef`)
);
--> statement-breakpoint
CREATE TABLE `portal_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`businessEntityId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` varchar(80) NOT NULL,
	`correlationId` varchar(80) NOT NULL,
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portal_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`roleKey` varchar(80) NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`status` enum('pending','accepted','expired','revoked') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_invitations_token_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `portal_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`userId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`senderType` enum('portal_user','entity_user','system') NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portal_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`notificationType` varchar(80) NOT NULL,
	`titleAr` varchar(220) NOT NULL,
	`bodyAr` text NOT NULL,
	`resourceType` varchar(80),
	`resourceId` varchar(80),
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portal_payment_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`invoiceType` varchar(80) NOT NULL,
	`invoiceId` int NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	`status` enum('created','pending','completed','failed','expired') NOT NULL DEFAULT 'created',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_payment_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_payments_entity_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `portal_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`profileType` enum('customer','supplier','partner','corporate_user') NOT NULL,
	`localRecordType` varchar(80) NOT NULL,
	`localRecordId` int NOT NULL,
	`displayName` varchar(180) NOT NULL,
	`status` enum('pending','active','blocked','unlinked') NOT NULL DEFAULT 'pending',
	`linkedAt` timestamp,
	CONSTRAINT `portal_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_profiles_user_entity_type_unique` UNIQUE(`userId`,`businessEntityId`,`profileType`)
);
--> statement-breakpoint
CREATE TABLE `portal_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`ticketNo` varchar(80) NOT NULL,
	`subject` varchar(220) NOT NULL,
	`category` varchar(80) NOT NULL,
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`status` enum('open','assigned','waiting_customer','resolved','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_tickets_entity_no_unique` UNIQUE(`businessEntityId`,`ticketNo`)
);
