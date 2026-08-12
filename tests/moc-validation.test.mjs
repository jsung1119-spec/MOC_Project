import test from "node:test";
import assert from "node:assert/strict";

import { implementationPlanTemplate, processSafetyDocumentTemplate, reviewTemplate } from "../app/lib/moc/forms.ts";
import { validateBasicInfo } from "../app/lib/moc/validation.ts";

const validBasicInfo = {
  title: "T-101 배관 변경",
  reason: "부식 개선",
  description: "탄소강 배관을 스테인리스 배관으로 변경",
  targetEquipment: "T-101 이송배관",
  workType: "배관",
  beforeState: "CS 배관",
  afterState: "STS 배관",
  changeKind: "NORMAL",
  duration: "PERMANENT",
};

test("temporary period above 30 inclusive days is rejected", () => {
  const errors = validateBasicInfo({ ...validBasicInfo, duration: "TEMPORARY", temporaryStartDate: "2026-08-01", temporaryEndDate: "2026-08-31" });
  assert.ok(errors.some((error) => error.code === "TEMPORARY_PERIOD_EXCEEDED"));
});

test("temporary period of 30 inclusive days is accepted", () => {
  const errors = validateBasicInfo({ ...validBasicInfo, duration: "TEMPORARY", temporaryStartDate: "2026-08-01", temporaryEndDate: "2026-08-30" });
  assert.equal(errors.length, 0);
});

test("temporary dates are required and end cannot precede start", () => {
  assert.ok(validateBasicInfo({ ...validBasicInfo, duration: "TEMPORARY" }).some((error) => error.code === "TEMPORARY_DATES_REQUIRED"));
  assert.ok(validateBasicInfo({ ...validBasicInfo, duration: "TEMPORARY", temporaryStartDate: "2026-08-10", temporaryEndDate: "2026-08-01" }).some((error) => error.code === "TEMPORARY_DATE_ORDER"));
});

test("all minimum basic fields are required with an action message", () => {
  const errors = validateBasicInfo({ ...validBasicInfo, title: "", reason: "" });
  assert.deepEqual(errors.map((error) => error.field), ["title", "reason"]);
  assert.ok(errors.every((error) => error.action.length > 0));
});

test("Appendix forms contain the complete guideline groups", () => {
  assert.equal(reviewTemplate.length, 16);
  assert.ok(implementationPlanTemplate.some((item) => item.title === "Punch List 작성 및 개선 실시"));
  assert.ok(implementationPlanTemplate.some((item) => item.title === "산업안전보건법 등 관련 법규 적용 여부"));
  assert.ok(processSafetyDocumentTemplate.some((item) => item.title === "P&ID"));
  assert.ok(processSafetyDocumentTemplate.some((item) => item.title === "Relief System 자료"));
});
