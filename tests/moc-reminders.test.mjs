import test from "node:test";
import assert from "node:assert/strict";

import { reminderReasonsForCase, remindersForCases } from "../app/lib/sites.ts";

const today = "2026-08-12";

test("Reminder includes only open work with an explicitly selected overdue due date", () => {
  const items = [
    { id: "overdue", status: "WORK_IN_PROGRESS", dueDate: "2026-08-10" },
    { id: "today", status: "WORK_IN_PROGRESS", dueDate: "2026-08-12" },
    { id: "future", status: "WORK_IN_PROGRESS", dueDate: "2026-08-20" },
    { id: "no-date", status: "WORK_IN_PROGRESS", dueDate: "" },
    { id: "closed", status: "CLOSED", dueDate: "2026-08-10" },
  ];

  assert.deepEqual(reminderReasonsForCase(items[0], today), ["완료 예정일 경과 후 미완료"]);
  assert.deepEqual(remindersForCases(items, today).map((item) => item.id), ["overdue"]);
});

test("a postponed Reminder stays hidden until its selected resume date", () => {
  const item = { id: "snoozed", status: "WORK_IN_PROGRESS", dueDate: "2026-08-10", reminderSnoozedUntil: "2026-08-15" };
  assert.deepEqual(remindersForCases([item], today), []);
  assert.deepEqual(remindersForCases([item], "2026-08-16").map((caseItem) => caseItem.id), ["snoozed"]);
});
