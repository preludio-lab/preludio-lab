CREATE TABLE `phrase_translations` (
	`phrase_id` text NOT NULL,
	`lang` text NOT NULL,
	`caption` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`phrase_id`, `lang`),
	FOREIGN KEY (`phrase_id`) REFERENCES `phrases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_phrases` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`work_id` text NOT NULL,
	`work_part_id` text,
	`score_id` text,
	`format` text DEFAULT 'abc' NOT NULL,
	`data_storage_path` text,
	`measure_range` text,
	`recording_segments` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_part_id`) REFERENCES `work_parts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`score_id`) REFERENCES `scores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_phrases`("id", "slug", "work_id", "work_part_id", "score_id", "format", "data_storage_path", "measure_range", "recording_segments", "created_at", "updated_at") SELECT "id", "slug", "work_id", "work_part_id", "score_id", "format", "data_storage_path", "measure_range", "recording_segments", "created_at", "updated_at" FROM `phrases`;--> statement-breakpoint
DROP TABLE `phrases`;--> statement-breakpoint
ALTER TABLE `__new_phrases` RENAME TO `phrases`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `phrases_slug_unique` ON `phrases` (`slug`);