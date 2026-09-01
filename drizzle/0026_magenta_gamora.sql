CREATE TABLE `automation_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowVersionId` int NOT NULL,
	`actionKey` varchar(100) NOT NULL,
	`sequence` int NOT NULL,
	`actionType` enum('create_task','assign_task','send_notification','request_approval','create_command','call_entity_api','create_document','request_signature','create_service_request','create_purchase_request','create_inter_entity_transaction','update_workflow_state','wait','branch','end') NOT NULL,
	`targetSystem` varchar(80),
	`configJson` text NOT NULL,
	`compensationJson` text,
	`timeoutSeconds` int NOT NULL DEFAULT 30,
	`maxAttempts` int NOT NULL DEFAULT 3,
	CONSTRAINT `automation_actions_id` PRIMARY KEY(`id`),
	CONSTRAINT `automation_action_key_unique` UNIQUE(`workflowVersionId`,`actionKey`)
);
--> statement-breakpoint
CREATE TABLE `automation_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`businessEntityId` int,
	`approvalKey` varchar(100) NOT NULL,
	`approverRole` varchar(80),
	`approverUserId` int,
	`mode` enum('sequential','parallel') NOT NULL DEFAULT 'sequential',
	`amountThresholdMinor` int,
	`status` enum('pending','approved','rejected','delegated','expired','cancelled') NOT NULL DEFAULT 'pending',
	`dueAt` timestamp,
	`decidedAt` timestamp,
	`comments` text,
	CONSTRAINT `automation_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` varchar(100) NOT NULL,
	`requestId` varchar(80) NOT NULL,
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automation_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_dead_letters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`businessEntityId` int,
	`reason` text NOT NULL,
	`payloadJson` text NOT NULL,
	`status` enum('open','replayed','discarded') NOT NULL DEFAULT 'open',
	`replayedBy` int,
	`replayedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automation_dead_letters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_escalations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`businessEntityId` int,
	`sourceType` enum('task','approval','sla','notification','action') NOT NULL,
	`sourceId` varchar(100) NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`ruleJson` text NOT NULL,
	`targetRole` varchar(80),
	`targetUserId` int,
	`dueAt` timestamp NOT NULL,
	`status` enum('pending','triggered','acknowledged','resolved','cancelled') NOT NULL DEFAULT 'pending',
	`triggeredAt` timestamp,
	CONSTRAINT `automation_escalations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_failures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`runStepId` int,
	`failureType` enum('workflow','action','api_timeout','permission','validation','rate_limit','loop_detected','unknown') NOT NULL,
	`message` text NOT NULL,
	`detailsJson` text,
	`retryable` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automation_failures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int,
	`businessEntityId` int,
	`templateKey` varchar(100) NOT NULL,
	`channel` enum('in_app','email','sms','push','webhook') NOT NULL,
	`recipientRef` varchar(320) NOT NULL,
	`language` varchar(12) NOT NULL DEFAULT 'ar',
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`dedupeKey` varchar(160) NOT NULL,
	`subject` varchar(220),
	`body` text NOT NULL,
	`status` enum('queued','sent','delivered','failed','suppressed','rate_limited') NOT NULL DEFAULT 'queued',
	`attempts` int NOT NULL DEFAULT 0,
	`nextAttemptAt` timestamp,
	`sentAt` timestamp,
	CONSTRAINT `automation_notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `automation_notification_dedupe_unique` UNIQUE(`channel`,`recipientRef`,`dedupeKey`)
);
--> statement-breakpoint
CREATE TABLE `automation_retries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runStepId` int NOT NULL,
	`attemptNo` int NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`backoffSeconds` int NOT NULL,
	`status` enum('scheduled','running','succeeded','failed','cancelled') NOT NULL DEFAULT 'scheduled',
	`errorJson` text,
	CONSTRAINT `automation_retries_id` PRIMARY KEY(`id`),
	CONSTRAINT `automation_retry_attempt_unique` UNIQUE(`runStepId`,`attemptNo`)
);
--> statement-breakpoint
CREATE TABLE `automation_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowVersionId` int NOT NULL,
	`ruleKey` varchar(100) NOT NULL,
	`sequence` int NOT NULL,
	`operator` enum('and','or') NOT NULL DEFAULT 'and',
	`expressionJson` text NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `automation_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `automation_rule_key_unique` UNIQUE(`workflowVersionId`,`ruleKey`)
);
--> statement-breakpoint
CREATE TABLE `automation_run_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`actionId` int,
	`stepKey` varchar(100) NOT NULL,
	`sequence` int NOT NULL,
	`status` enum('pending','running','waiting','completed','failed','skipped','compensated') NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`inputJson` text,
	`outputJson` text,
	`errorJson` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	CONSTRAINT `automation_run_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` varchar(100) NOT NULL,
	`workflowId` int NOT NULL,
	`workflowVersionId` int NOT NULL,
	`businessEntityId` int,
	`eventId` varchar(100),
	`idempotencyKey` varchar(160) NOT NULL,
	`correlationId` varchar(100) NOT NULL,
	`parentRunId` varchar(100),
	`depth` int NOT NULL DEFAULT 0,
	`mode` enum('live','dry_run','preview') NOT NULL DEFAULT 'live',
	`status` enum('queued','running','waiting','completed','failed','cancelled','dead_lettered') NOT NULL DEFAULT 'queued',
	`inputJson` text NOT NULL,
	`outputJson` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automation_runs_id` PRIMARY KEY(`id`),
	CONSTRAINT `automation_runs_runId_unique` UNIQUE(`runId`),
	CONSTRAINT `automation_run_key_unique` UNIQUE(`workflowId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `automation_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`businessEntityId` int,
	`name` varchar(160) NOT NULL,
	`cronExpression` varchar(100) NOT NULL,
	`timezone` varchar(80) NOT NULL DEFAULT 'UTC',
	`payloadJson` text,
	`schedule_cron_task_uid` varchar(65),
	`status` enum('active','paused','expired') NOT NULL DEFAULT 'active',
	`nextRunAt` timestamp,
	`lastRunAt` timestamp,
	`createdBy` int NOT NULL,
	CONSTRAINT `automation_schedules_id` PRIMARY KEY(`id`),
	CONSTRAINT `automation_schedule_task_unique` UNIQUE(`schedule_cron_task_uid`)
);
--> statement-breakpoint
CREATE TABLE `automation_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`businessEntityId` int,
	`taskKey` varchar(100) NOT NULL,
	`titleAr` varchar(220) NOT NULL,
	`assigneeUserId` int,
	`assigneeRole` varchar(80),
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`status` enum('open','in_progress','completed','cancelled','escalated') NOT NULL DEFAULT 'open',
	`dueAt` timestamp,
	`completedAt` timestamp,
	`evidenceJson` text,
	CONSTRAINT `automation_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_triggers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowVersionId` int NOT NULL,
	`triggerType` enum('event','time','condition','approval','schedule','threshold','exception','document') NOT NULL,
	`eventType` varchar(120),
	`sourceSystem` varchar(80),
	`configJson` text NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `automation_triggers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_workflow_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`version` int NOT NULL,
	`definitionJson` text NOT NULL,
	`completionRuleJson` text,
	`failureRuleJson` text,
	`checksum` varchar(64) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automation_workflow_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `automation_workflow_version_unique` UNIQUE(`workflowId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `automation_workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`workflowKey` varchar(100) NOT NULL,
	`nameAr` varchar(200) NOT NULL,
	`scope` enum('entity','central','cross_entity') NOT NULL,
	`status` enum('draft','published','active','paused','deprecated','archived') NOT NULL DEFAULT 'draft',
	`currentVersion` int NOT NULL DEFAULT 1,
	`rateLimitPerMinute` int NOT NULL DEFAULT 60,
	`maxDepth` int NOT NULL DEFAULT 8,
	`publishedBy` int,
	`publishedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automation_workflows_id` PRIMARY KEY(`id`),
	CONSTRAINT `automation_workflow_key_unique` UNIQUE(`businessEntityId`,`workflowKey`)
);
