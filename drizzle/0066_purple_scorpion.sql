CREATE TABLE `inventory_count_variances_56` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`countId` int NOT NULL,
	`countLineId` int NOT NULL,
	`productId` int NOT NULL,
	`systemQty` decimal(16,3) NOT NULL,
	`countedQty` decimal(16,3) NOT NULL,
	`varianceQty` decimal(16,3) NOT NULL,
	`varianceValueMinor` int NOT NULL,
	`reasonCode` varchar(80),
	`evidenceStorageKey` varchar(300),
	`status` enum('open','under_review','approved','rejected','posted') NOT NULL DEFAULT 'open',
	`requestedBy` int NOT NULL,
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_count_variances_56_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_labels_56` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`productId` int NOT NULL,
	`batchId` int,
	`serialId` int,
	`labelType` enum('barcode','qr') NOT NULL,
	`encodedValue` varchar(240) NOT NULL,
	`labelPayloadJson` text NOT NULL,
	`status` enum('ready','printed','void') NOT NULL DEFAULT 'ready',
	`printedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_labels_56_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_label_56_value_unique` UNIQUE(`businessEntityId`,`encodedValue`)
);
--> statement-breakpoint
CREATE TABLE `inventory_offline_queue_56` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`deviceId` varchar(120) NOT NULL,
	`localOperationId` varchar(160) NOT NULL,
	`operationType` enum('receive','issue','transfer','count') NOT NULL,
	`payloadJson` text NOT NULL,
	`status` enum('queued','syncing','synced','retryable','permanent_failure','conflict') NOT NULL DEFAULT 'queued',
	`attemptCount` int NOT NULL DEFAULT 0,
	`lastError` text,
	`occurredAt` timestamp NOT NULL,
	`syncedAt` timestamp,
	`idempotencyKey` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_offline_queue_56_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_offline_operation_56_unique` UNIQUE(`businessEntityId`,`localOperationId`),
	CONSTRAINT `inventory_offline_key_56_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `inventory_operation_trace_56` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`operationType` enum('receive','issue','transfer','count') NOT NULL,
	`operationId` int NOT NULL,
	`productId` int NOT NULL,
	`batchId` int,
	`serialId` int,
	`batchNo` varchar(100),
	`serialNo` varchar(140),
	`expiryAt` timestamp,
	`quantity` decimal(16,3) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_operation_trace_56_id` PRIMARY KEY(`id`)
);
