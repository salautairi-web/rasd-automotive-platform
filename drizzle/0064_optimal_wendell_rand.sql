CREATE TABLE `procurement_po_changes_55` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`purchaseOrderId` int NOT NULL,
	`revision` int NOT NULL,
	`reason` text NOT NULL,
	`impactJson` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`requestedBy` int NOT NULL,
	`decidedBy` int,
	`decidedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procurement_po_changes_55_id` PRIMARY KEY(`id`),
	CONSTRAINT `procurement_po_change_revision_55` UNIQUE(`businessEntityId`,`purchaseOrderId`,`revision`)
);
--> statement-breakpoint
CREATE TABLE `procurement_supplier_change_requests_55` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`supplierId` int NOT NULL,
	`changeType` enum('bank','identity','terms','risk') NOT NULL,
	`proposedValueMasked` text NOT NULL,
	`reason` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`requestedBy` int NOT NULL,
	`decidedBy` int,
	`decidedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procurement_supplier_change_requests_55_id` PRIMARY KEY(`id`)
);
