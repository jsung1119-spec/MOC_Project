export const sites = ["포항라임공장", "포항화성공장"] as const;

export type Site = (typeof sites)[number];

export const isSite = (value: string | null): value is Site =>
  value !== null && sites.includes(value as Site);

export const casesForSite = <T extends { site: Site }>(items: T[], site: Site) =>
  items.filter((item) => item.site === site);

type ReminderCandidate = {
  status: string;
  dueDate: string;
  basicInfo?: {
    changeKind?: string;
    duration?: string;
    temporaryEndDate?: string;
  };
  emergencyPostReviewCompleted?: boolean;
  temporaryRestored?: boolean;
  approval?: { approved?: boolean };
  training?: { records?: { required?: boolean; completed?: boolean }[] };
  preStartupInspection?: { punchItems?: { completed?: boolean }[] };
};

const localDateKey = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export const reminderReasonsForCase = (item: ReminderCandidate, today = localDateKey()) => {
  if (["CLOSED", "WORK_COMPLETED"].includes(item.status)) return [];

  const reasons: string[] = [];
  if (item.status === "DOCUMENT_DRAFTING") reasons.push("초안 작성 후 미제출");
  if (item.dueDate && item.dueDate <= today) reasons.push("완료 예정일 경과");
  if (item.basicInfo?.changeKind === "EMERGENCY" && item.emergencyPostReviewCompleted === false) {
    reasons.push("비상 변경 사후 검토 미완료");
  }
  if (
    item.basicInfo?.duration === "TEMPORARY" &&
    item.basicInfo.temporaryEndDate &&
    item.basicInfo.temporaryEndDate < today &&
    item.temporaryRestored === false
  ) {
    reasons.push("임시 변경 기한 경과 및 원상복구 미완료");
  }
  if (item.approval?.approved && item.training?.records?.some((record) => record.required && !record.completed)) {
    reasons.push("필수 교육 미완료");
  }
  if (item.preStartupInspection?.punchItems?.some((punch) => !punch.completed)) {
    reasons.push("Punch List 조치 미완료");
  }
  return reasons;
};

export const remindersForCases = <T extends ReminderCandidate>(items: T[], today = localDateKey()) =>
  items.filter((item) => reminderReasonsForCase(item, today).length > 0);
