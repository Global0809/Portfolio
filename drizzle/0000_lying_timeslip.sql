CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`request_key` text NOT NULL,
	`request_hash` text NOT NULL,
	`slot` integer NOT NULL,
	`email` text NOT NULL,
	`email_hash` text NOT NULL,
	`ip_hash` text NOT NULL,
	`artist` text NOT NULL,
	`song` text NOT NULL,
	`mood` text NOT NULL,
	`link` text NOT NULL,
	`vision` text NOT NULL,
	`inspiration` text NOT NULL,
	`status` text NOT NULL,
	`verify_expires` integer NOT NULL,
	`hold_expires` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_request_key_unique` ON `bookings` (`request_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `one_active_slot` ON `bookings` (`slot`) WHERE "bookings"."status" in ('pending','reserved','started','completed');--> statement-breakpoint
CREATE UNIQUE INDEX `one_active_email` ON `bookings` (`email_hash`) WHERE "bookings"."status" in ('pending','reserved','started');--> statement-breakpoint
CREATE TABLE `email_events` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`provider_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
