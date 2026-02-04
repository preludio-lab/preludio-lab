DROP INDEX IF EXISTS `idx_works_catalogue`;--> statement-breakpoint
ALTER TABLE `works` DROP COLUMN `catalogue_prefix`;--> statement-breakpoint
ALTER TABLE `works` ADD `catalogue_prefix` text GENERATED ALWAYS AS (json_extract(catalogues, '$[0].prefix')) VIRTUAL;--> statement-breakpoint
ALTER TABLE `works` DROP COLUMN `catalogue_number`;--> statement-breakpoint
ALTER TABLE `works` ADD `catalogue_number` text GENERATED ALWAYS AS (json_extract(catalogues, '$[0].number')) VIRTUAL;--> statement-breakpoint
ALTER TABLE `works` DROP COLUMN `catalogue_sort_order`;--> statement-breakpoint
ALTER TABLE `works` ADD `catalogue_sort_order` real GENERATED ALWAYS AS (json_extract(catalogues, '$[0].sortOrder')) VIRTUAL;--> statement-breakpoint
CREATE INDEX `idx_works_catalogue` ON `works` (`composer_id`,`catalogue_prefix`,`catalogue_sort_order`);