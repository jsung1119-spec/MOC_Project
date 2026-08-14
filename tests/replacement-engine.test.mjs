import test from "node:test";
import assert from "node:assert/strict";

import { criteriaForAsset, replacementCriteria } from "../app/lib/moc/replacement-criteria.ts";
import { judgeReplacement } from "../app/lib/moc/replacement-engine.ts";

test("all Appendix 2 pump characteristics equal means simple replacement", () => {
  const comparisons = Object.fromEntries(criteriaForAsset("PUMP").map((criterion) => [criterion.id, "SAME"]));
  const result = judgeReplacement({ assetType: "PUMP", comparisons });

  assert.equal(result.result, "SIMPLE_REPLACEMENT");
  assert.equal(result.requiresCommittee, false);
  assert.match(result.reasons[0], /모두 동일/);
});

test("not applicable Appendix 2 criteria are treated the same as existing conditions", () => {
  const comparisons = Object.fromEntries(criteriaForAsset("PUMP").map((criterion) => [criterion.id, "SAME"]));
  comparisons.sealType = "NOT_APPLICABLE";
  const result = judgeReplacement({ assetType: "PUMP", comparisons });

  assert.equal(result.result, "SIMPLE_REPLACEMENT");
  assert.equal(result.requiresCommittee, false);
});

test("one different required piping characteristic means change", () => {
  const comparisons = Object.fromEntries(criteriaForAsset("PIPING").map((criterion) => [criterion.id, "SAME"]));
  comparisons.material = "DIFFERENT";
  const result = judgeReplacement({ assetType: "PIPING", comparisons });

  assert.equal(result.result, "CHANGE");
  assert.equal(result.matchedCriteria[0].ruleId, "APP2-PIPING-MATERIAL");
  assert.match(result.reasons.join(" "), /재료/);
});

test("unknown required valve characteristic needs committee review", () => {
  const comparisons = Object.fromEntries(criteriaForAsset("VALVE").map((criterion) => [criterion.id, "SAME"]));
  comparisons.type = "UNKNOWN";
  const result = judgeReplacement({ assetType: "VALVE", comparisons });

  assert.equal(result.result, "UNDETERMINED");
  assert.equal(result.requiresCommittee, true);
  assert.match(result.reasons.join(" "), /확인할 수 없는/);
});

test("missing applicable comparison cannot be called simple replacement", () => {
  const result = judgeReplacement({ assetType: "CHEMICAL", comparisons: { composition: "SAME" } });

  assert.equal(result.result, "UNDETERMINED");
  assert.match(result.reasons.join(" "), /미응답/);
});

test("operation and maintenance criteria use the same source data", () => {
  const hotTapping = replacementCriteria.find((criterion) => criterion.id === "hotTapping");
  assert.deepEqual(hotTapping?.assetTypes, ["MAINTENANCE"]);
  assert.equal(hotTapping?.label, "핫탭핑(Hot Tapping) 작업");
});

test("unknown asset type is undetermined instead of silently non-target", () => {
  const result = judgeReplacement({ assetType: "UNKNOWN_ASSET", comparisons: {} });
  assert.equal(result.result, "UNDETERMINED");
  assert.equal(result.requiresCommittee, true);
});
