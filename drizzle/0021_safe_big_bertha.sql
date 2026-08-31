CREATE TABLE `hr_attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employeeId` int NOT NULL,
	`shiftId` int,
	`workDate` varchar(10) NOT NULL,
	`clockIn` timestamp,
	`clockOut` timestamp,
	`lateMinutes` int NOT NULL DEFAULT 0,
	`earlyLeaveMinutes` int NOT NULL DEFAULT 0,
	`overtimeMinutes` int NOT NULL DEFAULT 0,
	`status` enum('present','absent','leave','holiday','incomplete') NOT NULL,
	`source` varchar(60) NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	CONSTRAINT `hr_attendance_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_attendance_day_unique` UNIQUE(`businessEntityId`,`employeeId`,`workDate`),
	CONSTRAINT `hr_attendance_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `hr_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` varchar(100) NOT NULL,
	`requestId` varchar(80) NOT NULL,
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employeeId` int NOT NULL,
	`contractNo` varchar(80) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`contractType` enum('permanent','fixed_term','part_time','temporary') NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`probationEnd` timestamp,
	`basicSalaryMinor` int NOT NULL,
	`allowancesMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`workingHoursWeekly` decimal(6,2) NOT NULL,
	`leaveEntitlementDays` decimal(6,2) NOT NULL,
	`status` enum('draft','active','expired','terminated') NOT NULL DEFAULT 'draft',
	CONSTRAINT `hr_contracts_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_contract_version_unique` UNIQUE(`businessEntityId`,`contractNo`,`version`)
);
--> statement-breakpoint
CREATE TABLE `hr_employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employeeNo` varchar(80) NOT NULL,
	`userId` int,
	`fullNameAr` varchar(220) NOT NULL,
	`email` varchar(320),
	`phone` varchar(40),
	`positionId` int,
	`departmentId` int,
	`branchId` int,
	`costCenterId` int,
	`managerEmployeeId` int,
	`hireDate` timestamp NOT NULL,
	`employmentStatus` enum('active','probation','leave','suspended','terminated') NOT NULL DEFAULT 'active',
	`bankAccountMasked` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_employee_no_unique` UNIQUE(`businessEntityId`,`employeeNo`)
);
--> statement-breakpoint
CREATE TABLE `hr_expense_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employeeId` int NOT NULL,
	`claimNo` varchar(80) NOT NULL,
	`category` varchar(80) NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`costCenterId` int,
	`receiptStorageKey` varchar(300),
	`status` enum('draft','pending','approved','rejected','reimbursed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_expense_claims_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_expense_claim_no_unique` UNIQUE(`businessEntityId`,`claimNo`)
);
--> statement-breakpoint
CREATE TABLE `hr_inter_entity_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerEntityId` int NOT NULL,
	`serviceEntityId` int NOT NULL,
	`employeeId` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`rechargeMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`approvalStatus` enum('pending','approved','rejected','closed') NOT NULL DEFAULT 'pending',
	`correlationId` varchar(80) NOT NULL,
	CONSTRAINT `hr_inter_entity_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_leave_balances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employeeId` int NOT NULL,
	`leaveTypeId` int NOT NULL,
	`year` int NOT NULL,
	`entitledDays` decimal(7,2) NOT NULL,
	`usedDays` decimal(7,2) NOT NULL DEFAULT '0',
	`pendingDays` decimal(7,2) NOT NULL DEFAULT '0',
	CONSTRAINT `hr_leave_balances_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_leave_balance_unique` UNIQUE(`businessEntityId`,`employeeId`,`leaveTypeId`,`year`)
);
--> statement-breakpoint
CREATE TABLE `hr_leave_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employeeId` int NOT NULL,
	`leaveTypeId` int NOT NULL,
	`requestNo` varchar(80) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`days` decimal(7,2) NOT NULL,
	`reason` text,
	`status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`idempotencyKey` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_leave_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_leave_request_no_unique` UNIQUE(`businessEntityId`,`requestNo`),
	CONSTRAINT `hr_leave_request_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `hr_leave_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`leaveCode` varchar(60) NOT NULL,
	`nameAr` varchar(120) NOT NULL,
	`allowNegative` boolean NOT NULL DEFAULT false,
	`paid` boolean NOT NULL DEFAULT true,
	`carryForwardLimit` decimal(6,2) NOT NULL DEFAULT '0',
	CONSTRAINT `hr_leave_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_leave_type_code_unique` UNIQUE(`businessEntityId`,`leaveCode`)
);
--> statement-breakpoint
CREATE TABLE `hr_offboarding` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employeeId` int NOT NULL,
	`reason` varchar(180) NOT NULL,
	`lastWorkingDate` timestamp NOT NULL,
	`assetReturnStatus` enum('pending','complete') NOT NULL DEFAULT 'pending',
	`accessRevocationStatus` enum('pending','requested','complete') NOT NULL DEFAULT 'pending',
	`payrollClosureStatus` enum('pending','complete') NOT NULL DEFAULT 'pending',
	`status` enum('started','clearance','completed','cancelled') NOT NULL DEFAULT 'started',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_offboarding_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_payroll_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`payrollRunId` int NOT NULL,
	`employeeId` int NOT NULL,
	`basicMinor` int NOT NULL,
	`allowancesMinor` int NOT NULL DEFAULT 0,
	`overtimeMinor` int NOT NULL DEFAULT 0,
	`bonusMinor` int NOT NULL DEFAULT 0,
	`deductionsMinor` int NOT NULL DEFAULT 0,
	`netMinor` int NOT NULL,
	CONSTRAINT `hr_payroll_lines_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_payroll_line_employee_unique` UNIQUE(`payrollRunId`,`employeeId`)
);
--> statement-breakpoint
CREATE TABLE `hr_payroll_periods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`paymentDate` timestamp NOT NULL,
	`status` enum('open','processing','approved','posted','closed') NOT NULL DEFAULT 'open',
	CONSTRAINT `hr_payroll_periods_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_payroll_period_unique` UNIQUE(`businessEntityId`,`periodCode`)
);
--> statement-breakpoint
CREATE TABLE `hr_payroll_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`payrollPeriodId` int NOT NULL,
	`runNo` varchar(80) NOT NULL,
	`createdBy` int NOT NULL,
	`approvedBy` int,
	`grossMinor` int NOT NULL DEFAULT 0,
	`deductionsMinor` int NOT NULL DEFAULT 0,
	`netMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`status` enum('draft','calculated','pending_approval','approved','posted','cancelled') NOT NULL DEFAULT 'draft',
	`idempotencyKey` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_payroll_runs_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_payroll_run_no_unique` UNIQUE(`businessEntityId`,`runNo`),
	CONSTRAINT `hr_payroll_run_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `hr_performance_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employeeId` int NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`managerEmployeeId` int,
	`scoreBps` int,
	`goalsJson` text,
	`developmentPlan` text,
	`status` enum('draft','self_review','manager_review','completed') NOT NULL DEFAULT 'draft',
	CONSTRAINT `hr_performance_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_performance_review_unique` UNIQUE(`businessEntityId`,`employeeId`,`periodCode`)
);
--> statement-breakpoint
CREATE TABLE `hr_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyKey` varchar(100) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`policyType` enum('employment','attendance','leave','payroll','recruitment','performance','training','compliance') NOT NULL,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`currentVersion` int NOT NULL DEFAULT 1,
	CONSTRAINT `hr_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_policy_key_unique` UNIQUE(`policyKey`)
);
--> statement-breakpoint
CREATE TABLE `hr_positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`positionCode` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`departmentId` int,
	`grade` varchar(40),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	CONSTRAINT `hr_positions_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_position_code_unique` UNIQUE(`businessEntityId`,`positionCode`)
);
--> statement-breakpoint
CREATE TABLE `hr_shifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`shiftCode` varchar(60) NOT NULL,
	`nameAr` varchar(120) NOT NULL,
	`startTime` varchar(8) NOT NULL,
	`endTime` varchar(8) NOT NULL,
	`graceMinutes` int NOT NULL DEFAULT 0,
	`overtimeRateBps` int NOT NULL DEFAULT 15000,
	CONSTRAINT `hr_shifts_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_shift_code_unique` UNIQUE(`businessEntityId`,`shiftCode`)
);
