CREATE TABLE `hr_benefits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employmentId` int NOT NULL,
	`benefitCode` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`provider` varchar(180),
	`employerCostMinor` int NOT NULL DEFAULT 0,
	`employeeCostMinor` int NOT NULL DEFAULT 0,
	`eligibleFrom` timestamp NOT NULL,
	`eligibleTo` timestamp,
	`status` enum('pending','active','suspended','ended') NOT NULL DEFAULT 'pending',
	CONSTRAINT `hr_benefits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employmentId` int NOT NULL,
	`caseNo` varchar(80) NOT NULL,
	`caseType` enum('grievance','disciplinary','investigation','accommodation','other') NOT NULL,
	`classification` enum('restricted','highly_restricted') NOT NULL DEFAULT 'highly_restricted',
	`summary` text,
	`status` enum('open','investigating','decision','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_cases_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_case_no_unique` UNIQUE(`businessEntityId`,`caseNo`)
);
--> statement-breakpoint
CREATE TABLE `hr_cost_allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employmentId` int NOT NULL,
	`costCenterId` int,
	`projectId` int,
	`activityCode` varchar(80),
	`allocationBasis` enum('percentage','hours','amount') NOT NULL,
	`allocationValue` decimal(9,4) NOT NULL,
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	`approvalStatus` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft',
	CONSTRAINT `hr_cost_allocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_employee_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employmentId` int NOT NULL,
	`documentId` int,
	`documentType` enum('contract','identity','permit','certificate','policy','performance','other') NOT NULL,
	`classification` enum('restricted','confidential','internal') NOT NULL DEFAULT 'restricted',
	`expiresAt` timestamp,
	`status` enum('active','expired','revoked') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_employee_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_employments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`personId` int NOT NULL,
	`employmentNo` varchar(80) NOT NULL,
	`positionId` int,
	`organizationUnitId` int,
	`branchId` int,
	`managerEmployeeId` int,
	`employmentType` enum('permanent','fixed_term','part_time','temporary','contractor') NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`status` enum('recruitment','onboarding','probation','active','leave','suspended','terminated') NOT NULL DEFAULT 'recruitment',
	`primaryCostCenterId` int,
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_employments_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_employment_no_unique` UNIQUE(`businessEntityId`,`employmentNo`)
);
--> statement-breakpoint
CREATE TABLE `hr_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employmentId` int NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`titleAr` varchar(220) NOT NULL,
	`targetValue` decimal(12,4),
	`achievedValue` decimal(12,4),
	`status` enum('draft','active','completed','cancelled') NOT NULL DEFAULT 'draft',
	CONSTRAINT `hr_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_onboarding` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employmentId` int NOT NULL,
	`checklistJson` text,
	`accountProvisioningStatus` enum('pending','requested','complete','blocked') NOT NULL DEFAULT 'pending',
	`equipmentStatus` enum('pending','assigned','complete') NOT NULL DEFAULT 'pending',
	`trainingStatus` enum('pending','scheduled','complete') NOT NULL DEFAULT 'pending',
	`probationReviewDate` timestamp,
	`status` enum('open','in_progress','complete','cancelled') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_onboarding_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_organization_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`unitCode` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`unitType` enum('company','branch','department','team','cost_center') NOT NULL,
	`parentUnitId` int,
	`managerEmployeeId` int,
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	CONSTRAINT `hr_organization_units_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_org_unit_code_unique` UNIQUE(`businessEntityId`,`unitCode`)
);
--> statement-breakpoint
CREATE TABLE `hr_payroll_components` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employmentId` int NOT NULL,
	`componentCode` varchar(80) NOT NULL,
	`componentType` enum('allowance','deduction','bonus','overtime','employer_contribution','benefit') NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	`approvalStatus` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft',
	CONSTRAINT `hr_payroll_components_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_people` (
	`id` int AUTO_INCREMENT NOT NULL,
	`globalIdentityRef` varchar(120),
	`personNo` varchar(80) NOT NULL,
	`fullNameAr` varchar(220) NOT NULL,
	`fullNameEn` varchar(220),
	`nationalIdMasked` varchar(120),
	`dateOfBirth` timestamp,
	`gender` enum('female','male','unspecified'),
	`email` varchar(320),
	`phone` varchar(40),
	`emergencyContactJson` text,
	`piiClass` enum('restricted','confidential','internal') NOT NULL DEFAULT 'restricted',
	`status` enum('active','inactive','deceased') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_people_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_person_no_unique` UNIQUE(`personNo`)
);
--> statement-breakpoint
CREATE TABLE `hr_recruitment_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`requestNo` varchar(80) NOT NULL,
	`positionId` int,
	`requestedBy` int NOT NULL,
	`headcount` int NOT NULL DEFAULT 1,
	`reason` text,
	`status` enum('draft','pending_approval','approved','rejected','closed') NOT NULL DEFAULT 'draft',
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_recruitment_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_recruitment_request_no_unique` UNIQUE(`businessEntityId`,`requestNo`)
);
--> statement-breakpoint
CREATE TABLE `hr_skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employmentId` int NOT NULL,
	`skillCode` varchar(80) NOT NULL,
	`skillNameAr` varchar(180) NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`verified` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp,
	CONSTRAINT `hr_skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_training_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employmentId` int NOT NULL,
	`courseNameAr` varchar(220) NOT NULL,
	`provider` varchar(180),
	`costMinor` int NOT NULL DEFAULT 0,
	`attendedAt` timestamp,
	`certificationNo` varchar(120),
	`expiresAt` timestamp,
	`status` enum('planned','enrolled','completed','expired') NOT NULL DEFAULT 'planned',
	CONSTRAINT `hr_training_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_workforce_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`planCode` varchar(80) NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`plannedHeadcount` int NOT NULL DEFAULT 0,
	`salaryBudgetMinor` int NOT NULL DEFAULT 0,
	`overtimeBudgetMinor` int NOT NULL DEFAULT 0,
	`benefitsBudgetMinor` int NOT NULL DEFAULT 0,
	`status` enum('draft','submitted','approved','closed') NOT NULL DEFAULT 'draft',
	CONSTRAINT `hr_workforce_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_workforce_plan_unique` UNIQUE(`businessEntityId`,`planCode`)
);
