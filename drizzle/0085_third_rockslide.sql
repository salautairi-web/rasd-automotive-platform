CREATE TABLE `workflow_document_requirements_71` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`workflowId` int NOT NULL,
	`documentTypeCode` varchar(80) NOT NULL,
	`required` boolean NOT NULL DEFAULT true,
	`suppliedDocumentId` int,
	`status` enum('missing','submitted','verified','rejected','waived') NOT NULL DEFAULT 'missing',
	`blocker` boolean NOT NULL DEFAULT true,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	CONSTRAINT `workflow_document_requirements_71_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_inbox_71` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`module` varchar(80) NOT NULL,
	`transactionType` varchar(80) NOT NULL,
	`transactionId` varchar(120) NOT NULL,
	`taskType` enum('approval','review','exception','delegation','escalation') NOT NULL,
	`assignedTo` int NOT NULL,
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`status` enum('pending','approved','rejected','returned','delegated','escalated','completed','cancelled') NOT NULL DEFAULT 'pending',
	`dueAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `workflow_inbox_71_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_sla_events_71` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`workflowId` int NOT NULL,
	`taskId` int,
	`targetMinutes` int NOT NULL,
	`elapsedMinutes` int NOT NULL DEFAULT 0,
	`status` enum('on_track','warning','breached','paused','resolved') NOT NULL DEFAULT 'on_track',
	`warningAt` timestamp,
	`breachedAt` timestamp,
	`ownerUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_sla_events_71_id` PRIMARY KEY(`id`)
);
