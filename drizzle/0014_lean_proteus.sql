CREATE TABLE `import_export_containers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`shipmentId` int NOT NULL,
	`containerNo` varchar(40) NOT NULL,
	`containerType` varchar(40) NOT NULL,
	`sealNo` varchar(40),
	`demurrageMinor` int NOT NULL DEFAULT 0,
	`detentionMinor` int NOT NULL DEFAULT 0,
	CONSTRAINT `import_export_containers_id` PRIMARY KEY(`id`),
	CONSTRAINT `impex_containers_entity_no_unique` UNIQUE(`businessEntityId`,`containerNo`)
);
--> statement-breakpoint
CREATE TABLE `import_export_costs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`shipmentId` int NOT NULL,
	`costType` enum('purchase','freight','insurance','customs','tax','port','broker','inspection','transport','handling','documents','other') NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`allocationMethod` enum('value','weight','quantity','volume','manual') NOT NULL,
	`status` enum('draft','approved','finalized','adjusted') NOT NULL DEFAULT 'draft',
	`sourceReference` varchar(100),
	CONSTRAINT `import_export_costs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_export_customs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`shipmentId` int NOT NULL,
	`declarationNo` varchar(100) NOT NULL,
	`customsValueMinor` int NOT NULL,
	`dutyMinor` int NOT NULL DEFAULT 0,
	`taxMinor` int NOT NULL DEFAULT 0,
	`brokerFeeMinor` int NOT NULL DEFAULT 0,
	`inspectionFeeMinor` int NOT NULL DEFAULT 0,
	`portFeeMinor` int NOT NULL DEFAULT 0,
	`status` enum('draft','submitted','inspection','paid','cleared','rejected') NOT NULL DEFAULT 'draft',
	CONSTRAINT `import_export_customs_id` PRIMARY KEY(`id`),
	CONSTRAINT `impex_customs_entity_declaration_unique` UNIQUE(`businessEntityId`,`declarationNo`)
);
--> statement-breakpoint
CREATE TABLE `import_export_landed_cost_allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`landedCostId` int NOT NULL,
	`shipmentItemId` int NOT NULL,
	`purchaseCostMinor` int NOT NULL,
	`allocatedCostMinor` int NOT NULL,
	`landedCostMinor` int NOT NULL,
	`allocationBasis` int NOT NULL,
	CONSTRAINT `import_export_landed_cost_allocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_export_landed_costs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`shipmentId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`totalPurchaseMinor` int NOT NULL DEFAULT 0,
	`totalAdditionalMinor` int NOT NULL DEFAULT 0,
	`totalLandedMinor` int NOT NULL DEFAULT 0,
	`status` enum('draft','calculated','pending_approval','finalized','superseded') NOT NULL DEFAULT 'draft',
	`finalizedAt` timestamp,
	CONSTRAINT `import_export_landed_costs_id` PRIMARY KEY(`id`),
	CONSTRAINT `impex_landed_entity_shipment_version_unique` UNIQUE(`businessEntityId`,`shipmentId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `import_export_order_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`orderId` int NOT NULL,
	`itemType` enum('vehicle','part','goods') NOT NULL,
	`skuOrVin` varchar(100) NOT NULL,
	`description` varchar(240) NOT NULL,
	`quantity` int NOT NULL,
	`unitPriceMinor` int NOT NULL,
	`weightGrams` int NOT NULL DEFAULT 0,
	`volumeCm3` int NOT NULL DEFAULT 0,
	CONSTRAINT `import_export_order_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_export_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`orderNo` varchar(80) NOT NULL,
	`orderType` enum('import_purchase','export_sale') NOT NULL,
	`partyId` int NOT NULL,
	`incoterm` varchar(20),
	`currency` varchar(8) NOT NULL,
	`totalMinor` int NOT NULL DEFAULT 0,
	`approvalStatus` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft',
	`status` enum('draft','confirmed','shipping','received','closed','cancelled') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `import_export_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `impex_orders_entity_no_unique` UNIQUE(`businessEntityId`,`orderNo`)
);
--> statement-breakpoint
CREATE TABLE `import_export_parties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`partyNo` varchar(80) NOT NULL,
	`partyType` enum('supplier','customer','shipping_agent','customs_broker','forwarder','insurer','port','inspection','transport') NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`countryCode` varchar(3),
	`currency` varchar(8) NOT NULL,
	`status` enum('active','inactive','blocked') NOT NULL DEFAULT 'active',
	CONSTRAINT `import_export_parties_id` PRIMARY KEY(`id`),
	CONSTRAINT `impex_parties_entity_no_unique` UNIQUE(`businessEntityId`,`partyNo`)
);
--> statement-breakpoint
CREATE TABLE `import_export_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`partyId` int NOT NULL,
	`shipmentId` int,
	`paymentType` varchar(60) NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	`paidAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `import_export_payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `impex_payments_entity_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `import_export_shipment_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`shipmentId` int NOT NULL,
	`orderLineId` int NOT NULL,
	`containerId` int,
	`quantity` int NOT NULL,
	`purchaseCostMinor` int NOT NULL,
	`status` enum('planned','loaded','in_transit','arrived','received','transferred') NOT NULL DEFAULT 'planned',
	CONSTRAINT `import_export_shipment_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_export_shipments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`shipmentNo` varchar(80) NOT NULL,
	`shipmentType` enum('import','export') NOT NULL,
	`mode` enum('sea','land','air') NOT NULL,
	`origin` varchar(120) NOT NULL,
	`destination` varchar(120) NOT NULL,
	`portOfLoading` varchar(120),
	`portOfDischarge` varchar(120),
	`etd` timestamp,
	`eta` timestamp,
	`actualDeparture` timestamp,
	`actualArrival` timestamp,
	`carrierPartyId` int,
	`forwarderPartyId` int,
	`trackingNo` varchar(120),
	`status` enum('draft','booked','loaded','in_transit','arrived','customs','cleared','received','closed','cancelled') NOT NULL DEFAULT 'draft',
	`correlationId` varchar(80) NOT NULL,
	CONSTRAINT `import_export_shipments_id` PRIMARY KEY(`id`),
	CONSTRAINT `impex_shipments_entity_no_unique` UNIQUE(`businessEntityId`,`shipmentNo`)
);
--> statement-breakpoint
CREATE TABLE `import_export_inter_entity_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`targetEntityId` int NOT NULL,
	`shipmentId` int NOT NULL,
	`targetSystem` enum('AUTO_SALES','SPARE_PARTS','RENTAL') NOT NULL,
	`transferNo` varchar(80) NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`status` enum('draft','pending_approval','approved','sent','matched','completed','cancelled') NOT NULL DEFAULT 'draft',
	`correlationId` varchar(80) NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	CONSTRAINT `import_export_inter_entity_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `impex_transfers_entity_no_unique` UNIQUE(`businessEntityId`,`transferNo`),
	CONSTRAINT `impex_transfers_entity_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
