CREATE TABLE `communication_dead_letters_54` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`messageId` int NOT NULL,
	`lastAttemptId` int,
	`reason` text NOT NULL,
	`retryable` boolean NOT NULL DEFAULT false,
	`replayedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_dead_letters_54_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communication_events_54` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`eventKey` varchar(180) NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`sourceRef` varchar(180) NOT NULL,
	`payloadHash` varchar(64) NOT NULL,
	`processedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_events_54_id` PRIMARY KEY(`id`),
	CONSTRAINT `communication_event_entity_key_54` UNIQUE(`businessEntityId`,`eventKey`)
);
--> statement-breakpoint
CREATE TABLE `communication_metrics_54` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`channelKey` varchar(40) NOT NULL,
	`metricDate` timestamp NOT NULL,
	`queuedCount` int NOT NULL DEFAULT 0,
	`deliveredCount` int NOT NULL DEFAULT 0,
	`failedCount` int NOT NULL DEFAULT 0,
	`unsubscribedCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_metrics_54_id` PRIMARY KEY(`id`),
	CONSTRAINT `communication_metric_entity_channel_date_54` UNIQUE(`businessEntityId`,`channelKey`,`metricDate`)
);
