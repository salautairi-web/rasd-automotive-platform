ALTER TABLE `customers` DROP INDEX `customers_customerNo_unique`;--> statement-breakpoint
ALTER TABLE `products` DROP INDEX `products_productNo_unique`;--> statement-breakpoint
ALTER TABLE `vehicles` DROP INDEX `vehicles_vehicleNo_unique`;--> statement-breakpoint
ALTER TABLE `products` ADD `businessEntityId` int;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `businessEntityId` int;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_entity_no_unique` UNIQUE(`businessEntityId`,`customerNo`);--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_entity_no_unique` UNIQUE(`businessEntityId`,`productNo`);--> statement-breakpoint
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_entity_no_unique` UNIQUE(`businessEntityId`,`vehicleNo`);