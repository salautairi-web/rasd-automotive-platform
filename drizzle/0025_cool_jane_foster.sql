CREATE TABLE `dms_access_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`documentId` int NOT NULL,
	`versionId` int,
	`userId` int,
	`shareId` int,
	`action` enum('view','download','upload','share','sign','archive','dispose') NOT NULL,
	`requestId` varchar(80) NOT NULL,
	`ipHash` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dms_access_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dms_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` varchar(100) NOT NULL,
	`requestId` varchar(80) NOT NULL,
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dms_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dms_document_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`documentId` int NOT NULL,
	`stageNo` int NOT NULL,
	`approvalMode` enum('sequential','parallel') NOT NULL DEFAULT 'sequential',
	`approverUserId` int NOT NULL,
	`status` enum('pending','approved','rejected','returned','cancelled') NOT NULL DEFAULT 'pending',
	`comments` text,
	`decidedAt` timestamp,
	CONSTRAINT `dms_document_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dms_document_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`templateCode` varchar(80) NOT NULL,
	`documentTypeId` int NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`storageKey` varchar(400) NOT NULL,
	`mergeSchemaJson` text,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `dms_document_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `dms_template_version_unique` UNIQUE(`businessEntityId`,`templateCode`,`version`)
);
--> statement-breakpoint
CREATE TABLE `dms_document_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`typeCode` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`defaultClassification` enum('public','internal','confidential','restricted') NOT NULL DEFAULT 'internal',
	`defaultRetentionMonths` int NOT NULL DEFAULT 60,
	`requiresSignature` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `dms_document_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `dms_document_types_typeCode_unique` UNIQUE(`typeCode`)
);
--> statement-breakpoint
CREATE TABLE `dms_document_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`documentId` int NOT NULL,
	`versionNo` int NOT NULL,
	`fileName` varchar(240) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`storageKey` varchar(400) NOT NULL,
	`checksumSha256` varchar(64) NOT NULL,
	`status` enum('draft','review','approved','signed','superseded','archived') NOT NULL DEFAULT 'draft',
	`immutable` boolean NOT NULL DEFAULT false,
	`previousVersionId` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dms_document_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `dms_document_version_unique` UNIQUE(`businessEntityId`,`documentId`,`versionNo`),
	CONSTRAINT `dms_document_hash_unique` UNIQUE(`businessEntityId`,`documentId`,`checksumSha256`)
);
--> statement-breakpoint
CREATE TABLE `dms_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`documentNo` varchar(100) NOT NULL,
	`documentTypeId` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`referenceNo` varchar(120),
	`sourceSystem` varchar(80) NOT NULL,
	`sourceTransactionId` varchar(120),
	`relatedCustomerId` varchar(100),
	`relatedSupplierId` varchar(100),
	`relatedVehicleId` varchar(100),
	`relatedEmployeeId` varchar(100),
	`classification` enum('public','internal','confidential','restricted') NOT NULL DEFAULT 'internal',
	`status` enum('draft','review','approved','signature_pending','signed','superseded','archived','disposed') NOT NULL DEFAULT 'draft',
	`currentVersion` int NOT NULL DEFAULT 1,
	`expiresAt` timestamp,
	`retentionUntil` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dms_documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `dms_document_no_unique` UNIQUE(`businessEntityId`,`documentNo`)
);
--> statement-breakpoint
CREATE TABLE `dms_legal_holds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`documentId` int NOT NULL,
	`reason` text NOT NULL,
	`placedBy` int NOT NULL,
	`placedAt` timestamp NOT NULL DEFAULT (now()),
	`releasedBy` int,
	`releasedAt` timestamp,
	`status` enum('active','released') NOT NULL DEFAULT 'active',
	CONSTRAINT `dms_legal_holds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dms_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`documentId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`permission` enum('view','download','sign') NOT NULL DEFAULT 'view',
	`passwordHash` varchar(120),
	`watermark` boolean NOT NULL DEFAULT true,
	`expiresAt` timestamp NOT NULL,
	`maxUses` int,
	`usedCount` int NOT NULL DEFAULT 0,
	`revokedAt` timestamp,
	`createdBy` int NOT NULL,
	CONSTRAINT `dms_shares_id` PRIMARY KEY(`id`),
	CONSTRAINT `dms_shares_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `signature_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`signatureRequestId` int NOT NULL,
	`signerId` int,
	`eventType` varchar(80) NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	`ipHash` varchar(64),
	`deviceHash` varchar(64),
	`consentEvidence` text,
	`documentChecksum` varchar(64),
	`providerEvidenceId` varchar(180),
	CONSTRAINT `signature_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signature_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`documentId` int NOT NULL,
	`documentVersionId` int NOT NULL,
	`provider` varchar(100),
	`providerRequestId` varchar(180),
	`authenticationMode` enum('email','otp','mfa','provider_managed') NOT NULL DEFAULT 'provider_managed',
	`status` enum('draft','sent','viewed','partially_signed','completed','declined','expired','cancelled') NOT NULL DEFAULT 'draft',
	`expiresAt` timestamp,
	`idempotencyKey` varchar(120) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `signature_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `signature_request_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `signature_signers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`signatureRequestId` int NOT NULL,
	`signingOrder` int NOT NULL,
	`signerName` varchar(180) NOT NULL,
	`signerEmail` varchar(320) NOT NULL,
	`identityReference` varchar(180),
	`status` enum('pending','invited','viewed','signed','declined','expired') NOT NULL DEFAULT 'pending',
	`declineReason` text,
	`signedAt` timestamp,
	CONSTRAINT `signature_signers_id` PRIMARY KEY(`id`)
);
