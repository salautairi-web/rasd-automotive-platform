CREATE TABLE `mdm_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`userId` int,
	`domainType` varchar(80) NOT NULL,
	`resourceId` int,
	`action` varchar(100) NOT NULL,
	`outcome` enum('success','failure','denied') NOT NULL,
	`beforeHash` varchar(128),
	`afterHash` varchar(128),
	`correlationId` varchar(120) NOT NULL,
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mdm_change_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`domainType` varchar(80) NOT NULL,
	`recordId` int NOT NULL,
	`fieldName` varchar(120) NOT NULL,
	`oldValue` text,
	`newValue` text,
	`reason` text NOT NULL,
	`requesterUserId` int NOT NULL,
	`approverUserId` int,
	`effectiveDate` timestamp,
	`status` enum('draft','submitted','approved','rejected','applied','cancelled') NOT NULL DEFAULT 'draft',
	`idempotencyKey` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_change_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `mdm_change_request_idem_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `mdm_conflicts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`syncRunId` int,
	`domainType` varchar(80) NOT NULL,
	`recordId` int,
	`sourceOfTruth` varchar(160) NOT NULL,
	`conflictingSource` varchar(160) NOT NULL,
	`resolutionRule` enum('source_of_truth','latest_approved','entity_owned','manual_review') NOT NULL,
	`status` enum('open','resolved','waived') NOT NULL DEFAULT 'open',
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_conflicts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mdm_customer_identities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`globalReferenceId` int NOT NULL,
	`identityHash` varchar(128) NOT NULL,
	`identityType` enum('person','company','government') NOT NULL,
	`canonicalNameAr` varchar(220) NOT NULL,
	`status` enum('draft','active','inactive','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_customer_identities_id` PRIMARY KEY(`id`),
	CONSTRAINT `mdm_customer_identities_globalReferenceId_unique` UNIQUE(`globalReferenceId`)
);
--> statement-breakpoint
CREATE TABLE `mdm_duplicate_candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`domainType` varchar(80) NOT NULL,
	`leftRecordId` int NOT NULL,
	`rightRecordId` int NOT NULL,
	`confidenceBps` int NOT NULL DEFAULT 0,
	`matchReasonJson` text,
	`status` enum('open','reviewing','merged','rejected','blocked') NOT NULL DEFAULT 'open',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_duplicate_candidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mdm_employee_identities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`globalReferenceId` int NOT NULL,
	`identityHash` varchar(128) NOT NULL,
	`displayNameAr` varchar(220) NOT NULL,
	`classification` enum('confidential','restricted','highly_restricted') NOT NULL DEFAULT 'confidential',
	`status` enum('draft','active','inactive','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_employee_identities_id` PRIMARY KEY(`id`),
	CONSTRAINT `mdm_employee_identities_globalReferenceId_unique` UNIQUE(`globalReferenceId`)
);
--> statement-breakpoint
CREATE TABLE `mdm_entity_customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`globalReferenceId` int,
	`localCustomerId` int,
	`localCode` varchar(100) NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`customerType` varchar(60),
	`creditTermsJson` text,
	`balanceMinor` int NOT NULL DEFAULT 0,
	`status` enum('draft','active','inactive','archived') NOT NULL DEFAULT 'draft',
	`sourceOfTruth` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_entity_customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `mdm_entity_customer_code_unique` UNIQUE(`businessEntityId`,`localCode`)
);
--> statement-breakpoint
CREATE TABLE `mdm_entity_employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`globalReferenceId` int,
	`localEmployeeId` int,
	`employeeCode` varchar(100) NOT NULL,
	`branchId` int,
	`departmentId` int,
	`roleKey` varchar(120),
	`compensationJson` text,
	`status` enum('draft','active','inactive','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_entity_employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `mdm_entity_employee_code_unique` UNIQUE(`businessEntityId`,`employeeCode`)
);
--> statement-breakpoint
CREATE TABLE `mdm_entity_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`globalReferenceId` int,
	`localProductId` int,
	`localSku` varchar(100) NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`localPriceMinor` int NOT NULL DEFAULT 0,
	`localCostMinor` int NOT NULL DEFAULT 0,
	`localStockQty` int NOT NULL DEFAULT 0,
	`taxCode` varchar(60),
	`reorderRulesJson` text,
	`status` enum('draft','active','inactive','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_entity_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `mdm_entity_product_sku_unique` UNIQUE(`businessEntityId`,`localSku`)
);
--> statement-breakpoint
CREATE TABLE `mdm_entity_suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`globalReferenceId` int,
	`localSupplierId` int,
	`localCode` varchar(100) NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`termsJson` text,
	`riskScoreBps` int NOT NULL DEFAULT 0,
	`balanceMinor` int NOT NULL DEFAULT 0,
	`status` enum('draft','active','inactive','archived') NOT NULL DEFAULT 'draft',
	`sourceOfTruth` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_entity_suppliers_id` PRIMARY KEY(`id`),
	CONSTRAINT `mdm_entity_supplier_code_unique` UNIQUE(`businessEntityId`,`localCode`)
);
--> statement-breakpoint
CREATE TABLE `mdm_entity_vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`globalReferenceId` int,
	`localVehicleId` int,
	`localCode` varchar(100) NOT NULL,
	`vinMasked` varchar(80),
	`ownershipType` varchar(60),
	`operationalStatus` varchar(60),
	`classification` varchar(60),
	`status` enum('draft','active','inactive','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_entity_vehicles_id` PRIMARY KEY(`id`),
	CONSTRAINT `mdm_entity_vehicle_code_unique` UNIQUE(`businessEntityId`,`localCode`)
);
--> statement-breakpoint
CREATE TABLE `mdm_global_references` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referenceType` varchar(60) NOT NULL,
	`referenceKey` varchar(160) NOT NULL,
	`displayNameAr` varchar(220) NOT NULL,
	`status` enum('draft','active','inactive','archived') NOT NULL DEFAULT 'draft',
	`classification` enum('public','internal','confidential','restricted','highly_restricted') NOT NULL DEFAULT 'internal',
	`ownerUserId` int,
	`sourceOfTruth` varchar(160) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_global_references_id` PRIMARY KEY(`id`),
	CONSTRAINT `mdm_global_reference_key_unique` UNIQUE(`referenceType`,`referenceKey`)
);
--> statement-breakpoint
CREATE TABLE `mdm_lineage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`domainType` varchar(80) NOT NULL,
	`recordId` int,
	`originSystem` varchar(120) NOT NULL,
	`transformationJson` text,
	`mappingId` int,
	`consumerSystem` varchar(120),
	`version` int NOT NULL DEFAULT 1,
	`ownerUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_lineage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mdm_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`parentId` int,
	`locationType` enum('country','region','city','branch','warehouse','workshop','showroom','yard') NOT NULL,
	`code` varchar(100) NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`gpsJson` text,
	`status` enum('draft','active','inactive','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_locations_id` PRIMARY KEY(`id`),
	CONSTRAINT `mdm_location_scope_code_unique` UNIQUE(`businessEntityId`,`code`)
);
--> statement-breakpoint
CREATE TABLE `mdm_mappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`domainType` varchar(80) NOT NULL,
	`localRecordId` int NOT NULL,
	`globalReferenceId` int NOT NULL,
	`mappingType` enum('exact','fuzzy_confirmed','manual') NOT NULL,
	`confidenceBps` int NOT NULL DEFAULT 0,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('active','revoked','superseded') NOT NULL DEFAULT 'active',
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_mappings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mdm_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyKey` varchar(120) NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`domainType` varchar(80) NOT NULL,
	`rulesJson` text NOT NULL,
	`classification` enum('public','internal','confidential','restricted','highly_restricted') NOT NULL DEFAULT 'internal',
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`version` int NOT NULL DEFAULT 1,
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `mdm_policies_policyKey_unique` UNIQUE(`policyKey`)
);
--> statement-breakpoint
CREATE TABLE `mdm_product_references` (
	`id` int AUTO_INCREMENT NOT NULL,
	`globalReferenceId` int NOT NULL,
	`sku` varchar(100),
	`oem` varchar(100),
	`mpn` varchar(100),
	`canonicalNameAr` varchar(220) NOT NULL,
	`status` enum('draft','active','inactive','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_product_references_id` PRIMARY KEY(`id`),
	CONSTRAINT `mdm_product_references_globalReferenceId_unique` UNIQUE(`globalReferenceId`)
);
--> statement-breakpoint
CREATE TABLE `mdm_quality_issues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`domainType` varchar(80) NOT NULL,
	`recordId` int,
	`ruleKey` varchar(120) NOT NULL,
	`dimension` enum('completeness','accuracy','validity','consistency','uniqueness','timeliness') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`scoreBps` int NOT NULL DEFAULT 0,
	`detailsJson` text,
	`status` enum('open','assigned','resolved','waived') NOT NULL DEFAULT 'open',
	`ownerUserId` int,
	`dueAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_quality_issues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mdm_reference_values` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referenceType` varchar(80) NOT NULL,
	`valueKey` varchar(100) NOT NULL,
	`labelAr` varchar(220) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','active','inactive','retired') NOT NULL DEFAULT 'draft',
	`validFrom` timestamp,
	`validTo` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_reference_values_id` PRIMARY KEY(`id`),
	CONSTRAINT `mdm_reference_value_unique` UNIQUE(`referenceType`,`valueKey`,`version`)
);
--> statement-breakpoint
CREATE TABLE `mdm_supplier_identities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`globalReferenceId` int NOT NULL,
	`identityHash` varchar(128) NOT NULL,
	`canonicalNameAr` varchar(220) NOT NULL,
	`status` enum('draft','active','inactive','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_supplier_identities_id` PRIMARY KEY(`id`),
	CONSTRAINT `mdm_supplier_identities_globalReferenceId_unique` UNIQUE(`globalReferenceId`)
);
--> statement-breakpoint
CREATE TABLE `mdm_sync_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`sourceSystem` varchar(120) NOT NULL,
	`targetSystem` varchar(120) NOT NULL,
	`method` enum('api','event','batch') NOT NULL,
	`status` enum('queued','running','completed','conflict','failed','dead_letter') NOT NULL DEFAULT 'queued',
	`recordCount` int NOT NULL DEFAULT 0,
	`retryCount` int NOT NULL DEFAULT 0,
	`conflictCount` int NOT NULL DEFAULT 0,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_sync_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mdm_vehicle_references` (
	`id` int AUTO_INCREMENT NOT NULL,
	`globalReferenceId` int NOT NULL,
	`vinHash` varchar(128),
	`make` varchar(100) NOT NULL,
	`model` varchar(100) NOT NULL,
	`modelYear` int,
	`status` enum('draft','active','inactive','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mdm_vehicle_references_id` PRIMARY KEY(`id`),
	CONSTRAINT `mdm_vehicle_references_globalReferenceId_unique` UNIQUE(`globalReferenceId`)
);
