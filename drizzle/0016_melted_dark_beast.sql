CREATE TABLE `central_command_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commandId` int NOT NULL,
	`stage` int NOT NULL DEFAULT 1,
	`approverUserId` int,
	`approverRoleKey` varchar(80),
	`decision` enum('pending','approved','rejected','delegated') NOT NULL DEFAULT 'pending',
	`comment` text,
	`decidedAt` timestamp,
	CONSTRAINT `central_command_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `central_command_dispatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commandId` int NOT NULL,
	`attemptNo` int NOT NULL DEFAULT 1,
	`eventId` varchar(80) NOT NULL,
	`status` enum('queued','sent','accepted','failed','dead_letter') NOT NULL DEFAULT 'queued',
	`errorMessage` text,
	`dispatchedAt` timestamp,
	`completedAt` timestamp,
	CONSTRAINT `central_command_dispatches_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_command_dispatch_attempt_unique` UNIQUE(`commandId`,`attemptNo`),
	CONSTRAINT `central_command_dispatch_event_unique` UNIQUE(`eventId`)
);
--> statement-breakpoint
CREATE TABLE `central_commands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commandNo` varchar(80) NOT NULL,
	`commandType` varchar(100) NOT NULL,
	`sourceUserId` int NOT NULL,
	`sourceEntityId` int,
	`targetEntityId` int NOT NULL,
	`targetSystem` varchar(80) NOT NULL,
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`dueAt` timestamp,
	`payloadJson` text NOT NULL,
	`approvalRequired` int NOT NULL DEFAULT 0,
	`correlationId` varchar(80) NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	`status` enum('draft','pending_approval','approved','dispatched','accepted','in_progress','completed','rejected','failed','cancelled','expired') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `central_commands_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_commands_no_unique` UNIQUE(`commandNo`),
	CONSTRAINT `central_commands_target_key_unique` UNIQUE(`targetEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `central_delegations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`delegatorUserId` int NOT NULL,
	`delegateUserId` int NOT NULL,
	`businessEntityId` int,
	`scopeJson` text NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`status` enum('active','revoked','expired') NOT NULL DEFAULT 'active',
	CONSTRAINT `central_delegations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `central_escalations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`level` int NOT NULL,
	`reason` varchar(220) NOT NULL,
	`escalatedToUserId` int,
	`escalatedToRoleKey` varchar(80),
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `central_escalations_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_escalation_task_level_unique` UNIQUE(`taskId`,`level`)
);
--> statement-breakpoint
CREATE TABLE `central_operation_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sourceEntityId` int,
	`targetEntityId` int,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` varchar(80) NOT NULL,
	`requestId` varchar(80) NOT NULL,
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `central_operation_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `central_sla_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskType` varchar(100) NOT NULL,
	`targetEntityId` int,
	`warningMinutes` int NOT NULL,
	`dueMinutes` int NOT NULL,
	`escalationLevel1Minutes` int NOT NULL,
	`escalationLevel2Minutes` int NOT NULL,
	`enabled` int NOT NULL DEFAULT 1,
	CONSTRAINT `central_sla_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `central_task_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`userId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `central_task_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `central_task_dependencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`dependsOnTaskId` int NOT NULL,
	`dependencyType` enum('finish_to_start','finish_to_finish') NOT NULL DEFAULT 'finish_to_start',
	`status` enum('pending','satisfied','failed') NOT NULL DEFAULT 'pending',
	`blockingReason` text,
	CONSTRAINT `central_task_dependencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_task_dependency_unique` UNIQUE(`taskId`,`dependsOnTaskId`)
);
--> statement-breakpoint
CREATE TABLE `central_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskNo` varchar(80) NOT NULL,
	`commandId` int,
	`targetEntityId` int NOT NULL,
	`targetSystem` varchar(80) NOT NULL,
	`branchId` int,
	`departmentId` int,
	`assigneeUserId` int,
	`teamKey` varchar(80),
	`title` varchar(220) NOT NULL,
	`description` text,
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`dueAt` timestamp,
	`slaMinutes` int,
	`status` enum('open','assigned','in_progress','blocked','waiting','completed','rejected','cancelled','overdue') NOT NULL DEFAULT 'open',
	`completionEvidenceJson` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `central_tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_tasks_no_unique` UNIQUE(`taskNo`)
);
--> statement-breakpoint
CREATE TABLE `central_workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowKey` varchar(100) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`triggerType` varchar(100) NOT NULL,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`currentVersion` int NOT NULL DEFAULT 1,
	CONSTRAINT `central_workflows_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_workflows_key_unique` UNIQUE(`workflowKey`)
);
--> statement-breakpoint
CREATE TABLE `central_workflow_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowVersionId` int NOT NULL,
	`targetEntityId` int NOT NULL,
	`commandId` int,
	`correlationId` varchar(80) NOT NULL,
	`status` enum('running','waiting_approval','waiting_task','completed','failed','cancelled') NOT NULL DEFAULT 'running',
	`currentNodeKey` varchar(100),
	`contextJson` text NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `central_workflow_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `central_workflow_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`version` int NOT NULL,
	`definitionJson` text NOT NULL,
	`publishedAt` timestamp,
	CONSTRAINT `central_workflow_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_workflow_version_unique` UNIQUE(`workflowId`,`version`)
);
