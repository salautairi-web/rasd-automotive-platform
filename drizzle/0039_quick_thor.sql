CREATE TABLE `project_gate_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`gateId` int NOT NULL,
	`stage` int NOT NULL,
	`requiredRoleKey` varchar(120) NOT NULL,
	`approverUserId` int,
	`makerUserId` int,
	`decision` enum('pending','approved','rejected','returned','waived') NOT NULL DEFAULT 'pending',
	`stepUpVerifiedAt` timestamp,
	`comment` text,
	`evidenceRefsJson` text,
	`decidedAt` timestamp,
	`idempotencyKey` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_gate_approvals_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_gate_approval_idem_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `project_gate_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gateNo` int NOT NULL,
	`gateKey` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`requiredRoleKey` varchar(120) NOT NULL,
	`requiredPermissionKey` varchar(160) NOT NULL,
	`requiresMfa` boolean NOT NULL DEFAULT true,
	`requiresFreshSession` boolean NOT NULL DEFAULT true,
	`separationOfDuties` boolean NOT NULL DEFAULT true,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_gate_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_gate_policy_key_unique` UNIQUE(`gateNo`,`gateKey`)
);
--> statement-breakpoint
CREATE TABLE `project_procurement_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`sourceType` enum('purchase_order','supplier_invoice') NOT NULL,
	`sourceId` int NOT NULL,
	`costId` int NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`linkStatus` enum('proposed','confirmed','reversed') NOT NULL DEFAULT 'proposed',
	`sourceHash` varchar(128) NOT NULL,
	`idempotencyKey` varchar(160) NOT NULL,
	`linkedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_procurement_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_procurement_source_unique` UNIQUE(`businessEntityId`,`sourceType`,`sourceId`),
	CONSTRAINT `project_procurement_link_idem_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
