# 등급 확정 후 검토/승인 배지 표시 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 등급 확정 후 결과 화면을 유지하고, 선택 사업장의 미승인 등급 확정 건수를 검토/승인 메뉴에 표시한다.

**Architecture:** `app/page.tsx`의 판단 실행 함수는 상태만 `JUDGMENT_COMPLETED`로 갱신하고 화면 전환을 하지 않는다. 같은 파일의 사이드바에서 현재 사업장 이력 중 `JUDGMENT_COMPLETED`, `SUBMITTED`, `UNDER_REVIEW` 상태를 계산하여 검토/승인 메뉴의 배지와 승인 목록에 사용한다.

**Tech Stack:** Next.js, React, TypeScript, Node.js 내장 테스트 러너

## Global Constraints

- 배지와 승인 목록은 현재 선택 사업장의 이력만 사용한다.
- 승인 완료(`APPROVED`)와 종결(`CLOSED`) 건은 대기 건수에서 제외한다.
- 문서 초안 작성 여부와 무관하게 등급 확정 직후부터 대기 건수에 포함한다.
- 기존 브라우저 로컬 저장 방식과 Vercel 시연용 빌드 구성을 유지한다.

---

### Task 1: 등급 확정 화면 유지와 승인 대기 조건 테스트

**Files:**
- Modify: `tests/moc-engine.test.mjs:136-144`
- Modify: `app/page.tsx:172-177`

**Interfaces:**
- Consumes: `runJudgment()` 내부의 `updateCase()`와 `go()` 호출
- Produces: 판단 완료 상태를 저장하되 결과 화면을 유지한다는 소스 계약

- [ ] **Step 1: Write the failing test**

`tests/moc-engine.test.mjs`의 기존 자동 승인 화면 이동 테스트를 아래 내용으로 교체한다.

```js
test("completed judgments remain on the result screen and enter the approval queue", () => {
  const normalizedPage = page.replaceAll("\r\n", "\n");
  const judgmentBlock = normalizedPage.match(/function runJudgment\(\)[\s\S]*?\n  }\n\n  if \(!hydrated\)/)?.[0] ?? "";
  assert.match(judgmentBlock, /status: "JUDGMENT_COMPLETED"/);
  assert.doesNotMatch(judgmentBlock, /go\("approvals"\)/);
  assert.match(page, /\["JUDGMENT_COMPLETED", "SUBMITTED", "UNDER_REVIEW"\]/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test`

Expected: the test fails because the current implementation stores `SUBMITTED` and calls `go("approvals")`.

- [ ] **Step 3: Write minimal implementation**

In `runJudgment()`, replace the automatic submission and navigation with a judgment-completed state update and result-screen navigation.

```ts
updateCase({ judgment: result, status: "JUDGMENT_COMPLETED" });
go("result");
```

Add one shared pending-status constant near the view-level helpers.

```ts
const approvalPendingStatuses: MocStatus[] = ["JUDGMENT_COMPLETED", "SUBMITTED", "UNDER_REVIEW"];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test`

Expected: the updated behavior test passes and no existing test fails.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx tests/moc-engine.test.mjs
git commit -m "feat: keep judgment results before approval"
```

### Task 2: 사업장별 검토/승인 메뉴 배지 표시

**Files:**
- Modify: `tests/moc-engine.test.mjs`
- Modify: `app/page.tsx:223-239`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `siteCases`, `approvalPendingStatuses`, `View`, `go()`
- Produces: `approvalPendingCount`와 메뉴 항목용 숫자 배지

- [ ] **Step 1: Write the failing test**

Add a source-level test that requires the count to use the current site case collection, the approved-state exclusion, and a menu badge.

```js
test("approval navigation shows a selected-site pending count badge", () => {
  assert.match(page, /const approvalPendingCount = siteCases\.filter\(c => approvalPendingStatuses\.includes\(c\.status\)\)\.length;/);
  assert.match(page, /approvalPendingCount > 0 && <span className="nav-count">\{approvalPendingCount\}<\/span>/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test`

Expected: the new test fails because neither `approvalPendingCount` nor `nav-count` exists.

- [ ] **Step 3: Write minimal implementation**

Calculate the count immediately before the `nav` array and render it only for the approval menu item.

```tsx
const approvalPendingCount = siteCases.filter(c => approvalPendingStatuses.includes(c.status)).length;

<button className={cn("nav-item", view === n.key && "active")} onClick={() => go(n.key)}>
  <span className="nav-icon">{n.icon}</span>
  <span>{n.label}</span>
  {n.key === "approvals" && approvalPendingCount > 0 && <span className="nav-count">{approvalPendingCount}</span>}
</button>
```

Add compact red circular badge styling without changing the existing Reminder badge.

```css
.nav-count{margin-left:auto;min-width:20px;height:20px;padding:0 6px;border-radius:999px;display:grid;place-items:center;background:#d94343;color:#fff;font-size:11px;font-weight:800;line-height:1}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test`

Expected: the new menu-badge test and all existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/globals.css tests/moc-engine.test.mjs
git commit -m "feat: show pending approvals in navigation"
```

### Task 3: 승인 목록과 배지의 동일한 대기 범위 검증

**Files:**
- Modify: `tests/moc-engine.test.mjs`
- Modify: `app/page.tsx:381-386`

**Interfaces:**
- Consumes: `approvalPendingStatuses`, `Approvals` 컴포넌트의 `items`
- Produces: 메뉴 배지와 승인 목록이 같은 상태 집합을 사용하는 구현

- [ ] **Step 1: Write the failing test**

Add a test that confirms the approval list accepts the same status values as the side-menu badge.

```js
test("approval list includes every unapproved judgment-completed status", () => {
  const approvalBlock = page.match(/function Approvals[\s\S]*?\n}\n\nfunction History/?.[0] ?? "";
  assert.match(approvalBlock, /approvalPendingStatuses\.includes\(c\.status\)/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test`

Expected: the test fails because the list currently filters only `SUBMITTED` and `UNDER_REVIEW`.

- [ ] **Step 3: Write minimal implementation**

Update the pending filter in `Approvals` to use the shared status array.

```ts
const pending = items.filter(c => approvalPendingStatuses.includes(c.status));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test && npm.cmd run build && npm.cmd run build:vercel`

Expected: all tests, the ChatGPT Sites build, and the Vercel demo build complete successfully.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx tests/moc-engine.test.mjs
git commit -m "fix: align approval list with pending badge"
```
