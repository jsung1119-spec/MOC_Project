# Entry Return and Admin Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the criteria-management dialog heading and provide a first-screen return action that clears all active session data.

**Architecture:** Keep reset orchestration in `Home`, which owns the entered state and all session state. Pass a reset callback to `Header`; it clears in-memory state and browser storage before rendering `EntryScreen` again. The existing password dialog remains intact except for its visible heading.

**Tech Stack:** React, TypeScript, CSS, Node test runner, vinext.

## Global Constraints

- Preserve the existing criteria password `0000` and its behavior.
- Return must reset selected site, in-progress MOC data, filters, Reminder logs, and administrator authorization.
- Clear only `safechange-cases` and `safechange-selected-site` from browser storage.
- Do not change MOC rules, configured sites, or deployment access.

---

### Task 1: Prompt copy cleanup and session return

**Files:**
- Modify: `app/page.tsx`
- Modify: `tests/moc-engine.test.mjs`

**Interfaces:**
- Consumes: `Header` rendering inside `Home` and `seedCases` default records.
- Produces: `returnToEntry(): void` and `Header({ onReturnToEntry })`.

- [ ] **Step 1: Write failing source-level regression tests**

```js
test("admin password prompt omits the obsolete heading", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.equal(page.includes(">기준 관리 접근<"), false);
  assert.match(page, /aria-label="기준 관리 비밀번호 입력"/);
});

test("return to entry clears session state and persisted work", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /function returnToEntry\(\)/);
  assert.match(page, /localStorage\.removeItem\("safechange-cases"\)/);
  assert.match(page, /localStorage\.removeItem\("safechange-selected-site"\)/);
  assert.match(page, /setAdminAuthorized\(false\)/);
  assert.match(page, /처음 화면으로/);
});
```

- [ ] **Step 2: Run the test suite to verify red**

Run: `npm.cmd test`

Expected: the obsolete-heading assertion and return-handler assertions fail because the heading and no reset action are currently present.

- [ ] **Step 3: Implement the minimal UI and reset behavior**

```tsx
function returnToEntry() {
  setSelectedSite(null);
  setView("dashboard");
  setCases(seedCases);
  setActiveId(seedCases[0].id);
  setQuestionIndex(0);
  setSaveState("saved");
  setToast("");
  setFilter("");
  setReminderLogs([]);
  setAdminAuthorized(false);
  setAdminPromptOpen(false);
  try {
    localStorage.removeItem("safechange-cases");
    localStorage.removeItem("safechange-selected-site");
  } catch {}
  setEntered(false);
}
```

- Pass `onReturnToEntry={returnToEntry}` to `Header` and render a visible `처음 화면으로` button in the header actions.
- Remove the visible prompt heading. Give the dialog a meaningful `aria-label="기준 관리 비밀번호 입력"` instead of the removed title ID.

- [ ] **Step 4: Run tests to verify green**

Run: `npm.cmd test`

Expected: all existing tests and the two new tests pass.

### Task 2: Verify and publish

**Files:**
- No source-file changes expected.

- [ ] **Step 1: Run final verification**

Run: `npm.cmd test; npm.cmd run build`

Expected: all tests pass and the vinext production build completes.

- [ ] **Step 2: Publish the exact verified version**

Push the verified source state, package the existing project, save a new version, deploy privately, and poll until deployment succeeds.

- [ ] **Step 3: Hand off the site**

Return the deployed ChatGPT Sites URL and briefly state that the prompt title was removed and the return action clears session state.
