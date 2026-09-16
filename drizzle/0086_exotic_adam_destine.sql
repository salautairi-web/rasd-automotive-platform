CREATE TABLE `approval_matrix_steps_72` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`ruleId` int NOT NULL,
	`stepNo` int NOT NULL,
	`roleKey` varchar(100),
	`approverUserId` int,
	`parallelGroup` varchar(80),
	`requiredCount` int NOT NULL DEFAULT 1,
	`slaMinutes` int NOT NULL DEFAULT 1440,
	`conditionJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_matrix_steps_72_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approval_rule_sets_72` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`ruleKey` varchar(120) NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`module` varchar(80) NOT NULL,
	`transactionType` varchar(80) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','review','approved','active','retired') NOT NULL DEFAULT 'draft',
	`checksum` varchar(64) NOT NULL,
	`createdBy` int NOT NULL,
	`approvedBy` int,
	`activatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_rule_sets_72_id` PRIMARY KEY(`id`),
	CONSTRAINT `approval_rule_set_72_scope_key_unique` UNIQUE(`businessEntityId`,`ruleKey`,`version`)
);
--> statement-breakpoint
CREATE TABLE `approval_rules_72` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`ruleSetId` int NOT NULL,
	`conditionJson` text NOT NULL,
	`approvalMode` enum('sequential','parallel') NOT NULL,
	`quorumRequired` int NOT NULL DEFAULT 1,
	`minAmountMinor` int,
	`maxAmountMinor` int,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_rules_72_id` PRIMARY KEY(`id`)
);
