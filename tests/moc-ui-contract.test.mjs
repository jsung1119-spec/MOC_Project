import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("new MOC form captures every guideline minimum field", async () => {
  const source = await read("../app/components/moc/NewMocCaseForm.tsx");
  for (const field of ["title", "reason", "description", "targetEquipment", "workType", "beforeState", "beforeImageDataUrl", "changeKind", "duration", "temporaryStartDate", "temporaryEndDate"]) {
    assert.match(source, new RegExp(field));
  }
  assert.match(source, /type="file"/);
  assert.doesNotMatch(source, /label="변경 후 상태"/);
  assert.match(source, /validateBasicInfo/);
});

test("replacement questionnaire consumes the Appendix 2 dataset", async () => {
  const source = await read("../app/components/moc/ReplacementQuestionnaire.tsx");
  assert.match(source, /criteriaForAsset/);
  assert.match(source, /judgeReplacement/);
  assert.match(source, /SAME/);
  assert.match(source, /DIFFERENT/);
  assert.match(source, /UNKNOWN/);
});

test("grade questionnaire consumes Appendix 3 rules and engine", async () => {
  const source = await read("../app/components/moc/GradeQuestionnaire.tsx");
  assert.match(source, /gradeRules/);
  assert.match(source, /recommendGrade/);
  assert.match(source, /해당함/);
  assert.match(source, /잘 모르겠음/);
});

test("active new-case flow uses the guideline screens and does not call legacy judge", async () => {
  const source = await read("../app/page.tsx");
  assert.match(source, /NewMocCaseForm/);
  assert.match(source, /ReplacementQuestionnaire/);
  assert.match(source, /GradeQuestionnaire/);
  const runBlock = source.match(/function runGuidelineReplacement[\s\S]*?\n  }/)?.[0] ?? "";
  assert.doesNotMatch(runBlock, /judge\(/);
});
