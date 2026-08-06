# 사업장 입장 및 데이터 분리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인 없이 입장 화면에서 시작하고, 선택한 사업장 기준으로 MOC 업무 데이터를 분리해 표시한다.

**Architecture:** `app/lib/sites.ts`가 사업장 목록과 필터를 제공한다. `MocCase`에 `site`를 추가하고, 페이지는 입장 상태와 선택 사업장을 보존한 뒤 모든 목록에 필터된 건만 전달한다.

**Tech Stack:** React, TypeScript, Node test runner, CSS.

## Global Constraints

- 사업장은 `포항라임공장`, `포항화성공장`만 제공한다.
- 로그인·회원가입·인증 호출은 입장 흐름에서 제거한다.
- 사업장 선택값은 `localStorage`에 저장하며, 지원하지 않는 값은 무시한다.
- 신규 건은 현재 선택 사업장에 귀속한다.

---

### Task 1: 사업장 모델과 테스트

**Files:**

- Create: `app/lib/sites.ts`
- Modify: `app/lib/moc.ts`
- Modify: `tests/moc-engine.test.mjs`

**Interfaces:**

- Produces: `sites`, `Site`, `isSite(value)`, `casesForSite(items, site)`.
- Changes: `MocCase` gains `site: Site`.

- [ ] **Step 1: Write the failing test**

```js
import { casesForSite, sites } from "../app/lib/sites.ts";
test("사업장 목록은 가나다순이며 선택 사업장 건만 반환한다", () => {
  assert.deepEqual(sites, ["포항라임공장", "포항화성공장"]);
  const result = casesForSite([{ id: "1", site: "포항라임공장" }, { id: "2", site: "포항화성공장" }], "포항화성공장");
  assert.deepEqual(result.map((item) => item.id), ["2"]);
});
```

- [ ] **Step 2: Run the test**

Run: `npm test`

Expected: FAIL because `app/lib/sites.ts` is missing.

- [ ] **Step 3: Implement the minimum model**

```ts
export const sites = ["포항라임공장", "포항화성공장"] as const;
export type Site = (typeof sites)[number];
export const isSite = (value: string | null): value is Site => value !== null && sites.includes(value as Site);
export const casesForSite = <T extends { site: Site }>(items: T[], site: Site) => items.filter((item) => item.site === site);
```

Import `Site` in `moc.ts`, add it to `MocCase`, and assign the mock cases to the two sites.

- [ ] **Step 4: Verify and commit**

Run: `npm test`

Expected: PASS.

Commit: `git add app/lib/sites.ts app/lib/moc.ts tests/moc-engine.test.mjs && git commit -m "feat: add site-aware MOC model"`

### Task 2: 입장 화면과 사업장 선택

**Files:**

- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Modify: `tests/moc-engine.test.mjs`

**Interfaces:**

- Consumes: `sites`, `Site`, `isSite` from Task 1.
- Produces: `EntryScreen({ onEnter })`, `SiteSelector({ site, onSelect })`, plus `entered` and `selectedSite` state.

- [ ] **Step 1: Write the failing test**

```js
import { isSite } from "../app/lib/sites.ts";
test("저장된 사업장 값은 지원 목록에서만 유효하다", () => {
  assert.equal(isSite("포항라임공장"), true);
  assert.equal(isSite("없는공장"), false);
  assert.equal(isSite(null), false);
});
```

- [ ] **Step 2: Run the test**

Run: `npm test`

Expected: FAIL until `isSite` is exported.

- [ ] **Step 3: Implement the entry flow**

Remove the login and registration state, callbacks, API calls, and `Login` component. Add a service-introduction `EntryScreen` with one `입장` button. After entry, render the app shell. Read and write `safechange-selected-site` only for values accepted by `isSite`. Put `SiteSelector` under the logo at the upper left. Show a selection prompt if no site is selected.

- [ ] **Step 4: Verify and commit**

Run: `npm test`

Expected: PASS.

Commit: `git add app/page.tsx app/globals.css tests/moc-engine.test.mjs && git commit -m "feat: replace login with site entry flow"`

### Task 3: 사업장별 목록과 상단 표시

**Files:**

- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**

- Consumes: `casesForSite(cases, selectedSite)` and `selectedSite: Site`.
- Produces: `siteCases` list and `Header({ site })` display.

- [ ] **Step 1: Write the failing test**

```js
test("새 MOC 건은 선택 사업장을 보존한다", () => {
  const created = { id: "moc-new", site: "포항라임공장" };
  assert.deepEqual(casesForSite([created], "포항라임공장"), [created]);
  assert.deepEqual(casesForSite([created], "포항화성공장"), []);
});
```

- [ ] **Step 2: Run the test**

Run: `npm test`

Expected: FAIL until site-aware case creation is implemented.

- [ ] **Step 3: Implement filtering and labels**

Derive `siteCases` from all cases and the current business site. Use it for dashboard stats, recent list, reminders and history. Set `site: selectedSite` in `startCase`. Pass selected site to sidebar and header. Replace the right-header person, department and avatar with the business-site name. Do not allow case creation or opening before selection.

- [ ] **Step 4: Verify and commit**

Run: `npm test && npm run build`

Expected: all tests PASS and no TypeScript build error.

Commit: `git add app/page.tsx app/globals.css tests/moc-engine.test.mjs && git commit -m "feat: filter MOC views by selected site"`

### Task 4: Usage documentation

**Files:**

- Modify: `README.md`

**Interfaces:**

- Consumes: completed entry flow from Tasks 1-3.
- Produces: Korean usage notes for entry and business-site selection.

- [ ] **Step 1: Update documentation**

Add a short Korean section explaining `입장`, the upper-left selector, and the two available factories.

- [ ] **Step 2: Verify and commit**

Run: `npm test && npm run build`

Expected: PASS.

Commit: `git add README.md && git commit -m "docs: describe site entry workflow"`

## Plan Self-Review

- Entry button: Task 2.
- Ordered two-site selector: Tasks 1 and 2.
- Right-side business-site display: Task 3.
- Site-specific MOC data and new-case assignment: Tasks 1 and 3.
- No placeholders or inconsistent type names remain.
