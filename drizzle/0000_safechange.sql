CREATE TABLE `users` (
  `id` text PRIMARY KEY NOT NULL,
  `login_id` text NOT NULL UNIQUE,
  `password_hash` text NOT NULL,
  `name` text NOT NULL,
  `department` text NOT NULL,
  `role` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `moc_cases` (
  `id` text PRIMARY KEY NOT NULL,
  `case_number` text NOT NULL UNIQUE,
  `title` text NOT NULL,
  `work_type` text NOT NULL,
  `author_id` text NOT NULL,
  `department` text NOT NULL,
  `is_moc_target` integer,
  `grade` text,
  `risk_level` text,
  `status` text NOT NULL,
  `planned_start_date` text,
  `planned_end_date` text,
  `submitted_at` text,
  `completed_at` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `moc_answers` (
  `id` text PRIMARY KEY NOT NULL,
  `moc_case_id` text NOT NULL,
  `question_id` text NOT NULL,
  `answer_value` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `moc_judgments` (
  `id` text PRIMARY KEY NOT NULL,
  `moc_case_id` text NOT NULL,
  `is_moc_target` integer NOT NULL,
  `grade` text NOT NULL,
  `risk_level` text NOT NULL,
  `summary` text NOT NULL,
  `requires_human_review` integer NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `moc_evidences` (
  `id` text PRIMARY KEY NOT NULL,
  `judgment_id` text NOT NULL,
  `rule_id` text NOT NULL,
  `title` text NOT NULL,
  `description` text NOT NULL,
  `guideline_section` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `required_documents` (
  `id` text PRIMARY KEY NOT NULL,
  `moc_case_id` text NOT NULL,
  `document_type` text NOT NULL,
  `required` integer NOT NULL,
  `status` text NOT NULL,
  `content_json` text DEFAULT '{}' NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `status_histories` (
  `id` text PRIMARY KEY NOT NULL,
  `moc_case_id` text NOT NULL,
  `previous_status` text,
  `new_status` text NOT NULL,
  `changed_by` text NOT NULL,
  `memo` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reminders` (
  `id` text PRIMARY KEY NOT NULL,
  `moc_case_id` text NOT NULL,
  `reminder_type` text NOT NULL,
  `scheduled_at` text NOT NULL,
  `sent_at` text,
  `status` text NOT NULL,
  `recipient_email` text NOT NULL,
  `message` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guidelines` (
  `id` text PRIMARY KEY NOT NULL,
  `section_code` text NOT NULL UNIQUE,
  `title` text NOT NULL,
  `content` text NOT NULL,
  `active` integer DEFAULT true NOT NULL,
  `version` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `decision_rules` (
  `id` text PRIMARY KEY NOT NULL,
  `rule_code` text NOT NULL UNIQUE,
  `name` text NOT NULL,
  `condition_json` text NOT NULL,
  `result_json` text NOT NULL,
  `guideline_id` text,
  `priority` integer NOT NULL,
  `active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `questions` (
  `id` text PRIMARY KEY NOT NULL,
  `sort_order` integer NOT NULL,
  `category` text NOT NULL,
  `text` text NOT NULL,
  `description` text,
  `answer_type` text NOT NULL,
  `options_json` text NOT NULL,
  `visible_when_json` text,
  `guideline_section` text,
  `active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `moc_answers_case_question_unique`
  ON `moc_answers` (`moc_case_id`, `question_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `reminders_dedupe_unique`
  ON `reminders` (`moc_case_id`, `reminder_type`, `scheduled_at`);
