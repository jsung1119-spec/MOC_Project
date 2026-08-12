import { isSite, sites, type Site } from "./sites.ts";

export * from "./moc/types.ts";
export { createEmptyMocCase } from "./moc/defaults.ts";
export { normalizeMocCasesV2 } from "./moc/migration.ts";
export * from "./moc/replacement-criteria.ts";
export * from "./moc/replacement-engine.ts";

export type AnswerValue = "YES" | "NO" | "UNKNOWN" | "NOT_APPLICABLE";
export type WorkType = "기계 설비" | "배관" | "전기" | "계장" | "운전조건" | "원료·화학물질" | "작업 절차" | "기타";
export type MocStatus =
  | "DRAFT" | "QUESTIONNAIRE_IN_PROGRESS" | "JUDGMENT_COMPLETED"
  | "DOCUMENT_DRAFTING" | "READY_TO_SUBMIT" | "SUBMITTED"
  | "UNDER_REVIEW" | "APPROVED" | "WORK_IN_PROGRESS"
  | "WORK_COMPLETED" | "CLOSED" | "OVERDUE";

export interface Question {
  id: string; order: number; category: string; text: string; description: string;
  guidelineSection: string;
  /** Empty means this is a common question shown for every work type. */
  workTypes?: WorkType[];
  visibleWhen?: { questionId: string; operator: "EQUALS" | "NOT_EQUALS"; value: AnswerValue };
}

export interface Evidence {
  ruleId: string; title: string; description: string; guidelineSection: string;
}

export interface Judgment {
  isMocTarget: boolean; grade: "1" | "2" | "3" | "NONE";
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "REVIEW_REQUIRED";
  evidences: Evidence[]; requiredDocumentIds: string[]; requiresHumanReview: boolean;
  summary: string; conflicts: string[];
}

export interface Draft {
  purpose: string; equipment: string; before: string; after: string; startDate: string;
  endDate: string; department: string; author: string; owner: string; hazards: string;
  safeguards: string; education: boolean; drawingRevision: boolean; procedureRevision: boolean;
}

export interface MocCase {
  id: string; caseNumber: string; title: string; workType: WorkType; author: string;
  department: string; site: Site; status: MocStatus; createdAt: string; dueDate: string;
  answers: Record<string, AnswerValue>; judgment?: Judgment; draft: Draft;
}

export const questions: Question[] = [
  { id: "same_spec", order: 1, category: "공통", text: "기존 설비와 동일한 규격입니까?", description: "모델명뿐 아니라 용량·재질·설계조건이 모두 같은지 확인하세요.", guidelineSection: "MOC 업무지침 4.1.1" },
  { id: "capacity", order: 2, category: "설비", text: "설비의 용량 또는 성능이 변경됩니까?", description: "처리량, 회전수, 동력, 효율 등 설계 성능 변화를 포함합니다.", guidelineSection: "MOC 업무지침 4.2.1" },
  { id: "material", order: 3, category: "설비", text: "사용 재질이 변경됩니까?", description: "배관·가스켓·라이닝 등 접액부 재질 변경도 포함합니다.", guidelineSection: "MOC 업무지침 4.2.3" },
  { id: "operating", order: 4, category: "공정", text: "운전 온도·압력 또는 유량이 변경됩니까?", description: "정상 운전값뿐 아니라 경보·인터록 범위 변경도 확인하세요.", guidelineSection: "MOC 업무지침 4.2.4" },
  { id: "logic", order: 5, category: "제어", text: "제어 Logic 또는 Set Point가 변경됩니까?", description: "PLC/DCS 로직, 알람, Trip 설정값 변경을 포함합니다.", guidelineSection: "MOC 업무지침 4.2.5" },
  { id: "hazard", order: 6, category: "위험", text: "변경으로 인해 위험도가 증가할 가능성이 있습니까?", description: "화재·폭발·누출·감전 또는 오조작 가능성을 함께 고려하세요.", guidelineSection: "MOC 업무지침 5.1.2" },
  { id: "major", order: 7, category: "위험", text: "중대한 공정조건 또는 안전설비 변경입니까?", description: "공정 한계 변경, 안전밸브·인터록 해제 및 방호설비 변경을 뜻합니다.", guidelineSection: "MOC 업무지침 5.1.3", visibleWhen: { questionId: "hazard", operator: "NOT_EQUALS", value: "NO" } },
  { id: "revision", order: 8, category: "후속조치", text: "작업 후 도면 또는 절차서 개정이 필요합니까?", description: "P&ID, 단선도, Loop 도면, SOP 등 최신화 여부를 확인하세요.", guidelineSection: "MOC 업무지침 6.2.1" },
  { id: "temporary", order: 9, category: "공통", text: "임시 변경이 30일을 초과합니까?", description: "임시 바이패스·가설 배관도 기간과 복구 계획이 필요합니다.", guidelineSection: "MOC 업무지침 4.3.1" },
];

