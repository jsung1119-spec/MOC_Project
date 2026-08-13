"use client";

import { useEffect, useMemo, useState } from "react";
import { recommendGrade, type GradeRecommendation } from "../../lib/moc/grade-engine";
import { gradeRules } from "../../lib/moc/grade-rules";
import type { WorkType } from "../../lib/moc/types";

type RuleAnswer = "YES" | "NO" | "UNKNOWN";

export function GradeQuestionnaire({ workType, onComplete, onTemporarySave, onBack, initialAnswers, draftKey }: { workType: WorkType; contextText: string; onComplete: (result: GradeRecommendation, answers: Record<string, RuleAnswer>) => void; onTemporarySave: (answers: Record<string, RuleAnswer>) => void; onBack: () => void; initialAnswers?: Record<string, RuleAnswer>; draftKey?: string }) {
  const [answers, setAnswers] = useState<Record<string, RuleAnswer>>(initialAnswers ?? {});
  useEffect(() => setAnswers(initialAnswers ?? {}), [draftKey, initialAnswers]);
  const selectedRuleIds = useMemo(() => Object.entries(answers).filter(([, answer]) => answer === "YES").map(([id]) => id), [answers]);
  const selectedGrades = useMemo(() => gradeRules.filter((rule) => selectedRuleIds.includes(rule.id)).map((rule) => rule.grade), [selectedRuleIds]);
  const highestGrade = selectedGrades.length ? [...selectedGrades].sort()[0] : undefined;
  const toggleRule = (id: string, checked: boolean) => setAnswers((current) => {
    if (checked) return { ...current, [id]: "YES" };
    const next = { ...current };
    delete next[id];
    return next;
  });
  const finish = () => onComplete(recommendGrade(selectedRuleIds, []), answers);

  return <div className="focused-page wide grade-table-page"><div className="step-head"><button className="back-link" onClick={onBack}>← 변경판정</button><div><span>변경관리 등급판정</span><b>붙임 3</b></div><div className="progress-track"><i style={{ width: "100%" }}/></div></div>
    <section className="question-card grade-table-card"><div className="question-meta"><span className="security-chip">붙임 3 · 변경관리등급 기준</span><span>{workType}</span></div><h1>해당 변경 항목을 모두 선택해 주세요.</h1><p className="question-help"><span>i</span>질문을 순서대로 답하지 않습니다. 표에서 해당되는 항목을 여러 개 선택하면, 숫자가 가장 높은 등급(1등급이 최상위)으로 최종 판정합니다. 예: 2등급과 3등급을 함께 선택하면 2등급입니다.</p>
      <div className="grade-selection-summary"><div><b>선택 항목</b><strong>{selectedRuleIds.length}건</strong></div><div><b>예상 최종 등급</b><strong>{highestGrade ? `${highestGrade}등급` : "선택 필요"}</strong></div><small>1·2등급으로 판정되면 변경관리위원회 개최 절차가 자동 적용됩니다.</small></div>
      <div className="grade-table-wrap"><table><thead><tr><th>구분</th><th>대상항목</th><th>해당</th></tr></thead><tbody>{gradeRules.map((rule) => <tr key={rule.id}><td>{rule.category}</td><td>{rule.title}</td><td><label className="grade-check"><input type="checkbox" checked={answers[rule.id] === "YES"} onChange={(event) => toggleRule(rule.id, event.target.checked)}/><span>선택</span></label></td></tr>)}</tbody></table></div>
      <div className="guideline-link">▤ 관련 기준: 붙임 3 변경관리등급 기준 · 여러 기준이 중복되면 가장 높은 등급을 최종 적용</div>
      <div className="question-footer"><button className="btn ghost" onClick={onBack}>← 이전</button><button type="button" className="btn soft" onClick={() => onTemporarySave(answers)}>임시저장</button><button className="btn primary" disabled={selectedRuleIds.length === 0} onClick={finish}>최종 등급 판정 →</button></div>
    </section></div>;
}
