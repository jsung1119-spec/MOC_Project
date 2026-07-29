import assert from "node:assert/strict";
import test from "node:test";
import { judge, visibleQuestions } from "../app/lib/moc.ts";

test("시나리오 A: 동일 규격 단순 교체는 비대상", () => {
  const result = judge({ same_spec: "YES", capacity: "NO", material: "NO", operating: "NO", logic: "NO", hazard: "NO" });
  assert.equal(result.isMocTarget, false);
  assert.equal(result.grade, "NONE");
  assert.equal(result.requiresHumanReview, false);
  assert.ok(result.evidences.some((e) => e.ruleId === "R-001"));
});

test("시나리오 B: 재질 변경과 위험 증가 시 2등급", () => {
  const result = judge({ same_spec: "NO", material: "YES", operating: "NO", hazard: "YES", major: "NO" });
  assert.equal(result.isMocTarget, true);
  assert.equal(result.grade, "2");
  assert.equal(result.riskLevel, "MEDIUM");
  assert.ok(result.requiredDocumentIds.includes("위험성 검토서"));
});

test("시나리오 C: 불확실 답변은 담당자 검토 필요", () => {
  const result = judge({ same_spec: "NO", logic: "UNKNOWN", hazard: "UNKNOWN" });
  assert.equal(result.requiresHumanReview, true);
  assert.equal(result.riskLevel, "REVIEW_REQUIRED");
  assert.ok(result.evidences.some((e) => e.ruleId === "R-008"));
});

test("중대 공정조건 변경은 1등급", () => {
  const result = judge({ same_spec: "NO", hazard: "YES", major: "YES" });
  assert.equal(result.grade, "1");
  assert.equal(result.riskLevel, "HIGH");
});

test("동일 규격과 변경 항목 동시 선택은 상충으로 기록", () => {
  const result = judge({ same_spec: "YES", material: "YES", hazard: "NO" });
  assert.equal(result.requiresHumanReview, true);
  assert.equal(result.conflicts.length, 1);
});

test("위험 증가가 아니면 중대 변경 보충 질문을 숨김", () => {
  const list = visibleQuestions({ hazard: "NO" });
  assert.equal(list.some((q) => q.id === "major"), false);
});
