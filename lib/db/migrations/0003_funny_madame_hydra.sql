ALTER TABLE `links` RENAME COLUMN "url_params" TO "utm_params";--> statement-breakpoint
ALTER TABLE `emails` DROP COLUMN `links_id`;--> statement-breakpoint
ALTER TABLE `emails` DROP COLUMN `images_id`;