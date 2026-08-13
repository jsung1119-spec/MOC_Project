import type { Site } from "../sites.ts";

export const MOC_SCHEMA_VERSION = 2 as const;

export type WorkType = "기계 설비" | "배관" | "전기" | "계장" | "운전조건" | "원료·화학물질" | "작업 절차" | "기타";
export type ChangeKind = "NORMAL" | "EMERGENCY";
export type ChangeDuration = "TEMPORARY" | "PERMANENT";
export type ReplacementResult = "SIMPLE_REPLACEMENT" | "CHANGE" | "UNDETERMINED";
export type ComparisonValue = "SAME" | "DIFFERENT" | "UNKNOWN" | "NOT_APPLICABLE";
export type Grade = "1" | "2" | "3" | "UNDETERMINED";
export type RiskAssessmentMethod = "HAZOP" | "CHECK_LIST" | "OTHER";
export type MocWorkflowStatus =
  | "DRAFT" | "JUDGMENT_PENDING" | "SIMPLE_REPLACEMENT" | "CHANGE_CONFIRMED"
  | "GRADE_PENDING" | "REVIEW_PENDING" | "COMMITTEE_REVIEW" | "APPROVAL_PENDING"
  | "APPROVED" | "IMPLEMENTING" | "DOCUMENT_UPDATE" | "TRAINING"
  | "PRE_STARTUP_CHECK" | "CORRECTIVE_ACTION" | "COMPLETED";

export interface MocBasicInfo {
  title: string;
  reason: string;
  description: string;
  targetEquipment: string;
  workType: WorkType;
  beforeState: string;
  /** 기존 이력 호환용 필드입니다. 신규 변경 판단에서는 입력하지 않습니다. */
  afterState?: string;
  /** 브라우저 저장소에 보관하는 변경 전 상태 사진(Data URL)입니다. */
  beforeImageDataUrl?: string;
  changeKind: ChangeKind;
  duration: ChangeDuration;
  temporaryStartDate?: string;
  temporaryEndDate?: string;
}

export interface DecisionEvidence {
  ruleId: string;
  title: string;
  description: string;
  guidelineSection: string;
}

export interface ReplacementDecision {
  result: ReplacementResult;
  assetType?: string;
  comparisons: Record<string, ComparisonValue>;
  matchedCriteria: DecisionEvidence[];
  reasons: string[];
  requiresCommittee: boolean;
  decidedAt: string;
}

export interface GradeDecision {
  recommendedGrade: Grade;
  finalGrade?: Exclude<Grade, "UNDETERMINED">;
  adjustmentReason?: string;
  matchedRules: DecisionEvidence[];
  reasons: string[];
  requiresCommittee: boolean;
  recommendedRiskAssessment?: RiskAssessmentMethod;
  selectedRiskAssessment?: RiskAssessmentMethod;
  riskAssessmentChangeReason?: string;
  decidedAt: string;
}

export interface ApprovalRecord {
  approved: boolean;
  approverRole?: string;
  approverName?: string;
  approvedAt?: string;
  comment?: string;
}

export interface CommitteeRecord {
  held: boolean;
  heldAt?: string;
  members: string[];
  decision: "APPROVED" | "REJECTED" | "SUPPLEMENT_REQUIRED" | null;
  finalChangeResult?: Exclude<ReplacementResult, "UNDETERMINED">;
  finalGrade?: Exclude<Grade, "UNDETERMINED">;
  reason?: string;
  additionalRisks?: string;
  safeguards?: string;
  followUpPlan?: string;
}

export interface ChecklistRecord {
  id: string;
  category: string;
  title: string;
  applicable: boolean | null;
  owner?: string;
  department?: string;
  plannedDate?: string;
  completedDate?: string;
  confirmed: boolean;
  result?: string;
  actionRequired?: string;
  note?: string;
}

export type DocumentUpdateStatus = "NO_IMPACT" | "REQUIRED" | "IN_PROGRESS" | "COMPLETED";

export interface ProcessSafetyDocumentRecord {
  id: string;
  title: string;
  status: DocumentUpdateStatus;
  owner?: string;
  plannedDate?: string;
  completedDate?: string;
  note?: string;
}

export interface TrainingRecord {
  id: string;
  audience: "OPERATOR" | "MAINTENANCE" | "CONTRACTOR";
  content: string;
  plannedDate?: string;
  completedDate?: string;
  trainer?: string;
  attendees: string[];
  required: boolean;
  completed: boolean;
}

export interface PunchItem {
  id: string;
  description: string;
  correctiveAction?: string;
  owner?: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
}

export interface PreStartupInspection {
  inspectionDate?: string;
  inspectors: string[];
  checklist: ChecklistRecord[];
  result?: string;
  punchItems: PunchItem[];
  reinspectionRequired: boolean;
  reinspectionDate?: string;
  finalResult: "SUITABLE" | "UNSUITABLE" | null;
}

export interface StatusHistoryEntry {
  id: string;
  previousStatus?: MocWorkflowStatus;
  newStatus: MocWorkflowStatus;
  changedAt: string;
  changedBy: string;
  memo?: string;
}

export interface MocCaseV2 {
  schemaVersion: typeof MOC_SCHEMA_VERSION;
  id: string;
  caseNumber: string;
  title: string;
  workType: WorkType;
  author: string;
  department: string;
  site: Site;
  createdAt: string;
  dueDate: string;
  basicInfo: MocBasicInfo;
  replacementDecision?: ReplacementDecision;
  gradeDecision?: GradeDecision;
  approval: ApprovalRecord;
  committee: CommitteeRecord;
  implementationPlan: ChecklistRecord[];
  reviewItems: ChecklistRecord[];
  processSafetyDocuments: ProcessSafetyDocumentRecord[];
  training: { records: TrainingRecord[] };
  preStartupInspection: PreStartupInspection;
  workCompleted: boolean;
  emergencyPostReviewCompleted: boolean;
  temporaryTechnicalReviewCompleted: boolean;
  temporaryRiskAssessmentCompleted: boolean;
  temporarySiteTagInstalled: boolean;
  temporaryRestored: boolean;
  temporaryConvertedToPermanentCaseId?: string;
  workflow: { status: MocWorkflowStatus };
  statusHistory: StatusHistoryEntry[];
  answers: Record<string, unknown>;
  judgment?: Record<string, unknown>;
  draft: Record<string, unknown>;
  [legacyKey: string]: unknown;
}
