"use client";

import type { MocCase } from "../../lib/moc";
import { allowedWorkflowActions, deriveWorkflowStatus, validateCompletion } from "../../lib/moc/workflow";
import type { ChecklistRecord, MocCaseV2, ProcessSafetyDocumentRecord, TrainingRecord } from "../../lib/moc/types";

const workflowLabels: Record<string, string> = {
  DRAFT: "초안", JUDGMENT_PENDING: "변경판정", SIMPLE_REPLACEMENT: "단순교체", CHANGE_CONFIRMED: "변경 확정",
  GRADE_PENDING: "등급판정", REVIEW_PENDING: "검토 필요", COMMITTEE_REVIEW: "위원회 검토", APPROVAL_PENDING: "승인 대기",
  APPROVED: "승인 완료", IMPLEMENTING: "변경 실시", DOCUMENT_UPDATE: "자료 최신화", TRAINING: "교육",
  PRE_STARTUP_CHECK: "가동전 점검", CORRECTIVE_ACTION: "보완·재점검", COMPLETED: "변경완료",
};

export function MocProcessWorkspace({ item, onChange, onBack }: { item: MocCase; onChange: (patch: Partial<MocCase>) => void; onBack: () => void }) {
  const domain = item as unknown as MocCaseV2;
  const status = deriveWorkflowStatus(domain);
  const completionErrors = validateCompletion(domain);
  const grade = item.gradeDecision?.finalGrade ?? item.gradeDecision?.recommendedGrade;
  const committeeRequired = grade === "1" || grade === "2" || item.replacementDecision?.requiresCommittee;
  const nextActions = allowedWorkflowActions(domain);

  const updatePlan = (id: string, patch: Partial<ChecklistRecord>) => onChange({ implementationPlan: (item.implementationPlan ?? []).map((entry) => entry.id === id ? { ...entry, ...patch } : entry) });
  const updateReview = (id: string, patch: Partial<ChecklistRecord>) => onChange({ reviewItems: (item.reviewItems ?? []).map((entry) => entry.id === id ? { ...entry, ...patch } : entry) });
  const updateDocument = (id: string, patch: Partial<ProcessSafetyDocumentRecord>) => onChange({ processSafetyDocuments: (item.processSafetyDocuments ?? []).map((entry) => entry.id === id ? { ...entry, ...patch } : entry) });
  const updateTraining = (id: string, patch: Partial<TrainingRecord>) => onChange({ training: { records: (item.training?.records ?? []).map((entry) => entry.id === id ? { ...entry, ...patch } : entry) } });

  return <div className="focused-page wide process-workspace"><div className="page-title"><div><span className="eyebrow">{item.caseNumber} · MOC PROCESS</span><h1>{item.title}</h1><p>{item.basicInfo?.targetEquipment} · 추천 {grade && grade !== "UNDETERMINED" ? `${grade}등급` : "판정불가"}</p></div><span className="process-status">{workflowLabels[status]}</span></div>
    <section className="case-overview card"><span>변경 종류<b>{item.basicInfo?.changeKind === "EMERGENCY" ? "비상변경" : "정상변경"}</b></span><span>변경 구분<b>{item.basicInfo?.duration === "TEMPORARY" ? "임시" : "영구"}</b></span><span>위험성평가<b>{item.gradeDecision?.selectedRiskAssessment ?? item.gradeDecision?.recommendedRiskAssessment ?? "-"}</b></span><span>다음 행동<b>{nextActions[0] ?? "완료 조건 확인"}</b></span></section>

    {committeeRequired && <ProcessSection title="변경관리위원회" help="1·2등급 또는 판정불가 건은 위원회 심의가 필요합니다."><div className="process-grid"><label>개최일<input type="date" value={item.committee?.heldAt?.slice(0, 10) ?? ""} onChange={(event) => onChange({ committee: { ...(item.committee ?? { held: false, members: [], decision: null }), heldAt: event.target.value } })}/></label><label>위원<input value={item.committee?.members.join(", ") ?? ""} placeholder="운전, 정비, 안전 등 3인 이상" onChange={(event) => onChange({ committee: { ...(item.committee ?? { held: false, decision: null }), members: event.target.value.split(",").map((name) => name.trim()).filter(Boolean) } })}/></label><label>심의 결과<select value={item.committee?.decision ?? ""} onChange={(event) => onChange({ committee: { ...(item.committee ?? { held: false, members: [] }), held: true, decision: event.target.value as "APPROVED" | "REJECTED" | "SUPPLEMENT_REQUIRED" } })}><option value="">선택</option><option value="APPROVED">승인</option><option value="SUPPLEMENT_REQUIRED">보완 필요</option><option value="REJECTED">반려</option></select></label><label>검토 사유<textarea value={item.committee?.reason ?? ""} onChange={(event) => onChange({ committee: { ...(item.committee ?? { held: false, members: [], decision: null }), reason: event.target.value } })}/></label></div></ProcessSection>}

    <ProcessSection title="검토 및 승인" help={grade === "3" ? "3등급은 설비운전파트장이 자체 승인할 수 있습니다." : "위원회 검토 후 설비운영부서장 등의 승인이 필요합니다."}><div className="approval-action"><div><b>승인자</b><p>{grade === "3" ? "설비운전파트장" : "설비운영부서장 / 공장장"}</p></div><button className="btn primary" disabled={committeeRequired && item.committee?.decision !== "APPROVED"} onClick={() => onChange({ approval: { approved: true, approverRole: grade === "3" ? "설비운전파트장" : "설비운영부서장", approverName: "공장장/리더", approvedAt: new Date().toISOString() }, status: "APPROVED" })}>{item.approval?.approved ? "✓ 승인 완료" : "승인하기"}</button></div></ProcessSection>

    <ProcessSection title="변경관리 실시 계획" help="첨부 2 양식을 체크리스트로 관리합니다."><ChecklistTable items={item.implementationPlan ?? []} onChange={updatePlan}/></ProcessSection>
    <ProcessSection title="변경 검토사항" help="붙임 5의 16개 영역을 빠짐없이 확인합니다."><ChecklistTable items={item.reviewItems ?? []} onChange={updateReview}/></ProcessSection>

    <ProcessSection title="변경 실시" help="승인된 원안에 따라 작업을 실시합니다."><label className="completion-toggle"><input type="checkbox" checked={Boolean(item.workCompleted)} disabled={!item.approval?.approved} onChange={(event) => onChange({ workCompleted: event.target.checked, status: event.target.checked ? "WORK_COMPLETED" : "WORK_IN_PROGRESS" })}/><span>변경 작업 완료</span><small>승인 완료 후에만 기록할 수 있습니다.</small></label></ProcessSection>

    <ProcessSection title="공정안전자료 최신화" help="영향 없음 또는 개정 완료 상태가 되어야 종결할 수 있습니다."><div className="document-update-list">{(item.processSafetyDocuments ?? []).map((document) => <label key={document.id}><span>{document.title}</span><select value={document.status} onChange={(event) => updateDocument(document.id, { status: event.target.value as ProcessSafetyDocumentRecord["status"], completedDate: event.target.value === "COMPLETED" ? new Date().toISOString().slice(0, 10) : undefined })}><option value="NO_IMPACT">영향 없음</option><option value="REQUIRED">개정 필요</option><option value="IN_PROGRESS">개정 중</option><option value="COMPLETED">개정 완료</option></select></label>)}</div></ProcessSection>

    <ProcessSection title="교육" help="운전·정비·도급업체 관련 인원 교육은 설비 가동 전에 완료해야 합니다."><div className="training-list">{(item.training?.records ?? []).map((record) => <div key={record.id}><label><input type="checkbox" checked={record.required} onChange={(event) => updateTraining(record.id, { required: event.target.checked })}/>{record.audience === "OPERATOR" ? "운전" : record.audience === "MAINTENANCE" ? "정비" : "도급업체"} 교육 필요</label><input placeholder="교육 내용" value={record.content} onChange={(event) => updateTraining(record.id, { content: event.target.value })}/><input type="date" value={record.completedDate ?? ""} onChange={(event) => updateTraining(record.id, { completedDate: event.target.value })}/><label><input type="checkbox" checked={record.completed} disabled={!record.content || !record.completedDate} onChange={(event) => updateTraining(record.id, { completed: event.target.checked })}/> 완료</label></div>)}</div></ProcessSection>

    <ProcessSection title="가동전 점검" help="부적합 또는 미완료 Punch List가 있으면 변경완료로 처리할 수 없습니다."><div className="process-grid"><label>점검 실시일<input type="date" value={item.preStartupInspection?.inspectionDate ?? ""} onChange={(event) => onChange({ preStartupInspection: { ...domain.preStartupInspection, inspectionDate: event.target.value } })}/></label><label>점검자<input value={item.preStartupInspection?.inspectors.join(", ") ?? ""} onChange={(event) => onChange({ preStartupInspection: { ...domain.preStartupInspection, inspectors: event.target.value.split(",").map((name) => name.trim()).filter(Boolean) } })}/></label><label>최종 결과<select value={item.preStartupInspection?.finalResult ?? ""} onChange={(event) => onChange({ preStartupInspection: { ...domain.preStartupInspection, finalResult: event.target.value as "SUITABLE" | "UNSUITABLE" } })}><option value="">미점검</option><option value="SUITABLE">적합</option><option value="UNSUITABLE">부적합</option></select></label></div><h3>Punch List</h3><div className="punch-list">{(item.preStartupInspection?.punchItems ?? []).map((punch) => <label key={punch.id}><input type="checkbox" checked={punch.completed} onChange={(event) => onChange({ preStartupInspection: { ...domain.preStartupInspection, punchItems: domain.preStartupInspection.punchItems.map((entry) => entry.id === punch.id ? { ...entry, completed: event.target.checked } : entry) } })}/><span>{punch.description}</span></label>)}<button className="btn soft" onClick={() => { const description = window.prompt("개선이 필요한 사항을 입력하세요."); if (description) onChange({ preStartupInspection: { ...domain.preStartupInspection, punchItems: [...domain.preStartupInspection.punchItems, { id: `punch-${Date.now()}`, description, completed: false }] } }); }}>＋ Punch List 추가</button></div></ProcessSection>

    {item.basicInfo?.duration === "TEMPORARY" && <ProcessSection title="임시변경 관리" help={`사용기간: ${item.basicInfo.temporaryStartDate} ~ ${item.basicInfo.temporaryEndDate} · 최대 30일`}><div className="temporary-checks"><Check label="기술검토서 작성" checked={Boolean(item.temporaryTechnicalReviewCompleted)} onChange={(checked) => onChange({ temporaryTechnicalReviewCompleted: checked })}/><Check label="공정위험성평가" checked={Boolean(item.temporaryRiskAssessmentCompleted)} onChange={(checked) => onChange({ temporaryRiskAssessmentCompleted: checked })}/><Check label="현장 표시판 / TAG" checked={Boolean(item.temporarySiteTagInstalled)} onChange={(checked) => onChange({ temporarySiteTagInstalled: checked })}/><Check label="원상복구 완료" checked={Boolean(item.temporaryRestored)} onChange={(checked) => onChange({ temporaryRestored: checked })}/></div></ProcessSection>}
    {item.basicInfo?.changeKind === "EMERGENCY" && <ProcessSection title="비상변경 사후 절차" help="선조치 후 정상변경에 준하는 사후 검토와 승인이 필요합니다."><Check label="사후 요청/승인 및 검토 완료" checked={Boolean(item.emergencyPostReviewCompleted)} onChange={(checked) => onChange({ emergencyPostReviewCompleted: checked })}/></ProcessSection>}

    <section className="card completion-guard"><div><h2>변경완료 조건</h2><p>{completionErrors.length ? `${completionErrors.length}개 항목을 완료해야 종결할 수 있습니다.` : "모든 완료 조건이 충족되었습니다."}</p></div>{completionErrors.length ? <ul>{completionErrors.map((entry) => <li key={entry.code}><b>{entry.message}</b><small>{entry.action}</small></li>)}</ul> : <span className="completion-ok">✓ 변경완료</span>}</section>
    <div className="bottom-actions"><button className="btn ghost" onClick={onBack}>← 판단 결과</button><span>모든 입력은 자동 저장되며 실제 완료 내역에 따라 상태가 변경됩니다.</span></div>
  </div>;
}

