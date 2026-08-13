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

/** 입력된 변경내용에서 붙임3에 해당할 가능성이 높은 항목을 먼저 찾습니다. */
export function inferGradeCandidateIds(text: string): string[] {
  const source = text.toLowerCase();
  const keywordMap: Array<[string, string[]]> = [
    ["G1-ESD", ["esd", "emergency shutdown", "인터록 추가", "인터록 삭제"]],
    ["G1-REACTOR-STRUCTURE", ["반응기", "reactor"]],
    ["G1-FLARE-STACK", ["flare", "플레어"]],
    ["G1-ELECTRICAL-300KW", ["300kw", "300 kw"]],
    ["G2-PSM-MATERIAL", ["원료 변경", "원재료 변경", "psm 물질"]],
    ["G2-FLAMMABLE", ["인화성", "가연성", "인화점"]],
    ["G2-HIGH-TEMP-PRESSURE", ["고온", "고압", "350℃", "980kpa"]],
    ["G2-PID-LOGIC", ["logic", "로직", "interlock"]],
    ["G2-SAFETY-DEVICE", ["안전밸브", "파열판", "relief"]],
    ["G2-ALARM-CONTROL", ["경보", "alarm", "set point", "설정값"]],
    ["G2-ELECTRICAL-3_3KV", ["3.3kv", "3.3 kv"]],
    ["G3-TRANSMITTER-RANGE", ["transmitter", "트랜스미터", "range"]],
    ["G3-ORIFICE-REPLACE", ["orifice", "오리피스"]],
    ["G3-ELECTRICAL-PANEL", ["전기 패널", "electrical panel"]],
    ["G3-WORK-STANDARD", ["작업표준", "작업 절차"]],
  ];
  return keywordMap.filter(([, keywords]) => keywords.some((keyword) => source.includes(keyword))).map(([id]) => id);
}

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
