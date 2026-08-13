"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import type { AssetType } from "../../lib/moc/replacement-criteria";
import type { MocBasicInfo, WorkType } from "../../lib/moc/types";
import { validateBasicInfo } from "../../lib/moc/validation";

const workTypes: WorkType[] = ["기계 설비", "배관", "전기", "계장", "운전조건", "원료·화학물질", "작업 절차", "기타"];
const assetOptions: Array<{ value: AssetType; label: string; workTypes: WorkType[] }> = [
  { value: "VALVE", label: "밸브", workTypes: ["기계 설비", "배관"] },
  { value: "PIPING", label: "배관", workTypes: ["배관"] },
  { value: "FLANGE", label: "플랜지", workTypes: ["배관"] },
  { value: "PUMP", label: "펌프", workTypes: ["기계 설비"] },
  { value: "COMPRESSOR", label: "압축기", workTypes: ["기계 설비"] },
  { value: "TURBINE", label: "터빈", workTypes: ["기계 설비"] },
  { value: "RECIPROCATING_DEVICE", label: "왕복동 장치", workTypes: ["기계 설비"] },
  { value: "DRIVE_DEVICE", label: "구동장치", workTypes: ["기계 설비"] },
  { value: "MOTOR", label: "전동기", workTypes: ["기계 설비", "전기"] },
  { value: "CONTROL_EQUIPMENT", label: "제어설비", workTypes: ["계장", "전기"] },
  { value: "CHEMICAL", label: "화학물", workTypes: ["원료·화학물질"] },
  { value: "MAINTENANCE", label: "정비 절차", workTypes: ["작업 절차", "기타"] },
  { value: "OPERATION", label: "운전 절차", workTypes: ["운전조건", "작업 절차", "기타"] },
  { value: "AUXILIARY_PROCESS", label: "부수공정", workTypes: ["기타", "배관", "전기"] },
];

const empty: MocBasicInfo = {
  title: "", reason: "", description: "", targetEquipment: "", workType: "기계 설비",
  beforeState: "", changeKind: "NORMAL", duration: "PERMANENT",
};

