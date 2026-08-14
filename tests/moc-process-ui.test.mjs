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

test("process workspace includes approval, committee, PSM plan, training and pre-startup records", async () => {
  const source = await read("../app/components/moc/MocProcessWorkspace.tsx");
  for (const label of ["변경관리위원회", "승인", "변경관리 실시 계획", "공정안전자료 최신화", "교육", "가동전 점검", "Punch List", "PSM 요소"]) {
    assert.match(source, new RegExp(label));
  }
  assert.doesNotMatch(source, /title="변경 검토사항"/);
});

test("Punch List deletion requires a confirmation dialog", async () => {
  const source = await read("../app/components/moc/MocProcessWorkspace.tsx");
  assert.match(source, /punchPendingDeletion/);
  assert.match(source, /정말 삭제하시겠습니까/);
  assert.match(source, /Punch List 삭제/);
  assert.match(source, /🗑/u);
});

test("grade 1 and 2 committee path is visibly distinguished from grade 3", async () => {
  const source = await read("../app/components/moc/MocProcessWorkspace.tsx");
  assert.match(source, /grade === "1" \|\| grade === "2"/);
  assert.match(source, /설비운영파트장/);
});

test("grade 1 and 2 committee records manage attendees with add, check, and confirmed deletion", async () => {
  const source = await read("../app/components/moc/MocProcessWorkspace.tsx");
  const types = await read("../app/lib/moc/types.ts");

  for (const label of ["담당", "성명", "직책", "참석여부", "참석자 추가", "위원회 참석자 삭제"]) {
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /addCommitteeMember/);
  assert.match(source, /committeeMemberPendingDeletion/);
  assert.match(source, /type="checkbox" checked=\{member\.attended\}/);
  assert.match(source, /filter\(\(member\) => member\.id !== committeeMemberPendingDeletion\)/);
  assert.match(types, /export interface CommitteeMember/);
  assert.match(types, /members: CommitteeMember\[\]/);
});

test("page routes guideline cases to the process workspace", async () => {
  const source = await read("../app/page.tsx");
  assert.match(source, /MocProcessWorkspace/);
  assert.match(source, /view === "process"/);
  assert.match(source, /onApprove=\{approveCase\}/);
});

test("process workspace approval updates the shared approval queue", async () => {
  const source = await read("../app/components/moc/MocProcessWorkspace.tsx");
  assert.match(source, /onApprove: \(id: string\) => void/);
  assert.match(source, /onClick=\{\(\) => onApprove\(item\.id\)\}/);
  assert.doesNotMatch(source, /disabled=\{committeeRequired && item\.committee\?\.decision !== "APPROVED"\}/);
});

test("process workspace saves only through the temporary save action and supports bulk confirmation", async () => {
  const source = await read("../app/components/moc/MocProcessWorkspace.tsx");
  assert.match(source, /onTemporarySave/);
  assert.match(source, /임시저장/);
  assert.match(source, /setItem\(\(current\)/);
  assert.match(source, /updateAllApplicablePlans/);
  assert.match(source, /onToggleAll/);
  assert.match(source, /확인 항목 전체 선택/);
  assert.match(source, /entry\.applicable === true/);
  assert.match(source, /disabled=\{entry\.applicable !== true\}/);
  assert.match(source, /완료 예정일/);
  assert.match(source, /임시저장 버튼을 누른 경우에만 저장/);
});
