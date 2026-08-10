# Vercel Public Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the current SafeChange UI as a public Vercel demonstration site while retaining the existing ChatGPT/Cloudflare deployment path.

**Architecture:** Keep `app/page.tsx`, the MOC rule engine, and browser-local demo history as the shared UI source. Keep `npm run build` for the existing vinext/Cloudflare deployment and add a separate `npm run build:vercel` command plus `vercel.json` for Vercel. Make the database health endpoint return an explicit demo response when built by Vercel so no Cloudflare D1 binding is required.

**Tech Stack:** React 19, Next.js 16 App Router, vinext/Vite, TypeScript, Vercel, Cloudflare D1.

## Global Constraints

- Preserve the current ChatGPT/Cloudflare build command: `npm run build`.
- Vercel is public and uses browser-local data only; do not add a production database or authentication.
- Opening either deployment must require a new business-site selection.
- Keep UI wording and workflows unchanged unless required to identify demo-only database status.

---

### Task 1: Make existing source tests portable across Windows worktrees

**Files:**
- Modify: `tests/moc-engine.test.mjs`

**Interfaces:**
- Consumes: source text in `app/page.tsx`
- Produces: source-level assertions that accept both LF and CRLF line endings

- [ ] **Step 1: Write the failing portability assertion**

Add a test that loads `app/page.tsx` after replacing `\r\n` with `\n`, then verifies `returnToEntry` and `runJudgment` blocks are found.

```js
const normalizedPage = page.replaceAll("\r\n", "\n");
assert.match(normalizedPage, /function returnToEntry\(\)[\s\S]*?function enterApplication/);
assert.match(normalizedPage, /function runJudgment\(\)[\s\S]*?status: "SUBMITTED"/);
```

- [ ] **Step 2: Run the test to verify it fails on the unnormalized extraction paths**

Run: `npm.cmd test`

Expected: the two existing source-block tests fail in the CRLF worktree.

- [ ] **Step 3: Normalize source text before every multiline regular-expression extraction**

Update the two affected tests to use `const normalizedPage = page.replaceAll("\r\n", "\n");` for their block matches.

- [ ] **Step 4: Run the full test suite**

Run: `npm.cmd test`

Expected: all existing MOC tests pass in the Vercel worktree.

- [ ] **Step 5: Commit**

```bash
git add tests/moc-engine.test.mjs
git commit -m "test: support CRLF source extraction"
```

### Task 2: Add Vercel-specific build configuration without changing ChatGPT build

**Files:**
- Modify: `package.json`
- Create: `vercel.json`
- Modify: `tests/moc-engine.test.mjs`

**Interfaces:**
- Consumes: `npm run build` for Cloudflare and Vercel project import from GitHub.
- Produces: `npm run build:vercel` and a Vercel build command that emits Next.js output.

- [ ] **Step 1: Write failing configuration tests**

Add source assertions for a `build:vercel` script equal to `next build`, preserved `build` script equal to `vinext build`, and `vercel.json` containing `buildCommand: "npm run build:vercel"`.

```js
assert.match(packageJson, /"build": "vinext build"/);
assert.match(packageJson, /"build:vercel": "next build"/);
assert.match(vercelConfig, /"buildCommand": "npm run build:vercel"/);
```

- [ ] **Step 2: Run tests to verify missing Vercel configuration fails**

Run: `npm.cmd test`

Expected: configuration test fails because `build:vercel` and `vercel.json` do not exist.

- [ ] **Step 3: Add the smallest Vercel configuration**

Add `"build:vercel": "next build"` to `package.json`. Create `vercel.json` with `framework` set to `nextjs` and `buildCommand` set to `npm run build:vercel`.

- [ ] **Step 4: Run configuration tests and both build commands**

Run: `npm.cmd test`, then `npm.cmd run build`, then `npm.cmd run build:vercel`.

Expected: tests pass; Cloudflare build succeeds; Vercel build either succeeds or identifies the remaining D1-only route dependency for Task 3.

- [ ] **Step 5: Commit**

```bash
git add package.json vercel.json tests/moc-engine.test.mjs
git commit -m "feat: add Vercel demo build configuration"
```

### Task 3: Provide a Vercel-safe health response for demo deployment

**Files:**
- Modify: `app/api/health/db/route.ts`
- Modify: `tests/moc-engine.test.mjs`

**Interfaces:**
- Consumes: `process.env.VERCEL` at runtime.
- Produces: `GET /api/health/db` returning `{ status: "ok", database: "Browser-local demo" }` on Vercel and retaining D1 query behavior elsewhere.

- [ ] **Step 1: Write a failing source assertion for the Vercel demo branch**

Add a test that verifies the route checks `process.env.VERCEL === "1"` before requesting D1 and returns `Browser-local demo`.

```js
assert.match(route, /process\.env\.VERCEL === "1"/);
assert.match(route, /database: "Browser-local demo"/);
```

- [ ] **Step 2: Run tests to verify the demo response is absent**

Run: `npm.cmd test`

Expected: the new route assertion fails.

- [ ] **Step 3: Implement the guarded response and preserve D1 behavior**

In `GET`, return the demo JSON response immediately when `process.env.VERCEL === "1"`. Keep the existing D1 health query path unchanged for the ChatGPT deployment.

- [ ] **Step 4: Verify both deployment builds**

Run: `npm.cmd test`, `npm.cmd run build`, and `npm.cmd run build:vercel`.

Expected: all tests and both builds pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/health/db/route.ts tests/moc-engine.test.mjs
git commit -m "feat: add Vercel demo database health response"
```

### Task 4: Publish and connect both deployments

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: GitHub `main` and Vercel project import.
- Produces: deployment notes explaining Vercel auto-deploy and ChatGPT site redeploy.

- [ ] **Step 1: Document the expected public-demo behavior**

Add a `Vercel 시연 배포` section stating that the Vercel URL is public, history stays in each browser, and `/api/health/db` intentionally reports `Browser-local demo`.

- [ ] **Step 2: Push the Vercel-ready branch and merge approved commits into `main`**

Run: `git push github codex/vercel-demo`, then merge the reviewed commits into `main` and run `git push github main`.

- [ ] **Step 3: In Vercel, deploy the imported GitHub project**

Use project name `moc-project`, retain the repository root, and select the `main` production branch. Vercel uses `vercel.json` to run `npm run build:vercel`.

- [ ] **Step 4: Verify the public URL**

Open the generated `*.vercel.app` URL. Confirm it opens at the entry screen, requires business-site selection, and allows new MOC case creation.

- [ ] **Step 5: Redeploy the ChatGPT site from the same `main` source**

Package the validated Cloudflare build and deploy it through Sites. Confirm both URLs show the same UI revision.

- [ ] **Step 6: Commit documentation**

```bash
git add README.md
git commit -m "docs: explain Vercel demo deployment"
git push github main
```

## Self-review

- Spec coverage: Tasks 2–4 cover public Vercel output, shared UI source, demo-only persistence, and preserving the ChatGPT deployment.
- No-placeholder check: no task contains a deferred implementation placeholder.
- Type consistency: runtime detection uses the same `process.env.VERCEL === "1"` contract in the route and its test.
