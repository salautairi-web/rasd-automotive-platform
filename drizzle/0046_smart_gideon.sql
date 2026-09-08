CREATE TABLE `compliance_contract_obligations_42` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`contractId` int NOT NULL,
	`obligationKey` varchar(140) NOT NULL,
	`titleAr` varchar(240) NOT NULL,
	`responsibleParty` varchar(180) NOT NULL,
	`dueDate` timestamp NOT NULL,
	`penaltyMinor` int,
	`evidenceDocumentId` int,
	`status` enum('open','in_progress','fulfilled','overdue','waived','closed') NOT NULL DEFAULT 'open',
	`ownerUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_contract_obligations_42_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_contracts_42` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`contractKey` varchar(140) NOT NULL,
	`contractType` varchar(100) NOT NULL,
	`counterpartyName` varchar(240) NOT NULL,
	`valueMinor` int,
	`currency` varchar(3) NOT NULL DEFAULT 'SAR',
	`startDate` timestamp,
	`endDate` timestamp,
	`noticeDays` int,
	`renewalDate` timestamp,
	`status` enum('draft','pending_approval','active','expiring','expired','terminated') NOT NULL DEFAULT 'draft',
	`ownerUserId` int,
	`documentId` int,
	`idempotencyKey` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `compliance_contracts_42_id` PRIMARY KEY(`id`),
	CONSTRAINT `compliance_contract_entity_key_42` UNIQUE(`businessEntityId`,`contractKey`),
	CONSTRAINT `compliance_contract_entity_idem_42` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `compliance_control_tests_42` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`controlId` int NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`sampleJson` text,
	`testerUserId` int NOT NULL,
	`result` enum('not_started','effective','partially_effective','ineffective') NOT NULL DEFAULT 'not_started',
	`findingId` int,
	`testedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_control_tests_42_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_controls_42` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`controlKey` varchar(140) NOT NULL,
	`objectiveAr` varchar(240) NOT NULL,
	`controlType` enum('preventive','detective','corrective') NOT NULL,
	`frequency` enum('continuous','monthly','quarterly','annual','event_based') NOT NULL,
	`ownerUserId` int,
	`procedureText` text,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_controls_42_id` PRIMARY KEY(`id`),
	CONSTRAINT `compliance_control_entity_key_42` UNIQUE(`businessEntityId`,`controlKey`)
);
--> statement-breakpoint
CREATE TABLE `compliance_findings_42` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`sourceType` varchar(100) NOT NULL,
	`sourceId` int,
	`titleAr` varchar(240) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`rootCause` text,
	`dueDate` timestamp,
	`ownerUserId` int,
	`status` enum('open','remediating','verification','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	CONSTRAINT `compliance_findings_42_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_permits_42` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`permitKey` varchar(140) NOT NULL,
	`requirementId` int,
	`authorityId` int,
	`activityKey` varchar(120),
	`permitNumberMasked` varchar(180),
	`issueDate` timestamp,
	`expiryDate` timestamp,
	`conditionsJson` text,
	`status` enum('draft','submitted','active','expiring','expired','suspended','cancelled') NOT NULL DEFAULT 'draft',
	`ownerUserId` int,
	`idempotencyKey` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `compliance_permits_42_id` PRIMARY KEY(`id`),
	CONSTRAINT `compliance_permit_entity_key_42` UNIQUE(`businessEntityId`,`permitKey`),
	CONSTRAINT `compliance_permit_entity_idem_42` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `compliance_remediation_42` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`findingId` int NOT NULL,
	`actionAr` varchar(500) NOT NULL,
	`ownerUserId` int NOT NULL,
	`dueDate` timestamp NOT NULL,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`evidenceDocumentId` int,
	`verificationNote` text,
	`status` enum('planned','in_progress','submitted','verified','rejected','closed') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `compliance_remediation_42_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_requirements_42` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requirementKey` varchar(140) NOT NULL,
	`titleAr` varchar(240) NOT NULL,
	`regulatoryDomain` varchar(120) NOT NULL,
	`jurisdiction` varchar(120) NOT NULL,
	`authorityId` int,
	`description` text,
	`applicabilityJson` text,
	`frequency` enum('once','monthly','quarterly','annual','event_based') NOT NULL DEFAULT 'annual',
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `compliance_requirements_42_id` PRIMARY KEY(`id`),
	CONSTRAINT `compliance_requirements_42_requirementKey_unique` UNIQUE(`requirementKey`)
);
--> statement-breakpoint
CREATE TABLE `governance_conflicts_42` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`subjectUserId` int NOT NULL,
	`disclosureType` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`relatedPartyRef` varchar(180),
	`severity` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`status` enum('declared','under_review','mitigated','closed') NOT NULL DEFAULT 'declared',
	`reviewerUserId` int,
	`resolutionNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `governance_conflicts_42_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `governance_resolutions_42` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`resolutionKey` varchar(140) NOT NULL,
	`meetingDate` timestamp,
	`titleAr` varchar(240) NOT NULL,
	`decisionText` text NOT NULL,
	`authorityScope` varchar(160),
	`status` enum('draft','approved','effective','superseded') NOT NULL DEFAULT 'draft',
	`approvedBy` int,
	`evidenceDocumentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `governance_resolutions_42_id` PRIMARY KEY(`id`),
	CONSTRAINT `governance_resolutions_42_resolutionKey_unique` UNIQUE(`resolutionKey`)
);
--> statement-breakpoint
CREATE TABLE `regulatory_reports_42` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`reportKey` varchar(140) NOT NULL,
	`authorityId` int,
	`periodStart` timestamp,
	`periodEnd` timestamp,
	`dataSourceJson` text,
	`approvalStatus` enum('draft','pending_approval','approved','submitted','rejected') NOT NULL DEFAULT 'draft',
	`submissionRef` varchar(180),
	`submittedAt` timestamp,
	`evidenceDocumentId` int,
	`ownerUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `regulatory_reports_42_id` PRIMARY KEY(`id`),
	CONSTRAINT `regulatory_report_entity_key_42` UNIQUE(`businessEntityId`,`reportKey`)
);
