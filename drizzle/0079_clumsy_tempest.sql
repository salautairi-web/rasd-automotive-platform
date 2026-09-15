CREATE TABLE `ap_supplier_bills_65` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`supplierRef` varchar(160) NOT NULL,
	`billNo` varchar(80) NOT NULL,
	`dueDate` timestamp NOT NULL,
	`amountMinor` int NOT NULL,
	`outstandingMinor` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`sourceReference` varchar(160) NOT NULL,
	`status` enum('open','partial','paid','disputed','cancelled') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ap_supplier_bills_65_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ar_collections_65` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`customerAccountId` int NOT NULL,
	`invoiceId` int NOT NULL,
	`amountMinor` int NOT NULL,
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`ownerRef` varchar(120) NOT NULL,
	`promiseDate` timestamp,
	`status` enum('open','promised','paid','escalated','closed') NOT NULL DEFAULT 'open',
	`notes` varchar(1000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ar_collections_65_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ar_credit_applications_65` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`customerAccountId` int NOT NULL,
	`requestedLimitMinor` int NOT NULL,
	`paymentTermsDays` int NOT NULL,
	`risk` enum('low','medium','high') NOT NULL,
	`status` enum('pending','approved','rejected','review') NOT NULL DEFAULT 'pending',
	`reviewDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ar_credit_applications_65_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ar_customer_accounts_65` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`customerRef` varchar(160) NOT NULL,
	`accountNo` varchar(80) NOT NULL,
	`currency` varchar(3) NOT NULL,
	`creditLimitMinor` int NOT NULL DEFAULT 0,
	`paymentTermsDays` int NOT NULL DEFAULT 0,
	`risk` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`status` enum('active','blocked','closed') NOT NULL DEFAULT 'active',
	`openingBalanceMinor` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ar_customer_accounts_65_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ar_invoices_65` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`customerAccountId` int NOT NULL,
	`invoiceNo` varchar(80) NOT NULL,
	`issueDate` timestamp NOT NULL,
	`dueDate` timestamp NOT NULL,
	`amountMinor` int NOT NULL,
	`taxMinor` int NOT NULL DEFAULT 0,
	`outstandingMinor` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`sourceReference` varchar(160) NOT NULL,
	`status` enum('open','partial','paid','disputed','cancelled') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ar_invoices_65_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `working_capital_snapshots_65` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`asOfDate` timestamp NOT NULL,
	`arOutstandingMinor` int NOT NULL DEFAULT 0,
	`apOutstandingMinor` int NOT NULL DEFAULT 0,
	`dsoBps` int NOT NULL DEFAULT 0,
	`dpoBps` int NOT NULL DEFAULT 0,
	`cashConversionDaysBps` int NOT NULL DEFAULT 0,
	`status` enum('draft','approved') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `working_capital_snapshots_65_id` PRIMARY KEY(`id`)
);
