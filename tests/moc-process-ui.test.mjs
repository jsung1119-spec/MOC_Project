import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("process workspace derives status and has no manual next-step control", async () => {
  const source = await read("../app/components/moc/MocProcessWorkspace.tsx");
  assert.match(source, /deriveWorkflowStatus/);
  assert.match(source, /validateCompletion/);
  assert.doesNotMatch(source, /다음 단계 완료/);
});

test("process workspace includes approval, committee, plans, training and pre-startup records", async () => {
  const source = await read("../app/components/moc/MocProcessWorkspace.tsx");
  for (const label of ["변경관리위원회", "승인", "변경관리 실시 계획", "변경 검토사항", "공정안전자료 최신화", "교육", "가동전 점검", "Punch List"]) {
    assert.match(source, new RegExp(label));
  }
});

test("grade 1 and 2 committee path is visibly distinguished from grade 3", async () => {
  const source = await read("../app/components/moc/MocProcessWorkspace.tsx");
  assert.match(source, /grade === "1" \|\| grade === "2"/);
  assert.match(source, /설비운전파트장/);
});

test("page routes guideline cases to the process workspace", async () => {
  const source = await read("../app/page.tsx");
  assert.match(source, /MocProcessWorkspace/);
  assert.match(source, /view === "process"/);
});