export const optionMeta: Record<AnswerValue, { label: string; short: string }> = {
  YES: { label: "예, 해당합니다", short: "예" },
  NO: { label: "아니오", short: "아니오" },
  UNKNOWN: { label: "잘 모르겠습니다", short: "잘 모르겠음" },
  NOT_APPLICABLE: { label: "해당 없음", short: "해당 없음" },
};

export const guidelines = [
  { code: "4.1.1", title: "동일 규격 교체", content: "동일 재질·용량·운전조건의 단순 교체는 비대상으로 분류할 수 있다." },
  { code: "4.2.1", title: "설비 성능 변경", content: "설비 용량 또는 성능 변경은 변경요소관리 대상 여부를 검토한다." },
  { code: "4.2.3", title: "재질 변경", content: "공정 유체와 접촉하는 재질 변경 시 변경요소관리를 실시한다." },
  { code: "4.2.4", title: "운전조건 변경", content: "온도·압력·유량 등 운전조건 변경은 위험성 검토를 포함한다." },
  { code: "4.2.5", title: "제어 변경", content: "Logic, Set Point, 알람 및 인터록 변경을 관리한다." },
  { code: "5.1.2", title: "위험도 등급", content: "위험 증가 가능성이 있으면 최소 2등급으로 관리한다." },
  { code: "6.2.1", title: "문서 최신화", content: "변경 완료 전 관련 도면과 절차서를 최신화한다." },
];

const evidence = (ruleId: string, title: string, description: string, guidelineSection: string): Evidence =>
  ({ ruleId, title, description, guidelineSection });

export function visibleQuestions(answers: Record<string, AnswerValue>, list: Question[] = questions, workType?: WorkType) {
  return list.filter((q) => {
    if (workType && q.workTypes?.length && !q.workTypes.includes(workType)) return false;
    if (!q.visibleWhen) return true;
    const actual = answers[q.visibleWhen.questionId];
    return q.visibleWhen.operator === "EQUALS" ? actual === q.visibleWhen.value : actual !== q.visibleWhen.value;
  });
}

