CREATE TABLE `card_blocks` (
	`card_id` integer NOT NULL,
	`block` text NOT NULL,
	PRIMARY KEY(`card_id`, `block`),
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `card_tags` (
	`card_id` integer NOT NULL,
	`tag` text NOT NULL,
	PRIMARY KEY(`card_id`, `tag`),
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`contact` text NOT NULL,
	`course_code` text NOT NULL,
	`idea` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
DROP TABLE IF EXISTS `messages`;