export function NewMocCaseForm({ onSubmit, onTemporarySave, onBack }: { onSubmit: (info: MocBasicInfo, assetType: AssetType) => void; onTemporarySave: (info: MocBasicInfo, assetType: AssetType) => void; onBack: () => void }) {
  const [info, setInfo] = useState(empty);
  const [assetType, setAssetType] = useState<AssetType>("PUMP");
  const [attempted, setAttempted] = useState(false);
  const errors = validateBasicInfo(info);
  const assets = useMemo(() => assetOptions.filter((option) => option.workTypes.includes(info.workType)), [info.workType]);
  const set = <K extends keyof MocBasicInfo>(key: K, value: MocBasicInfo[K]) => setInfo((current) => ({ ...current, [key]: value }));
  const errorFor = (field: keyof MocBasicInfo) => attempted ? errors.find((error) => error.field === field) : undefined;

  function submit() {
    setAttempted(true);
    if (errors.length) return;
    onSubmit(info, assetType);
  }

  return <div className="focused-page wide guideline-form"><div className="step-head"><button className="back-link" onClick={onBack}>← 대시보드</button><div><span>변경사항 입력</span><b>1 / 4</b></div><div className="progress-track"><i style={{ width: "25%" }}/></div></div>
    <section className="question-card start-card"><span className="eyebrow">STEP 01 · 변경 발의</span><h1>변경사항을 먼저 알려주세요</h1><p>변경판정과 등급판정에 필요한 기본정보입니다. 입력 내용은 이후 변경 요청/승인서에도 사용됩니다.</p>
      <div className="form-grid">
        <GuidelineField label="변경 제목" value={info.title} onChange={(value) => set("title", value)} error={errorFor("title")?.message}/>
        <label className="field"><span>변경 대상 분야</span><select value={info.workType} onChange={(event) => { const value = event.target.value as WorkType; set("workType", value); const first = assetOptions.find((option) => option.workTypes.includes(value)); if (first) setAssetType(first.value); }}>{workTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        <GuidelineField label="대상 설비 / 공정" value={info.targetEquipment} onChange={(value) => set("targetEquipment", value)} error={errorFor("targetEquipment")?.message}/>
        <label className="field"><span>세부 판정 대상</span><select value={assetType} onChange={(event) => setAssetType(event.target.value as AssetType)}>{assets.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      </div>
      <div className="form-grid one"><GuidelineField area label="변경 사유" value={info.reason} onChange={(value) => set("reason", value)} error={errorFor("reason")?.message}/><GuidelineField area label="변경 내용" value={info.description} onChange={(value) => set("description", value)} error={errorFor("description")?.message}/></div>
      <div className="form-grid one"><GuidelineField area label="변경 전 상태" value={info.beforeState} onChange={(value) => set("beforeState", value)} error={errorFor("beforeState")?.message}/><BeforeStatePhoto value={info.beforeImageDataUrl} onChange={(value) => set("beforeImageDataUrl", value)}/></div>
      <div className="guideline-choice-row"><fieldset><legend>변경 종류</legend><label><input type="radio" checked={info.changeKind === "NORMAL"} onChange={() => set("changeKind", "NORMAL")}/> 정상변경</label><label><input type="radio" checked={info.changeKind === "EMERGENCY"} onChange={() => set("changeKind", "EMERGENCY")}/> 비상변경</label></fieldset><fieldset><legend>변경 구분</legend><label><input type="radio" checked={info.duration === "PERMANENT"} onChange={() => set("duration", "PERMANENT")}/> 영구</label><label><input type="radio" checked={info.duration === "TEMPORARY"} onChange={() => set("duration", "TEMPORARY")}/> 임시</label></fieldset></div>
      {info.duration === "TEMPORARY" && <div className="notice amber"><b>30</b><div><strong>임시변경은 30일 이내로 제한됩니다.</strong><div className="form-grid"><GuidelineField type="date" label="사용 시작일" value={info.temporaryStartDate ?? ""} onChange={(value) => set("temporaryStartDate", value)} error={errorFor("temporaryStartDate")?.message}/><GuidelineField type="date" label="사용 종료일" value={info.temporaryEndDate ?? ""} onChange={(value) => set("temporaryEndDate", value)} error={errorFor("temporaryEndDate")?.message}/></div></div></div>}
      <div className="question-footer"><button className="btn ghost" onClick={onBack}>← 이전</button><button className="btn primary" onClick={submit}>변경판정 시작 →</button></div>
      <div className="question-footer temporary-save-footer"><button type="button" className="btn soft" onClick={() => onTemporarySave(info, assetType)}>임시저장</button></div>
    </section></div>;
}

function BeforeStatePhoto({ value, onChange }: { value?: string; onChange: (value: string | undefined) => void }) {
  const [error, setError] = useState("");
  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("사진 파일만 첨부할 수 있습니다."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("사진은 2MB 이하 파일을 선택해 주세요."); return; }
    const reader = new FileReader();
    reader.onload = () => { onChange(typeof reader.result === "string" ? reader.result : undefined); setError(""); };
    reader.onerror = () => setError("사진을 읽지 못했습니다. 다른 파일을 선택해 주세요.");
    reader.readAsDataURL(file);
  }
  return <div className="field before-photo-field"><span>변경 전 상태 사진 <small>선택</small></span><p>현장 또는 설비의 현재 상태 사진을 1장 첨부할 수 있습니다. (최대 2MB)</p><input aria-label="변경 전 상태 사진" type="file" accept="image/*" onChange={selectPhoto}/>{error && <small className="field-error">{error}</small>}{value && <div className="before-photo-preview"><img src={value} alt="변경 전 상태 첨부 사진"/><button type="button" className="btn ghost" onClick={() => onChange(undefined)}>사진 삭제</button></div>}</div>;
}

function GuidelineField({ label, value, onChange, error, area, type = "text" }: { label: string; value: string; onChange: (value: string) => void; error?: string; area?: boolean; type?: string }) {
  return <label className={`field ${error ? "missing" : ""}`}><span>{label}<em>*</em></span>{area ? <textarea value={value} onChange={(event) => onChange(event.target.value)}/> : <input type={type} value={value} onInput={(event) => onChange(event.currentTarget.value)}/>} {error && <small className="field-error">{error}</small>}</label>;
}
