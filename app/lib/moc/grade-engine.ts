import { gradeRules, type GradeRule } from "./grade-rules.ts";
import type { Grade, RiskAssessmentMethod } from "./types.ts";

export interface GradeRecommendation {
  recommendedGrade: Grade;
  matchedRules: GradeRule[];
  reasons: string[];
  requiresCommittee: boolean;
  recommendedRiskAssessment?: RiskAssessmentMethod;
}

const rank: Record<GradeRule["grade"], number> = { "1": 1, "2": 2, "3": 3 };

export function recommendGrade(answeredRuleIds: string[], unknownRuleIds: string[]): GradeRecommendation {
  const matchedRules = gradeRules.filter((rule) => answeredRuleIds.includes(rule.id));
  const unknownRules = gradeRules.filter((rule) => unknownRuleIds.includes(rule.id));

  if (unknownRules.length > 0) {
    return {
      recommendedGrade: "UNDETERMINED",
      matchedRules,
      reasons: [`상위 등급 가능성을 포함해 확인되지 않은 기준 ${unknownRules.length}개가 있어 자동 등급을 확정하지 않습니다.`],
      requiresCommittee: true,
    };
  }

  if (matchedRules.length === 0) {
    return {
      recommendedGrade: "UNDETERMINED",
      matchedRules: [],
      reasons: ["붙임 3에서 일치하는 등급 기준을 확인할 수 없어 변경관리위원회 검토가 필요합니다."],
      requiresCommittee: true,
    };
  }

  const recommendedGrade = [...matchedRules].sort((left, right) => rank[left.grade] - rank[right.grade])[0].grade;
  const highestRules = matchedRules.filter((rule) => rule.grade === recommendedGrade);
  return {
    recommendedGrade,
    matchedRules,
    reasons: [
      ...highestRules.map((rule) => `${rule.title}에 해당하여 ${rule.grade}등급 기준을 적용했습니다.`),
      ...(new Set(matchedRules.map((rule) => rule.grade)).size > 1 ? ["둘 이상의 기준이 중복되어 가장 높은 등급을 추천했습니다."] : []),
    ],
    requiresCommittee: recommendedGrade === "1" || recommendedGrade === "2",
    recommendedRiskAssessment: recommendedGrade === "3" ? "CHECK_LIST" : "HAZOP",
  };
}
