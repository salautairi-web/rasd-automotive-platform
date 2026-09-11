CREATE TABLE `risk_resilience_exercises_49` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`exerciseType` enum('tabletop','walkthrough','failover','restore','vendor_outage','cyber_incident') NOT NULL,
	`scenario` varchar(220) NOT NULL,
	`planType` enum('bcp','dr') NOT NULL,
	`planId` int NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`result` enum('planned','pass','partial','fail') NOT NULL DEFAULT 'planned',
	`participantsJson` text NOT NULL,
	`evidenceJson` text,
	`observations` text,
	`correctiveActions` text,
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_resilience_exercises_49_id` PRIMARY KEY(`id`)
);
