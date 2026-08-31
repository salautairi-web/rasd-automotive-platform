CREATE TABLE `crm_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`activityType` enum('call','email','meeting','visit','task','follow_up') NOT NULL,
	`customerId` int,
	`leadId` int,
	`opportunityId` int,
	`ownerUserId` int NOT NULL,
	`subject` varchar(220) NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`outcome` text,
	`status` enum('planned','completed','cancelled','overdue') NOT NULL DEFAULT 'planned',
	CONSTRAINT `crm_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` varchar(100) NOT NULL,
	`requestId` varchar(80) NOT NULL,
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`campaignCode` varchar(80) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`channel` varchar(80) NOT NULL,
	`audienceJson` text,
	`budgetMinor` int NOT NULL DEFAULT 0,
	`revenueMinor` int NOT NULL DEFAULT 0,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`status` enum('draft','approved','active','completed','cancelled') NOT NULL DEFAULT 'draft',
	CONSTRAINT `crm_campaigns_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_campaign_code_unique` UNIQUE(`businessEntityId`,`campaignCode`)
);
--> statement-breakpoint
CREATE TABLE `crm_commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`salespersonUserId` int NOT NULL,
	`salesOrderId` int NOT NULL,
	`baseMinor` int NOT NULL,
	`rateBps` int NOT NULL,
	`amountMinor` int NOT NULL,
	`status` enum('calculated','approved','payable','paid','reversed') NOT NULL DEFAULT 'calculated',
	`approvedBy` int,
	`payrollRef` varchar(120),
	CONSTRAINT `crm_commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`customerId` int NOT NULL,
	`fullName` varchar(180) NOT NULL,
	`jobTitle` varchar(120),
	`email` varchar(320),
	`phone` varchar(40),
	`isPrimary` boolean NOT NULL DEFAULT false,
	CONSTRAINT `crm_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`contractNo` varchar(80) NOT NULL,
	`customerId` int NOT NULL,
	`salesOrderId` int,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp,
	`valueMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`documentStorageKey` varchar(300),
	`status` enum('draft','active','expired','terminated') NOT NULL DEFAULT 'draft',
	CONSTRAINT `crm_contracts_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_contract_no_unique` UNIQUE(`businessEntityId`,`contractNo`)
);
--> statement-breakpoint
CREATE TABLE `crm_customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`customerNo` varchar(80) NOT NULL,
	`customerType` enum('individual','company') NOT NULL,
	`displayName` varchar(200) NOT NULL,
	`email` varchar(320),
	`phone` varchar(40),
	`segment` varchar(80),
	`creditLimitMinor` int NOT NULL DEFAULT 0,
	`creditTermsDays` int NOT NULL DEFAULT 0,
	`ownerUserId` int,
	`portalProfileId` int,
	`status` enum('active','inactive','blocked') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_customer_no_unique` UNIQUE(`businessEntityId`,`customerNo`)
);
--> statement-breakpoint
CREATE TABLE `crm_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`leadNo` varchar(80) NOT NULL,
	`fullName` varchar(180) NOT NULL,
	`email` varchar(320),
	`phone` varchar(40),
	`source` varchar(100) NOT NULL,
	`campaignId` int,
	`customerType` enum('retail','corporate','dealer','partner','vip','wholesale','fleet') NOT NULL DEFAULT 'retail',
	`interest` varchar(180),
	`ownerUserId` int,
	`branchId` int,
	`score` int NOT NULL DEFAULT 0,
	`status` enum('new','contacted','qualified','converted','disqualified') NOT NULL DEFAULT 'new',
	`consentStatus` enum('unknown','granted','withdrawn') NOT NULL DEFAULT 'unknown',
	`idempotencyKey` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_lead_no_unique` UNIQUE(`businessEntityId`,`leadNo`),
	CONSTRAINT `crm_lead_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `crm_opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`opportunityNo` varchar(80) NOT NULL,
	`customerId` int NOT NULL,
	`leadId` int,
	`stageId` int NOT NULL,
	`title` varchar(220) NOT NULL,
	`productType` varchar(80),
	`productRef` varchar(120),
	`expectedValueMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`probability` int NOT NULL DEFAULT 0,
	`expectedCloseAt` timestamp,
	`ownerUserId` int NOT NULL,
	`competitor` varchar(180),
	`nextAction` text,
	`lostReason` text,
	`status` enum('open','won','lost','cancelled') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_opportunities_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_opportunity_no_unique` UNIQUE(`businessEntityId`,`opportunityNo`)
);
--> statement-breakpoint
CREATE TABLE `crm_pipeline_stages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`stageCode` varchar(60) NOT NULL,
	`nameAr` varchar(120) NOT NULL,
	`sequence` int NOT NULL,
	`probability` int NOT NULL DEFAULT 0,
	`terminalType` enum('none','won','lost') NOT NULL DEFAULT 'none',
	CONSTRAINT `crm_pipeline_stages_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_stage_code_unique` UNIQUE(`businessEntityId`,`stageCode`)
);
--> statement-breakpoint
CREATE TABLE `crm_quotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`quotationNo` varchar(80) NOT NULL,
	`opportunityId` int NOT NULL,
	`customerId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`subtotalMinor` int NOT NULL,
	`discountMinor` int NOT NULL DEFAULT 0,
	`taxMinor` int NOT NULL DEFAULT 0,
	`totalMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`validUntil` timestamp NOT NULL,
	`status` enum('draft','pending_approval','approved','sent','accepted','rejected','expired') NOT NULL DEFAULT 'draft',
	`approvedBy` int,
	CONSTRAINT `crm_quotations_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_quotation_version_unique` UNIQUE(`businessEntityId`,`quotationNo`,`version`)
);
--> statement-breakpoint
CREATE TABLE `crm_sales_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`orderNo` varchar(80) NOT NULL,
	`quotationId` int,
	`customerId` int NOT NULL,
	`opportunityId` int,
	`totalMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`paymentTerms` varchar(180),
	`deliveryAt` timestamp,
	`invoiceRef` varchar(120),
	`status` enum('draft','approved','fulfilling','fulfilled','won','lost','cancelled') NOT NULL DEFAULT 'draft',
	`idempotencyKey` varchar(120) NOT NULL,
	CONSTRAINT `crm_sales_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_sales_order_no_unique` UNIQUE(`businessEntityId`,`orderNo`),
	CONSTRAINT `crm_sales_order_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `crm_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`ticketNo` varchar(80) NOT NULL,
	`customerId` int NOT NULL,
	`ticketType` enum('request','complaint','support','warranty','return') NOT NULL,
	`subject` varchar(220) NOT NULL,
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`assignedTo` int,
	`dueAt` timestamp,
	`resolvedAt` timestamp,
	`resolution` text,
	`status` enum('open','in_progress','escalated','resolved','closed') NOT NULL DEFAULT 'open',
	CONSTRAINT `crm_tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_ticket_no_unique` UNIQUE(`businessEntityId`,`ticketNo`)
);
