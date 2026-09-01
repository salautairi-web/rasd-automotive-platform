CREATE TABLE `communication_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`messageId` int,
	`conversationId` int,
	`storageKey` varchar(500) NOT NULL,
	`fileName` varchar(240) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`sha256` varchar(128) NOT NULL,
	`scanStatus` enum('pending','clean','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communication_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`actorRef` varchar(160) NOT NULL,
	`action` varchar(120) NOT NULL,
	`resourceType` varchar(100) NOT NULL,
	`resourceId` varchar(120),
	`outcome` enum('success','failure','denied') NOT NULL,
	`correlationId` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communication_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`campaignKey` varchar(140) NOT NULL,
	`templateId` int NOT NULL,
	`audienceJson` text NOT NULL,
	`channelKey` varchar(40) NOT NULL,
	`status` enum('draft','pending_approval','scheduled','running','completed','cancelled') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_campaigns_id` PRIMARY KEY(`id`),
	CONSTRAINT `communication_campaign_entity_key_unique` UNIQUE(`businessEntityId`,`campaignKey`)
);
--> statement-breakpoint
CREATE TABLE `communication_channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelKey` varchar(40) NOT NULL,
	`nameAr` varchar(120) NOT NULL,
	`status` enum('active','paused','disabled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_channels_id` PRIMARY KEY(`id`),
	CONSTRAINT `communication_channels_channelKey_unique` UNIQUE(`channelKey`)
);
--> statement-breakpoint
CREATE TABLE `communication_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`subjectRef` varchar(160) NOT NULL,
	`purpose` enum('marketing','transactional','service') NOT NULL,
	`channelKey` varchar(40) NOT NULL,
	`decision` enum('granted','withdrawn','opted_out') NOT NULL,
	`source` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_consents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communication_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`conversationKey` varchar(160) NOT NULL,
	`channelKey` varchar(40) NOT NULL,
	`relatedType` varchar(80),
	`relatedId` int,
	`customerId` int,
	`vehicleId` int,
	`ticketId` int,
	`assignedTeam` varchar(100),
	`assignedAgentId` int,
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`status` enum('open','pending','resolved','closed') NOT NULL DEFAULT 'open',
	`slaDueAt` timestamp,
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `communication_conversation_entity_key_unique` UNIQUE(`businessEntityId`,`conversationKey`)
);
--> statement-breakpoint
CREATE TABLE `communication_delivery_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`providerId` int,
	`attemptNo` int NOT NULL,
	`status` enum('queued','sent','delivered','failed','retrying','dead_letter') NOT NULL,
	`responseCode` int,
	`errorMessage` text,
	`scheduledAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_delivery_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communication_entities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`defaultLanguage` varchar(12) NOT NULL DEFAULT 'ar',
	`status` enum('active','paused') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_entities_id` PRIMARY KEY(`id`),
	CONSTRAINT `communication_entities_businessEntityId_unique` UNIQUE(`businessEntityId`)
);
--> statement-breakpoint
CREATE TABLE `communication_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`conversationId` int,
	`messageKey` varchar(180) NOT NULL,
	`channelKey` varchar(40) NOT NULL,
	`senderRef` varchar(160) NOT NULL,
	`recipientRef` varchar(320) NOT NULL,
	`relatedType` varchar(80),
	`relatedId` int,
	`templateId` int,
	`content` text NOT NULL,
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`status` enum('queued','sent','accepted','delivered','read','failed','retrying','expired','suppressed') NOT NULL DEFAULT 'queued',
	`idempotencyKey` varchar(180) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`deliveredAt` timestamp,
	`readAt` timestamp,
	CONSTRAINT `communication_messages_id` PRIMARY KEY(`id`),
	CONSTRAINT `communication_message_entity_idempotency_unique` UNIQUE(`businessEntityId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `communication_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`participantType` enum('customer','employee','partner','system') NOT NULL,
	`participantRef` varchar(160) NOT NULL,
	`role` varchar(60) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `communication_participant_unique` UNIQUE(`conversationId`,`participantType`,`participantRef`)
);
--> statement-breakpoint
CREATE TABLE `communication_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`subjectType` varchar(60) NOT NULL,
	`subjectRef` varchar(160) NOT NULL,
	`language` varchar(12) NOT NULL DEFAULT 'ar',
	`channelsJson` text NOT NULL,
	`quietHoursJson` text,
	`frequencyJson` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communication_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `communication_preference_scope_unique` UNIQUE(`businessEntityId`,`subjectType`,`subjectRef`)
);
--> statement-breakpoint
CREATE TABLE `communication_providers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`channelKey` varchar(40) NOT NULL,
	`providerKey` varchar(100) NOT NULL,
	`secretMetadataJson` text,
	`status` enum('active','paused','failed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_providers_id` PRIMARY KEY(`id`),
	CONSTRAINT `communication_provider_entity_channel_unique` UNIQUE(`businessEntityId`,`channelKey`,`providerKey`)
);
--> statement-breakpoint
CREATE TABLE `communication_suppressions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`subjectRef` varchar(160) NOT NULL,
	`channelKey` varchar(40) NOT NULL,
	`reason` varchar(180) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_suppressions_id` PRIMARY KEY(`id`),
	CONSTRAINT `communication_suppression_scope_unique` UNIQUE(`businessEntityId`,`subjectRef`,`channelKey`)
);
--> statement-breakpoint
CREATE TABLE `communication_template_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`version` int NOT NULL,
	`language` varchar(12) NOT NULL,
	`subject` varchar(220),
	`body` text NOT NULL,
	`variablesJson` text NOT NULL,
	`status` enum('draft','approved','retired') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_template_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `communication_template_language_version_unique` UNIQUE(`templateId`,`language`,`version`)
);
--> statement-breakpoint
CREATE TABLE `communication_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int NOT NULL,
	`templateKey` varchar(140) NOT NULL,
	`channelKey` varchar(40) NOT NULL,
	`purpose` enum('transactional','operational','marketing','internal') NOT NULL,
	`variablesJson` text NOT NULL,
	`status` enum('draft','pending_approval','active','retired') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `communication_template_entity_key_unique` UNIQUE(`businessEntityId`,`templateKey`)
);
--> statement-breakpoint
CREATE TABLE `communication_webhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessEntityId` int,
	`providerId` int,
	`endpointHash` varchar(128) NOT NULL,
	`signatureValid` boolean NOT NULL DEFAULT false,
	`replayDetected` boolean NOT NULL DEFAULT false,
	`eventKey` varchar(140) NOT NULL,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_webhooks_id` PRIMARY KEY(`id`)
);
