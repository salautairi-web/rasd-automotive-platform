CREATE TABLE `external_auditor_workspaces_50` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`engagementId` int,
	`workspaceNo` varchar(80) NOT NULL,
	`auditorName` varchar(180) NOT NULL,
	`auditorEmail` varchar(320) NOT NULL,
	`accessScopeJson` text NOT NULL,
	`role` enum('external_auditor_read_only','external_reviewer_read_only') NOT NULL DEFAULT 'external_auditor_read_only',
	`status` enum('pending','active','expired','revoked','closed') NOT NULL DEFAULT 'pending',
	`startsAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`exportPolicyJson` text NOT NULL,
	`createdBy` int NOT NULL,
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `external_auditor_workspaces_50_id` PRIMARY KEY(`id`),
	CONSTRAINT `external_auditor_workspaces_50_no_unique` UNIQUE(`businessEntityId`,`workspaceNo`)
);
--> statement-breakpoint
CREATE TABLE `external_evidence_requests_50` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`requestNo` varchar(80) NOT NULL,
	`titleAr` varchar(220) NOT NULL,
	`description` text NOT NULL,
	`evidenceType` enum('document','transaction','system_log','approval','report','external_confirmation') NOT NULL,
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`dueDate` timestamp,
	`status` enum('requested','in_progress','submitted','under_review','approved','rejected','closed') NOT NULL DEFAULT 'requested',
	`responseEvidenceJson` text,
	`submittedBy` int,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `external_evidence_requests_50_id` PRIMARY KEY(`id`),
	CONSTRAINT `external_evidence_requests_50_no_unique` UNIQUE(`businessEntityId`,`requestNo`)
);
--> statement-breakpoint
CREATE TABLE `external_export_approvals_50` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`exportNo` varchar(80) NOT NULL,
	`requestedBy` int NOT NULL,
	`reason` text NOT NULL,
	`scopeJson` text NOT NULL,
	`redactionStatus` enum('not_required','pending','completed','rejected') NOT NULL DEFAULT 'pending',
	`format` enum('csv','xlsx','pdf','json') NOT NULL,
	`status` enum('requested','under_review','approved','rejected','expired','downloaded') NOT NULL DEFAULT 'requested',
	`expiresAt` timestamp NOT NULL,
	`approvedBy` int,
	`approvedAt` timestamp,
	`downloadCount` int NOT NULL DEFAULT 0,
	`lastDownloadedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `external_export_approvals_50_id` PRIMARY KEY(`id`),
	CONSTRAINT `external_export_approvals_50_no_unique` UNIQUE(`businessEntityId`,`exportNo`)
);
--> statement-breakpoint
CREATE TABLE `external_workspace_audit_50` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`actorUserId` int,
	`actorType` enum('internal','external_auditor','system') NOT NULL,
	`action` varchar(120) NOT NULL,
	`resourceType` varchar(100) NOT NULL,
	`resourceId` varchar(140) NOT NULL,
	`scopeJson` text,
	`requestId` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `external_workspace_audit_50_id` PRIMARY KEY(`id`)
);
