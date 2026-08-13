import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("guideline cases use the process workspace after judgment, while unfinished drafts resume their saved step", () => {
  assert.match(page, /function continueCase\(item: MocCase\)/);
  assert.match(page, /if \(item\.schemaVersion === 2\) return go\(item\.replacementDecision\?\.result === "SIMPLE_REPLACEMENT" \? "guideline_result" : "process"\)/);
  assert.match(page, /function resumeGuidelineDraft/);
  assert.match(page, /if \(!item\.replacementDecision\) return go\("new"\)/);
  assert.match(page, /item\.replacementDecision\.result === "UNDETERMINED"\) return go\("replacement"\)/);
  assert.match(page, /item\.replacementDecision\.result === "CHANGE" && !item\.gradeDecision\) return go\("grade"\)/);
});

test("approval updates the business approval record, not only a display status", () => {
  const approve = page.match(/function approveCase[\s\S]*?\n  }/)?.[0] ?? "";
  assert.match(approve, /approval:/);
  assert.match(approve, /approverRole/);
  assert.match(approve, /deriveWorkflowStatus/);
});

test("review detail displays guideline basic info, comparison answers and grade answers", () => {
  const detail = page.match(/function MocReviewDetail[\s\S]*?\n}/)?.[0] ?? "";
  assert.match(detail, /basicInfo/);
  assert.match(detail, /replacementDecision/);
  assert.match(detail, /comparisons/);
  assert.match(detail, /gradeRules/);
});

test("approval count excludes simple replacement and remains selected-site scoped", () => {
  assert.match(page, /siteCases\.filter/);
  assert.match(page, /c\.replacementDecision\?\.result === "SIMPLE_REPLACEMENT"/);
  assert.match(page, /function resolvedGrade\(c: MocCase\)/);
});

test("approval closes the selected detail so the approved work disappears from review", () => {
  const approvals = page.match(/function Approvals[\s\S]*?\n}\r?\n\r?\nfunction MocReviewDetail/)?.[0] ?? "";
  assert.match(approvals, /onApprove\(item\.id\); setSelectedCase\(null\);/);
  assert.match(approvals, /items\.filter\(isApprovalQueueCase\)/);
});

test("print output labels the document as guideline based instead of Mock", () => {
  assert.doesNotMatch(page, /본 문서는 Mock 업무지침/);
  assert.match(page, /변경관리 지침 및 붙임 기준/);
});
