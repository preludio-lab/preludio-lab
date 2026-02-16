ALTER TABLE `musical_examples` RENAME TO `phrases`;
--> statement-breakpoint
ALTER TABLE `phrases` ADD `favorites_count` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS `idx_mus_ex_work_id`;
--> statement-breakpoint
CREATE INDEX `idx_phrase_work_id` ON `phrases` (`work_id`);
--> statement-breakpoint
DROP INDEX IF EXISTS `idx_mus_ex_work_part`;
--> statement-breakpoint
CREATE INDEX `idx_phrase_work_part` ON `phrases` (`work_part_id`);
--> statement-breakpoint
DROP INDEX IF EXISTS `idx_mus_ex_score_id`;
--> statement-breakpoint
CREATE INDEX `idx_phrase_score_id` ON `phrases` (`score_id`);
--> statement-breakpoint
DROP INDEX IF EXISTS `idx_mus_ex_slug`;
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_phrase_slug` ON `phrases` (`work_id`,`slug`);