"use client";

import type { MocCase } from "../../lib/moc";

export function MocDecisionResult({ item, onEdit, onProcess, onDashboard }: { item: MocCase; onEdit: () => void; onProcess: () => void; onDashboard: () => void }) {
  const replacement = item.replacementDecision;
  const grade = item.gradeDecision;
  const simple = replacement?.result === "SIMPLE_REPLACEMENT";
  const undetermined = replacement?.result === "UNDETERMINED" || grade?.recommendedGrade === "UNDETERMINED";
  const evidence = [...(replacement?.matchedCriteria ?? []), ...(grade?.matchedRules ?? [])];
  const reasons = [...(replacement?.reasons ?? []), ...(grade?.reasons ?? [])];

  return <div className="focused-page wide"><div className={`result-hero ${simple ? "non-target" : "target"}`}><div className="result-icon">{undetermined ? "!" : simple ? "○" : "✓"}</div><div><span className="eyebrow">지침 기준 판정이 완료되었습니다</span><h1>{undetermined ? "변경관리위원회 검토가 필요합니다" : simple ? "판정 결과: 단순교체" : "변경으로 판정되었습니다"}</h1><p>{reasons[0] ?? "판정 근거를 확인해 주세요."}</p></div><div className="result-meta"><span>변경판정<b>{replacement?.result === "CHANGE" ? "변경" : replacement?.result === "SIMPLE_REPLACEMENT" ? "단순교체" : "판정불가"}</b></span><span>시스템 추천 등급<b>{grade && grade.recommendedGrade !== "UNDETERMINED" ? `${grade.recommendedGrade}등급` : "-"}</b></span><span>권장 위험성평가<b>{grade?.recommendedRiskAssessment === "CHECK_LIST" ? "Check List" : grade?.recommendedRiskAssessment ?? "-"}</b></span></div></div>
    <div className="result-grid"><section className="card"><div className="card-head"><div><h2>판정 근거</h2><p>변경관리 지침의 붙임 2·3 기준과 선택 답변입니다.</p></div><span className="security-chip">{evidence.length}개 기준</span></div><div className="evidence-list">{evidence.length ? evidence.map((entry, index) => <div key={`${entry.ruleId}-${index}`}><span>{index + 1}</span><div><b>{entry.title}</b><p>{entry.description}</p><small>▤ {entry.guidelineSection} · {entry.ruleId}</small></div></div>) : reasons.map((reason, index) => <div key={reason}><span>{index + 1}</span><div><b>{reason}</b></div></div>)}</div></section>
      <aside className="card result-side"><h2>다음 단계</h2>{simple ? <><p>단순교체 판단 이력과 비교 조건이 저장되었습니다. 일반 변경관리 절차는 진행하지 않습니다.</p><button className="btn primary full" onClick={onDashboard}>대시보드로 이동</button></> : <><p>{grade?.requiresCommittee || undetermined ? "변경관리위원회 검토와 승인이 필요합니다." : "설비운영파트장 승인 후 변경을 실시할 수 있습니다."}</p><button className="btn primary full" onClick={onProcess}>검토 및 실시계획 확인 →</button></>}<button className="btn soft full" onClick={onEdit}>판정 답변 수정</button></aside></div>
    <div className="disclaimer"><span>i</span><p>시스템 추천 등급은 붙임 3 기준의 작성 지원 결과입니다. 최종 등급은 변경관리 담당자 또는 변경관리위원회 검토에 따라 조정될 수 있습니다.</p></div>
  </div>;
}
