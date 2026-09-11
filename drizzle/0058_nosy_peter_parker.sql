CREATE TABLE `external_evidence_comments_50` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`evidenceRequestId` int NOT NULL,
	`parentCommentId` int,
	`authorUserId` int,
	`authorType` enum('internal','external_auditor') NOT NULL,
	`body` text NOT NULL,
	`visibility` enum('workspace','internal_only') NOT NULL DEFAULT 'workspace',
	`status` enum('open','resolved','reopened') NOT NULL DEFAULT 'open',
	`mentionsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`resolvedBy` int,
	CONSTRAINT `external_evidence_comments_50_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `external_evidence_watermarks_50` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`evidenceRequestId` int,
	`exportId` int,
	`sourceRef` varchar(220) NOT NULL,
	`watermarkText` varchar(320) NOT NULL,
	`placement` enum('diagonal','header_footer','overlay') NOT NULL DEFAULT 'diagonal',
	`status` enum('queued','processing','completed','failed','revoked') NOT NULL DEFAULT 'queued',
	`renderedStorageKey` varchar(400),
	`integrityHash` varchar(128),
	`processedBy` int,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `external_evidence_watermarks_50_id` PRIMARY KEY(`id`)
);
