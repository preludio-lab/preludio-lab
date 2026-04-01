CREATE TABLE `score_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`work_part_id` text,
	`score_id` text,
	`provider` text NOT NULL,
	`repository_owner` text,
	`repository_name` text,
	`commit_hash` text NOT NULL,
	`file_path` text NOT NULL,
	`format` text NOT NULL,
	`work_part_number` integer DEFAULT 0 NOT NULL,
	`work_part_title` text,
	`work_part_slug` text NOT NULL,
	`license` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_part_id`) REFERENCES `work_parts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`score_id`) REFERENCES `scores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_score_src_work` ON `score_sources` (`work_id`);--> statement-breakpoint
CREATE INDEX `idx_score_src_part` ON `score_sources` (`work_part_id`);--> statement-breakpoint
CREATE INDEX `idx_score_src_score` ON `score_sources` (`score_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_score_src_lookup` ON `score_sources` (`work_id`,`work_part_slug`,`provider`);--> statement-breakpoint
CREATE INDEX `idx_score_src_version` ON `score_sources` (`repository_name`,`commit_hash`);