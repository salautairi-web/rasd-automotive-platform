CREATE TABLE `risk_appetite_49` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`appetiteScore` int NOT NULL,
	`toleranceScore` int NOT NULL,
	`financialLimitMinor` int NOT NULL DEFAULT 0,
	`operationalLimit` int NOT NULL DEFAULT 0,
	`escalationRulesJson` text NOT NULL,
	`status` enum('draft','approved','retired') NOT NULL DEFAULT 'draft',
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_appetite_49_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risk_assessments_49` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`riskId` int NOT NULL,
	`likelihood` int NOT NULL,
	`impact` int NOT NULL,
	`velocity` int NOT NULL,
	`exposure` int NOT NULL,
	`riskScore` int NOT NULL,
	`appetiteScore` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`assessedBy` int NOT NULL,
	`assessedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_assessments_49_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risk_audit_49` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessEntityId` int,
	`action` varchar(120) NOT NULL,
	`resourceType` varchar(100) NOT NULL,
	`resourceId` varchar(140) NOT NULL,
	`requestId` varchar(100) NOT NULL,
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_audit_49_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risk_bcp_plans_49` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`biaId` int NOT NULL,
	`planNo` varchar(80) NOT NULL,
	`scenario` varchar(180) NOT NULL,
	`recoveryStrategy` text NOT NULL,
	`ownerUserId` int NOT NULL,
	`stepsJson` text NOT NULL,
	`contactsJson` text NOT NULL,
	`lastTestAt` timestamp,
	`status` enum('draft','approved','active','under_review','retired') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_bcp_plans_49_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risk_bia_49` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`processKey` varchar(100) NOT NULL,
	`processNameAr` varchar(200) NOT NULL,
	`criticality` enum('low','medium','high','critical') NOT NULL,
	`rtoMinutes` int NOT NULL,
	`rpoMinutes` int NOT NULL,
	`maxDowntimeMinutes` int NOT NULL,
	`dependenciesJson` text NOT NULL,
	`minimumResourcesJson` text NOT NULL,
	`status` enum('draft','approved','review_due') NOT NULL DEFAULT 'draft',
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_bia_49_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risk_control_tests_49` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`controlId` int NOT NULL,
	`periodCode` varchar(30) NOT NULL,
	`sampleSize` int NOT NULL DEFAULT 0,
	`testerUserId` int NOT NULL,
	`result` enum('pass','fail','pass_with_exception','not_applicable') NOT NULL,
	`exceptionText` text,
	`remediationRef` varchar(160),
	`evidenceJson` text,
	`retestResult` enum('pending','pass','fail') NOT NULL DEFAULT 'pending',
	`testedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_control_tests_49_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risk_controls_49` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`riskId` int,
	`controlNo` varchar(80) NOT NULL,
	`objective` text NOT NULL,
	`controlType` enum('preventive','detective','corrective','it_general','entity_level') NOT NULL,
	`executionType` enum('manual','automated') NOT NULL,
	`ownerUserId` int NOT NULL,
	`frequency` enum('per_transaction','daily','weekly','monthly','quarterly','annual') NOT NULL,
	`evidenceRequired` boolean NOT NULL DEFAULT true,
	`effectiveness` enum('not_tested','effective','partially_effective','ineffective') NOT NULL DEFAULT 'not_tested',
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_controls_49_id` PRIMARY KEY(`id`),
	CONSTRAINT `risk_controls_49_no_unique` UNIQUE(`businessEntityId`,`controlNo`)
);
--> statement-breakpoint
CREATE TABLE `risk_crises_49` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`crisisNo` varchar(80) NOT NULL,
	`crisisLevel` enum('level_1','level_2','level_3','level_4') NOT NULL,
	`incidentId` int,
	`commanderUserId` int NOT NULL,
	`activationReason` text NOT NULL,
	`decisionLogJson` text NOT NULL,
	`communicationPlanJson` text NOT NULL,
	`status` enum('standby','active','recovering','closed') NOT NULL DEFAULT 'standby',
	`activatedAt` timestamp,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_crises_49_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risk_dependencies_49` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`sourceType` varchar(80) NOT NULL,
	`sourceKey` varchar(120) NOT NULL,
	`targetType` varchar(80) NOT NULL,
	`targetKey` varchar(120) NOT NULL,
	`criticality` enum('low','medium','high','critical') NOT NULL,
	`singlePointOfFailure` boolean NOT NULL DEFAULT false,
	`fallbackJson` text,
	`status` enum('active','review_due','retired') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_dependencies_49_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risk_dr_plans_49` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`systemKey` varchar(120) NOT NULL,
	`systemNameAr` varchar(200) NOT NULL,
	`criticality` enum('low','medium','high','critical') NOT NULL,
	`rtoMinutes` int NOT NULL,
	`rpoMinutes` int NOT NULL,
	`backupPolicyJson` text NOT NULL,
	`recoveryStrategy` text NOT NULL,
	`restoreProcedure` text NOT NULL,
	`ownerUserId` int NOT NULL,
	`lastTestAt` timestamp,
	`lastTestResult` enum('not_tested','pass','fail','partial') NOT NULL DEFAULT 'not_tested',
	`status` enum('draft','approved','active','retired') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_dr_plans_49_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risk_findings_49` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`riskId` int,
	`controlId` int,
	`findingNo` varchar(80) NOT NULL,
	`titleAr` varchar(220) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`rootCause` text,
	`ownerUserId` int NOT NULL,
	`dueDate` timestamp,
	`action` text NOT NULL,
	`status` enum('open','in_progress','accepted','verified','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_findings_49_id` PRIMARY KEY(`id`),
	CONSTRAINT `risk_findings_49_no_unique` UNIQUE(`businessEntityId`,`findingNo`)
);
--> statement-breakpoint
CREATE TABLE `risk_incidents_49` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`incidentNo` varchar(80) NOT NULL,
	`category` varchar(100) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`titleAr` varchar(220) NOT NULL,
	`description` text NOT NULL,
	`phase` enum('detected','contained','investigating','recovering','closed') NOT NULL DEFAULT 'detected',
	`rootCause` text,
	`lessonsLearned` text,
	`reportedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_incidents_49_id` PRIMARY KEY(`id`),
	CONSTRAINT `risk_incidents_49_no_unique` UNIQUE(`businessEntityId`,`incidentNo`)
);
--> statement-breakpoint
CREATE TABLE `risk_kri_49` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`riskId` int,
	`metricKey` varchar(100) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`thresholdMinor` int NOT NULL DEFAULT 0,
	`currentValueMinor` int NOT NULL DEFAULT 0,
	`frequency` enum('realtime','daily','weekly','monthly','quarterly') NOT NULL,
	`trend` enum('up','flat','down','unknown') NOT NULL DEFAULT 'unknown',
	`alertStatus` enum('normal','warning','critical') NOT NULL DEFAULT 'normal',
	`ownerUserId` int NOT NULL,
	`source` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_kri_49_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risk_register_49` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`riskNo` varchar(80) NOT NULL,
	`activity` varchar(180) NOT NULL,
	`titleAr` varchar(240) NOT NULL,
	`description` text NOT NULL,
	`category` enum('strategic','financial','operational','compliance','legal','cybersecurity','technology','supplier','customer','fleet','workshop','inventory','project','people','liquidity','reputation','business_continuity') NOT NULL,
	`ownerUserId` int NOT NULL,
	`inherentScore` int NOT NULL,
	`residualScore` int NOT NULL,
	`treatment` enum('avoid','reduce','transfer','accept') NOT NULL,
	`dueDate` timestamp,
	`status` enum('open','monitoring','mitigating','accepted','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_register_49_id` PRIMARY KEY(`id`),
	CONSTRAINT `risk_register_49_no_unique` UNIQUE(`businessEntityId`,`riskNo`)
);
--> statement-breakpoint
CREATE TABLE `risk_third_parties_49` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`supplierRef` varchar(160) NOT NULL,
	`service` varchar(180) NOT NULL,
	`criticality` enum('low','medium','high','critical') NOT NULL,
	`slaRef` varchar(160),
	`continuityPlanJson` text NOT NULL,
	`concentrationScore` int NOT NULL DEFAULT 0,
	`exitPlanJson` text NOT NULL,
	`status` enum('active','review_due','blocked','exited') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_third_parties_49_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risk_treatments_49` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`riskId` int NOT NULL,
	`actionPlan` text NOT NULL,
	`ownerUserId` int NOT NULL,
	`budgetMinor` int NOT NULL DEFAULT 0,
	`dueDate` timestamp,
	`verificationEvidenceJson` text,
	`status` enum('planned','in_progress','blocked','verified','overdue','cancelled') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_treatments_49_id` PRIMARY KEY(`id`)
);
