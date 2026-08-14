import { type Question } from "../moc.ts";
import { replacementCriteria } from "./replacement-criteria.ts";

/**
 * The administrator's question catalog contains only the Appendix 2 change
 * determination criteria. Grade criteria are maintained separately as Appendix 3.
 */
export function managedQuestions(): Question[] {
  return replacementCriteria.map((criterion, index): Question => ({
    id: `replacement:${criterion.id}`,
    order: index + 1,
    category: "붙임 2 · 변경판정",
    text: `${criterion.label}이(가) 기존과 동일합니까?`,
    description: "기존 설비 또는 절차와 비교하여 선택합니다.",
    guidelineSection: criterion.guidelineSection,
    workTypes: [],
  }));
}

export function mergeManagedQuestions(saved: Question[]) {
  const defaults = managedQuestions();
  const savedById = new Map(saved.map((question) => [question.id, question]));
  return defaults.map((question) => savedById.get(question.id) ?? question);
}
