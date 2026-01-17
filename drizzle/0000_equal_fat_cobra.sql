CREATE TABLE `article_translations` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`lang` text NOT NULL,
	`status` text NOT NULL,
	`title` text NOT NULL,
	`display_title` text NOT NULL,
	`catchcopy` text,
	`excerpt` text,
	`published_at` text,
	`is_featured` integer DEFAULT false NOT NULL,
	`mdx_path` text GENERATED ALWAYS AS (lang || '/' || sl_category || '/' || sl_slug) STORED,
	`sl_slug` text NOT NULL,
	`sl_category` text NOT NULL,
	`sl_composer_name` text,
	`sl_work_catalogue_id` text,
	`sl_work_nicknames` text,
	`sl_genre` text,
	`sl_instrumentations` text,
	`sl_era` text,
	`sl_nationality` text,
	`sl_key` text,
	`sl_performance_difficulty` integer,
	`sl_impression_dimensions` text,
	`content_embedding` F32BLOB(384),
	`sl_series_assignments` text DEFAULT '[]' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`content_structure` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_art_trans_mdx_path` ON `article_translations` (`mdx_path`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_art_trans_article_lookup` ON `article_translations` (`article_id`,`lang`);--> statement-breakpoint
CREATE INDEX `idx_art_trans_status_pub` ON `article_translations` (`lang`,`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `idx_art_trans_featured` ON `article_translations` (`lang`,`is_featured`,`published_at`);--> statement-breakpoint
CREATE INDEX `idx_art_trans_search_genre` ON `article_translations` (`lang`,`sl_genre`);--> statement-breakpoint
CREATE INDEX `idx_art_trans_search_era` ON `article_translations` (`lang`,`sl_era`);--> statement-breakpoint
CREATE INDEX `idx_art_trans_search_comp` ON `article_translations` (`lang`,`sl_composer_name`);--> statement-breakpoint
CREATE INDEX `idx_art_trans_compound_filter` ON `article_translations` (`lang`,`status`,`is_featured`,`published_at`);--> statement-breakpoint
CREATE TABLE `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text,
	`slug` text NOT NULL,
	`category` text NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`reading_time_seconds` integer DEFAULT 0 NOT NULL,
	`thumbnail_path` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_articles_work_id` ON `articles` (`work_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_articles_slug` ON `articles` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_articles_featured` ON `articles` (`is_featured`,`created_at`);--> statement-breakpoint
CREATE TABLE `series` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_series_article_id` ON `series` (`article_id`);--> statement-breakpoint
CREATE TABLE `series_articles` (
	`series_id` text NOT NULL,
	`article_id` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`series_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_ser_art_lookup` ON `series_articles` (`series_id`,`article_id`);--> statement-breakpoint
CREATE INDEX `idx_ser_art_order` ON `series_articles` (`series_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `idx_ser_art_article` ON `series_articles` (`article_id`);--> statement-breakpoint
CREATE TABLE `composer_translations` (
	`id` text PRIMARY KEY NOT NULL,
	`composer_id` text NOT NULL,
	`lang` text NOT NULL,
	`full_name` text NOT NULL,
	`display_name` text NOT NULL,
	`short_name` text NOT NULL,
	`biography` text,
	`profile_embedding` F32BLOB(384),
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`composer_id`) REFERENCES `composers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_comp_trans_lookup` ON `composer_translations` (`composer_id`,`lang`);--> statement-breakpoint
CREATE INDEX `idx_comp_trans_name` ON `composer_translations` (`lang`,`display_name`);--> statement-breakpoint
CREATE TABLE `composers` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`birth_date` text,
	`death_date` text,
	`nationality_code` text,
	`representative_instruments` text DEFAULT '[]' NOT NULL,
	`representative_genres` text DEFAULT '[]' NOT NULL,
	`places` text DEFAULT '[]' NOT NULL,
	`impression_dimensions` text,
	`portrait_image_path` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_composers_slug` ON `composers` (`slug`);--> statement-breakpoint
CREATE TABLE `work_parts` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`slug` text NOT NULL,
	`type` text NOT NULL,
	`is_name_standard` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`title` text DEFAULT '{}' NOT NULL,
	`key_tonality` text,
	`tempo_text` text,
	`tempo_translation` text DEFAULT '{}' NOT NULL,
	`ts_numerator` integer,
	`ts_denominator` integer,
	`ts_display_string` text,
	`bpm` integer,
	`metronome_unit` text,
	`genres` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_work_parts_fk` ON `work_parts` (`work_id`);--> statement-breakpoint
CREATE INDEX `idx_work_parts_ord` ON `work_parts` (`work_id`,`sort_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_work_parts_slg` ON `work_parts` (`work_id`,`slug`);--> statement-breakpoint
CREATE TABLE `work_translations` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`lang` text NOT NULL,
	`title` text NOT NULL,
	`popular_title` text,
	`nicknames` text DEFAULT '[]' NOT NULL,
	`composition_period` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_work_trans_lookup` ON `work_translations` (`work_id`,`lang`);--> statement-breakpoint
CREATE INDEX `idx_work_trans_title` ON `work_translations` (`lang`,`title`);--> statement-breakpoint
CREATE INDEX `idx_work_trans_pops` ON `work_translations` (`lang`,`popular_title`);--> statement-breakpoint
CREATE TABLE `works` (
	`id` text PRIMARY KEY NOT NULL,
	`composer_id` text NOT NULL,
	`slug` text NOT NULL,
	`catalogue_prefix` text,
	`catalogue_number` text,
	`catalogue_sort_order` real,
	`era` text,
	`instrumentation` text,
	`instrumentation_flags` text DEFAULT '{}' NOT NULL,
	`performance_difficulty` integer,
	`key_tonality` text,
	`tempo_text` text,
	`tempo_translation` text DEFAULT '{}' NOT NULL,
	`ts_numerator` integer,
	`ts_denominator` integer,
	`ts_display_string` text,
	`bpm` integer,
	`metronome_unit` text,
	`impression_dimensions` text,
	`genres` text DEFAULT '[]' NOT NULL,
	`composition_year` integer,
	`composition_period` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`composer_id`) REFERENCES `composers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_works_composer_id` ON `works` (`composer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_works_slug` ON `works` (`composer_id`,`slug`);--> statement-breakpoint
CREATE INDEX `idx_works_catalogue` ON `works` (`composer_id`,`catalogue_prefix`,`catalogue_sort_order`);--> statement-breakpoint
CREATE TABLE `musical_examples` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`work_part_id` text,
	`score_id` text,
	`slug` text NOT NULL,
	`format` text NOT NULL,
	`data_storage_path` text NOT NULL,
	`measure_range` text,
	`recording_segments` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_part_id`) REFERENCES `work_parts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`score_id`) REFERENCES `scores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_mus_ex_work_id` ON `musical_examples` (`work_id`);--> statement-breakpoint
CREATE INDEX `idx_mus_ex_work_part` ON `musical_examples` (`work_part_id`);--> statement-breakpoint
CREATE INDEX `idx_mus_ex_score_id` ON `musical_examples` (`score_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_mus_ex_slug` ON `musical_examples` (`work_id`,`slug`);--> statement-breakpoint
CREATE TABLE `score_translations` (
	`id` text PRIMARY KEY NOT NULL,
	`score_id` text NOT NULL,
	`lang` text NOT NULL,
	`publisher` text,
	`editor` text,
	`edition` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`score_id`) REFERENCES `scores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_score_trans_lookup` ON `score_translations` (`score_id`,`lang`);--> statement-breakpoint
CREATE TABLE `score_works` (
	`score_id` text NOT NULL,
	`work_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`score_id`) REFERENCES `scores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_score_works_lookup` ON `score_works` (`score_id`,`work_id`);--> statement-breakpoint
