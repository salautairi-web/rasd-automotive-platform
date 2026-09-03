CREATE TABLE `treasury_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessEntityId` int,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` varchar(120) NOT NULL,
	`requestId` varchar(100) NOT NULL,
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasury_bank_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`bankName` varchar(160) NOT NULL,
	`branchName` varchar(160),
	`accountReferenceMasked` varchar(100) NOT NULL,
	`currency` varchar(8) NOT NULL,
	`purpose` varchar(100) NOT NULL,
	`status` enum('active','frozen','closed') NOT NULL DEFAULT 'active',
	`openingBalanceMinor` int NOT NULL DEFAULT 0,
	`authorizedSignatoriesJson` text,
	`documentRefsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_bank_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `treasury_bank_scope_ref_unique` UNIQUE(`businessEntityId`,`accountReferenceMasked`)
);
--> statement-breakpoint
CREATE TABLE `treasury_bank_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`bankAccountId` int NOT NULL,
	`externalReference` varchar(160) NOT NULL,
	`transactionDate` timestamp NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`direction` enum('debit','credit') NOT NULL,
	`description` text,
	`sourceWatermark` varchar(140),
	`importKey` varchar(180) NOT NULL,
	`status` enum('imported','matched','unmatched','reconciled','duplicate') NOT NULL DEFAULT 'imported',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_bank_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `treasury_bank_transaction_import_unique` UNIQUE(`businessEntityId`,`importKey`)
);
--> statement-breakpoint
CREATE TABLE `treasury_beneficiaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`name` varchar(220) NOT NULL,
	`bankReferenceMasked` varchar(120),
	`verificationStatus` enum('unverified','pending','verified','suspended') NOT NULL DEFAULT 'unverified',
	`coolingUntil` timestamp,
	`changeApprovalJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_beneficiaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasury_cash_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`branchId` int,
	`accountType` enum('cash_on_hand','petty_cash') NOT NULL,
	`cashierUserId` int,
	`custodianUserId` int,
	`currency` varchar(8) NOT NULL,
	`openingFloatMinor` int NOT NULL DEFAULT 0,
	`maximumFloatMinor` int NOT NULL DEFAULT 0,
	`status` enum('active','suspended','closed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_cash_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasury_cash_forecasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`forecastDate` timestamp NOT NULL,
	`scenario` enum('base','optimistic','conservative','stress') NOT NULL,
	`openingCashMinor` int NOT NULL,
	`expectedReceiptsMinor` int NOT NULL DEFAULT 0,
	`expectedPaymentsMinor` int NOT NULL DEFAULT 0,
	`restrictedCashMinor` int NOT NULL DEFAULT 0,
	`committedPaymentsMinor` int NOT NULL DEFAULT 0,
	`closingForecastMinor` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`assumptionsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_cash_forecasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasury_collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`sourceTransactionRef` varchar(120) NOT NULL,
	`dueAmountMinor` int NOT NULL,
	`collectedAmountMinor` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL,
	`status` enum('due','reminded','partially_collected','collected','overpaid','refunded') NOT NULL DEFAULT 'due',
	`nextReminderAt` timestamp,
	CONSTRAINT `treasury_collections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasury_financing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`lender` varchar(180) NOT NULL,
	`principalMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`rateBps` int,
	`maturityAt` timestamp,
	`balanceMinor` int NOT NULL,
	`covenantsJson` text,
	`status` enum('planned','active','matured','settled') NOT NULL DEFAULT 'planned',
	CONSTRAINT `treasury_financing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasury_gateway_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`providerKey` varchar(100) NOT NULL,
	`intentRef` varchar(160) NOT NULL,
	`idempotencyKey` varchar(140) NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`status` enum('created','authorized','settled','refunded','chargeback','failed') NOT NULL DEFAULT 'created',
	`webhookFingerprint` varchar(180),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_gateway_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `treasury_gateway_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`),
	CONSTRAINT `treasury_gateway_intent_unique` UNIQUE(`providerKey`,`intentRef`)
);
--> statement-breakpoint
CREATE TABLE `treasury_inter_entity_funding` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceEntityId` int NOT NULL,
	`targetEntityId` int NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`purpose` text NOT NULL,
	`treatment` enum('loan','capital','agency') NOT NULL,
	`status` enum('draft','pending_approval','approved','disbursed','settled','cancelled') NOT NULL DEFAULT 'draft',
	`agreementRef` varchar(120),
	`idempotencyKey` varchar(140) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_inter_entity_funding_id` PRIMARY KEY(`id`),
	CONSTRAINT `treasury_funding_key_unique` UNIQUE(`sourceEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `treasury_investments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`instrumentRef` varchar(120) NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`liquidityClass` enum('liquid','restricted','illiquid') NOT NULL,
	`maturityAt` timestamp,
	`status` enum('planned','active','matured','exited') NOT NULL DEFAULT 'planned',
	CONSTRAINT `treasury_investments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasury_payment_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paymentRequestId` int NOT NULL,
	`stage` int NOT NULL DEFAULT 1,
	`approverUserId` int,
	`decision` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`decidedAt` timestamp,
	`comment` text,
	CONSTRAINT `treasury_payment_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasury_payment_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`batchNo` varchar(80) NOT NULL,
	`currency` varchar(8) NOT NULL,
	`paymentCount` int NOT NULL DEFAULT 0,
	`totalAmountMinor` int NOT NULL DEFAULT 0,
	`status` enum('draft','pending_approval','approved','submitted','executing','settled','failed','exception') NOT NULL DEFAULT 'draft',
	`providerRef` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_payment_batches_id` PRIMARY KEY(`id`),
	CONSTRAINT `treasury_payment_batch_no_unique` UNIQUE(`batchNo`)
);
--> statement-breakpoint
CREATE TABLE `treasury_payment_methods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`methodType` enum('cash','bank_transfer','card','gateway','cheque','wallet') NOT NULL,
	`nameAr` varchar(160) NOT NULL,
	`policyJson` text NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	CONSTRAINT `treasury_payment_methods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasury_payment_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`requestNo` varchar(80) NOT NULL,
	`requesterUserId` int NOT NULL,
	`beneficiaryId` int,
	`paymentType` varchar(80) NOT NULL,
	`purpose` text NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`dueAt` timestamp,
	`sourceTransactionRef` varchar(120),
	`idempotencyKey` varchar(140) NOT NULL,
	`status` enum('draft','pending_approval','approved','submitted','completed','failed','rejected','cancelled') NOT NULL DEFAULT 'pending_approval',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_payment_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `treasury_payment_request_no_unique` UNIQUE(`requestNo`),
	CONSTRAINT `treasury_payment_request_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `treasury_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`receiptNo` varchar(80) NOT NULL,
	`receiptType` enum('customer','supplier_refund','other','deposit') NOT NULL,
	`sourceTransactionRef` varchar(120),
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`paymentMethodId` int,
	`reference` varchar(160),
	`status` enum('recorded','allocated','refunded','cancelled') NOT NULL DEFAULT 'recorded',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_receipts_id` PRIMARY KEY(`id`),
	CONSTRAINT `treasury_receipt_no_unique` UNIQUE(`receiptNo`)
);
--> statement-breakpoint
CREATE TABLE `treasury_reconciliation_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reconciliationId` int NOT NULL,
	`bankTransactionId` int NOT NULL,
	`sourceTransactionRef` varchar(120),
	`matchedAmountMinor` int NOT NULL,
	`matchType` enum('exact','reference','amount_tolerance','date_tolerance','manual') NOT NULL,
	`matchedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_reconciliation_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasury_reconciliations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`bankAccountId` int,
	`periodCode` varchar(20) NOT NULL,
	`bookAmountMinor` int NOT NULL,
	`statementAmountMinor` int NOT NULL,
	`differenceMinor` int NOT NULL,
	`status` enum('open','matching','exception','approved','closed') NOT NULL DEFAULT 'open',
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_reconciliations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasury_risk_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`alertType` enum('duplicate_payment','unusual_amount','unusual_beneficiary','rapid_repetition','round_amount','bank_detail_change','liquidity_threshold') NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'warning',
	`sourceReference` varchar(140),
	`detailsJson` text NOT NULL,
	`status` enum('open','reviewing','resolved','dismissed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_risk_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasury_transfers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`transferType` enum('cash_to_bank','bank_to_bank','petty_cash_topup','cashier_transfer') NOT NULL,
	`fromAccountRef` varchar(100) NOT NULL,
	`toAccountRef` varchar(100) NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`status` enum('pending_approval','approved','executed','reversed','cancelled') NOT NULL DEFAULT 'pending_approval',
	`idempotencyKey` varchar(140) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasury_transfers_id` PRIMARY KEY(`id`),
	CONSTRAINT `treasury_transfer_key_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
