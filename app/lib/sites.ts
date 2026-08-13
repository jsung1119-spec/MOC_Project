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
  if (!item.dueDate || item.dueDate >= today) return [];
  return ["완료 예정일 경과 후 미완료"];
};

export const remindersForCases = <T extends ReminderCandidate>(items: T[], today = localDateKey()) =>
  items.filter((item) => reminderReasonsForCase(item, today).length > 0);
