CREATE TABLE `places` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`building` text NOT NULL,
	`location_note` text,
	`cuisine` text NOT NULL,
	`price_range` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
DROP TABLE `messages`;