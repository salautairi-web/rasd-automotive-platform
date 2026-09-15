CREATE TABLE `procurement_matches_69` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`purchaseOrderId` int NOT NULL,
	`supplierInvoiceId` int,
	`receiptId` int,
	`poAmountMinor` int NOT NULL,
	`receivedAmountMinor` int NOT NULL,
	`invoicedAmountMinor` int NOT NULL,
	`varianceMinor` int NOT NULL,
	`toleranceBps` int NOT NULL DEFAULT 100,
	`status` enum('pending','matched','variance','blocked','approved') NOT NULL DEFAULT 'pending',
	`exceptionReason` varchar(500),
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procurement_matches_69_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `procurement_receipt_exceptions_69` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`purchaseOrderId` int NOT NULL,
	`supplierId` int NOT NULL,
	`exceptionType` enum('shortage','damage','quality','late','document') NOT NULL,
	`quantity` int NOT NULL DEFAULT 0,
	`description` varchar(500) NOT NULL,
	`status` enum('open','under_review','resolved','rejected') NOT NULL DEFAULT 'open',
	`resolution` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procurement_receipt_exceptions_69_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplier_performance_69` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`supplierId` int NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`deliveryScoreBps` int NOT NULL,
	`qualityScoreBps` int NOT NULL,
	`priceScoreBps` int NOT NULL,
	`complianceScoreBps` int NOT NULL,
	`overallScoreBps` int NOT NULL,
	`riskLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
	`sourceReference` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplier_performance_69_id` PRIMARY KEY(`id`)
);
