CREATE TABLE `entity_procurement_suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`supplierNo` varchar(80) NOT NULL,
	`legalName` varchar(220) NOT NULL,
	`country` varchar(80),
	`registrationNo` varchar(100),
	`taxNo` varchar(100),
	`category` varchar(100) NOT NULL,
	`paymentTermsDays` int NOT NULL DEFAULT 0,
	`bankAccountMasked` varchar(100),
	`complianceStatus` enum('pending','compliant','conditional','blocked') NOT NULL DEFAULT 'pending',
	`riskRating` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`qualificationStatus` enum('draft','under_review','qualified','rejected','suspended','expired') NOT NULL DEFAULT 'draft',
	`status` enum('active','inactive','blocked') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entity_procurement_suppliers_id` PRIMARY KEY(`id`),
	CONSTRAINT `entity_procurement_supplier_no_unique` UNIQUE(`businessEntityId`,`supplierNo`)
);
--> statement-breakpoint
CREATE TABLE `procurement_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`resourceType` enum('purchase_request','rfq_award','purchase_order','invoice','bank_change','over_budget') NOT NULL,
	`resourceId` int NOT NULL,
	`stage` int NOT NULL DEFAULT 1,
	`approverUserId` int,
	`approverRoleKey` varchar(80),
	`limitMinor` int,
	`decision` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`comment` text,
	`decidedAt` timestamp,
	CONSTRAINT `procurement_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `procurement_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` varchar(100) NOT NULL,
	`requestId` varchar(80) NOT NULL,
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procurement_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `procurement_goods_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`purchaseOrderId` int NOT NULL,
	`receiptNo` varchar(80) NOT NULL,
	`receiptType` enum('goods','service') NOT NULL,
	`acceptedQuantity` decimal(16,4) NOT NULL,
	`rejectedQuantity` decimal(16,4) NOT NULL DEFAULT '0',
	`inspectionStatus` enum('pending','accepted','partially_accepted','rejected') NOT NULL DEFAULT 'pending',
	`receivedBy` int NOT NULL,
	`receivedAt` timestamp NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	CONSTRAINT `procurement_goods_receipts_id` PRIMARY KEY(`id`),
	CONSTRAINT `procurement_receipt_no_unique` UNIQUE(`businessEntityId`,`receiptNo`),
	CONSTRAINT `procurement_receipt_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `procurement_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyKey` varchar(100) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`policyType` enum('approval','competitive_quote','preferred_supplier','emergency','due_diligence','budget','fraud') NOT NULL,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`currentVersion` int NOT NULL DEFAULT 1,
	CONSTRAINT `procurement_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `procurement_policy_key_unique` UNIQUE(`policyKey`)
);
--> statement-breakpoint
CREATE TABLE `procurement_policy_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyId` int NOT NULL,
	`version` int NOT NULL,
	`rulesJson` text NOT NULL,
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procurement_policy_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `procurement_policy_version_unique` UNIQUE(`policyId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `procurement_purchase_order_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`purchaseOrderId` int NOT NULL,
	`lineNo` int NOT NULL,
	`description` varchar(240) NOT NULL,
	`quantity` decimal(16,4) NOT NULL,
	`receivedQuantity` decimal(16,4) NOT NULL DEFAULT '0',
	`unitPriceMinor` int NOT NULL,
	`taxMinor` int NOT NULL DEFAULT 0,
	`lineTotalMinor` int NOT NULL,
	CONSTRAINT `procurement_purchase_order_lines_id` PRIMARY KEY(`id`),
	CONSTRAINT `procurement_po_line_unique` UNIQUE(`purchaseOrderId`,`lineNo`)
);
--> statement-breakpoint
CREATE TABLE `procurement_purchase_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`supplierId` int NOT NULL,
	`purchaseRequestId` int,
	`rfqResponseId` int,
	`poNo` varchar(80) NOT NULL,
	`revision` int NOT NULL DEFAULT 1,
	`currency` varchar(8) NOT NULL,
	`subtotalMinor` int NOT NULL,
	`discountMinor` int NOT NULL DEFAULT 0,
	`taxMinor` int NOT NULL DEFAULT 0,
	`totalMinor` int NOT NULL,
	`expectedDate` timestamp NOT NULL,
	`budgetReference` varchar(100),
	`status` enum('draft','pending_approval','approved','sent','partially_received','received','closed','cancelled') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procurement_purchase_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `procurement_po_revision_unique` UNIQUE(`businessEntityId`,`poNo`,`revision`)
);
--> statement-breakpoint
CREATE TABLE `purchase_request_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`purchaseRequestId` int NOT NULL,
	`lineNo` int NOT NULL,
	`itemType` enum('item','service','asset') NOT NULL,
	`description` varchar(240) NOT NULL,
	`category` varchar(100) NOT NULL,
	`quantity` decimal(16,4) NOT NULL,
	`estimatedUnitPriceMinor` int NOT NULL,
	`specificationJson` text,
	CONSTRAINT `purchase_request_lines_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchase_request_line_unique` UNIQUE(`purchaseRequestId`,`lineNo`)
);
--> statement-breakpoint
CREATE TABLE `purchase_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`branchId` int,
	`departmentId` int,
	`costCenterId` int,
	`requestNo` varchar(80) NOT NULL,
	`requesterUserId` int NOT NULL,
	`budgetReference` varchar(100),
	`purchaseType` enum('opex','capex','emergency','inter_entity') NOT NULL,
	`priority` enum('normal','high','urgent') NOT NULL DEFAULT 'normal',
	`justification` text NOT NULL,
	`requiredDate` timestamp NOT NULL,
	`estimatedTotalMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`status` enum('draft','pending_approval','approved','rejected','sourcing','ordered','closed','cancelled') NOT NULL DEFAULT 'draft',
	`idempotencyKey` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `purchase_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchase_request_no_unique` UNIQUE(`businessEntityId`,`requestNo`),
	CONSTRAINT `purchase_request_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `procurement_rfq_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`rfqId` int NOT NULL,
	`supplierId` int NOT NULL,
	`responseNo` varchar(80) NOT NULL,
	`currency` varchar(8) NOT NULL,
	`subtotalMinor` int NOT NULL,
	`taxMinor` int NOT NULL DEFAULT 0,
	`deliveredCostMinor` int NOT NULL,
	`deliveryDays` int NOT NULL,
	`warrantyDays` int NOT NULL DEFAULT 0,
	`scoreBps` int,
	`selectionReason` text,
	`status` enum('submitted','shortlisted','selected','rejected') NOT NULL DEFAULT 'submitted',
	CONSTRAINT `procurement_rfq_responses_id` PRIMARY KEY(`id`),
	CONSTRAINT `procurement_rfq_response_unique` UNIQUE(`rfqId`,`supplierId`)
);
--> statement-breakpoint
CREATE TABLE `procurement_rfqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`purchaseRequestId` int NOT NULL,
	`rfqNo` varchar(80) NOT NULL,
	`deadline` timestamp NOT NULL,
	`deliveryTerms` varchar(160),
	`paymentTerms` varchar(160),
	`status` enum('draft','open','closed','evaluating','awarded','cancelled') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procurement_rfqs_id` PRIMARY KEY(`id`),
	CONSTRAINT `procurement_rfq_no_unique` UNIQUE(`businessEntityId`,`rfqNo`)
);
--> statement-breakpoint
CREATE TABLE `entity_supplier_contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`supplierId` int NOT NULL,
	`contractNo` varchar(80) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`currency` varchar(8) NOT NULL,
	`termsJson` text NOT NULL,
	`status` enum('draft','active','expired','terminated') NOT NULL DEFAULT 'draft',
	CONSTRAINT `entity_supplier_contracts_id` PRIMARY KEY(`id`),
	CONSTRAINT `supplier_contract_version_unique` UNIQUE(`businessEntityId`,`contractNo`,`version`)
);
--> statement-breakpoint
CREATE TABLE `entity_supplier_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`supplierId` int NOT NULL,
	`documentType` varchar(80) NOT NULL,
	`storageKey` varchar(300) NOT NULL,
	`expiresAt` timestamp,
	`verificationStatus` enum('pending','verified','rejected','expired') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entity_supplier_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `procurement_supplier_invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`supplierId` int NOT NULL,
	`purchaseOrderId` int NOT NULL,
	`receiptId` int,
	`invoiceNo` varchar(100) NOT NULL,
	`invoiceDate` timestamp NOT NULL,
	`currency` varchar(8) NOT NULL,
	`totalMinor` int NOT NULL,
	`matchType` enum('two_way','three_way') NOT NULL,
	`matchStatus` enum('pending','matched','variance','rejected') NOT NULL DEFAULT 'pending',
	`varianceMinor` int NOT NULL DEFAULT 0,
	`status` enum('draft','pending_approval','approved','posted','paid','void') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procurement_supplier_invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `procurement_supplier_invoice_unique` UNIQUE(`businessEntityId`,`supplierId`,`invoiceNo`)
);
--> statement-breakpoint
CREATE TABLE `procurement_vendor_performance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`supplierId` int NOT NULL,
	`periodCode` varchar(20) NOT NULL,
	`onTimeBps` int NOT NULL DEFAULT 0,
	`qualityBps` int NOT NULL DEFAULT 0,
	`priceVarianceBps` int NOT NULL DEFAULT 0,
	`responseBps` int NOT NULL DEFAULT 0,
	`overallScoreBps` int NOT NULL DEFAULT 0,
	`spendMinor` int NOT NULL DEFAULT 0,
	CONSTRAINT `procurement_vendor_performance_id` PRIMARY KEY(`id`),
	CONSTRAINT `procurement_vendor_performance_unique` UNIQUE(`businessEntityId`,`supplierId`,`periodCode`)
);
