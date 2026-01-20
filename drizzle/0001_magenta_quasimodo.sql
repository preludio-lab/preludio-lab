CREATE TABLE `work_part_translations` (
	`id` text PRIMARY KEY NOT NULL,
	`work_part_id` text NOT NULL,
	`lang` text NOT NULL,
	`title` text NOT NULL,
	`title_prefix` text,
	`title_content` text,
	`title_nickname` text,
	`tempo_translation` text,
	`description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`work_part_id`) REFERENCES `work_parts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_work_part_trans_lookup` ON `work_part_translations` (`work_part_id`,`lang`);--> statement-breakpoint
DROP INDEX `idx_work_trans_pops`;--> statement-breakpoint
ALTER TABLE `work_translations` ADD `title_prefix` text;--> statement-breakpoint
ALTER TABLE `work_translations` ADD `title_content` text;--> statement-breakpoint
ALTER TABLE `work_translations` ADD `title_nickname` text;--> statement-breakpoint
ALTER TABLE `work_translations` ADD `description` text;--> statement-breakpoint
ALTER TABLE `work_translations` DROP COLUMN `popular_title`;--> statement-breakpoint
ALTER TABLE `composers` ADD `era` text;--> statement-breakpoint
ALTER TABLE `composers` ADD `tags` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_parts` ADD `catalogues` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_parts` ADD `performance_difficulty` integer;--> statement-breakpoint
ALTER TABLE `work_parts` ADD `impression_dimensions` text;--> statement-breakpoint
ALTER TABLE `work_parts` ADD `nicknames` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_parts` ADD `based_on` text;--> statement-breakpoint
ALTER TABLE `work_parts` DROP COLUMN `title`;--> statement-breakpoint
ALTER TABLE `work_parts` DROP COLUMN `tempo_translation`;--> statement-breakpoint
ALTER TABLE `works` ADD `catalogues` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `works` ADD `tags` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `works` ADD `based_on` text;--> statement-breakpoint
ALTER TABLE `works` DROP COLUMN `tempo_translation`;