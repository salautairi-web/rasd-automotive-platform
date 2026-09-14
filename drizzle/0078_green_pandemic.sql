CREATE TABLE `hr_approval_events_63` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` int NOT NULL,
	`stage` varchar(80) NOT NULL,
	`decision` enum('pending','approved','rejected') NOT NULL,
	`note` varchar(1000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_approval_events_63_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_labor_integrations_63` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employeeId` int NOT NULL,
	`workDate` timestamp NOT NULL,
	`projectId` int,
	`jobCardId` int,
	`taskRef` varchar(160),
	`hoursBps` int NOT NULL,
	`laborCostMinor` int NOT NULL,
	`sourceReference` varchar(160) NOT NULL,
	`reconciliationStatus` enum('pending','matched','unmatched') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_labor_integrations_63_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_leave_balances_63` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employeeId` int NOT NULL,
	`leaveType` varchar(80) NOT NULL,
	`year` int NOT NULL,
	`accruedDaysBps` int NOT NULL DEFAULT 0,
	`usedDaysBps` int NOT NULL DEFAULT 0,
	`reservedDaysBps` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_leave_balances_63_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_payroll_controls_63` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`payrollPeriodId` int NOT NULL,
	`controlType` varchar(80) NOT NULL,
	`status` enum('pending','passed','failed') NOT NULL DEFAULT 'pending',
	`expectedMinor` int,
	`actualMinor` int,
	`checksum` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_payroll_controls_63_id` PRIMARY KEY(`id`)
);
