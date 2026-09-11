CREATE TABLE `treasury_account_controls_48` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`accountType` enum('bank','cash') NOT NULL,
	`accountId` int NOT NULL,
	`dailyLimitMinor` int NOT NULL DEFAULT 0,
	`singleLimitMinor` int NOT NULL DEFAULT 0,
	`dualApprovalRequired` boolean NOT NULL DEFAULT true,
	`stepUpRequired` boolean NOT NULL DEFAULT true,
	`status` enum('active','suspended') NOT NULL DEFAULT 'active',
	`effectiveAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_account_controls_48_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasury_liquidity_scenarios_48` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`nameAr` varchar(160) NOT NULL,
	`horizonDays` int NOT NULL,
	`scenarioType` enum('base','optimistic','conservative','stress') NOT NULL,
	`openingCashMinor` int NOT NULL,
	`expectedInflowsMinor` int NOT NULL DEFAULT 0,
	`expectedOutflowsMinor` int NOT NULL DEFAULT 0,
	`committedOutflowsMinor` int NOT NULL DEFAULT 0,
	`minimumCashMinor` int NOT NULL DEFAULT 0,
	`projectedClosingMinor` int NOT NULL,
	`assumptionsJson` text,
	`status` enum('draft','reviewed','approved','archived') NOT NULL DEFAULT 'draft',
	`version` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_liquidity_scenarios_48_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasury_transfer_approvals_48` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`transferId` int NOT NULL,
	`stage` int NOT NULL DEFAULT 1,
	`approverUserId` int,
	`decision` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`stepUpVerified` boolean NOT NULL DEFAULT false,
	`decidedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_transfer_approvals_48_id` PRIMARY KEY(`id`)
);
