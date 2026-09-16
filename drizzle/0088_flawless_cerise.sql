CREATE TABLE `mdm_data_standards_74` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`domainType` varchar(80) NOT NULL,
	`standardKey` varchar(120) NOT NULL,
	`nameAr` varchar(240) NOT NULL,
	`validationJson` text NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','review','approved','retired') NOT NULL DEFAULT 'draft',
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_data_standards_74_id` PRIMARY KEY(`id`),
	CONSTRAINT `mdm_standard_74_unique` UNIQUE(`businessEntityId`,`domainType`,`standardKey`,`version`)
);
--> statement-breakpoint
CREATE TABLE `mdm_governance_assignments_74` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`domainType` varchar(80) NOT NULL,
	`dataOwnerUserId` int NOT NULL,
	`dataStewardUserId` int NOT NULL,
	`dataCustodianUserId` int,
	`policyVersion` int NOT NULL DEFAULT 1,
	`status` enum('draft','submitted','approved','retired') NOT NULL DEFAULT 'draft',
	`effectiveFrom` timestamp NOT NULL DEFAULT (now()),
	`effectiveTo` timestamp,
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_governance_assignments_74_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mdm_lifecycle_actions_74` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`domainType` varchar(80) NOT NULL,
	`recordId` int NOT NULL,
	`fromStatus` varchar(40) NOT NULL,
	`toStatus` varchar(40) NOT NULL,
	`reason` text NOT NULL,
	`requestedBy` int NOT NULL,
	`approvedBy` int,
	`status` enum('submitted','approved','rejected','applied') NOT NULL DEFAULT 'submitted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`appliedAt` timestamp,
	CONSTRAINT `mdm_lifecycle_actions_74_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mdm_quality_assessments_74` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`domainType` varchar(80) NOT NULL,
	`recordId` int NOT NULL,
	`ruleId` int NOT NULL,
	`observedValue` decimal(8,4) NOT NULL,
	`status` enum('passed','warning','failed','waived') NOT NULL DEFAULT 'passed',
	`evidenceJson` text NOT NULL,
	`evaluatedBy` int NOT NULL,
	`evaluatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_quality_assessments_74_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mdm_quality_rules_74` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`domainType` varchar(80) NOT NULL,
	`ruleKey` varchar(120) NOT NULL,
	`dimension` enum('completeness','accuracy','validity','consistency','uniqueness','timeliness','integrity','conformity') NOT NULL,
	`expression` text NOT NULL,
	`thresholdBps` int NOT NULL DEFAULT 10000,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_quality_rules_74_id` PRIMARY KEY(`id`),
	CONSTRAINT `mdm_quality_rule_74_unique` UNIQUE(`businessEntityId`,`domainType`,`ruleKey`)
);