export function judge(answers: Record<string, AnswerValue>): Judgment {
  const a = (id: string) => answers[id];
  const unknowns = questions.filter(q => a(q.id) === "UNKNOWN");
  const conflicts: string[] = [];
  if (a("same_spec") === "YES" && ["capacity", "material", "operating", "logic"].some(id => a(id) === "YES")) {
    conflicts.push("동일 규격이라고 답했지만 변경 항목이 함께 선택되었습니다.");
  }
  const targetSignals = ["capacity", "material", "operating", "logic", "temporary"].filter(id => a(id) === "YES");
  const major = a("major") === "YES";
  const hazard = a("hazard") === "YES";
  const requiresHumanReview = unknowns.length > 0 || conflicts.length > 0;
  const isMocTarget = targetSignals.length > 0 || hazard || major;
  let grade: Judgment["grade"] = isMocTarget ? "3" : "NONE";
  let riskLevel: Judgment["riskLevel"] = isMocTarget ? "LOW" : "LOW";
  if (hazard) { grade = "2"; riskLevel = "MEDIUM"; }
  if (major) { grade = "1"; riskLevel = "HIGH"; }
  if (requiresHumanReview) riskLevel = "REVIEW_REQUIRED";
  const evidences: Evidence[] = [];
  if (!isMocTarget && a("same_spec") === "YES") evidences.push(evidence("R-001", "동일 규격 단순 교체", "용량·재질·운전조건·Logic 변경이 확인되지 않았습니다.", "MOC 업무지침 4.1.1"));
  if (a("material") === "YES") evidences.push(evidence("R-003", "재질 변경", "공정 접촉부 재질 변경은 MOC 대상입니다.", "MOC 업무지침 4.2.3"));
  if (a("operating") === "YES") evidences.push(evidence("R-004", "운전조건 변경", "온도·압력·유량 변경은 MOC 대상입니다.", "MOC 업무지침 4.2.4"));
  if (a("logic") === "YES") evidences.push(evidence("R-005", "제어 로직 변경", "Logic 또는 Set Point 변경이 확인되었습니다.", "MOC 업무지침 4.2.5"));
  if (a("capacity") === "YES") evidences.push(evidence("R-002", "설비 성능 변경", "설비 용량 또는 성능 변경이 확인되었습니다.", "MOC 업무지침 4.2.1"));
  if (hazard) evidences.push(evidence("R-006", "위험도 증가 가능성", "최소 2등급 기준을 적용했습니다.", "MOC 업무지침 5.1.2"));
  if (major) evidences.push(evidence("R-007", "중대 변경", "고위험 변경으로 1등급 기준을 적용했습니다.", "MOC 업무지침 5.1.3"));
  if (requiresHumanReview) evidences.push(evidence("R-008", "담당자 검토 필요", "불확실하거나 상충되는 답변은 자동 확정하지 않습니다.", "MOC 업무지침 3.3.2"));
  const docs = grade === "1"
    ? ["신청서", "위험성 검토서", "작업 계획서", "교육 계획서", "교육 결과서", "P&ID 개정", "작업 전 점검표", "완료 확인서"]
    : grade === "2" ? ["신청서", "위험성 검토서", "작업 계획서", "교육 결과서", "도면 개정", "완료 확인서"]
    : grade === "3" ? ["신청서", "작업 계획서", "완료 확인서"] : [];
  return {
    isMocTarget, grade, riskLevel, evidences, requiredDocumentIds: docs, requiresHumanReview,
    conflicts,
    summary: requiresHumanReview ? "불확실하거나 상충되는 답변이 있어 담당자 검토가 필요합니다."
      : isMocTarget ? `${grade}등급 변경요소관리 대상으로 판단되었습니다.`
      : "동일 규격의 단순 교체로 변경요소관리 비대상입니다.",
  };
}

export const statusLabels: Record<MocStatus, string> = {
  DRAFT: "초안", QUESTIONNAIRE_IN_PROGRESS: "판단 진행 중", JUDGMENT_COMPLETED: "판단 완료",
  DOCUMENT_DRAFTING: "초안 작성 중", READY_TO_SUBMIT: "제출 대기", SUBMITTED: "제출됨",
  UNDER_REVIEW: "검토 중", APPROVED: "승인 완료", WORK_IN_PROGRESS: "작업 수행 중",
  WORK_COMPLETED: "작업 완료", CLOSED: "최종 종결", OVERDUE: "기한 초과",
};

export const emptyDraft = (author = "김현수", department = "생산1팀"): Draft => ({
  purpose: "", equipment: "", before: "", after: "", startDate: "", endDate: "",
  department, author, owner: "", hazards: "", safeguards: "", education: false,
  drawingRevision: false, procedureRevision: false,
});

