PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`direction` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`currency` text NOT NULL,
	`fx_rate` text NOT NULL,
	`fx_source` text NOT NULL,
	`amount_thb_minor` integer NOT NULL,
	`occurred_at` text NOT NULL,
	`counterparty` text,
	`category_id` integer NOT NULL,
	`note` text,
	`slip_ref` text,
	`image_path` text,
	`source` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "records_amount_check" CHECK("__new_records"."amount_minor" > 0),
	CONSTRAINT "records_amount_thb_check" CHECK("__new_records"."amount_thb_minor" >= 0),
	CONSTRAINT "records_currency_check" CHECK(length("__new_records"."currency") = 3),
	CONSTRAINT "records_direction_check" CHECK("__new_records"."direction" in ('income', 'expense')),
	CONSTRAINT "records_fx_source_check" CHECK("__new_records"."fx_source" in ('auto', 'manual')),
	CONSTRAINT "records_source_check" CHECK("__new_records"."source" in ('ai', 'manual'))
);
--> statement-breakpoint
INSERT INTO `__new_records`("id", "direction", "amount_minor", "currency", "fx_rate", "fx_source", "amount_thb_minor", "occurred_at", "counterparty", "category_id", "note", "slip_ref", "image_path", "source", "created_at", "updated_at") SELECT "id", "direction", "amount_minor", "currency", "fx_rate", "fx_source", "amount_thb_minor", "occurred_at", "counterparty", "category_id", "note", "slip_ref", "image_path", "source", "created_at", "updated_at" FROM `records`;--> statement-breakpoint
DROP TABLE `records`;--> statement-breakpoint
ALTER TABLE `__new_records` RENAME TO `records`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `records_occurred_at_idx` ON `records` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `records_category_id_idx` ON `records` (`category_id`);--> statement-breakpoint
CREATE INDEX `records_duplicate_check_idx` ON `records` (`slip_ref`,`occurred_at`,`amount_minor`);--> statement-breakpoint
CREATE TABLE `__new_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`direction` text NOT NULL,
	`sort_order` integer NOT NULL,
	CONSTRAINT "categories_direction_check" CHECK("__new_categories"."direction" in ('income', 'expense'))
);
--> statement-breakpoint
INSERT INTO `__new_categories`("id", "name", "direction", "sort_order") SELECT "id", "name", "direction", "sort_order" FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_direction_unique` ON `categories` (`name`,`direction`);