function ProcessSection({ title, help, children }: { title: string; help: string; children: React.ReactNode }) {
  return <details className="card process-section" open><summary><div><h2>{title}</h2><p>{help}</p></div><span>⌄</span></summary><div className="process-section-body">{children}</div></details>;
}

function ChecklistTable({ items, onChange }: { items: ChecklistRecord[]; onChange: (id: string, patch: Partial<ChecklistRecord>) => void }) {
  return <div className="process-table-wrap"><table><thead><tr><th>항목</th><th>대상</th><th>담당자</th><th>예정일</th><th>완료일</th><th>확인</th></tr></thead><tbody>{items.map((entry) => <tr key={entry.id}><td><b>{entry.title}</b><small>{entry.category}</small></td><td><select value={entry.applicable === null ? "" : entry.applicable ? "Y" : "N"} onChange={(event) => onChange(entry.id, { applicable: event.target.value === "" ? null : event.target.value === "Y" })}><option value="">-</option><option value="Y">Y</option><option value="N">N</option></select></td><td><input value={entry.owner ?? ""} onChange={(event) => onChange(entry.id, { owner: event.target.value })}/></td><td><input type="date" value={entry.plannedDate ?? ""} onChange={(event) => onChange(entry.id, { plannedDate: event.target.value })}/></td><td><input type="date" value={entry.completedDate ?? ""} onChange={(event) => onChange(entry.id, { completedDate: event.target.value })}/></td><td><input type="checkbox" checked={entry.confirmed} disabled={entry.applicable === null} onChange={(event) => onChange(entry.id, { confirmed: event.target.checked })}/></td></tr>)}</tbody></table></div>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="completion-toggle"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)}/><span>{label}</span></label>;
}
