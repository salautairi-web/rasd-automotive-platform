CREATE TABLE `iam_access_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`reviewerUserId` int NOT NULL,
	`subjectUserId` int NOT NULL,
	`decision` enum('pending','approved','revoked') NOT NULL DEFAULT 'pending',
	`reason` varchar(500),
	`dueAt` timestamp,
	`decidedAt` timestamp,
	CONSTRAINT `iam_access_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iam_impersonation_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supportUserId` int NOT NULL,
	`subjectUserId` int NOT NULL,
	`reason` varchar(500) NOT NULL,
	`approvalRef` varchar(120) NOT NULL,
	`startsAt` timestamp NOT NULL DEFAULT (now()),
	`endsAt` timestamp NOT NULL,
	`status` enum('pending','active','expired','revoked') NOT NULL DEFAULT 'pending',
	CONSTRAINT `iam_impersonation_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iam_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`roleId` int NOT NULL,
	`scopeJson` text NOT NULL,
	`status` enum('pending','active','suspended','revoked') NOT NULL DEFAULT 'active',
	`startsAt` timestamp NOT NULL DEFAULT (now()),
	`endsAt` timestamp,
	`defaultEntity` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iam_memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `iam_membership_user_entity_role_unique` UNIQUE(`userId`,`businessEntityId`,`roleId`)
);
--> statement-breakpoint
CREATE TABLE `iam_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`permissionKey` varchar(160) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`resource` varchar(100) NOT NULL,
	`action` varchar(80) NOT NULL,
	`sensitivity` enum('normal','sensitive','critical') NOT NULL DEFAULT 'normal',
	CONSTRAINT `iam_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `iam_permissions_permissionKey_unique` UNIQUE(`permissionKey`)
);
--> statement-breakpoint
CREATE TABLE `iam_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyKey` varchar(120) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`effect` enum('allow','deny') NOT NULL,
	`expressionJson` text NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iam_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `iam_policies_policyKey_unique` UNIQUE(`policyKey`)
);
--> statement-breakpoint
CREATE TABLE `iam_role_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roleId` int NOT NULL,
	`permissionId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iam_role_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `iam_role_permission_unique` UNIQUE(`roleId`,`permissionId`)
);
--> statement-breakpoint
CREATE TABLE `iam_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roleKey` varchar(100) NOT NULL,
	`nameAr` varchar(160) NOT NULL,
	`scopeType` enum('central','company','entity','branch','own','assigned') NOT NULL,
	`systemRole` boolean NOT NULL DEFAULT false,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iam_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `iam_roles_roleKey_unique` UNIQUE(`roleKey`)
);
--> statement-breakpoint
CREATE TABLE `iam_security_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`businessEntityId` int,
	`eventType` varchar(100) NOT NULL,
	`outcome` enum('success','failure','denied') NOT NULL,
	`resourceType` varchar(100),
	`resourceId` varchar(120),
	`correlationId` varchar(100) NOT NULL,
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iam_security_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mobile_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`deviceId` int,
	`businessEntityId` int,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(100),
	`resourceId` varchar(120),
	`correlationId` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mobile_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mobile_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessEntityId` int,
	`deviceKey` varchar(160) NOT NULL,
	`platform` enum('ios','android','web') NOT NULL,
	`appVersion` varchar(40) NOT NULL,
	`status` enum('active','revoked','offline') NOT NULL DEFAULT 'active',
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mobile_devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `mobile_devices_deviceKey_unique` UNIQUE(`deviceKey`)
);
--> statement-breakpoint
CREATE TABLE `mobile_push_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`provider` varchar(40) NOT NULL,
	`status` enum('active','invalid','revoked') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mobile_push_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `mobile_push_tokens_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `mobile_sync_conflicts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`queueId` int NOT NULL,
	`businessEntityId` int,
	`resourceType` varchar(100) NOT NULL,
	`resourceId` varchar(120) NOT NULL,
	`serverVersion` varchar(100),
	`clientVersion` varchar(100),
	`resolution` enum('pending','server_wins','client_wins','merged') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mobile_sync_conflicts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mobile_sync_cursors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`streamKey` varchar(120) NOT NULL,
	`cursor` varchar(160) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mobile_sync_cursors_id` PRIMARY KEY(`id`),
	CONSTRAINT `mobile_device_stream_cursor_unique` UNIQUE(`deviceId`,`streamKey`)
);
--> statement-breakpoint
CREATE TABLE `mobile_sync_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`businessEntityId` int,
	`operationKey` varchar(160) NOT NULL,
	`operationType` varchar(100) NOT NULL,
	`payloadJson` text NOT NULL,
	`idempotencyKey` varchar(180) NOT NULL,
	`status` enum('queued','processing','succeeded','conflict','failed') NOT NULL DEFAULT 'queued',
	`errorJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `mobile_sync_queue_id` PRIMARY KEY(`id`),
	CONSTRAINT `mobile_sync_queue_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
