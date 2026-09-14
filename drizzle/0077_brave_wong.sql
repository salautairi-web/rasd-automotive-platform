CREATE TABLE `hr_attendance_63` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employeeId` int NOT NULL,
	`workDate` timestamp NOT NULL,
	`clockIn` timestamp,
	`clockOut` timestamp,
	`source` enum('manual','device','import') NOT NULL DEFAULT 'manual',
	`status` enum('present','late','absent','approved') NOT NULL DEFAULT 'present',
	`approvalStatus` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_attendance_63_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_cost_allocations_63` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employeeId` int NOT NULL,
	`payrollPeriodId` int NOT NULL,
	`projectId` int,
	`workOrderId` int,
	`costCenterRef` varchar(120),
	`amountMinor` int NOT NULL,
	`allocationBps` int NOT NULL,
	`sourceReference` varchar(160) NOT NULL,
	`reconciliationStatus` enum('pending','matched','unmatched') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_cost_allocations_63_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_leave_requests_63` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employeeId` int NOT NULL,
	`leaveType` varchar(80) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`daysBps` int NOT NULL,
	`evidenceKey` varchar(500),
	`status` enum('draft','pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_leave_requests_63_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_overtime_63` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`employeeId` int NOT NULL,
	`workDate` timestamp NOT NULL,
	`hoursBps` int NOT NULL,
	`rateBps` int NOT NULL DEFAULT 12500,
	`amountMinor` int NOT NULL,
	`projectId` int,
	`workOrderId` int,
	`status` enum('draft','pending','approved','rejected','paid') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hr_overtime_63_id` PRIMARY KEY(`id`)
);
