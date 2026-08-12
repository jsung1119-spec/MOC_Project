import type { MocCaseV2, MocWorkflowStatus } from "./types.ts";

export interface CompletionError {
  code: string;
  message: string;
  action: string;
}

const error = (code: string, message: string, action: string): CompletionError => ({ code, message, action });

function effectiveGrade(item: MocCaseV2) {
  return item.gradeDecision?.finalGrade ?? item.gradeDecision?.recommendedGrade;
}

function requiredDocumentsComplete(item: MocCaseV2) {
  return item.processSafetyDocuments.every((document) => document.status === "NO_IMPACT" || document.status === "COMPLETED");
}

function requiredTrainingComplete(item: MocCaseV2) {
  return item.training.records.filter((record) => record.required).every((record) => record.completed);
}

function reviewItemsComplete(item: MocCaseV2) {
  return item.reviewItems.every((review) => review.applicable === false || (review.applicable === true && review.confirmed));
}

export function validateCompletion(item: MocCaseV2): CompletionError[] {
  const errors: CompletionError[] = [];
  const grade = effectiveGrade(item);

  if (!item.approval.approved) errors.push(error("APPROVAL_INCOMPLETE", "필요한 변경 승인이 완료되지 않았습니다.", "검토/승인 단계에서 승인자를 지정하고 승인을 완료하세요."));
  if ((grade === "1" || grade === "2") && (!item.committee.held || item.committee.decision !== "APPROVED")) {
    errors.push(error("COMMITTEE_APPROVAL_INCOMPLETE", "1·2등급 변경관리위원회 심의·승인이 완료되지 않았습니다.", "3인 이상의 위원과 심의결과를 기록하세요."));
  }
  if (!item.workCompleted) errors.push(error("WORK_INCOMPLETE", "변경 작업이 완료되지 않았습니다.", "변경 실시 결과와 완료일을 기록하세요."));
  if (!requiredDocumentsComplete(item)) errors.push(error("DOCUMENT_UPDATE_INCOMPLETE", "개정이 필요한 공정안전자료가 남아 있습니다.", "개정 필요 자료를 모두 개정 완료로 변경하세요."));
  if (!requiredTrainingComplete(item)) errors.push(error("TRAINING_INCOMPLETE", "필수교육이 완료되지 않았습니다.", "가동 전에 운전·정비·도급업체 대상 필수교육을 완료하세요."));
  if (item.preStartupInspection.finalResult !== "SUITABLE") errors.push(error("PRE_STARTUP_INCOMPLETE", "가동전 점검이 최종 적합 상태가 아닙니다.", "가동전 점검과 필요한 재점검을 완료하세요."));
  if (item.preStartupInspection.punchItems.some((punch) => !punch.completed)) errors.push(error("PUNCH_ITEMS_OPEN", "미완료 Punch List가 있습니다.", "모든 개선사항을 조치하고 완료 여부를 확인하세요."));
  if (!reviewItemsComplete(item)) errors.push(error("REVIEW_ITEMS_INCOMPLETE", "변경 검토사항이 완료되지 않았습니다.", "해당되는 변경 검토사항의 결과와 완료 여부를 기록하세요."));

  if (item.basicInfo.duration === "TEMPORARY") {
    if (!item.temporaryTechnicalReviewCompleted) errors.push(error("TEMPORARY_TECHNICAL_REVIEW_INCOMPLETE", "임시변경 기술검토가 완료되지 않았습니다.", "변경관리 기술검토서를 작성하고 검토를 완료하세요."));
    if (!item.temporaryRiskAssessmentCompleted) errors.push(error("TEMPORARY_RISK_ASSESSMENT_INCOMPLETE", "임시변경 위험성평가가 완료되지 않았습니다.", "공정위험성평가를 수행하고 결과를 등록하세요."));
    if (!item.temporarySiteTagInstalled) errors.push(error("TEMPORARY_SITE_TAG_INCOMPLETE", "임시변경 현장 표시가 확인되지 않았습니다.", "표시판 또는 TAG를 설치하고 확인하세요."));
    if (!item.temporaryRestored && !item.temporaryConvertedToPermanentCaseId) errors.push(error("TEMPORARY_RESTORATION_INCOMPLETE", "임시변경 원상복구 또는 영구변경 전환이 완료되지 않았습니다.", "기간 만료 전 원상복구하거나 정상변경 건을 새로 등록하세요."));
  }

  if (item.basicInfo.changeKind === "EMERGENCY" && !item.emergencyPostReviewCompleted) {
    errors.push(error("EMERGENCY_POST_REVIEW_INCOMPLETE", "비상변경 사후 검토와 승인이 완료되지 않았습니다.", "변경 요청/승인서와 정상변경에 준하는 사후 절차를 완료하세요."));
  }
  return errors;
}

export function deriveWorkflowStatus(item: MocCaseV2): MocWorkflowStatus {
  const replacement = item.replacementDecision?.result;
  if (!replacement) return item.basicInfo.title && item.basicInfo.reason ? "JUDGMENT_PENDING" : "DRAFT";
  if (replacement === "SIMPLE_REPLACEMENT") return "SIMPLE_REPLACEMENT";
  if (replacement === "UNDETERMINED") return "COMMITTEE_REVIEW";

  const grade = effectiveGrade(item);
  if (!grade || grade === "UNDETERMINED") return "GRADE_PENDING";
  if ((grade === "1" || grade === "2") && (!item.committee.held || item.committee.decision !== "APPROVED")) return "COMMITTEE_REVIEW";
  if (!item.approval.approved) return "APPROVAL_PENDING";
  if (!item.workCompleted) return "IMPLEMENTING";
  if (!requiredDocumentsComplete(item)) return "DOCUMENT_UPDATE";
  if (!requiredTrainingComplete(item)) return "TRAINING";
  if (item.preStartupInspection.punchItems.some((punch) => !punch.completed) || item.preStartupInspection.finalResult === "UNSUITABLE") return "CORRECTIVE_ACTION";
  if (item.preStartupInspection.finalResult !== "SUITABLE") return "PRE_STARTUP_CHECK";
  return validateCompletion(item).length === 0 ? "COMPLETED" : "REVIEW_PENDING";
}

export function allowedWorkflowActions(item: MocCaseV2): string[] {
  const status = deriveWorkflowStatus(item);
  const actionByStatus: Partial<Record<MocWorkflowStatus, string[]>> = {
    DRAFT: ["기본정보 작성"],
    JUDGMENT_PENDING: ["변경판정 진행"],
    COMMITTEE_REVIEW: ["변경관리위원회 검토"],
    GRADE_PENDING: ["등급판정 진행"],
    APPROVAL_PENDING: ["승인 요청"],
    IMPLEMENTING: ["변경 실시 기록"],
    DOCUMENT_UPDATE: ["공정안전자료 최신화"],
    TRAINING: ["필수교육 실시"],
    PRE_STARTUP_CHECK: ["가동전 점검"],
    CORRECTIVE_ACTION: ["미흡사항 보완 및 재점검"],
  };
  return actionByStatus[status] ?? [];
}
