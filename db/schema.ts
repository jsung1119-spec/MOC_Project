import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), loginId: text("login_id").notNull().unique(),
  passwordHash: text("password_hash").notNull(), name: text("name").notNull(),
  department: text("department").notNull(), role: text("role").notNull(), ...timestamps,
});
export const mocCases = sqliteTable("moc_cases", {
  id: text("id").primaryKey(), caseNumber: text("case_number").notNull().unique(),
  site: text("site").notNull().default("포항라임공장"),
  schemaVersion: integer("schema_version").notNull().default(1),
  title: text("title").notNull(), workType: text("work_type").notNull(),
  authorId: text("author_id").notNull(), department: text("department").notNull(),
  isMocTarget: integer("is_moc_target", { mode: "boolean" }), grade: text("grade"),
  riskLevel: text("risk_level"), status: text("status").notNull(),
  plannedStartDate: text("planned_start_date"), plannedEndDate: text("planned_end_date"),
  basicInfoJson: text("basic_info_json").notNull().default("{}"),
  replacementDecisionJson: text("replacement_decision_json"),
  gradeDecisionJson: text("grade_decision_json"),
  workflowJson: text("workflow_json").notNull().default("{}"),
  businessRecordsJson: text("business_records_json").notNull().default("{}"),
  submittedAt: text("submitted_at"), completedAt: text("completed_at"), ...timestamps,
});
export const mocAnswers = sqliteTable("moc_answers", {
  id: text("id").primaryKey(), mocCaseId: text("moc_case_id").notNull(),
  questionId: text("question_id").notNull(), answerValue: text("answer_value").notNull(), ...timestamps,
});
export const mocJudgments = sqliteTable("moc_judgments", {
  id: text("id").primaryKey(), mocCaseId: text("moc_case_id").notNull(),
  isMocTarget: integer("is_moc_target", { mode: "boolean" }).notNull(),
  grade: text("grade").notNull(), riskLevel: text("risk_level").notNull(),
  summary: text("summary").notNull(), requiresHumanReview: integer("requires_human_review", { mode: "boolean" }).notNull(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});
export const mocEvidences = sqliteTable("moc_evidences", {
  id: text("id").primaryKey(), judgmentId: text("judgment_id").notNull(),
  ruleId: text("rule_id").notNull(), title: text("title").notNull(),
  description: text("description").notNull(), guidelineSection: text("guideline_section").notNull(),
});
export const requiredDocuments = sqliteTable("required_documents", {
  id: text("id").primaryKey(), mocCaseId: text("moc_case_id").notNull(),
  documentType: text("document_type").notNull(), required: integer("required", { mode: "boolean" }).notNull(),
  status: text("status").notNull(), contentJson: text("content_json").notNull().default("{}"), ...timestamps,
});
export const statusHistories = sqliteTable("status_histories", {
  id: text("id").primaryKey(), mocCaseId: text("moc_case_id").notNull(),
  previousStatus: text("previous_status"), newStatus: text("new_status").notNull(),
  changedBy: text("changed_by").notNull(), memo: text("memo"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});
export const reminders = sqliteTable("reminders", {
  id: text("id").primaryKey(), mocCaseId: text("moc_case_id").notNull(),
  reminderType: text("reminder_type").notNull(), scheduledAt: text("scheduled_at").notNull(),
  sentAt: text("sent_at"), status: text("status").notNull(), recipientEmail: text("recipient_email").notNull(),
  message: text("message").notNull(),
});
export const guidelines = sqliteTable("guidelines", {
  id: text("id").primaryKey(), sectionCode: text("section_code").notNull().unique(),
  title: text("title").notNull(), content: text("content").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  version: text("version").notNull(), ...timestamps,
});
export const decisionRules = sqliteTable("decision_rules", {
  id: text("id").primaryKey(), ruleCode: text("rule_code").notNull().unique(),
  name: text("name").notNull(), conditionJson: text("condition_json").notNull(),
  resultJson: text("result_json").notNull(), guidelineId: text("guideline_id"),
  priority: integer("priority").notNull(), active: integer("active", { mode: "boolean" }).notNull().default(true),
});
export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(), sortOrder: integer("sort_order").notNull(),
  category: text("category").notNull(), text: text("text").notNull(),
  description: text("description"), answerType: text("answer_type").notNull(),
  optionsJson: text("options_json").notNull(), visibleWhenJson: text("visible_when_json"),
  guidelineSection: text("guideline_section"), active: integer("active", { mode: "boolean" }).notNull().default(true),
});
