import test from "node:test";
import assert from "node:assert/strict";

import { recommendGrade } from "../app/lib/moc/grade-engine.ts";
import { gradeRules } from "../app/lib/moc/grade-rules.ts";

test("grade 1 outranks grade 2 and recommends HAZOP", () => {
  const result = recommendGrade(["G1-ESD", "G2-PID-PIPE"], []);
  assert.equal(result.recommendedGrade, "1");
  assert.equal(result.recommendedRiskAssessment, "HAZOP");
  assert.equal(result.requiresCommittee, true);
});

test("grade 2 outranks grade 3", () => {
  const result = recommendGrade(["G2-PID-PIPE", "G3-SIMPLE-VALVE"], []);
  assert.equal(result.recommendedGrade, "2");
});

test("grade 3 recommends Check List and does not require committee by grade", () => {
  const result = recommendGrade(["G3-LIGHTING"], []);
  assert.equal(result.recommendedGrade, "3");
  assert.equal(result.recommendedRiskAssessment, "CHECK_LIST");
  assert.equal(result.requiresCommittee, false);
});

test("no match is not auto-confirmed", () => {
  const result = recommendGrade([], []);
  assert.equal(result.recommendedGrade, "UNDETERMINED");
  assert.equal(result.requiresCommittee, true);
});

test("unknown answer prevents automatic grade even when a lower rule matched", () => {
  const result = recommendGrade(["G3-LIGHTING"], ["G2-PID-PIPE"]);
  assert.equal(result.recommendedGrade, "UNDETERMINED");
  assert.match(result.reasons.join(" "), /확인되지 않은/);
});

test("Appendix 3 dataset has every grade group and unique IDs", () => {
  assert.equal(gradeRules.filter((rule) => rule.grade === "1").length, 8);
  assert.ok(gradeRules.filter((rule) => rule.grade === "2").length >= 40);
  assert.ok(gradeRules.filter((rule) => rule.grade === "3").length >= 49);
  assert.equal(new Set(gradeRules.map((rule) => rule.id)).size, gradeRules.length);
  assert.ok(gradeRules.every((rule) => rule.guidelineSection === "붙임 3 변경관리등급 기준"));
});

test("important document rows have stable rule IDs", () => {
  for (const id of ["G1-DESIGNATED-QUANTITY", "G2-HIGH-TEMP-PRESSURE", "G2-ESD-SIL", "G3-EXCHANGER-BUNDLE", "G3-SAFETY-IMPROVEMENT"]) {
    assert.ok(gradeRules.some((rule) => rule.id === id), `${id} 규칙이 필요합니다.`);
  }
});
