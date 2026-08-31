CREATE TABLE `sales_quotation_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`quotationId` int NOT NULL,
	`requestedBy` int,
	`approvedBy` int,
	`thresholdRateBps` int NOT NULL,
	`discountMinor` int NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`decisionNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`decidedAt` timestamp,
	CONSTRAINT `sales_quotation_approvals_id` PRIMARY KEY(`id`)
);
