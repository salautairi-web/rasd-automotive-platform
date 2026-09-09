CREATE TABLE `iam_abac_policies_43` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyKey` varchar(140) NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`resource` varchar(120) NOT NULL,
	`action` varchar(100) NOT NULL,
	`effect` enum('allow','deny') NOT NULL,
	`expressionJson` text NOT NULL,
	`priority` int NOT NULL DEFAULT 100,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`ownerUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iam_abac_policies_43_id` PRIMARY KEY(`id`),
	CONSTRAINT `iam_abac_policy_key_43` UNIQUE(`policyKey`,`version`)
);
--> statement-breakpoint
CREATE TABLE `iam_attribute_bindings_43` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessEntityId` int,
	`attributeKey` varchar(120) NOT NULL,
	`valueHash` varchar(128) NOT NULL,
	`source` varchar(100) NOT NULL,
	`effectiveAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`status` enum('active','revoked','expired') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iam_attribute_bindings_43_id` PRIMARY KEY(`id`),
	CONSTRAINT `iam_attribute_binding_unique_43` UNIQUE(`userId`,`businessEntityId`,`attributeKey`,`valueHash`)
);
--> statement-breakpoint
CREATE TABLE `iam_conditional_access_43` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyKey` varchar(140) NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`application` varchar(120),
	`networkRuleJson` text,
	`locationRuleJson` text,
	`deviceRuleJson` text,
	`timeRuleJson` text,
	`riskThreshold` int,
	`action` enum('allow','challenge','deny') NOT NULL,
	`requireMfa` boolean NOT NULL DEFAULT false,
	`requireFreshSession` boolean NOT NULL DEFAULT false,
	`status` enum('draft','active','disabled') NOT NULL DEFAULT 'draft',
	`version` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iam_conditional_access_43_id` PRIMARY KEY(`id`),
	CONSTRAINT `iam_conditional_access_43_policyKey_unique` UNIQUE(`policyKey`)
);
--> statement-breakpoint
CREATE TABLE `iam_privilege_requests_43` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`requesterUserId` int NOT NULL,
	`targetRoleId` int,
	`permissionKey` varchar(160) NOT NULL,
	`reason` varchar(1000) NOT NULL,
	`evidenceRef` varchar(240),
	`startsAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`approverUserId` int,
	`status` enum('requested','approved','rejected','expired','revoked') NOT NULL DEFAULT 'requested',
	`idempotencyKey` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`decidedAt` timestamp,
	CONSTRAINT `iam_privilege_requests_43_id` PRIMARY KEY(`id`),
	CONSTRAINT `iam_privilege_request_idem_43` UNIQUE(`requesterUserId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `security_break_glass_43` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`requesterUserId` int NOT NULL,
	`approverUserId` int,
	`reason` varchar(1000) NOT NULL,
	`scopeJson` text NOT NULL,
	`startsAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`status` enum('requested','approved','active','expired','revoked','rejected') NOT NULL DEFAULT 'requested',
	`postReviewRequired` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	CONSTRAINT `security_break_glass_43_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `security_incidents_43` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`incidentKey` varchar(140) NOT NULL,
	`titleAr` varchar(260) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`phase` enum('detected','contained','investigating','recovering','closed') NOT NULL DEFAULT 'detected',
	`ownerUserId` int,
	`rootCause` text,
	`evidenceJson` text,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`idempotencyKey` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `security_incidents_43_id` PRIMARY KEY(`id`),
	CONSTRAINT `security_incident_key_43` UNIQUE(`businessEntityId`,`incidentKey`),
	CONSTRAINT `security_incident_idem_43` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `security_risk_signals_43` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`businessEntityId` int,
	`signalType` varchar(120) NOT NULL,
	`score` int NOT NULL,
	`evidenceJson` text,
	`status` enum('open','reviewed','dismissed') NOT NULL DEFAULT 'open',
	`observedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `security_risk_signals_43_id` PRIMARY KEY(`id`)
);
