CREATE TABLE `mdm_data_ownership` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`domainType` varchar(80) NOT NULL,
	`dataOwnerUserId` int,
	`dataStewardUserId` int,
	`systemOfRecord` varchar(160) NOT NULL,
	`creationPermissionKey` varchar(160) NOT NULL,
	`updatePermissionKey` varchar(160) NOT NULL,
	`approvalRequired` boolean NOT NULL DEFAULT true,
	`classification` enum('public','internal','confidential','restricted','highly_restricted') NOT NULL DEFAULT 'internal',
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_data_ownership_id` PRIMARY KEY(`id`),
	CONSTRAINT `mdm_data_ownership_scope_unique` UNIQUE(`businessEntityId`,`domainType`,`version`)
);
--> statement-breakpoint
CREATE TABLE `mdm_privacy_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`subjectReferenceHash` varchar(128) NOT NULL,
	`requestType` enum('access','correction','restriction','retention_review','disposal') NOT NULL,
	`purpose` varchar(240) NOT NULL,
	`requestedBy` int NOT NULL,
	`approvedBy` int,
	`status` enum('submitted','under_review','approved','rejected','completed','blocked') NOT NULL DEFAULT 'submitted',
	`retentionUntil` timestamp,
	`completionEvidenceJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_privacy_requests_id` PRIMARY KEY(`id`)
);
