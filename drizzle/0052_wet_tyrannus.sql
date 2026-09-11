CREATE TABLE `payment_collection_activities_47` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`invoiceId` int NOT NULL,
	`activityType` enum('reminder','call','email','promise_to_pay','escalation','note') NOT NULL,
	`status` enum('planned','completed','cancelled') NOT NULL DEFAULT 'planned',
	`ownerUserId` int,
	`notes` text,
	`dueAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_collection_activities_47_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_gateway_events_47` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`providerKey` varchar(100) NOT NULL,
	`eventRef` varchar(180) NOT NULL,
	`eventType` varchar(120) NOT NULL,
	`signatureVerified` boolean NOT NULL DEFAULT false,
	`replayDetected` boolean NOT NULL DEFAULT false,
	`payloadRedactedJson` text,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_gateway_events_47_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_gateway_event_47_ref_unique` UNIQUE(`businessEntityId`,`providerKey`,`eventRef`)
);
--> statement-breakpoint
CREATE TABLE `payment_intents_47` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`invoiceId` int,
	`providerKey` varchar(100) NOT NULL,
	`intentRef` varchar(160) NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`paymentMethodType` enum('cash','bank_transfer','card','wallet','gateway') NOT NULL,
	`status` enum('created','requires_action','authorized','captured','failed','cancelled','expired','partially_refunded','refunded','chargeback') NOT NULL DEFAULT 'created',
	`idempotencyKey` varchar(180) NOT NULL,
	`maskedReference` varchar(120),
	`failureCode` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`capturedAt` timestamp,
	`expiredAt` timestamp,
	CONSTRAINT `payment_intents_47_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_intent_47_idem_unique` UNIQUE(`businessEntityId`,`idempotencyKey`),
	CONSTRAINT `payment_intent_47_provider_ref_unique` UNIQUE(`providerKey`,`intentRef`)
);
--> statement-breakpoint
CREATE TABLE `payment_invoices_47` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`sourceSystem` varchar(100) NOT NULL,
	`sourceRecordId` varchar(120) NOT NULL,
	`invoiceNo` varchar(100) NOT NULL,
	`customerRef` varchar(160),
	`amountMinor` int NOT NULL,
	`paidAmountMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`dueAt` timestamp,
	`status` enum('issued','partially_paid','paid','overdue','cancelled','disputed') NOT NULL DEFAULT 'issued',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_invoices_47_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_invoice_47_source_unique` UNIQUE(`businessEntityId`,`sourceSystem`,`sourceRecordId`),
	CONSTRAINT `payment_invoice_47_no_unique` UNIQUE(`businessEntityId`,`invoiceNo`)
);
--> statement-breakpoint
CREATE TABLE `payment_refunds_47` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`intentId` int NOT NULL,
	`refundRef` varchar(160) NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`reason` varchar(240) NOT NULL,
	`status` enum('requested','approved','submitted','succeeded','failed','cancelled') NOT NULL DEFAULT 'requested',
	`idempotencyKey` varchar(180) NOT NULL,
	`requestedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_refunds_47_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_refund_47_idem_unique` UNIQUE(`businessEntityId`,`idempotencyKey`),
	CONSTRAINT `payment_refund_47_ref_unique` UNIQUE(`businessEntityId`,`refundRef`)
);
--> statement-breakpoint
CREATE TABLE `payment_settlements_47` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`providerKey` varchar(100) NOT NULL,
	`settlementRef` varchar(160) NOT NULL,
	`settlementDate` timestamp NOT NULL,
	`grossAmountMinor` int NOT NULL,
	`feeAmountMinor` int NOT NULL DEFAULT 0,
	`netAmountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`status` enum('imported','matched','partially_matched','exception','approved') NOT NULL DEFAULT 'imported',
	`reconciliationRef` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_settlements_47_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_settlement_47_ref_unique` UNIQUE(`businessEntityId`,`providerKey`,`settlementRef`)
);
