CREATE TABLE `workflow_approvals_52` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`instanceId` int NOT NULL,
	`taskId` int,
	`approvalKey` varchar(100) NOT NULL,
	`makerUserId` int,
	`approverUserId` int,
	`approverRole` varchar(100),
	`mode` enum('single','sequential','parallel','quorum') NOT NULL DEFAULT 'single',
	`quorumRequired` int NOT NULL DEFAULT 1,
	`quorumApproved` int NOT NULL DEFAULT 0,
	`stepUpRequired` int NOT NULL DEFAULT 0,
	`status` enum('pending','approved','rejected','returned','delegated','expired') NOT NULL DEFAULT 'pending',
	`decisionNote` text,
	`dueAt` timestamp,
	`decidedAt` timestamp,
	CONSTRAINT `workflow_approvals_52_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_audit_52` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`instanceId` int,
	`actorUserId` int,
	`eventType` varchar(120) NOT NULL,
	`nodeKey` varchar(100),
	`beforeJson` text,
	`afterJson` text,
	`requestId` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_audit_52_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_definitions_52` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`workflowKey` varchar(120) NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`scope` enum('entity','central','cross_entity') NOT NULL,
	`triggerType` varchar(100) NOT NULL,
	`status` enum('draft','testing','published','deprecated') NOT NULL DEFAULT 'draft',
	`currentVersion` int NOT NULL DEFAULT 1,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_definitions_52_id` PRIMARY KEY(`id`),
	CONSTRAINT `workflow_definitions_52_key_unique` UNIQUE(`businessEntityId`,`workflowKey`)
);
--> statement-breakpoint
CREATE TABLE `workflow_delegations_52` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`fromUserId` int NOT NULL,
	`toUserId` int NOT NULL,
	`scopeJson` text NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`status` enum('active','expired','revoked') NOT NULL DEFAULT 'active',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_delegations_52_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_exceptions_52` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`instanceId` int NOT NULL,
	`exceptionType` enum('validation','integration','timeout','rejected','missing_evidence','conflict') NOT NULL,
	`message` text NOT NULL,
	`status` enum('open','retrying','manual_review','compensated','closed') NOT NULL DEFAULT 'open',
	`retryCount` int NOT NULL DEFAULT 0,
	`compensationJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `workflow_exceptions_52_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_instances_52` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`workflowVersionId` int NOT NULL,
	`correlationId` varchar(100) NOT NULL,
	`businessRecordType` varchar(100),
	`businessRecordId` varchar(120),
	`status` enum('running','waiting_approval','waiting_task','escalated','completed','failed','cancelled') NOT NULL DEFAULT 'running',
	`currentNodeKey` varchar(100),
	`contextJson` text NOT NULL,
	`idempotencyKey` varchar(140) NOT NULL,
	`retryCount` int NOT NULL DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `workflow_instances_52_id` PRIMARY KEY(`id`),
	CONSTRAINT `workflow_instances_52_correlation_unique` UNIQUE(`businessEntityId`,`correlationId`),
	CONSTRAINT `workflow_instances_52_idempotency_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `workflow_nodes_52` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowVersionId` int NOT NULL,
	`nodeKey` varchar(100) NOT NULL,
	`nodeType` enum('start','end','task','approval','condition','parallel','timer','event','integration','human_review') NOT NULL,
	`titleAr` varchar(220) NOT NULL,
	`configJson` text NOT NULL,
	`sequenceNo` int NOT NULL DEFAULT 1,
	CONSTRAINT `workflow_nodes_52_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_tasks_52` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`instanceId` int NOT NULL,
	`nodeKey` varchar(100) NOT NULL,
	`titleAr` varchar(220) NOT NULL,
	`assigneeUserId` int,
	`assigneeRole` varchar(100),
	`status` enum('open','claimed','in_progress','completed','rejected','escalated','cancelled') NOT NULL DEFAULT 'open',
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`dueAt` timestamp,
	`evidenceJson` text,
	`outcomeJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `workflow_tasks_52_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_versions_52` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`version` int NOT NULL,
	`definitionJson` text NOT NULL,
	`checksum` varchar(64) NOT NULL,
	`status` enum('draft','testing','published','deprecated') NOT NULL DEFAULT 'draft',
	`effectiveAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_versions_52_id` PRIMARY KEY(`id`),
	CONSTRAINT `workflow_versions_52_unique` UNIQUE(`workflowId`,`version`)
);
