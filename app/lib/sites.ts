export const sites = ["포항라임공장", "포항화성공장"] as const;

export type Site = (typeof sites)[number];

export const isSite = (value: string | null): value is Site =>
  value !== null && sites.includes(value as Site);

export const casesForSite = <T extends { site: Site }>(items: T[], site: Site) =>
  items.filter((item) => item.site === site);

type ReminderCandidate = {
  status: string;
  dueDate: string;
};

export const remindersForCases = <T extends ReminderCandidate>(items: T[]) =>
  items.filter(
    (item) =>
      !["CLOSED", "WORK_COMPLETED"].includes(item.status) &&
      (item.status === "DOCUMENT_DRAFTING" || item.dueDate <= "2026-07-31"),
  );
