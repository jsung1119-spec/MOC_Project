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

test("uncommitted new-change input is discarded when leaving the questionnaire and temporary saves commit it", () => {
  assert.match(page, /const \[uncommittedCaseId, setUncommittedCaseId\] = useState\(""\)/);
  assert.match(page, /function discardUncommittedCase\(\)/);
  assert.match(page, /cases\.filter\(\(item\) => item\.id !== uncommittedCaseId\)/);
  assert.match(page, /if \(uncommittedCaseIdRef\.current && !keepUncommittedCase && next !== view\) discardUncommittedCase\(\)/);
  assert.match(page, /if \(saved\) commitCaseDraft\(\); else markCaseUncommitted\(id\);/);
  assert.match(page, /function saveReplacementDraft[\s\S]*?commitCaseDraft\(\)/);
  assert.match(page, /function saveGradeDraft[\s\S]*?commitCaseDraft\(\)/);
});

test("approval updates the business approval record, not only a display status", () => {
  const approve = page.match(/function approveCase[\s\S]*?\n  }/)?.[0] ?? "";
  assert.match(approve, /candidate = cases\.find/);
  assert.match(approve, /committee\?\.decision === "REJECTED"/);
  assert.match(approve, /위원회 심의 결과가 반려/);
  assert.match(approve, /committee\?\.decision !== "APPROVED"/);
  assert.match(approve, /approval:/);
  assert.match(approve, /approverRole/);
  assert.match(page, /function approvalReviewer\(c: MocCase\) \{ return resolvedGrade\(c\) === "3" \? "설비운영파트장" : "공장장\/리더"; \}/);
  assert.match(page, /approverName: reviewer/);
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

test("approval removes work from the queue without forcibly closing the open detail", () => {
  const approvals = page.match(/function Approvals[\s\S]*?\n}\r?\n\r?\nfunction MocReviewDetail/)?.[0] ?? "";
  assert.match(approvals, /onClick=\{\(\) => onApprove\(item\.id\)\}/);
  assert.doesNotMatch(approvals, /onApprove\(item\.id\); setSelectedCase\(null\);/);
  assert.match(approvals, /items\.filter\(isApprovalQueueCase\)/);
  assert.match(approvals, /site: Site \| null/);
  assert.match(approvals, /작성자 \{site \?\? item\.site\}/);
  assert.match(approvals, /displaySite=\{site\}/);
});

test("review detail can show the selected site in place of a case author", () => {
  const detail = page.match(/function MocReviewDetail[\s\S]*?\n}\r?\n\r?\nfunction History/)?.[0] ?? "";
  assert.match(detail, /displaySite\?: Site \| null/);
  assert.match(detail, /작성자 \{displaySite \?\? item\.author\}/);
});

test("every work-detail entry point passes the selected site as its author label", () => {
  const dashboard = page.match(/function Dashboard[\s\S]*?\n}\r?\n\r?\nfunction countChartData/)?.[0] ?? "";
  const history = page.match(/function History[\s\S]*?\n}\r?\n\r?\nfunction Admin/)?.[0] ?? "";

  assert.match(page, /<Dashboard cases=\{siteCases\} site=\{selectedSite\}/);
  assert.match(dashboard, /site: Site \| null/);
  assert.match(dashboard, /displaySite=\{site\}/);
  assert.match(history, /displaySite=\{site\}/);
});

test("work titles can be renamed from the detail opened by every history view", () => {
  const detail = page.match(/function MocReviewDetail[\s\S]*?\n}\r?\n\r?\nfunction History/)?.[0] ?? "";
  assert.match(page, /function renameCase\(id: string, title: string\)/);
  assert.match(page, /onRename=\{renameCase\}/);
  assert.match(detail, /onRename\?: \(id: string, title: string\) => void/);
  assert.match(detail, /새 작업명을 입력해 주세요/);
  assert.match(detail, /onRename\(item\.id, nextTitle\)/);
  assert.match(detail, /작업명 수정/);
});

test("print output labels the document as guideline based instead of Mock", () => {
  assert.doesNotMatch(page, /본 문서는 Mock 업무지침/);
  assert.match(page, /변경관리 지침 및 붙임 기준/);
});
