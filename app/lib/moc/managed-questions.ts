import { gradeRules } from "./grade-rules.ts";
import { questions, type Question } from "../moc.ts";
import { replacementCriteria } from "./replacement-criteria.ts";

/**
 * A single catalog for the admin screen and every question shown in a new MOC.
 * Prefixes keep Appendix 2 and 3 question IDs separate from the older wizard IDs.
 */
export function managedQuestions(): Question[] {
  const replacement = replacementCriteria.map((criterion, index): Question => ({
    id: `replacement:${criterion.id}`,
    order: questions.length + index + 1,
    category: "붙임 2 · 변경판정",
    text: `${criterion.label}이(가) 기존과 동일합니까?`,
    description: "기존 설비 또는 절차와 비교하여 선택합니다.",
    guidelineSection: criterion.guidelineSection,
    workTypes: [],
  }));
  const grade = gradeRules.map((rule, index): Question => ({
    id: `grade:${rule.id}`,
    order: questions.length + replacement.length + index + 1,
    category: `붙임 3 · ${rule.grade}등급 · ${rule.category}`,
    text: rule.title,
    description: "해당 변경 항목이면 체크하여 등급판정에 반영합니다.",
    guidelineSection: rule.guidelineSection,
    workTypes: [],
  }));
  return [...questions, ...replacement, ...grade];
}

export function mergeManagedQuestions(saved: Question[]) {
  const defaults = managedQuestions();
  const savedById = new Map(saved.map((question) => [question.id, question]));
  return defaults.map((question) => savedById.get(question.id) ?? question);
}
