"use client";

import { useEffect, useMemo, useState } from "react";
import { inferGradeCandidateIds, recommendGrade, type GradeRecommendation } from "../../lib/moc/grade-engine";
import { gradeRules } from "../../lib/moc/grade-rules";
import type { WorkType } from "../../lib/moc/types";

const categoriesByWorkType: Record<WorkType, string[]> = {
  "기계 설비": ["신·증설", "물질 또는 설비", "P&ID", "회전장치", "안전장치", "배관/기계", "안전성 향상"],
  "배관": ["물질 또는 설비", "P&ID", "배관/기계", "안전장치", "안전성 향상"],
  "전기": ["신·증설", "전기설비", "안전성 향상"],
  "계장": ["P&ID", "계측기", "전기설비", "안전장치", "안전성 향상"],
  "운전조건": ["물질 또는 설비", "운전절차", "안전장치"],
  "원료·화학물질": ["물질 또는 설비", "안전성 향상"],
  "작업 절차": ["운전절차", "안전성 향상"],
  "기타": [],
};

type RuleAnswer = "YES" | "NO" | "UNKNOWN";

export function GradeQuestionnaire({ workType, contextText, onComplete, onTemporarySave, onBack, initialAnswers, draftKey }: { workType: WorkType; contextText: string; onComplete: (result: GradeRecommendation, answers: Record<string, RuleAnswer>) => void; onTemporarySave: (answers: Record<string, RuleAnswer>) => void; onBack: () => void; initialAnswers?: Record<string, RuleAnswer>; draftKey?: string }) {
  const suggestedRuleIds = useMemo(() => inferGradeCandidateIds(contextText), [contextText]);
  const rules = useMemo(() => {
    const categories = categoriesByWorkType[workType];
    const scoped = categories.length ? gradeRules.filter((rule) => categories.includes(rule.category)) : gradeRules;
    const suggested = scoped.filter((rule) => suggestedRuleIds.includes(rule.id));
    return suggested.length ? suggested : scoped;
  }, [workType, suggestedRuleIds]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, RuleAnswer>>(initialAnswers ?? {});
  useEffect(() => {
    const saved = initialAnswers ?? {};
    setAnswers(saved);
    const firstUnanswered = rules.findIndex((rule) => !saved[rule.id]);
    setIndex(firstUnanswered < 0 ? Math.max(0, rules.length - 1) : firstUnanswered);
  }, [draftKey, rules, initialAnswers]);
  const current = rules[index];
  const selected = answers[current.id];
  const finish = () => onComplete(recommendGrade(Object.entries(answers).filter(([, answer]) => answer === "YES").map(([id]) => id), Object.entries(answers).filter(([, answer]) => answer === "UNKNOWN").map(([id]) => id)), answers);

  return <div className="focused-page"><div className="step-head"><button className="back-link" onClick={onBack}>← 변경판정</button><div><span>변경관리 등급판정</span><b>{index + 1} / {rules.length}</b></div><div className="progress-track"><i style={{ width: `${((index + 1) / rules.length) * 100}%` }}/></div></div>
    <section className="question-card"><div className="question-meta"><span className="security-chip">붙임 3 · {current.grade}등급 기준</span><span>{current.category}</span></div><h1>{current.title}에 해당합니까?</h1><p className="question-help"><span>i</span>두 개 이상의 기준에 해당하면 가장 높은 등급이 추천됩니다.</p>
      <div className="answer-grid">{([['YES','해당함'], ['NO','해당하지 않음'], ['UNKNOWN','잘 모르겠음']] as const).map(([value, label]) => <button key={value} className={selected === value ? "selected" : ""} onClick={() => setAnswers((items) => ({ ...items, [current.id]: value }))}><span className="radio">{selected === value ? "●" : ""}</span><b>{label}</b>{value === "UNKNOWN" && <small>위원회 검토 필요</small>}</button>)}</div>
      <div className="guideline-link">▤ 관련 기준: 붙임 3 변경관리등급 기준 · {current.ruleId}</div>
      <div className="question-footer"><button className="btn ghost" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>← 이전</button><button type="button" className="btn soft" onClick={() => onTemporarySave(answers)}>임시저장</button>{index < rules.length - 1 ? <button className="btn primary" disabled={!selected} onClick={() => setIndex((value) => value + 1)}>다음 질문 →</button> : <button className="btn primary" disabled={!selected} onClick={finish}>추천 등급 확인 →</button>}</div>
    </section></div>;
}
