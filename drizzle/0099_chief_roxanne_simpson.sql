ALTER TABLE `customers` ADD `customerType` enum('individual','corporate') DEFAULT 'individual' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `companyName` varchar(180);--> statement-breakpoint
ALTER TABLE `customers` ADD `taxNo` varchar(80);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `customerId` int;