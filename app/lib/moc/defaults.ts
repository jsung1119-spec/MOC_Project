import type { Site } from "../sites.ts";
import {
  MOC_SCHEMA_VERSION,
  type MocCaseV2,
  type WorkType,
} from "./types.ts";

export function createEmptyMocCase({
  id,
  caseNumber,
  title,
  workType,
  site,
  author = "",
  department = "",
  createdAt = new Date().toISOString().slice(0, 10),
  dueDate = "",
}: {
  id: string;
  caseNumber: string;
  title: string;
  workType: WorkType;
  site: Site;
  author?: string;
  department?: string;
  createdAt?: string;
  dueDate?: string;
}): MocCaseV2 {
  return {
    schemaVersion: MOC_SCHEMA_VERSION,
    id,
    caseNumber,
    title,
    workType,
    author,
    department,
    site,
    createdAt,
    dueDate,
    basicInfo: {
      title,
      reason: "",
      description: "",
      targetEquipment: "",
      workType,
      beforeState: "",
      changeKind: "NORMAL",
      duration: "PERMANENT",
    },
    approval: { approved: false },
    committee: { held: false, members: [], decision: null },
    implementationPlan: [],
    reviewItems: [],
    processSafetyDocuments: [],
    training: { records: [] },
    preStartupInspection: {
      inspectors: [],
      checklist: [],
      punchItems: [],
      reinspectionRequired: false,
      finalResult: null,
    },
    workCompleted: false,
    emergencyPostReviewCompleted: false,
    temporaryTechnicalReviewCompleted: false,
    temporaryRiskAssessmentCompleted: false,
    temporarySiteTagInstalled: false,
    temporaryRestored: false,
    workflow: { status: "DRAFT" },
    statusHistory: [],
    answers: {},
    draft: {},
  };
}
