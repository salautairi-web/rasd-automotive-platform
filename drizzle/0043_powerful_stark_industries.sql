CREATE TABLE `alert_anomalies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`alertId` int,
	`metricKey` varchar(120) NOT NULL,
	`baselineValue` varchar(120) NOT NULL,
	`observedValue` varchar(120) NOT NULL,
	`deviationBps` int NOT NULL DEFAULT 0,
	`modelVersion` varchar(80) NOT NULL,
	`confidenceBps` int NOT NULL DEFAULT 0,
	`status` enum('detected','reviewed','dismissed') NOT NULL DEFAULT 'detected',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_anomalies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`alertId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`detailsJson` text,
	`correlationId` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_escalations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`alertId` int NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`targetUserId` int,
	`targetRole` varchar(100),
	`dueAt` timestamp NOT NULL,
	`status` enum('pending','triggered','acknowledged','resolved','cancelled') NOT NULL DEFAULT 'pending',
	`triggeredAt` timestamp,
	`resolvedAt` timestamp,
	CONSTRAINT `alert_escalations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`alertId` int NOT NULL,
	`userId` int NOT NULL,
	`feedbackType` enum('useful','false_positive','duplicate','threshold_too_low','threshold_too_high') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`correlationKey` varchar(180) NOT NULL,
	`titleAr` varchar(220) NOT NULL,
	`rootCauseHint` text,
	`status` enum('open','acknowledged','resolved','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_instances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`ruleId` int NOT NULL,
	`sourceSystem` varchar(100) NOT NULL,
	`sourceRecordType` varchar(100) NOT NULL,
	`sourceRecordId` varchar(120) NOT NULL,
	`correlationKey` varchar(180) NOT NULL,
	`severity` enum('info','low','medium','high','critical') NOT NULL,
	`priority` enum('low','normal','high','urgent') NOT NULL,
	`status` enum('detected','open','acknowledged','assigned','in_progress','escalated','resolved','verified','closed','suppressed') NOT NULL DEFAULT 'detected',
	`ownerUserId` int,
	`dueAt` timestamp,
	`evidenceJson` text,
	`recommendedAction` text,
	`dedupeKey` varchar(200) NOT NULL,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `alert_instances_id` PRIMARY KEY(`id`),
	CONSTRAINT `alert_instance_entity_dedupe_unique` UNIQUE(`businessEntityId`,`dedupeKey`)
);
--> statement-breakpoint
CREATE TABLE `alert_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`subjectType` enum('user','role','entity') NOT NULL,
	`subjectRef` varchar(180) NOT NULL,
	`channelsJson` text NOT NULL,
	`severityPolicyJson` text NOT NULL,
	`quietHoursJson` text,
	`digestMode` enum('immediate','digest','off') NOT NULL DEFAULT 'immediate',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `alert_preference_scope_unique` UNIQUE(`businessEntityId`,`subjectType`,`subjectRef`)
);
--> statement-breakpoint
CREATE TABLE `alert_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`ruleKey` varchar(120) NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`alertType` enum('expiry','threshold','variance','anomaly','sla_breach','cash','inventory','vehicle','workshop','rental','sales','compliance','project','security','data_quality') NOT NULL,
	`metricKey` varchar(120) NOT NULL,
	`operator` enum('gt','gte','lt','lte','eq','neq','rate','deviation') NOT NULL,
	`thresholdValue` varchar(120) NOT NULL,
	`severity` enum('info','low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','active','paused','retired') NOT NULL DEFAULT 'draft',
	`effectiveAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `alert_rule_scope_key_unique` UNIQUE(`businessEntityId`,`ruleKey`,`version`)
);
