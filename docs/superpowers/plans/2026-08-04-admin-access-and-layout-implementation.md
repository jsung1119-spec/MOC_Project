# Admin Access and Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the dashboard date, require password `0000` to open criteria management, and make criteria rows use the available horizontal space.

**Architecture:** Keep authorization state in the root client component as a session-only boolean. The sidebar routes `admin` requests through a small password-dialog component, while `Admin` remains a display-only management page. Update the admin row CSS grid to give the primary content column the remaining width.

**Tech Stack:** React, TypeScript, CSS, Node test runner, vinext.

## Global Constraints

- Dashboard date must not render for any selected business site.
- The exact MVP password is `0000`; this is a UI-only, reload-resetting gate.
- Do not alter business-site filtering or MOC case data.
- Keep all Korean UI copy valid UTF-8.
- Build and deploy only after all tests pass.

---

### Task 1: Dashboard date removal and protected admin navigation

**Files:**
- Modify: `app/page.tsx`
- Modify: `tests/moc-engine.test.mjs`

**Interfaces:**
- Consumes: `Sidebar` `onGo(view: View)` callback.
- Produces: `requestView(view: View)`, `AdminPasswordPrompt`, and `adminAuthorized` session state.

- [ ] **Step 1: Write failing source-level tests**

```js
test("dashboard omits its date label", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.equal(source.includes("2026년 7월 29일 수요일"), false);
});

test("admin navigation uses the MVP password gate", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /ADMIN_PASSWORD\s*=\s*["']0000["']/);
  assert.match(source, /비밀번호가 올바르지 않습니다\. 다시 입력해 주세요\./);
  assert.match(source, /AdminPasswordPrompt/);
});
```

- [ ] **Step 2: Run the tests to verify red**

Run: `npm.cmd test`

Expected: the new dashboard-date test fails because the date is currently rendered, and the gate test fails because no password gate exists.

- [ ] **Step 3: Implement the minimal behavior**

```tsx
const ADMIN_PASSWORD = "0000";
const [adminAuthorized, setAdminAuthorized] = useState(false);
const [adminPromptOpen, setAdminPromptOpen] = useState(false);

function requestView(nextView: View) {
  if (nextView === "admin" && !adminAuthorized) {
    setAdminPromptOpen(true);
    return;
  }
  setView(nextView);
}
```

- Remove only the dashboard date element; retain the fixed greeting.
- Add an accessible in-app modal with one password input, submit, cancel, error text, and Enter submission.
- On correct input, set `adminAuthorized`, close the prompt, then set `view` to `admin`.
- Route sidebar navigation through `requestView`.

- [ ] **Step 4: Run the tests to verify green**

Run: `npm.cmd test`

Expected: all existing tests plus the two new tests pass.

### Task 2: Full-width criteria rows

**Files:**
- Modify: `app/globals.css`
- Modify: `tests/moc-engine.test.mjs`

**Interfaces:**
- Consumes: existing `.admin-row` HTML structure from `Admin`.
- Produces: flexible desktop and responsive mobile grid styling for criteria rows.

- [ ] **Step 1: Write a failing style-contract test**

```js
test("admin rows allocate available width to their primary content", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.admin-row\{display:grid;grid-template-columns:35px 40px minmax\(0,1fr\) auto auto/);
});
```

- [ ] **Step 2: Run the tests to verify red**

Run: `npm.cmd test`

Expected: the style-contract test fails because the current grid constrains the content column after a fixed 35px column.

- [ ] **Step 3: Implement the layout**

```css
.admin-row {
  display:grid;
  grid-template-columns:35px 40px minmax(0,1fr) auto auto;
  align-items:center;
  gap:14px;
}
.admin-row > div { min-width:0; }
```

- Match the row structure for rows without a drag handle by adding a structural class in `Admin`, or use a separate grid rule for those rows.
- Add a narrow-screen media rule that makes status and edit controls readable without preserving a large blank region.

- [ ] **Step 4: Run the tests and production build**

Run: `npm.cmd test; npm.cmd run build`

Expected: all tests pass and vinext reports a complete build.

### Task 3: Publish the verified version

**Files:**
- No source-file changes expected.

- [ ] **Step 1: Package the exact successful build**

Use the existing Sites packaging helper to create a deployment archive from the verified source state.

- [ ] **Step 2: Save and privately deploy the new site version**

Use the existing project ID from `.openai/hosting.json`, deploy privately, and poll deployment status until it succeeds.

- [ ] **Step 3: Open and hand off the deployed site**

Open the resulting site URL in the app browser and provide it to the user.
