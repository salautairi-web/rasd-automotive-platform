CREATE TABLE `ui_layout_template_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateKey` varchar(120) NOT NULL,
	`roleKey` varchar(100) NOT NULL,
	`mode` enum('customer','user') NOT NULL DEFAULT 'user',
	`versionNo` int NOT NULL,
	`nameAr` varchar(180) NOT NULL,
	`configJson` text NOT NULL,
	`status` enum('published','archived') NOT NULL DEFAULT 'published',
	`changeNote` varchar(500),
	`createdBy` int NOT NULL,
	`restoredFromVersionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ui_layout_template_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `ui_layout_template_version_unique` UNIQUE(`templateKey`,`versionNo`)
);
