ALTER TABLE `emails` RENAME COLUMN "filePath" TO "file_path";--> statement-breakpoint
ALTER TABLE `emails` RENAME COLUMN "screenshotUrl" TO "screenshot_url";--> statement-breakpoint
ALTER TABLE `emails` RENAME COLUMN "linksId" TO "links_id";--> statement-breakpoint
ALTER TABLE `emails` RENAME COLUMN "imagesId" TO "images_id";--> statement-breakpoint
ALTER TABLE `emails` RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE `emails` ADD `updated_at` integer NOT NULL;