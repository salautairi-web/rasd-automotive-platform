CREATE TABLE `workflow_calendars_52` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`branchId` int,
	`nameAr` varchar(180) NOT NULL,
	`timezone` varchar(80) NOT NULL DEFAULT 'Asia/Riyadh',
	`workingDaysJson` text NOT NULL,
	`holidaysJson` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_calendars_52_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_edges_52` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowVersionId` int NOT NULL,
	`sourceNodeKey` varchar(100) NOT NULL,
	`targetNodeKey` varchar(100) NOT NULL,
	`conditionJson` text,
	`labelAr` varchar(180),
	`sequenceNo` int NOT NULL DEFAULT 1,
	CONSTRAINT `workflow_edges_52_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_metrics_52` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`workflowKey` varchar(120) NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`cycleTimeMinutes` int NOT NULL DEFAULT 0,
	`approvalTimeMinutes` int NOT NULL DEFAULT 0,
	`reworkCount` int NOT NULL DEFAULT 0,
	`exceptionRateBps` int NOT NULL DEFAULT 0,
	`throughput` int NOT NULL DEFAULT 0,
	`slaBreachCount` int NOT NULL DEFAULT 0,
	`automationRateBps` int NOT NULL DEFAULT 0,
	`bottleneckNodeKey` varchar(100),
	CONSTRAINT `workflow_metrics_52_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_notifications_52` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`instanceId` int,
	`taskId` int,
	`channel` enum('in_app','email','sms','push') NOT NULL,
	`templateKey` varchar(120) NOT NULL,
	`locale` varchar(12) NOT NULL DEFAULT 'ar-SA',
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`consentRequired` boolean NOT NULL DEFAULT true,
	`consentGranted` boolean NOT NULL DEFAULT false,
	`status` enum('queued','sent','failed','suppressed') NOT NULL DEFAULT 'queued',
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_notifications_52_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_simulations_52` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`workflowVersionId` int NOT NULL,
	`scenarioNameAr` varchar(180) NOT NULL,
	`contextJson` text NOT NULL,
	`resultJson` text NOT NULL,
	`status` enum('passed','warnings','failed') NOT NULL,
	`sideEffectsApplied` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_simulations_52_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_sla_policies_52` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`branchId` int,
	`nodeKey` varchar(100) NOT NULL,
	`durationMinutes` int NOT NULL,
	`warningMinutes` int NOT NULL,
	`pauseRulesJson` text,
	`escalationJson` text,
	`calendarId` int NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `workflow_sla_policies_52_id` PRIMARY KEY(`id`)
);
