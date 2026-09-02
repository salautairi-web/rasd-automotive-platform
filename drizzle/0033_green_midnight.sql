CREATE TABLE `compliance_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`userId` int,
	`action` varchar(120) NOT NULL,
	`resourceType` varchar(100) NOT NULL,
	`resourceId` varchar(120),
	`outcome` enum('success','failure','denied') NOT NULL,
	`correlationId` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_authorities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorityKey` varchar(120) NOT NULL,
	`nameAr` varchar(200) NOT NULL,
	`jurisdiction` varchar(100) NOT NULL,
	`contactRef` varchar(240),
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_authorities_id` PRIMARY KEY(`id`),
	CONSTRAINT `compliance_authorities_authorityKey_unique` UNIQUE(`authorityKey`)
);
--> statement-breakpoint
CREATE TABLE `compliance_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`resourceType` varchar(100) NOT NULL,
	`resourceId` int NOT NULL,
	`documentId` int,
	`storageKey` varchar(500),
	`checksum` varchar(128),
	`submissionRef` varchar(180),
	`submittedBy` int NOT NULL,
	`verifiedBy` int,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`verifiedAt` timestamp,
	`status` enum('submitted','verified','rejected') NOT NULL DEFAULT 'submitted',
	CONSTRAINT `compliance_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`titleAr` varchar(240) NOT NULL,
	`description` text NOT NULL,
	`rootCause` text,
	`correctiveAction` text,
	`status` enum('open','investigating','corrective_action','closed') NOT NULL DEFAULT 'open',
	`reportedBy` int NOT NULL,
	`closedBy` int,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_incidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_legal_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`caseReferenceMasked` varchar(180) NOT NULL,
	`caseType` varchar(100) NOT NULL,
	`authorityOrCourt` varchar(200),
	`status` enum('open','under_review','hearing','settled','closed') NOT NULL DEFAULT 'open',
	`importantDatesJson` text,
	`responsibleUserId` int,
	`externalCounselRef` varchar(180),
	`accessScopeJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_legal_cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_legal_holds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`holdKey` varchar(140) NOT NULL,
	`reason` text NOT NULL,
	`scopeJson` text NOT NULL,
	`approverUserId` int NOT NULL,
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`releaseDate` timestamp,
	`status` enum('active','released') NOT NULL DEFAULT 'active',
	CONSTRAINT `compliance_legal_holds_id` PRIMARY KEY(`id`),
	CONSTRAINT `compliance_legal_holds_holdKey_unique` UNIQUE(`holdKey`)
);
--> statement-breakpoint
CREATE TABLE `compliance_license_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`licenseKey` varchar(120) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`jurisdiction` varchar(100) NOT NULL,
	`activityKey` varchar(120),
	`renewalPeriodMonths` int,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_license_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `compliance_license_types_licenseKey_unique` UNIQUE(`licenseKey`)
);
--> statement-breakpoint
CREATE TABLE `compliance_licenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`licenseTypeId` int NOT NULL,
	`authorityId` int,
	`ownerResourceType` varchar(80) NOT NULL,
	`ownerResourceId` int,
	`licenseNumberMasked` varchar(180),
	`issueDate` timestamp,
	`expiryDate` timestamp,
	`status` enum('requested','submitted','under_review','approved','active','expiring','expired','suspended','cancelled','renewed') NOT NULL DEFAULT 'requested',
	`responsibleUserId` int,
	`idempotencyKey` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `compliance_licenses_id` PRIMARY KEY(`id`),
	CONSTRAINT `compliance_license_entity_idempotency_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `compliance_obligations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`authorityId` int,
	`obligationKey` varchar(140) NOT NULL,
	`titleAr` varchar(240) NOT NULL,
	`frequency` enum('monthly','quarterly','annual','event_based') NOT NULL,
	`dueDate` timestamp NOT NULL,
	`requiredDataJson` text,
	`status` enum('planned','in_progress','submitted','approved','overdue','closed') NOT NULL DEFAULT 'planned',
	`reviewerUserId` int,
	`idempotencyKey` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_obligations_id` PRIMARY KEY(`id`),
	CONSTRAINT `compliance_obligation_entity_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `compliance_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`policyKey` varchar(140) NOT NULL,
	`titleAr` varchar(240) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`effectiveDate` timestamp,
	`reviewDate` timestamp,
	`ownerUserId` int,
	`status` enum('draft','pending_approval','active','retired') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `compliance_policies_policyKey_unique` UNIQUE(`policyKey`)
);
--> statement-breakpoint
CREATE TABLE `compliance_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`legalName` varchar(240) NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`registrationRef` varchar(180),
	`complianceStatus` enum('unknown','compliant','attention','non_compliant') NOT NULL DEFAULT 'unknown',
	`responsibleUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `compliance_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `compliance_profiles_businessEntityId_unique` UNIQUE(`businessEntityId`)
);
--> statement-breakpoint
CREATE TABLE `compliance_renewals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`licenseId` int NOT NULL,
	`renewalDate` timestamp NOT NULL,
	`reminderIntervalsJson` text NOT NULL,
	`requiredDocumentsJson` text,
	`status` enum('planned','in_progress','submitted','approved','completed','overdue','cancelled') NOT NULL DEFAULT 'planned',
	`responsibleUserId` int,
	`approvalRef` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_renewals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_risks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`titleAr` varchar(240) NOT NULL,
	`likelihood` int NOT NULL,
	`impact` int NOT NULL,
	`score` int NOT NULL,
	`mitigation` text,
	`ownerUserId` int,
	`dueDate` timestamp,
	`status` enum('open','mitigating','accepted','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_risks_id` PRIMARY KEY(`id`)
);
