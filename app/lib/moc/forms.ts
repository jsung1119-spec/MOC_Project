import type { ChecklistRecord, ProcessSafetyDocumentRecord } from "./types.ts";

function checklist(id: string, category: string, title: string): ChecklistRecord {
  return { id, category, title, applicable: null, confirmed: false };
}

export const implementationPlanTemplate: ChecklistRecord[] = [
  checklist("PLAN-DESIGN", "공정안전자료", "변경설비 기본 및 상세설계 변경"),
  checklist("PLAN-PSR", "공정안전자료", "공정안전보고서 변경사항 검토"),
  checklist("PLAN-PID-PFD", "공정안전자료", "P&ID, PFD, 유해위험물질 및 사용량"),
  checklist("PLAN-EQUIPMENT", "공정안전자료", "동력기계 목록 및 장치·설비 명세"),
  checklist("PLAN-PIPING", "공정안전자료", "배관 및 Gasket 명세"),
  checklist("PLAN-RELIEF", "공정안전자료", "안전밸브 및 파열판 명세"),
  checklist("PLAN-PROCESS-DESCRIPTION", "공정안전자료", "공정설명서"),
  checklist("PLAN-OVERALL-LAYOUT", "공정안전자료", "건물·설비 전체배치도"),
  checklist("PLAN-EQUIPMENT-LAYOUT", "공정안전자료", "설비배치도"),
  checklist("PLAN-STRUCTURE", "공정안전자료", "건축·철구조물 도면"),
  checklist("PLAN-FIREPROOF", "공정안전자료", "내화구조"),
  checklist("PLAN-FIRE-FIGHTING", "공정안전자료", "소화설비"),
  checklist("PLAN-FIRE-ALARM", "공정안전자료", "화재탐지 및 경보"),
  checklist("PLAN-GAS-DETECTION", "공정안전자료", "가스누출감지"),
  checklist("PLAN-EYEWASH-PPE", "공정안전자료", "세안·세척설비 및 안전장구"),
  checklist("PLAN-LOCAL-EXHAUST", "공정안전자료", "국소배기"),
  checklist("PLAN-HAZARDOUS-AREA", "공정안전자료", "폭발위험장소 구분도"),
  checklist("PLAN-SINGLE-LINE", "공정안전자료", "전기단선도"),
  checklist("PLAN-GROUNDING", "공정안전자료", "접지계획"),
  checklist("PLAN-EMISSION", "공정안전자료", "배출물 처리"),
  checklist("PLAN-RISK-ASSESSMENT", "공정위험성평가", "위험성평가 방법 및 수행"),
  checklist("PLAN-CORRECTIVE", "공정위험성평가", "개선조치계획 수립"),
  checklist("PLAN-OPERATING-GUIDE", "안전운전지침", "안전운전지침 제정 또는 개정"),
  checklist("PLAN-MAINTENANCE-GUIDE", "설비점검·검사 및 유지보수", "관련지침 제정 또는 개정"),
  checklist("PLAN-CRITICALITY", "설비점검·검사 및 유지보수", "중요도 등급 설정"),
  checklist("PLAN-MAINTENANCE-CYCLE", "설비점검·검사 및 유지보수", "정비주기 설정"),
  checklist("PLAN-SPARE-PARTS", "설비점검·검사 및 유지보수", "예비품 목록 변경"),
  checklist("PLAN-HOT-WORK", "안전작업허가", "화기작업"),
  checklist("PLAN-CONFINED", "안전작업허가", "밀폐공간작업"),
  checklist("PLAN-ELECTRICAL-WORK", "안전작업허가", "전기작업"),
  checklist("PLAN-HEIGHT-WORK", "안전작업허가", "고소작업"),
  checklist("PLAN-OTHER-WORK", "안전작업허가", "기타 작업"),
  checklist("PLAN-TRAINING-OPERATOR", "근로자 교육", "운전원 교육"),
  checklist("PLAN-TRAINING-MAINTENANCE", "근로자 교육", "정비작업자 교육"),
  checklist("PLAN-TRAINING-CONTRACTOR", "근로자 교육", "도급업체 교육"),
  checklist("PLAN-PSSR", "가동전 점검", "가동전 점검 실시·점검표·결과보고"),
  checklist("PLAN-PUNCH", "가동전 점검", "Punch List 작성 및 개선 실시"),
  checklist("PLAN-EMERGENCY", "비상조치계획", "비상조치계획 변경 여부"),
  checklist("PLAN-COMPLETION", "변경관리", "변경완료 보고"),
  checklist("PLAN-LAW", "관련법규", "산업안전보건법 등 관련 법규 적용 여부"),
];

const reviewTitles = [
  "변경설비 기본 및 상세설계",
  "안전·보건·환경 영향",
  "공정안전자료 보완",
  "공정위험성평가 수행 필요 여부",
  "안전운전절차서 제정 또는 보완",
  "안전작업 허가절차",
  "운전원·정비원·도급업체 교육",
  "가동전 안전점검",
  "변경완료 후 검사",
  "정비 및 검사기록 보완",
  "점검·정비 절차 제정 또는 보완",
  "예비품 확보",
  "감독 및 판정",
  "변경일정 적합성",
  "관계기관 보고업무",
  "개정이 필요한 공정안전자료 및 개정일정",
] as const;

export const reviewTemplate: ChecklistRecord[] = reviewTitles.map((title, index) => checklist(`REVIEW-${index + 1}`, "변경 검토사항", title));

const documentTitles = [
  "MSDS", "BFD / PFD", "화학공정 관련 자료", "안전 상·하한치", "공정위험성평가 결과",
  "사용재료", "P&ID", "전기도면 / 사양 / 제어도면", "Relief System 자료", "환기 System",
  "설계기준 및 표준", "기타 관련 공정안전자료",
] as const;

export const processSafetyDocumentTemplate: ProcessSafetyDocumentRecord[] = documentTitles.map((title, index) => ({
  id: `PSD-${index + 1}`,
  title,
  status: "NO_IMPACT",
}));

export function cloneImplementationPlan() {
  return implementationPlanTemplate.map((item) => ({ ...item }));
}

export function cloneReviewItems() {
  return reviewTemplate.map((item) => ({ ...item }));
}

export function cloneProcessSafetyDocuments() {
  return processSafetyDocumentTemplate.map((item) => ({ ...item }));
}
