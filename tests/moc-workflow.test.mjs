import test from "node:test";
import assert from "node:assert/strict";

import { createEmptyMocCase } from "../app/lib/moc/defaults.ts";
import { cloneProcessSafetyDocuments, cloneReviewItems } from "../app/lib/moc/forms.ts";
import { deriveWorkflowStatus, validateCompletion } from "../app/lib/moc/workflow.ts";

function baseChange(grade = "2") {
  const item = createEmptyMocCase({ id: "case", caseNumber: "MOC-1", title: "변경", workType: "배관", site: "포항라임공장" });
  item.replacementDecision = { result: "CHANGE", comparisons: {}, matchedCriteria: [], reasons: [], requiresCommittee: false, decidedAt: "2026-08-01" };
  item.gradeDecision = { recommendedGrade: grade, matchedRules: [], reasons: [], requiresCommittee: grade !== "3", decidedAt: "2026-08-01" };
  return item;
}

test("simple replacement stops after judgment", () => {
  const item = baseChange("3");
  item.replacementDecision.result = "SIMPLE_REPLACEMENT";
  item.gradeDecision = undefined;
  assert.equal(deriveWorkflowStatus(item), "SIMPLE_REPLACEMENT");
});

test("grade 2 cannot implement before committee and approval", () => {
  const item = baseChange("2");
  assert.equal(deriveWorkflowStatus(item), "COMMITTEE_REVIEW");
  item.committee = { held: true, heldAt: "2026-08-02", members: ["운전", "정비", "안전"], decision: "APPROVED" };
  assert.equal(deriveWorkflowStatus(item), "APPROVAL_PENDING");
});

test("grade 3 skips committee but still needs leader approval", () => {
  const item = baseChange("3");
  assert.equal(deriveWorkflowStatus(item), "APPROVAL_PENDING");
});

test("training and pre-startup inspection block completion", () => {
  const item = baseChange("3");
  item.approval = { approved: true, approverRole: "설비운전파트장", approvedAt: "2026-08-02" };
  item.workCompleted = true;
  item.processSafetyDocuments = cloneProcessSafetyDocuments();
  item.reviewItems = cloneReviewItems().map((review) => ({ ...review, applicable: false, confirmed: true }));
  item.training.records = [{ id: "t1", audience: "OPERATOR", content: "변경교육", attendees: [], required: true, completed: false }];

  const errors = validateCompletion(item);
  assert.ok(errors.some((error) => error.code === "TRAINING_INCOMPLETE"));
  assert.ok(errors.some((error) => error.code === "PRE_STARTUP_INCOMPLETE"));
});

test("open Punch List enters corrective action and blocks completion", () => {
  const item = baseChange("3");
  item.approval.approved = true;
  item.workCompleted = true;
  item.processSafetyDocuments = cloneProcessSafetyDocuments();
  item.reviewItems = cloneReviewItems().map((review) => ({ ...review, applicable: false, confirmed: true }));
  item.preStartupInspection.finalResult = "UNSUITABLE";
  item.preStartupInspection.punchItems = [{ id: "p1", description: "보호커버 설치", completed: false }];
  assert.equal(deriveWorkflowStatus(item), "CORRECTIVE_ACTION");
  assert.ok(validateCompletion(item).some((error) => error.code === "PUNCH_ITEMS_OPEN"));
});

test("all required records produce completed status", () => {
  const item = baseChange("3");
  item.approval = { approved: true, approverRole: "설비운전파트장", approvedAt: "2026-08-02" };
  item.workCompleted = true;
  item.processSafetyDocuments = cloneProcessSafetyDocuments();
  item.reviewItems = cloneReviewItems().map((review) => ({ ...review, applicable: false, confirmed: true }));
  item.training.records = [{ id: "t1", audience: "OPERATOR", content: "변경교육", attendees: ["홍길동"], required: true, completed: true, completedDate: "2026-08-03" }];
  item.preStartupInspection.finalResult = "SUITABLE";
  assert.deepEqual(validateCompletion(item), []);
  assert.equal(deriveWorkflowStatus(item), "COMPLETED");
});

test("temporary change requires technical review, risk assessment, site tag and restoration", () => {
  const item = baseChange("3");
  item.basicInfo.duration = "TEMPORARY";
  item.basicInfo.temporaryStartDate = "2026-08-01";
  item.basicInfo.temporaryEndDate = "2026-08-20";
  item.approval.approved = true;
  item.workCompleted = true;
  item.reviewItems = cloneReviewItems().map((review) => ({ ...review, applicable: false, confirmed: true }));
  item.training.records = [];
  item.preStartupInspection.finalResult = "SUITABLE";
  const codes = validateCompletion(item).map((error) => error.code);
  assert.ok(codes.includes("TEMPORARY_TECHNICAL_REVIEW_INCOMPLETE"));
  assert.ok(codes.includes("TEMPORARY_RISK_ASSESSMENT_INCOMPLETE"));
  assert.ok(codes.includes("TEMPORARY_SITE_TAG_INCOMPLETE"));
  assert.ok(codes.includes("TEMPORARY_RESTORATION_INCOMPLETE"));
});

test("emergency change requires post-review before completion", () => {
  const item = baseChange("3");
  item.basicInfo.changeKind = "EMERGENCY";
  item.approval.approved = true;
  item.workCompleted = true;
  item.reviewItems = cloneReviewItems().map((review) => ({ ...review, applicable: false, confirmed: true }));
  item.preStartupInspection.finalResult = "SUITABLE";
  assert.ok(validateCompletion(item).some((error) => error.code === "EMERGENCY_POST_REVIEW_INCOMPLETE"));
});
