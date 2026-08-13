"use client";

import { useEffect, useMemo, useState } from "react";
import { criteriaForAsset, type AssetType } from "../../lib/moc/replacement-criteria";
import { judgeReplacement, type ReplacementJudgmentResult } from "../../lib/moc/replacement-engine";
import type { ComparisonValue } from "../../lib/moc/types";

const answers: Array<{ value: ComparisonValue; label: string; help: string }> = [
  { value: "SAME", label: "기존과 동일", help: "규격·재질·성능이 같습니다." },
  { value: "DIFFERENT", label: "기존과 다름", help: "하나 이상의 조건이 달라집니다." },
  { value: "UNKNOWN", label: "잘 모르겠음", help: "위원회 검토 필요로 기록됩니다." },
];

export function ReplacementQuestionnaire({ assetType, targetName, onComplete, onTemporarySave, onBack, initialComparisons, draftKey }: { assetType: AssetType; targetName: string; onComplete: (result: ReplacementJudgmentResult, comparisons: Record<string, ComparisonValue>) => void; onTemporarySave: (comparisons: Record<string, ComparisonValue>) => void; onBack: () => void; initialComparisons?: Record<string, ComparisonValue>; draftKey?: string }) {
  const criteria = useMemo(() => criteriaForAsset(assetType), [assetType]);
  const [index, setIndex] = useState(0);
  const [comparisons, setComparisons] = useState<Record<string, ComparisonValue>>(initialComparisons ?? {});
  useEffect(() => {
    const saved = initialComparisons ?? {};
    setComparisons(saved);
    const firstUnanswered = criteria.findIndex((criterion) => !saved[criterion.id]);
    setIndex(firstUnanswered < 0 ? Math.max(0, criteria.length - 1) : firstUnanswered);
  }, [draftKey, assetType, criteria, initialComparisons]);
  const current = criteria[index];
  if (!current) return <section className="question-card"><h1>적용 가능한 판정 기준이 없습니다.</h1><button className="btn primary" onClick={() => onComplete(judgeReplacement({ assetType, comparisons }), comparisons)}>위원회 검토로 기록</button></section>;
  const selected = comparisons[current.id];
  const choose = (value: ComparisonValue) => setComparisons((values) => ({ ...values, [current.id]: value }));
  const finish = () => onComplete(judgeReplacement({ assetType, comparisons }), comparisons);

  return <div className="focused-page"><div className="step-head"><button className="back-link" onClick={onBack}>← 기본정보</button><div><span>변경 / 단순교체 판정</span><b>{index + 1} / {criteria.length}</b></div><div className="progress-track"><i style={{ width: `${((index + 1) / criteria.length) * 100}%` }}/></div></div>
    <section className="question-card"><div className="question-meta"><span className="security-chip">붙임 2 변경판정 기준</span><span>{targetName}</span></div><h1>{current.label}이(가) 기존과 동일합니까?</h1><p className="question-help"><span>i</span>단순교체는 이 대상에 지정된 비교항목이 모두 동일한 경우에만 인정됩니다.</p>
      <div className="answer-grid">{answers.map((answer) => <button key={answer.value} className={selected === answer.value ? "selected" : ""} onClick={() => choose(answer.value)}><span className="radio">{selected === answer.value ? "●" : ""}</span><b>{answer.label}</b><small>{answer.help}</small></button>)}</div>
      <div className="guideline-link">▤ 관련 기준: 붙임 2 변경판정 기준 · {current.label}</div>
      <div className="question-footer"><button className="btn ghost" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>← 이전</button><button type="button" className="btn soft" onClick={() => onTemporarySave(comparisons)}>임시저장</button>{index < criteria.length - 1 ? <button className="btn primary" disabled={!selected} onClick={() => setIndex((value) => value + 1)}>다음 질문 →</button> : <button className="btn primary" disabled={!selected} onClick={finish}>변경판정 실행 →</button>}</div>
    </section></div>;
}
