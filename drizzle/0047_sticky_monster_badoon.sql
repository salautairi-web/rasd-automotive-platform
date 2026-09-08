CREATE TABLE `governance_members_42` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`memberType` enum('shareholder','director','officer','beneficial_owner','committee_member') NOT NULL,
	`memberName` varchar(240) NOT NULL,
	`roleTitle` varchar(160),
	`ownershipPercent` int,
	`appointmentDate` timestamp,
	`endDate` timestamp,
	`delegationScope` text,
	`status` enum('proposed','active','inactive','removed') NOT NULL DEFAULT 'active',
	`evidenceDocumentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `governance_members_42_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `regulatory_submissions_42` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`reportId` int,
	`authorityId` int,
	`submissionKey` varchar(140) NOT NULL,
	`correspondenceType` enum('filing','inspection_request','information_request','notice','response','appeal') NOT NULL,
	`receivedAt` timestamp,
	`dueDate` timestamp,
	`responseDate` timestamp,
	`referenceMasked` varchar(180),
	`responseSummary` text,
	`status` enum('received','in_progress','submitted','accepted','rejected','closed') NOT NULL DEFAULT 'received',
	`ownerUserId` int,
	`evidenceDocumentId` int,
	`idempotencyKey` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `regulatory_submissions_42_id` PRIMARY KEY(`id`),
	CONSTRAINT `regulatory_submission_entity_key_42` UNIQUE(`businessEntityId`,`submissionKey`),
	CONSTRAINT `regulatory_submission_entity_idem_42` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
