CREATE TABLE `project_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int,
	`businessEntityId` int,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` int NOT NULL,
	`stage` varchar(80) NOT NULL,
	`decision` enum('pending','approved','rejected','returned') NOT NULL DEFAULT 'pending',
	`approverUserId` int,
	`comment` text,
	`idempotencyKey` varchar(160) NOT NULL,
	`decidedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_approvals_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_approval_idem_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `project_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int,
	`businessEntityId` int,
	`userId` int,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` int,
	`action` varchar(100) NOT NULL,
	`outcome` enum('success','failure','denied') NOT NULL,
	`correlationId` varchar(120) NOT NULL,
	`beforeHash` varchar(128),
	`afterHash` varchar(128),
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_benefits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`benefitType` enum('revenue','cost_saving','capacity','new_customers','asset_value','operational') NOT NULL,
	`expectedMinor` int NOT NULL DEFAULT 0,
	`actualMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL DEFAULT 'OMR',
	`measurementMethod` text,
	`status` enum('planned','measuring','realized','cancelled') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_benefits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`budgetMinor` int NOT NULL DEFAULT 0,
	`committedMinor` int NOT NULL DEFAULT 0,
	`actualMinor` int NOT NULL DEFAULT 0,
	`forecastMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL DEFAULT 'OMR',
	`status` enum('draft','pending_approval','approved','locked') NOT NULL DEFAULT 'draft',
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_budgets_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_budget_version_unique` UNIQUE(`projectId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `project_business_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`objective` text NOT NULL,
	`problemOpportunity` text NOT NULL,
	`investmentMinor` int NOT NULL DEFAULT 0,
	`expectedRevenueMinor` int NOT NULL DEFAULT 0,
	`expectedCostMinor` int NOT NULL DEFAULT 0,
	`expectedReturnMinor` int NOT NULL DEFAULT 0,
	`paybackMonths` int,
	`riskSummary` text,
	`assumptionsJson` text,
	`recommendation` text,
	`approvalStatus` enum('draft','submitted','approved','rejected') NOT NULL DEFAULT 'draft',
	`approvedBy` int,
	`approvedAt` timestamp,
	`version` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_business_cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_capital_allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`sourceEntityId` int,
	`requestedMinor` int NOT NULL DEFAULT 0,
	`approvedMinor` int NOT NULL DEFAULT 0,
	`disbursedMinor` int NOT NULL DEFAULT 0,
	`committedMinor` int NOT NULL DEFAULT 0,
	`remainingMinor` int NOT NULL DEFAULT 0,
	`expectedReturnMinor` int NOT NULL DEFAULT 0,
	`actualReturnMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL DEFAULT 'OMR',
	`status` enum('requested','approved','partially_disbursed','disbursed','reallocated','closed') NOT NULL DEFAULT 'requested',
	`idempotencyKey` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_capital_allocations_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_capital_idem_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `project_changes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`changeCode` varchar(80) NOT NULL,
	`reason` text NOT NULL,
	`scopeImpact` text,
	`timeImpactDays` int NOT NULL DEFAULT 0,
	`costImpactMinor` int NOT NULL DEFAULT 0,
	`riskImpact` text,
	`approvalStatus` enum('draft','submitted','approved','rejected') NOT NULL DEFAULT 'draft',
	`baselineUpdated` boolean NOT NULL DEFAULT false,
	`requestedBy` int,
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_changes_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_change_code_unique` UNIQUE(`projectId`,`changeCode`)
);
--> statement-breakpoint
CREATE TABLE `project_closures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`acceptanceStatus` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`financialCloseStatus` enum('open','closed') NOT NULL DEFAULT 'open',
	`outstandingCommitmentsMinor` int NOT NULL DEFAULT 0,
	`assetHandoverJson` text,
	`documentRefsJson` text,
	`lessonsLearned` text,
	`finalReportRef` varchar(300),
	`reviewStatus` enum('pending','completed','waived') NOT NULL DEFAULT 'pending',
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_closures_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_closures_projectId_unique` UNIQUE(`projectId`)
);
--> statement-breakpoint
CREATE TABLE `project_costs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`costType` enum('direct','labor','material','equipment','external_service','overhead','capitalizable','expense') NOT NULL,
	`sourceSystem` varchar(80) NOT NULL,
	`sourceReference` varchar(160) NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`postedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_costs_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_cost_source_unique` UNIQUE(`businessEntityId`,`sourceSystem`,`sourceReference`)
);
--> statement-breakpoint
CREATE TABLE `project_dependencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`sourceType` enum('task','project','milestone','external') NOT NULL,
	`sourceId` int,
	`targetType` enum('task','project','milestone','external') NOT NULL,
	`targetId` int,
	`dependencyType` enum('finish_to_start','start_to_start','finish_to_finish','start_to_finish') NOT NULL DEFAULT 'finish_to_start',
	`ownerUserId` int,
	`impact` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`resolution` text,
	`status` enum('open','resolved','waived') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_dependencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_gates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`gateNo` int NOT NULL,
	`gateNameAr` varchar(180) NOT NULL,
	`status` enum('pending','submitted','approved','rejected','waived') NOT NULL DEFAULT 'pending',
	`evidenceRefsJson` text,
	`decisionBy` int,
	`decisionAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_gates_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_gate_unique` UNIQUE(`projectId`,`gateNo`)
);
--> statement-breakpoint
CREATE TABLE `project_go_live` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`checklistJson` text NOT NULL,
	`readinessBps` int NOT NULL DEFAULT 0,
	`approvalStatus` enum('draft','ready_for_review','approved','rejected') NOT NULL DEFAULT 'draft',
	`approvedBy` int,
	`approvedAt` timestamp,
	`targetDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_go_live_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_go_live_projectId_unique` UNIQUE(`projectId`)
);
--> statement-breakpoint
CREATE TABLE `project_issues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`issueCode` varchar(80) NOT NULL,
	`titleAr` varchar(220) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`ownerUserId` int,
	`dueDate` timestamp,
	`impact` text,
	`resolution` text,
	`status` enum('open','in_progress','escalated','resolved','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_issues_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_issue_code_unique` UNIQUE(`projectId`,`issueCode`)
);
--> statement-breakpoint
CREATE TABLE `project_milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`workstreamId` int,
	`milestoneCode` varchar(80) NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`ownerUserId` int,
	`dueDate` timestamp,
	`status` enum('planned','in_progress','blocked','completed','approved') NOT NULL DEFAULT 'planned',
	`completionBps` int NOT NULL DEFAULT 0,
	`acceptanceCriteria` text,
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_milestones_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_milestone_code_unique` UNIQUE(`projectId`,`milestoneCode`)
);
--> statement-breakpoint
CREATE TABLE `project_portfolios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`portfolioCode` varchar(80) NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`nameEn` varchar(220),
	`ownerUserId` int,
	`currency` varchar(8) NOT NULL DEFAULT 'OMR',
	`status` enum('draft','active','on_hold','closed') NOT NULL DEFAULT 'draft',
	`strategicTheme` varchar(180),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_portfolios_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_portfolio_code_unique` UNIQUE(`portfolioCode`)
);
--> statement-breakpoint
CREATE TABLE `project_programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`portfolioId` int,
	`programCode` varchar(80) NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`ownerUserId` int,
	`status` enum('draft','active','on_hold','closed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_programs_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_program_code_unique` UNIQUE(`programCode`)
);
--> statement-breakpoint
CREATE TABLE `project_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`resourceType` enum('employee','vehicle','equipment','vendor','budget') NOT NULL,
	`resourceRef` varchar(160) NOT NULL,
	`capacityBps` int NOT NULL DEFAULT 0,
	`allocationBps` int NOT NULL DEFAULT 0,
	`startDate` timestamp,
	`endDate` timestamp,
	`status` enum('planned','allocated','released') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_risks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`riskCode` varchar(80) NOT NULL,
	`titleAr` varchar(220) NOT NULL,
	`probabilityBps` int NOT NULL DEFAULT 0,
	`impactBps` int NOT NULL DEFAULT 0,
	`scoreBps` int NOT NULL DEFAULT 0,
	`ownerUserId` int,
	`mitigation` text,
	`contingency` text,
	`status` enum('open','monitoring','escalated','mitigated','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_risks_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_risk_code_unique` UNIQUE(`projectId`,`riskCode`)
);
--> statement-breakpoint
CREATE TABLE `project_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`workstreamId` int,
	`milestoneId` int,
	`parentTaskId` int,
	`taskCode` varchar(80) NOT NULL,
	`titleAr` varchar(240) NOT NULL,
	`assigneeUserId` int,
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`startDate` timestamp,
	`dueDate` timestamp,
	`status` enum('backlog','planned','in_progress','blocked','review','completed','cancelled') NOT NULL DEFAULT 'backlog',
	`completionBps` int NOT NULL DEFAULT 0,
	`checklistJson` text,
	`evidenceRefsJson` text,
	`comments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_task_code_unique` UNIQUE(`projectId`,`taskCode`)
);
--> statement-breakpoint
CREATE TABLE `project_workstreams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`businessEntityId` int NOT NULL,
	`code` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`ownerUserId` int,
	`status` enum('planned','active','blocked','completed') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_workstreams_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_workstream_code_unique` UNIQUE(`projectId`,`code`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`portfolioId` int,
	`programId` int,
	`projectCode` varchar(80) NOT NULL,
	`nameAr` varchar(240) NOT NULL,
	`nameEn` varchar(240),
	`projectType` enum('new_business_launch','branch_opening','workshop_setup','rental_fleet_expansion','showroom_setup','parts_warehouse','import_export','technology','marketing','capital_investment','operational_improvement') NOT NULL,
	`lifecycle` enum('idea','assessment','business_case','approval','planning','execution','monitoring','go_live','closure','post_implementation_review') NOT NULL DEFAULT 'idea',
	`status` enum('draft','active','on_hold','completed','cancelled') NOT NULL DEFAULT 'draft',
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`ownerUserId` int NOT NULL,
	`sponsorUserId` int,
	`managerUserId` int,
	`branchId` int,
	`locationRef` varchar(160),
	`strategicObjective` text,
	`startDate` timestamp,
	`endDate` timestamp,
	`budgetMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL DEFAULT 'OMR',
	`progressBps` int NOT NULL DEFAULT 0,
	`idempotencyKey` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_entity_code_unique` UNIQUE(`businessEntityId`,`projectCode`),
	CONSTRAINT `project_entity_idem_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
