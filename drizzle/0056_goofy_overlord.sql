CREATE TABLE `audit_auditlog_50` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessEntityId` int,
	`action` varchar(120) NOT NULL,
	`resourceType` varchar(100) NOT NULL,
	`resourceId` varchar(140) NOT NULL,
	`beforeHash` varchar(128),
	`afterHash` varchar(128),
	`reason` text,
	`source` varchar(100) NOT NULL,
	`requestId` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_auditlog_50_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_continuous_rules_50` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`ruleKey` varchar(100) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`sourceSystem` varchar(100) NOT NULL,
	`queryDefinitionJson` text NOT NULL,
	`frequency` enum('realtime','hourly','daily','weekly','monthly') NOT NULL,
	`thresholdMinor` int NOT NULL DEFAULT 0,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`status` enum('draft','active','paused','retired') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_continuous_rules_50_id` PRIMARY KEY(`id`),
	CONSTRAINT `audit_continuous_rules_50_key_unique` UNIQUE(`businessEntityId`,`ruleKey`)
);
--> statement-breakpoint
CREATE TABLE `audit_control_tests_50` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`controlId` int NOT NULL,
	`periodCode` varchar(30) NOT NULL,
	`sampleSize` int NOT NULL DEFAULT 0,
	`testerUserId` int NOT NULL,
	`result` enum('pass','fail','exception','not_tested') NOT NULL,
	`exceptionRateBps` int NOT NULL DEFAULT 0,
	`evidenceJson` text,
	`reviewerUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_control_tests_50_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_engagements_50` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`engagementNo` varchar(80) NOT NULL,
	`planId` int,
	`titleAr` varchar(220) NOT NULL,
	`objective` text NOT NULL,
	`scopeJson` text NOT NULL,
	`criteria` text NOT NULL,
	`teamJson` text NOT NULL,
	`startAt` timestamp,
	`endAt` timestamp,
	`status` enum('planned','fieldwork','review','reporting','closed','cancelled') NOT NULL DEFAULT 'planned',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_engagements_50_id` PRIMARY KEY(`id`),
	CONSTRAINT `audit_engagements_50_no_unique` UNIQUE(`businessEntityId`,`engagementNo`)
);
--> statement-breakpoint
CREATE TABLE `audit_evidence_50` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`engagementId` int NOT NULL,
	`evidenceNo` varchar(80) NOT NULL,
	`sourceType` enum('document','transaction','system_log','approval','media','external') NOT NULL,
	`sourceRef` varchar(220) NOT NULL,
	`description` text NOT NULL,
	`capturedAt` timestamp NOT NULL,
	`integrityHash` varchar(128),
	`version` int NOT NULL DEFAULT 1,
	`storageKey` varchar(400),
	`accessScopeJson` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_evidence_50_id` PRIMARY KEY(`id`),
	CONSTRAINT `audit_evidence_50_no_unique` UNIQUE(`businessEntityId`,`evidenceNo`)
);
--> statement-breakpoint
CREATE TABLE `audit_exceptions_50` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`ruleId` int NOT NULL,
	`exceptionNo` varchar(80) NOT NULL,
	`sourceRef` varchar(180) NOT NULL,
	`exceptionType` varchar(100) NOT NULL,
	`amountMinor` int,
	`detailsJson` text NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`status` enum('open','reviewing','escalated','resolved','dismissed') NOT NULL DEFAULT 'open',
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `audit_exceptions_50_id` PRIMARY KEY(`id`),
	CONSTRAINT `audit_exceptions_50_no_unique` UNIQUE(`businessEntityId`,`exceptionNo`)
);
--> statement-breakpoint
CREATE TABLE `audit_external_requests_50` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`requestNo` varchar(80) NOT NULL,
	`auditorRef` varchar(180) NOT NULL,
	`requestText` text NOT NULL,
	`accessScopeJson` text NOT NULL,
	`responseEvidenceJson` text,
	`status` enum('received','in_progress','submitted','approved','closed','rejected') NOT NULL DEFAULT 'received',
	`dueDate` timestamp,
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_external_requests_50_id` PRIMARY KEY(`id`),
	CONSTRAINT `audit_external_requests_50_no_unique` UNIQUE(`businessEntityId`,`requestNo`)
);
--> statement-breakpoint
CREATE TABLE `audit_financial_controls_50` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`controlNo` varchar(80) NOT NULL,
	`area` enum('journal','period_close','payment','bank_reconciliation','revenue','inventory','payroll','procurement','asset','inter_entity','treasury') NOT NULL,
	`objective` text NOT NULL,
	`ownerUserId` int NOT NULL,
	`frequency` enum('per_transaction','daily','monthly','quarterly','annual') NOT NULL,
	`thresholdMinor` int NOT NULL DEFAULT 0,
	`segregationRequired` boolean NOT NULL DEFAULT true,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_financial_controls_50_id` PRIMARY KEY(`id`),
	CONSTRAINT `audit_financial_controls_50_no_unique` UNIQUE(`businessEntityId`,`controlNo`)
);
--> statement-breakpoint
CREATE TABLE `audit_findings_50` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`engagementId` int,
	`findingNo` varchar(80) NOT NULL,
	`processRef` varchar(160),
	`riskRef` varchar(160),
	`controlRef` varchar(160),
	`condition` text NOT NULL,
	`criteria` text NOT NULL,
	`cause` text,
	`effect` text,
	`severity` enum('informational','low','medium','high','critical') NOT NULL,
	`recommendation` text NOT NULL,
	`managementResponse` text,
	`ownerUserId` int NOT NULL,
	`dueDate` timestamp,
	`status` enum('open','responded','in_remediation','awaiting_validation','closed','accepted') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_findings_50_id` PRIMARY KEY(`id`),
	CONSTRAINT `audit_findings_50_no_unique` UNIQUE(`businessEntityId`,`findingNo`)
);
--> statement-breakpoint
CREATE TABLE `audit_plans_50` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`planNo` varchar(80) NOT NULL,
	`periodCode` varchar(30) NOT NULL,
	`riskBasedPriority` int NOT NULL,
	`coverageJson` text NOT NULL,
	`budgetedHours` int NOT NULL DEFAULT 0,
	`resourcesJson` text NOT NULL,
	`status` enum('draft','submitted','approved','in_progress','closed','superseded') NOT NULL DEFAULT 'draft',
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_plans_50_id` PRIMARY KEY(`id`),
	CONSTRAINT `audit_plans_50_no_unique` UNIQUE(`businessEntityId`,`planNo`)
);
--> statement-breakpoint
CREATE TABLE `audit_remediation_50` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`findingId` int NOT NULL,
	`actionPlan` text NOT NULL,
	`actionType` enum('corrective','preventive') NOT NULL,
	`ownerUserId` int NOT NULL,
	`budgetMinor` int NOT NULL DEFAULT 0,
	`dueDate` timestamp,
	`evidenceJson` text,
	`validationResult` enum('pending','pass','fail','partial') NOT NULL DEFAULT 'pending',
	`status` enum('planned','in_progress','overdue','validated','closed') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_remediation_50_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_universe_50` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`universeKey` varchar(120) NOT NULL,
	`activity` varchar(180) NOT NULL,
	`processNameAr` varchar(200) NOT NULL,
	`systemRef` varchar(120),
	`riskRef` varchar(120),
	`controlRef` varchar(120),
	`regulatoryRef` varchar(160),
	`criticality` enum('low','medium','high','critical') NOT NULL,
	`status` enum('active','review_due','retired') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_universe_50_id` PRIMARY KEY(`id`),
	CONSTRAINT `audit_universe_50_key_unique` UNIQUE(`businessEntityId`,`universeKey`)
);
