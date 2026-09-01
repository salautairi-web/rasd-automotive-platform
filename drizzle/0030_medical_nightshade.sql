CREATE TABLE `portal_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portalUserId` int,
	`businessEntityId` int,
	`relationshipId` int,
	`action` varchar(120) NOT NULL,
	`resourceType` varchar(100) NOT NULL,
	`resourceId` varchar(120),
	`outcome` enum('success','failure','denied') NOT NULL,
	`correlationId` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portal_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portalUserId` int NOT NULL,
	`deviceKeyHash` varchar(128) NOT NULL,
	`platform` varchar(40) NOT NULL,
	`status` enum('active','revoked') NOT NULL DEFAULT 'active',
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_devices_deviceKeyHash_unique` UNIQUE(`deviceKeyHash`)
);
--> statement-breakpoint
CREATE TABLE `portal_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portalUserId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`relationshipId` int NOT NULL,
	`sourceDocumentId` int,
	`storageKey` varchar(500) NOT NULL,
	`name` varchar(240) NOT NULL,
	`status` enum('available','expired','revoked') NOT NULL DEFAULT 'available',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portal_entity_relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portalUserId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`relationshipType` enum('customer','corporate_customer','supplier','partner','dealer') NOT NULL,
	`sourceProfileId` int,
	`status` enum('pending','active','suspended','revoked') NOT NULL DEFAULT 'pending',
	`permissionsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_entity_relationships_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_user_entity_relationship_unique` UNIQUE(`portalUserId`,`businessEntityId`,`relationshipType`,`sourceProfileId`)
);
--> statement-breakpoint
CREATE TABLE `portal_identities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portalUserId` int NOT NULL,
	`identityType` enum('email','phone','oauth','sso') NOT NULL,
	`identityHash` varchar(128) NOT NULL,
	`verifiedAt` timestamp,
	`status` enum('pending','verified','revoked') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_identities_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_identity_hash_unique` UNIQUE(`identityType`,`identityHash`)
);
--> statement-breakpoint
CREATE TABLE `portal_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portalUserId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`relationshipId` int NOT NULL,
	`orderType` varchar(80) NOT NULL,
	`sourceOrderId` int,
	`idempotencyKey` varchar(180) NOT NULL,
	`status` enum('draft','submitted','confirmed','cancelled','fulfilled') NOT NULL DEFAULT 'draft',
	`summaryJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_order_idempotency_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `portal_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portalUserId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`relationshipId` int NOT NULL,
	`sourceInvoiceId` int,
	`idempotencyKey` varchar(180) NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`status` enum('requested','pending','succeeded','failed','refunded') NOT NULL DEFAULT 'requested',
	`providerRef` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_payment_idempotency_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `portal_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relationshipId` int NOT NULL,
	`permissionKey` varchar(160) NOT NULL,
	`effect` enum('allow','deny') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_relationship_permission_unique` UNIQUE(`relationshipId`,`permissionKey`)
);
--> statement-breakpoint
CREATE TABLE `portal_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portalUserId` int NOT NULL,
	`businessEntityId` int,
	`language` varchar(12) NOT NULL DEFAULT 'ar',
	`currency` varchar(3),
	`notificationsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portal_reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portalUserId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`relationshipId` int NOT NULL,
	`reservationType` varchar(80) NOT NULL,
	`sourceReservationId` int,
	`idempotencyKey` varchar(180) NOT NULL,
	`status` enum('requested','confirmed','cancelled','completed') NOT NULL DEFAULT 'requested',
	`detailsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_reservations_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_reservation_idempotency_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `portal_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portalUserId` int NOT NULL,
	`sessionHash` varchar(128) NOT NULL,
	`activeEntityId` int,
	`status` enum('active','rotated','revoked','expired') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp NOT NULL,
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_sessions_sessionHash_unique` UNIQUE(`sessionHash`)
);
--> statement-breakpoint
CREATE TABLE `portal_signatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portalUserId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`relationshipId` int NOT NULL,
	`sourceRequestId` int,
	`status` enum('requested','viewed','signed','declined','expired') NOT NULL DEFAULT 'requested',
	`evidenceJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_signatures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portal_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userType` enum('customer','corporate','supplier','partner','agent','admin') NOT NULL,
	`status` enum('pending','active','suspended','revoked') NOT NULL DEFAULT 'pending',
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_users_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `portal_v2_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portalUserId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`relationshipId` int NOT NULL,
	`ticketId` int,
	`transactionType` varchar(80),
	`transactionId` int,
	`body` text NOT NULL,
	`senderType` enum('portal_user','agent','system') NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_v2_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portal_v2_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portalUserId` int NOT NULL,
	`businessEntityId` int,
	`eventKey` varchar(140) NOT NULL,
	`channel` enum('in_app','email','sms','push') NOT NULL,
	`title` varchar(220) NOT NULL,
	`body` text NOT NULL,
	`dedupeKey` varchar(180) NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_v2_notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_v2_notification_dedupe_unique` UNIQUE(`portalUserId`,`dedupeKey`)
);
--> statement-breakpoint
CREATE TABLE `portal_v2_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portalUserId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`relationshipId` int NOT NULL,
	`ticketNo` varchar(80) NOT NULL,
	`category` varchar(80) NOT NULL,
	`subject` varchar(220) NOT NULL,
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`status` enum('open','in_progress','escalated','resolved','closed') NOT NULL DEFAULT 'open',
	`slaDueAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_v2_tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_v2_ticket_entity_no_unique` UNIQUE(`businessEntityId`,`ticketNo`)
);
