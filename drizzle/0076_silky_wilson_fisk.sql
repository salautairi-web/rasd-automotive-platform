CREATE TABLE `hr_compensation_63` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employeeId` int NOT NULL,
	`effectiveDate` timestamp NOT NULL,
	`allowancesMinor` int NOT NULL DEFAULT 0,
	`commissionMinor` int NOT NULL DEFAULT 0,
	`deductionMinor` int NOT NULL DEFAULT 0,
	`bonusMinor` int NOT NULL DEFAULT 0,
	`approvalStatus` enum('draft','pending','approved') NOT NULL DEFAULT 'draft',
	`checksum` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_compensation_63_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_contracts_63` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employeeId` int NOT NULL,
	`contractType` enum('permanent','fixed_term','probation','consultant') NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`baseSalaryMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'OMR',
	`workingHoursBps` int NOT NULL DEFAULT 40000,
	`approvalStatus` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft',
	`checksum` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_contracts_63_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_employees_63` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employeeNo` varchar(80) NOT NULL,
	`personRef` varchar(120) NOT NULL,
	`branchRef` varchar(120),
	`departmentRef` varchar(120),
	`positionRef` varchar(120),
	`managerEmployeeId` int,
	`employmentStatus` enum('active','on_leave','terminated','draft') NOT NULL DEFAULT 'draft',
	`hireDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_employees_63_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_employee_63_entity_no_unique` UNIQUE(`businessEntityId`,`employeeNo`)
);
--> statement-breakpoint
CREATE TABLE `hr_payroll_lines_63` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`payrollPeriodId` int NOT NULL,
	`employeeId` int NOT NULL,
	`grossPayMinor` int NOT NULL,
	`deductionsMinor` int NOT NULL DEFAULT 0,
	`netPayMinor` int NOT NULL,
	`employerCostMinor` int NOT NULL,
	`allocationJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_payroll_lines_63_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_payroll_line_63_period_employee_unique` UNIQUE(`payrollPeriodId`,`employeeId`)
);
--> statement-breakpoint
CREATE TABLE `hr_payroll_periods_63` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`periodCode` varchar(40) NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`status` enum('draft','calculated','locked','approved','posted','closed') NOT NULL DEFAULT 'draft',
	`totalGrossMinor` int NOT NULL DEFAULT 0,
	`totalNetMinor` int NOT NULL DEFAULT 0,
	`totalEmployerCostMinor` int NOT NULL DEFAULT 0,
	`checksum` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_payroll_periods_63_id` PRIMARY KEY(`id`),
	CONSTRAINT `hr_payroll_63_entity_period_unique` UNIQUE(`businessEntityId`,`periodCode`)
);
