import { criteriaForAsset } from "./replacement-criteria.ts";
import type { ComparisonValue, DecisionEvidence, ReplacementResult } from "./types.ts";

export interface ReplacementJudgmentInput {
  assetType: string;
  comparisons: Record<string, ComparisonValue | string | undefined>;
}

export interface ReplacementJudgmentResult {
  result: ReplacementResult;
  matchedCriteria: DecisionEvidence[];
  reasons: string[];
  requiresCommittee: boolean;
}

function evidence(assetType: string, id: string, label: string, value: string): DecisionEvidence {
  return {
    ruleId: `APP2-${assetType}-${id}`.toUpperCase(),
    title: `${label} 변경`,
    description: `${label} 비교 결과가 '${value === "DIFFERENT" ? "다름" : value}'으로 확인되었습니다.`,
    guidelineSection: "붙임 2 변경판정 기준",
  };
}

export function judgeReplacement(input: ReplacementJudgmentInput): ReplacementJudgmentResult {
  const applicable = criteriaForAsset(input.assetType);
  if (applicable.length === 0) {
    return {
      result: "UNDETERMINED",
      matchedCriteria: [],
      reasons: ["선택한 대상에 적용할 변경판정 기준이 없어 변경관리위원회 검토가 필요합니다."],
      requiresCommittee: true,
    };
  }

  const different = applicable.filter((criterion) => input.comparisons[criterion.id] === "DIFFERENT");
  if (different.length > 0) {
    return {
      result: "CHANGE",
      matchedCriteria: different.map((criterion) => evidence(input.assetType, criterion.id, criterion.label, "DIFFERENT")),
      reasons: different.map((criterion) => `${criterion.label}이(가) 기존과 달라 변경으로 판정했습니다.`),
      requiresCommittee: false,
    };
  }

  const unknown = applicable.filter((criterion) => input.comparisons[criterion.id] === "UNKNOWN");
  const missing = applicable.filter((criterion) => input.comparisons[criterion.id] === undefined || input.comparisons[criterion.id] === "NOT_APPLICABLE");
  if (unknown.length > 0 || missing.length > 0) {
    const reasons = [
      ...unknown.map((criterion) => `${criterion.label}이(가) 기존과 같은지 확인할 수 없는 상태입니다.`),
      ...missing.map((criterion) => `${criterion.label} 비교가 미응답 상태입니다.`),
    ];
    return { result: "UNDETERMINED", matchedCriteria: [], reasons, requiresCommittee: true };
  }

  return {
    result: "SIMPLE_REPLACEMENT",
    matchedCriteria: applicable.map((criterion) => ({
      ruleId: `APP2-${input.assetType}-${criterion.id}`.toUpperCase(),
      title: `${criterion.label} 동일`,
      description: `${criterion.label}이(가) 기존과 동일합니다.`,
      guidelineSection: criterion.guidelineSection,
    })),
    reasons: [`붙임 2의 적용 비교항목 ${applicable.length}개가 모두 동일하여 단순교체로 판정했습니다.`],
    requiresCommittee: false,
  };
}