const mockCases: Omit<MocCase, "site">[] = [
  { id: "moc-001", caseNumber: "MOC-2026-042", title: "P-204A 메카니컬 씰 교체", workType: "기계 설비", author: "김현수", department: "생산1팀", status: "QUESTIONNAIRE_IN_PROGRESS", createdAt: "2026-07-29", dueDate: "2026-08-02", answers: { same_spec: "YES", capacity: "NO" }, draft: emptyDraft() },
  { id: "moc-002", caseNumber: "MOC-2026-039", title: "T-101 이송배관 재질 변경", workType: "배관", author: "박준호", department: "기계정비팀", status: "DOCUMENT_DRAFTING", createdAt: "2026-07-26", dueDate: "2026-07-28", answers: { same_spec: "NO", material: "YES", operating: "NO", hazard: "YES" }, judgment: judge({ same_spec: "NO", material: "YES", operating: "NO", hazard: "YES" }), draft: { ...emptyDraft("박준호", "기계정비팀"), purpose: "부식 방지", equipment: "T-101 이송배관", before: "CS 배관", after: "STS316L 배관", hazards: "누출 및 화재", safeguards: "가스측정 및 화기감시자 배치" } },
  { id: "moc-003", caseNumber: "MOC-2026-037", title: "반응기 고온 알람 설정 변경", workType: "계장", author: "이서연", department: "전기계장팀", status: "UNDER_REVIEW", createdAt: "2026-07-24", dueDate: "2026-07-31", answers: { same_spec: "NO", logic: "YES", hazard: "UNKNOWN" }, judgment: judge({ same_spec: "NO", logic: "YES", hazard: "UNKNOWN" }), draft: emptyDraft("이서연", "전기계장팀") },
  { id: "moc-004", caseNumber: "MOC-2026-031", title: "냉각수 펌프 동급 교체", workType: "기계 설비", author: "김현수", department: "생산1팀", status: "CLOSED", createdAt: "2026-07-14", dueDate: "2026-07-18", answers: { same_spec: "YES", capacity: "NO", material: "NO", operating: "NO", logic: "NO", hazard: "NO" }, judgment: judge({ same_spec: "YES", capacity: "NO", material: "NO", operating: "NO", logic: "NO", hazard: "NO" }), draft: emptyDraft() },
  { id: "moc-005", caseNumber: "MOC-2026-028", title: "원료 투입 순서 변경", workType: "작업 절차", author: "김현수", department: "생산1팀", status: "CLOSED", createdAt: "2026-07-09", dueDate: "2026-07-13", answers: { same_spec: "NO", operating: "YES", hazard: "YES", major: "YES" }, judgment: judge({ same_spec: "NO", operating: "YES", hazard: "YES", major: "YES" }), draft: emptyDraft() },
];

export const seedCases: MocCase[] = mockCases.map((mocCase, index) => ({
  ...mocCase,
  site: index % 2 === 0 ? "포항라임공장" : "포항화성공장",
}));

export function normalizeMocCases(items: unknown, fallbackSite: Site = sites[0]): MocCase[] {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item): item is Omit<MocCase, "site"> & { site?: unknown } =>
      typeof item === "object" && item !== null && typeof item.id === "string")
    .map((item) => ({
      ...item,
      site: isSite(typeof item.site === "string" ? item.site : null) ? item.site : fallbackSite,
    } as MocCase));
}

export function createMocCase({
  id,
  cases,
  workType,
  site,
  createdAt = "2026-07-29",
  dueDate = "2026-08-05",
}: {
  id: string;
  cases: MocCase[];
  workType: WorkType;
  site: Site;
  createdAt?: string;
  dueDate?: string;
}): MocCase {
  return {
    id,
    caseNumber: nextCaseNumber(cases),
    title: `${workType} 변경`,
    workType,
    author: "김현수",
    department: "생산1팀",
    site,
    status: "QUESTIONNAIRE_IN_PROGRESS",
    createdAt,
    dueDate,
    answers: {},
    draft: emptyDraft(),
  };
}

export function nextCaseNumber(cases: MocCase[]) {
  return `MOC-2026-${String(43 + cases.length).padStart(3, "0")}`;
}
