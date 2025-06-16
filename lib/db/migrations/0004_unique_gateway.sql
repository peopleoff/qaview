CREATE TABLE `spell_errors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email_id` integer NOT NULL,
	`word` text NOT NULL,
	`position` integer NOT NULL,
	`suggestions` text NOT NULL,
	`context` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`email_id`) REFERENCES `emails`(`id`) ON UPDATE no action ON DELETE cascade
);
