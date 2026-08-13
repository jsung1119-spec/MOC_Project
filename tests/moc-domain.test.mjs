import test from "node:test";
import assert from "node:assert/strict";

import { createEmptyMocCase } from "../app/lib/moc/defaults.ts";
import { normalizeMocCasesV2 } from "../app/lib/moc/migration.ts";

test("legacy non-target judgment migrates to simple replacement", () => {
  const [item] = normalizeMocCasesV2([{
    id: "old",
    caseNumber: "MOC-2026-001",
    title: "동급 교체",
    workType: "기계 설비",
    author: "작성자",
    department: "생산팀",
    site: "포항라임공장",
    status: "JUDGMENT_COMPLETED",
    createdAt: "2026-08-01",
    dueDate: "2026-08-10",
    answers: {},
    judgment: { isMocTarget: false, grade: "NONE", evidences: [] },
    draft: {},
  }]);

  assert.equal(item.schemaVersion, 2);
  assert.equal(item.replacementDecision?.result, "SIMPLE_REPLACEMENT");
  assert.equal(item.workflow.status, "SIMPLE_REPLACEMENT");
  assert.equal(item.title, "동급 교체");
});

test("legacy target judgment keeps its grade as a recommendation", () => {
  const [item] = normalizeMocCasesV2([{
    id: "target",
    title: "배관 변경",
    workType: "배관",
    site: "포항화성공장",
    status: "JUDGMENT_COMPLETED",
    judgment: { isMocTarget: true, grade: "2", evidences: [] },
  }]);

  assert.equal(item.replacementDecision?.result, "CHANGE");
  assert.equal(item.gradeDecision?.recommendedGrade, "2");
  assert.equal(item.workflow.status, "REVIEW_PENDING");
});

test("new case defaults do not invent approvals or completions", () => {
  const item = createEmptyMocCase({
    id: "new",
    caseNumber: "MOC-2026-002",
    title: "배관 변경",
    workType: "배관",
    site: "포항라임공장",
  });

  assert.equal(item.schemaVersion, 2);
  assert.equal(item.workflow.status, "DRAFT");
  assert.equal(item.committee.held, false);
  assert.equal(item.approval.approved, false);
  assert.deepEqual(item.training.records, []);
  assert.deepEqual(item.statusHistory, []);
});

test("normalization rejects non-array input and keeps valid site isolation", () => {
  assert.deepEqual(normalizeMocCasesV2(null), []);
  const [item] = normalizeMocCasesV2([{ id: "one", title: "변경", site: "포항화성공장" }]);
  assert.equal(item.site, "포항화성공장");
});
