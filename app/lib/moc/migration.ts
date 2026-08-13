import { isSite, sites, type Site } from "../sites.ts";
import { createEmptyMocCase } from "./defaults.ts";
import {
  MOC_SCHEMA_VERSION,
  type Grade,
  type MocCaseV2,
  type MocWorkflowStatus,
  type WorkType,
} from "./types.ts";

const workTypes: WorkType[] = ["기계 설비", "배관", "전기", "계장", "운전조건", "원료·화학물질", "작업 절차", "기타"];

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function object(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function legacyWorkflowStatus(status: unknown, target: boolean | undefined): MocWorkflowStatus {
  if (status === "CLOSED" || status === "WORK_COMPLETED") return "COMPLETED";
  if (status === "APPROVED" || status === "WORK_IN_PROGRESS") return status === "APPROVED" ? "APPROVED" : "IMPLEMENTING";
  if (status === "SUBMITTED" || status === "UNDER_REVIEW" || status === "JUDGMENT_COMPLETED") {
    return target === false ? "SIMPLE_REPLACEMENT" : "REVIEW_PENDING";
  }
  if (status === "QUESTIONNAIRE_IN_PROGRESS") return "JUDGMENT_PENDING";
  return "DRAFT";
}

export function normalizeMocCasesV2(input: unknown, fallbackSite: Site = sites[0]): MocCaseV2[] {
  if (!Array.isArray(input)) return [];

  return input.flatMap((candidate) => {
    const source = object(candidate);
    if (typeof source.id !== "string") return [];

    const title = text(source.title, "제목 미입력");
    const workType = workTypes.includes(source.workType as WorkType) ? source.workType as WorkType : "기타";
    const site = isSite(text(source.site)) ? source.site as Site : fallbackSite;
    const base = createEmptyMocCase({
      id: source.id,
      caseNumber: text(source.caseNumber, source.id),
      title,
      workType,
      site,
      author: text(source.author),
      department: text(source.department),
      createdAt: text(source.createdAt, ""),
      dueDate: text(source.dueDate, ""),
    });

    if (source.schemaVersion === MOC_SCHEMA_VERSION) {
      return [{ ...base, ...source, schemaVersion: MOC_SCHEMA_VERSION, site } as MocCaseV2];
    }

    const judgment = object(source.judgment);
    const isMocTarget = typeof judgment.isMocTarget === "boolean" ? judgment.isMocTarget : undefined;
    const oldGrade = ["1", "2", "3"].includes(String(judgment.grade)) ? String(judgment.grade) as Exclude<Grade, "UNDETERMINED"> : undefined;
    const decidedAt = text(source.updatedAt, text(source.createdAt, ""));
    const workflowStatus = legacyWorkflowStatus(source.status, isMocTarget);

    return [{
      ...source,
      ...base,
      schemaVersion: MOC_SCHEMA_VERSION,
      site,
      answers: object(source.answers),
      judgment,
      draft: object(source.draft),
      replacementDecision: isMocTarget === undefined ? undefined : {
        result: isMocTarget ? "CHANGE" : "SIMPLE_REPLACEMENT",
        comparisons: {},
        matchedCriteria: [],
        reasons: isMocTarget ? ["기존 판단 결과를 변경으로 이관했습니다."] : ["기존 비대상 판단을 단순교체로 이관했습니다."],
        requiresCommittee: false,
        decidedAt,
      },
      gradeDecision: isMocTarget ? {
        recommendedGrade: oldGrade ?? "UNDETERMINED",
        matchedRules: [],
        reasons: oldGrade ? [`기존 ${oldGrade}등급 판단을 추천 등급으로 이관했습니다.`] : ["기존 등급을 확인할 수 없습니다."],
        requiresCommittee: oldGrade === "1" || oldGrade === "2" || !oldGrade,
        recommendedRiskAssessment: oldGrade === "3" ? "CHECK_LIST" : oldGrade ? "HAZOP" : undefined,
        decidedAt,
      } : undefined,
      workflow: { status: workflowStatus },
    } as MocCaseV2];
  });
}