CREATE INDEX `idx_score_works_work` ON `score_works` (`work_id`);--> statement-breakpoint
CREATE TABLE `scores` (
	`id` text PRIMARY KEY NOT NULL,
	`isbn` text,
	`gtin` text,
	`affiliate_links` text DEFAULT '[]' NOT NULL,
	`preview_url` text,
	`format` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_scores_isbn` ON `scores` (`isbn`);--> statement-breakpoint
CREATE TABLE `recording_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`recording_id` text NOT NULL,
	`provider` text NOT NULL,
	`external_source_id` text NOT NULL,
	`quality` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`recording_id`) REFERENCES `recordings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_rec_src_rec_id` ON `recording_sources` (`recording_id`);--> statement-breakpoint
CREATE INDEX `idx_rec_src_lookup` ON `recording_sources` (`provider`,`external_source_id`);--> statement-breakpoint
CREATE TABLE `recordings` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`work_part_id` text,
	`performer_name` text DEFAULT '{}' NOT NULL,
	`recording_year` integer,
	`is_recommended` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_part_id`) REFERENCES `work_parts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_recordings_work_id` ON `recordings` (`work_id`);--> statement-breakpoint
CREATE INDEX `idx_recordings_part_id` ON `recordings` (`work_part_id`);--> statement-breakpoint
CREATE INDEX `idx_recordings_rec` ON `recordings` (`work_id`,`is_recommended`);--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`media_type` text NOT NULL,
	`url` text NOT NULL,
	`alt_text` text DEFAULT '{}',
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tag_translations` (
	`id` text PRIMARY KEY NOT NULL,
	`tag_id` text NOT NULL,
	`lang` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tag_trans_lookup` ON `tag_translations` (`tag_id`,`lang`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tags_slug` ON `tags` (`category`,`slug`);