CREATE TABLE `emails` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`filePath` text NOT NULL,
	`subject` text,
	`analyzed` integer DEFAULT false NOT NULL,
	`screenshotUrl` text,
	`linksId` integer,
	`imagesId` integer,
	`createdAt` integer NOT NULL
);
