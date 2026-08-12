import test from "node:test";
import assert from "node:assert/strict";

import { reminderReasonsForCase, remindersForCases } from "../app/lib/sites.ts";

const today = "2026-08-12";

test("guideline reminders identify overdue temporary, emergency review, training and Punch items", () => {
  const item = {
    id: "moc-guideline",
    status: "WORK_IN_PROGRESS",
    dueDate: "2026-08-20",
    basicInfo: { changeKind: "EMERGENCY", duration: "TEMPORARY", temporaryEndDate: "2026-08-10" },
    emergencyPostReviewCompleted: false,
    temporaryRestored: false,
    approval: { approved: true },
    training: { records: [{ required: true, completed: false }] },
    preStartupInspection: { punchItems: [{ completed: false }] },
  };

  assert.deepEqual(reminderReasonsForCase(item, today), [
    "비상 변경 사후 검토 미완료",
    "임시 변경 기한 경과 및 원상복구 미완료",
    "필수 교육 미완료",
    "Punch List 조치 미완료",
  ]);
  assert.deepEqual(remindersForCases([item], today).map((caseItem) => caseItem.id), ["moc-guideline"]);
});

test("closed cases never re-enter Reminder even if old records are incomplete", () => {
  const closed = {
    id: "closed",
    status: "CLOSED",
    dueDate: "2026-08-01",
    basicInfo: { changeKind: "EMERGENCY", duration: "TEMPORARY", temporaryEndDate: "2026-08-01" },
    emergencyPostReviewCompleted: false,
    temporaryRestored: false,
  };

  assert.deepEqual(reminderReasonsForCase(closed, today), []);
});
