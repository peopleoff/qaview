PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email_id` integer,
	`src` text,
	`alt` text,
	`status` integer,
	`height` integer,
	`width` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`email_id`) REFERENCES `emails`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_images`("id", "email_id", "src", "alt", "status", "height", "width", "created_at", "updated_at") SELECT "id", "email_id", "src", "alt", "status", "height", "width", "created_at", "updated_at" FROM `images`;--> statement-breakpoint
DROP TABLE `images`;--> statement-breakpoint
ALTER TABLE `__new_images` RENAME TO `images`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email_id` integer,
	`text` text,
	`url` text,
	`status` integer,
	`screenshot_url` text,
	`redirect_chain` text,
	`final_url` text,
	`utm_params` text,
	`screenshot_path` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`email_id`) REFERENCES `emails`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_links`("id", "email_id", "text", "url", "status", "screenshot_url", "redirect_chain", "final_url", "utm_params", "screenshot_path", "created_at", "updated_at") SELECT "id", "email_id", "text", "url", "status", "screenshot_url", "redirect_chain", "final_url", "utm_params", "screenshot_path", "created_at", "updated_at" FROM `links`;--> statement-breakpoint
DROP TABLE `links`;--> statement-breakpoint
ALTER TABLE `__new_links` RENAME TO `links`;