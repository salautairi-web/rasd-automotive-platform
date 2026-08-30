CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`branchId` int,
	`code` varchar(32) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`nameEn` varchar(180),
	CONSTRAINT `departments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` varchar(80) NOT NULL,
	CONSTRAINT `document_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`warehouseId` int,
	`code` varchar(32) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	CONSTRAINT `locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `task_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`userId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `task_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `warehouses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`branchId` int,
	`code` varchar(32) NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`nameEn` varchar(180),
	CONSTRAINT `warehouses_id` PRIMARY KEY(`id`)
);
