ALTER TABLE `moc_cases` ADD `site` text DEFAULT '포항라임공장' NOT NULL;
--> statement-breakpoint
ALTER TABLE `moc_cases` ADD `schema_version` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `moc_cases` ADD `basic_info_json` text DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `moc_cases` ADD `replacement_decision_json` text;
--> statement-breakpoint
ALTER TABLE `moc_cases` ADD `grade_decision_json` text;
--> statement-breakpoint
ALTER TABLE `moc_cases` ADD `workflow_json` text DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `moc_cases` ADD `business_records_json` text DEFAULT '{}' NOT NULL;
--> statement-breakpoint
CREATE INDEX `moc_cases_site_status_idx` ON `moc_cases` (`site`, `status`);
