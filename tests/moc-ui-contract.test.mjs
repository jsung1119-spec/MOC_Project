import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("new MOC form captures every guideline minimum field", async () => {
  const source = await read("../app/components/moc/NewMocCaseForm.tsx");
  for (const field of ["title", "writtenDate", "plannedCompletionDate", "reason", "description", "targetEquipment", "workType", "beforeState", "beforeImageDataUrl", "changeKind", "duration", "temporaryStartDate", "temporaryEndDate"]) {
    assert.match(source, new RegExp(field));
  }
  assert.match(source, /type="file"/);
  assert.match(source, /validateBasicInfo/);
});

test("new MOC form places title above future-only written and completion dates and syncs the due date", async () => {
  const form = await read("../app/components/moc/NewMocCaseForm.tsx");
  const page = await read("../app/page.tsx");

  assert.match(form, /form-grid basic-info-grid/);
  assert.match(form, /basic-info-title/);
  assert.match(form, /label="변경완료 예정"/);
  assert.match(form, /min=\{today\}/);
  assert.match(page, /dueDate: info\.plannedCompletionDate \?\? ""/);
});

test("replacement questionnaire consumes the Appendix 2 dataset", async () => {
  const source = await read("../app/components/moc/ReplacementQuestionnaire.tsx");
  assert.match(source, /criteriaForAsset/);
  assert.match(source, /judgeReplacement/);
  assert.match(source, /questionList/);
  assert.match(source, /replacement:\$\{criterion\.id\}/);
  assert.match(source, /SAME/);
  assert.match(source, /DIFFERENT/);
  assert.match(source, /UNKNOWN/);
  assert.match(source, /NOT_APPLICABLE/);
  assert.match(source, /해당 없음/);
});

test("grade questionnaire presents Appendix 3 as a multi-select table", async () => {
  const source = await read("../app/components/moc/GradeQuestionnaire.tsx");
  assert.match(source, /gradeRules/);
  assert.match(source, /recommendGrade/);
  assert.match(source, /<th>구분<\/th><th>대상항목<\/th><th>해당<\/th>/);
  assert.match(source, /type="checkbox"/);
  assert.match(source, /selectedRuleIds\.length === 0/);
  assert.match(source, /1·2등급으로 판정되면 변경관리위원회/);
  assert.doesNotMatch(source, /questionList/);
  assert.doesNotMatch(source, /inferGradeCandidateIds/);
});

test("active new-case flow uses the guideline screens and does not call legacy judge", async () => {
  const source = await read("../app/page.tsx");
  assert.match(source, /NewMocCaseForm/);
  assert.match(source, /ReplacementQuestionnaire/);
  assert.match(source, /GradeQuestionnaire/);
  const runBlock = source.match(/function runGuidelineReplacement[\s\S]*?\n  }/)?.[0] ?? "";
  assert.doesNotMatch(runBlock, /judge\(/);
});
