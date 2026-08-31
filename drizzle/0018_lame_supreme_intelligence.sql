CREATE TABLE `central_bank_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountNo` varchar(80) NOT NULL,
	`bankName` varchar(160) NOT NULL,
	`currency` varchar(8) NOT NULL,
	`ibanMasked` varchar(80),
	`minimumBalanceMinor` int NOT NULL DEFAULT 0,
	`status` enum('active','frozen','closed') NOT NULL DEFAULT 'active',
	CONSTRAINT `central_bank_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_bank_account_no_unique` UNIQUE(`accountNo`)
);
--> statement-breakpoint
CREATE TABLE `central_cash_positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bankAccountId` int NOT NULL,
	`positionDate` timestamp NOT NULL,
	`bookBalanceMinor` int NOT NULL,
	`availableBalanceMinor` int NOT NULL,
	`committedMinor` int NOT NULL DEFAULT 0,
	`sourceWatermark` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `central_cash_positions_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_cash_position_unique` UNIQUE(`bankAccountId`,`positionDate`,`sourceWatermark`)
);
--> statement-breakpoint
CREATE TABLE `central_finance_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountCode` varchar(40) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`accountType` enum('asset','liability','equity','revenue','expense') NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	CONSTRAINT `central_finance_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_finance_account_code_unique` UNIQUE(`accountCode`)
);
--> statement-breakpoint
CREATE TABLE `central_finance_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessEntityId` int,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` varchar(100) NOT NULL,
	`amountMinor` int,
	`currency` varchar(8),
	`requestId` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `central_finance_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `central_finance_mappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`localAccountCode` varchar(80) NOT NULL,
	`centralAccountId` int NOT NULL,
	`version` int NOT NULL,
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	CONSTRAINT `central_finance_mappings_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_finance_mapping_unique` UNIQUE(`businessEntityId`,`localAccountCode`,`version`)
);
--> statement-breakpoint
CREATE TABLE `central_finance_reconciliations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reconciliationType` enum('bank','inter_entity','ar_ap','cash') NOT NULL,
	`businessEntityId` int,
	`periodCode` varchar(20) NOT NULL,
	`bookAmountMinor` int NOT NULL,
	`counterpartyAmountMinor` int NOT NULL,
	`differenceMinor` int NOT NULL,
	`status` enum('open','matched','difference','approved','closed') NOT NULL DEFAULT 'open',
	`checkerUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `central_finance_reconciliations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `central_funding_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestNo` varchar(80) NOT NULL,
	`businessEntityId` int NOT NULL,
	`fundingType` enum('capital','loan','operating','project','emergency') NOT NULL,
	`purpose` text NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`priority` enum('normal','high','urgent') NOT NULL DEFAULT 'normal',
	`status` enum('draft','pending','approved','rejected','funded','cancelled') NOT NULL DEFAULT 'pending',
	`requestedBy` int NOT NULL,
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `central_funding_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_funding_request_no_unique` UNIQUE(`requestNo`)
);
--> statement-breakpoint
CREATE TABLE `central_investment_cashflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`investmentId` int NOT NULL,
	`flowType` enum('contribution','additional_funding','distribution','expense','exit_proceeds') NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`occurredAt` timestamp NOT NULL,
	`sourceEventId` varchar(80) NOT NULL,
	CONSTRAINT `central_investment_cashflows_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_investment_cashflow_event_unique` UNIQUE(`sourceEventId`)
);
--> statement-breakpoint
CREATE TABLE `central_investments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`investmentNo` varchar(80) NOT NULL,
	`businessEntityId` int NOT NULL,
	`investmentType` varchar(80) NOT NULL,
	`capitalInvestedMinor` int NOT NULL DEFAULT 0,
	`committedCapitalMinor` int NOT NULL DEFAULT 0,
	`distributionsMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`expectedReturnBps` int,
	`riskLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('opportunity','due_diligence','pending_approval','approved','active','exited','closed') NOT NULL DEFAULT 'opportunity',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `central_investments_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_investment_no_unique` UNIQUE(`investmentNo`)
);
--> statement-breakpoint
CREATE TABLE `central_payment_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestNo` varchar(80) NOT NULL,
	`requestingEntityId` int,
	`beneficiary` varchar(220) NOT NULL,
	`purpose` text NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`makerUserId` int NOT NULL,
	`checkerUserId` int,
	`idempotencyKey` varchar(120) NOT NULL,
	`status` enum('draft','pending_approval','approved','rejected','executed','reconciled','cancelled') NOT NULL DEFAULT 'pending_approval',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	`executedAt` timestamp,
	CONSTRAINT `central_payment_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_payment_request_no_unique` UNIQUE(`requestNo`),
	CONSTRAINT `central_payment_request_key_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `central_period_closes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`scopeType` enum('entity','central','consolidated') NOT NULL,
	`businessEntityId` int,
	`checklistJson` text NOT NULL,
	`status` enum('open','in_review','closed','reopened') NOT NULL DEFAULT 'open',
	`closedBy` int,
	`closedAt` timestamp,
	CONSTRAINT `central_period_closes_id` PRIMARY KEY(`id`),
	CONSTRAINT `central_period_close_unique` UNIQUE(`periodCode`,`scopeType`,`businessEntityId`)
);
