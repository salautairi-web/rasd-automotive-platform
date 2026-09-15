CREATE TABLE `crm_360_snapshots_68` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`globalCustomerId` int NOT NULL,
	`segment` varchar(80),
	`lifetimeValueMinor` int NOT NULL DEFAULT 0,
	`openLeads` int NOT NULL DEFAULT 0,
	`openOpportunities` int NOT NULL DEFAULT 0,
	`activeContracts` int NOT NULL DEFAULT 0,
	`serviceInteractions` int NOT NULL DEFAULT 0,
	`riskLevel` enum('low','medium','high') NOT NULL DEFAULT 'low',
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_360_snapshots_68_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_lead_scores_68` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`leadId` int NOT NULL,
	`fitScore` int NOT NULL,
	`intentScore` int NOT NULL,
	`engagementScore` int NOT NULL,
	`budgetScore` int NOT NULL,
	`timingScore` int NOT NULL,
	`sourceQualityScore` int NOT NULL,
	`totalScore` int NOT NULL,
	`reason` varchar(500),
	`modelVersion` varchar(60) NOT NULL,
	`approvedOverride` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_lead_scores_68_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_merge_requests_68` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`sourceCustomerId` int NOT NULL,
	`targetCustomerId` int NOT NULL,
	`confidenceBps` int NOT NULL,
	`reason` varchar(500) NOT NULL,
	`status` enum('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending',
	`requestedBy` int NOT NULL,
	`approvedBy` int,
	`decidedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_merge_requests_68_id` PRIMARY KEY(`id`)
);
