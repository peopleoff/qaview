CREATE TABLE `attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email_id` integer NOT NULL,
	`filename` text NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`path` text NOT NULL,
	`description` text,
	`type` text DEFAULT 'general',
	`is_edited` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`email_id`) REFERENCES `emails`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `emails` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email_id` text,
	`filename` text NOT NULL,
	`file_path` text NOT NULL,
	`subject` text,
	`analyzed` integer DEFAULT false,
	`screenshot_url` text,
	`screenshot_desktop_url` text,
	`screenshot_mobile_url` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email_id` integer NOT NULL,
	`src` text,
	`alt` text,
	`status` integer,
	`height` integer,
	`width` integer,
	`is_edited` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`email_id`) REFERENCES `emails`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email_id` integer NOT NULL,
	`text` text,
	`url` text,
	`status` integer,
	`screenshot_url` text,
	`redirect_chain` text,
	`final_url` text,
	`utm_params` text,
	`screenshot_path` text,
	`is_edited` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`email_id`) REFERENCES `emails`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `qa_checklist` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email_id` integer NOT NULL,
	`item_id` text NOT NULL,
	`item_text` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`note` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`email_id`) REFERENCES `emails`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `qa_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email_id` integer NOT NULL,
	`text` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`email_id`) REFERENCES `emails`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `spell_errors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email_id` integer NOT NULL,
	`word` text,
	`position` integer,
	`suggestions` text,
	`context` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`email_id`) REFERENCES `emails`(`id`) ON UPDATE no action ON DELETE cascade
);
