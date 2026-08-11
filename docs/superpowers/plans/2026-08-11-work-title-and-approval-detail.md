# 작업명 입력과 검토/승인 상세 보기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 작업명을 직접 입력해 MOC 이력에 저장하고, 검토/승인 화면에서 작업 상세와 질문 답변을 확인하게 한다.

**Architecture:** `NewCase`는 작업명 상태를 관리해 선택된 작업 유형과 함께 `startCase`에 전달한다. `createMocCase` 생성 뒤 `title`을 덮어쓰며, 모든 기존 표는 이미 `item.title`을 사용하므로 입력값이 자동으로 반영된다. `Approvals`에는 선택된 건의 상세를 표시하는 로컬 상태를 추가한다.

**Tech Stack:** Next.js, React, TypeScript, Node.js 내장 테스트 러너

## Global Constraints

- 작업명과 변경 항목을 모두 선택해야 질문 단계로 이동한다.
- 작업명은 선택한 사업장의 새 MOC 건 `title`에 저장한다.
- 검토/승인 배지는 Reminder 배지와 같은 `em` 요소와 기존 CSS를 재사용한다.
- 승인 대기 수 계산과 사업장별 목록 제한은 바꾸지 않는다.
- 질문 상세는 작업명, 기본 판단 정보, 전체 질문과 답변을 표시한다.

---

### Task 1: 필수 작업명 입력과 이력 저장

**Files:**
- Modify: `tests/moc-engine.test.mjs`
- Modify: `app/page.tsx:158-165, 280-285`

**Interfaces:**
- Consumes: `NewCase`의 `onSelect`, `startCase`, `createMocCase`
- Produces: `onSelect(type: WorkType, title: string)`와 사용자가 입력한 `MocCase.title`

- [ ] **Step 1: Write the failing test**

```js
test("new MOC cases require and persist a user-provided work title", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /function startCase\(type: WorkType, title: string\)/);
  assert.match(page, /createMocCase\(\{ id, cases, workType: type, site: selectedSite \}\).*title: title\.trim\(\)/s);
  assert.match(page, /const \[title, setTitle\] = useState\(""\)/);
  assert.match(page, /disabled=\{!selected \|\| !title\.trim\(\)\}/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test`

Expected: FAIL because the current start function takes only a work type and the screen has no title state.

- [ ] **Step 3: Write minimal implementation**

```tsx
function startCase(type: WorkType, title: string) {
  const item = { ...createMocCase({ id, cases, workType: type, site: selectedSite }), title: title.trim() };
  // keep the existing state update and navigation
}

const [title, setTitle] = useState("");
<label className="field"><span>작업명</span><input value={title} onChange={event => setTitle(event.target.value)} placeholder="예: T-101 이송배관 재질 변경" /></label>
<button className="btn primary" disabled={!selected || !title.trim()} onClick={() => selected && onSelect(selected, title)}>다음 단계 →</button>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test`

Expected: the work-title test and all existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx tests/moc-engine.test.mjs
git commit -m "feat: require a work title for new cases"
```

### Task 2: 검토/승인 배지 통일과 작업 상세 보기

**Files:**
- Modify: `tests/moc-engine.test.mjs`
- Modify: `app/page.tsx:224-226, 383-386`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `MocCase`, `Question`, `questions`, `optionMeta`, `approvalPendingStatuses`
- Produces: `Approvals` 내부 `selectedCase` 상태와 질문 답변 상세 화면

- [ ] **Step 1: Write the failing test**

```js
test("approval navigation reuses the Reminder badge and opens work details", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const approvalBlock = page.match(/function Approvals[\s\S]*?\n}\n\nfunction History/?.[0] ?? "";
  assert.match(page, /item\.key === "approvals" && approvalPendingCount > 0 && <em>\{approvalPendingCount\}<\/em>/);
  assert.match(approvalBlock, /const \[selectedCase, setSelectedCase\] = useState<MocCase \| null>\(null\)/);
  assert.match(approvalBlock, /onClick=\{\(\) => setSelectedCase\(item\)\}/);
  assert.match(approvalBlock, /전체 질문과 답변/);
  assert.match(approvalBlock, /optionMeta\[selectedCase\.answers\[question\.id\]\?\? "NOT_APPLICABLE"\]\.label/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test`

Expected: FAIL because the approval count uses a separate span and approval rows have no selectable details.

- [ ] **Step 3: Write minimal implementation**

Use the existing Sidebar `em` tag for both Reminder and approval counts. In `Approvals`, add selected-case state, turn the title into a button, and show a modal-style detail section.

```tsx
{item.key === "approvals" && approvalPendingCount > 0 && <em>{approvalPendingCount}</em>}

const [selectedCase, setSelectedCase] = useState<MocCase | null>(null);
<button className="approval-title" onClick={() => setSelectedCase(item)}>{item.title}</button>
{selectedCase && <section className="approval-detail">
  <button className="btn ghost" onClick={() => setSelectedCase(null)}>닫기</button>
  <h2>{selectedCase.title}</h2>
  <h3>전체 질문과 답변</h3>
  <ul>{questions.map(question => <li key={question.id}>{question.text}<b>{optionMeta[selectedCase.answers[question.id] ?? "NOT_APPLICABLE"].label}</b></li>)}</ul>
</section>}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test && npm.cmd run build && npm.cmd run build:vercel`

Expected: all tests, the ChatGPT Sites build, and the Vercel demo build complete successfully.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/globals.css tests/moc-engine.test.mjs
git commit -m "feat: add approval work detail view"
```
