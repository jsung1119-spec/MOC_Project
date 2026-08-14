import test from "node:test";
import assert from "node:assert/strict";

import { managedQuestions, mergeManagedQuestions } from "../app/lib/moc/managed-questions.ts";

test("admin question catalog includes only the Appendix 2 change determination questions", () => {
  const catalog = managedQuestions();
  assert.ok(catalog.some((question) => question.id === "replacement:material"));
  assert.ok(catalog.every((question) => question.id.startsWith("replacement:")));
  assert.ok(catalog.every((question) => question.guidelineSection === "붙임 2 변경판정 기준"));
});

test("existing admin edits remain when the catalog is upgraded", () => {
  const merged = mergeManagedQuestions([{ id: "replacement:material", order: 1, category: "붙임 2 · 변경판정", text: "재질이 동일합니까?", description: "수정한 설명", guidelineSection: "붙임 2 변경판정 기준", workTypes: [] }]);
  assert.equal(merged.find((question) => question.id === "replacement:material")?.text, "재질이 동일합니까?");
  assert.ok(merged.every((question) => question.id.startsWith("replacement:")));
});
