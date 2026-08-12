# Guideline-Aligned MOC Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Mock MOC questionnaire and manual status stepper with the company-guideline change/replacement judgment, grade recommendation, controlled workflow, and document checklists while preserving the existing UI and browser-local demo data.

**Architecture:** Move guideline data and pure decision logic out of `app/page.tsx` into focused TypeScript modules. Keep `localStorage` as the active demo repository behind normalization functions, extend the D1 schema for later API use, and derive workflow state from completed business records instead of a manual next button.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Zod 4, Drizzle ORM with Cloudflare D1 schema, Node test runner, Tailwind/CSS.

## Global Constraints

- `변경관리_지침.pdf` and `변경관리_붙임, 첨부.pdf` are the source of truth.
- Preserve the existing site selector, per-site case isolation, dashboard, history, Reminder, approval, administrator password, typography, and visual design.
- Keep existing localStorage cases readable; new fields must have migration defaults.
- Use `SIMPLE_REPLACEMENT`, not generic non-target wording, for new simple-replacement decisions.
- When multiple grade rules match, choose the highest grade: 1 before 2 before 3.
- Automated grade is a recommendation; store final grade and adjustment reason separately.
- Temporary changes require a period of 30 days or less.
- Do not allow completion while required approval, document updates, training, pre-startup inspection, corrective actions, or review items remain incomplete.
- Keep Vercel and ChatGPT Sites usable without a server database.

---

### Task 1: Versioned MOC domain model and legacy normalization

**Files:**
- Create: `app/lib/moc/types.ts`
- Create: `app/lib/moc/defaults.ts`
- Create: `app/lib/moc/migration.ts`
- Modify: `app/lib/moc.ts`
- Create: `tests/fixtures/moc-cases.ts`
- Test: `tests/moc-domain.test.mjs`

**Interfaces:**
- Produces: `MocCaseV2`, `ChangeKind`, `ChangeDuration`, `ReplacementDecision`, `MocWorkflowStatus`, `createEmptyMocCase`, `normalizeMocCasesV2(input)`.
- Compatibility export: `app/lib/moc.ts` re-exports the new types while old UI integration remains compiling.

- [ ] **Step 1: Write failing normalization tests**

```ts
test("legacy non-target judgment migrates to simple replacement", () => {
  const [item] = normalizeMocCasesV2([{ id: "old", title: "동급 교체", site: "포항라임공장", isMocTarget: false }]);
  assert.equal(item.schemaVersion, 2);
  assert.equal(item.replacementDecision?.result, "SIMPLE_REPLACEMENT");
});

test("new case defaults do not invent approvals or completions", () => {
  const item = createEmptyMocCase({ id: "new", caseNumber: "MOC-2026-001", title: "배관 변경", site: "포항라임공장" });
  assert.equal(item.workflow.status, "DRAFT");
  assert.equal(item.committee.held, false);
  assert.deepEqual(item.training.records, []);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --experimental-strip-types --test tests/moc-domain.test.mjs`

Expected: FAIL because `app/lib/moc/migration.ts` and its exports do not exist.

- [ ] **Step 3: Define exact domain types**

```ts
export type ChangeKind = "NORMAL" | "EMERGENCY";
export type ChangeDuration = "TEMPORARY" | "PERMANENT";
export type ReplacementResult = "SIMPLE_REPLACEMENT" | "CHANGE" | "UNDETERMINED";
export type Grade = "1" | "2" | "3" | "UNDETERMINED";
export type MocWorkflowStatus =
  | "DRAFT" | "JUDGMENT_PENDING" | "SIMPLE_REPLACEMENT" | "CHANGE_CONFIRMED"
  | "GRADE_PENDING" | "REVIEW_PENDING" | "COMMITTEE_REVIEW" | "APPROVAL_PENDING"
  | "APPROVED" | "IMPLEMENTING" | "DOCUMENT_UPDATE" | "TRAINING"
  | "PRE_STARTUP_CHECK" | "CORRECTIVE_ACTION" | "COMPLETED";

export interface MocBasicInfo {
  title: string;
  reason: string;
  description: string;
  targetEquipment: string;
  workType: WorkType;
  beforeState: string;
  afterState: string;
  changeKind: ChangeKind;
  duration: ChangeDuration;
  temporaryStartDate?: string;
  temporaryEndDate?: string;
}
```

Define `ReplacementDecision`, `GradeDecision`, `RiskAssessmentRecord`, `ApprovalRecord`, `CommitteeRecord`, `ImplementationPlanItem`, `ReviewItem`, `ProcessSafetyDocumentRecord`, `TrainingRecord`, `PreStartupInspection`, `PunchItem`, `StatusHistoryEntry`, and `MocCaseV2`. Every collection defaults to `[]`; every completion flag defaults to `false`; no approval signature is prefilled.

Create typed test builders in `tests/fixtures/moc-cases.ts`: `validBasicInfo`, `grade2Case(overrides)`, `approvedImplementedCase({ trainingComplete, inspectionSuitable })`, and `caseWithOpenPunchItem()`. Each builder must start from `createEmptyMocCase` and set only the records named by the builder so later tests cannot accidentally inherit completed approvals.

- [ ] **Step 4: Implement backward-compatible normalization**

`normalizeMocCasesV2` must preserve legacy `id`, `caseNumber`, `title`, `workType`, `author`, `department`, `site`, `answers`, `judgment`, `draft`, dates, and status. Map `judgment.isMocTarget === false` to `SIMPLE_REPLACEMENT`, true to `CHANGE`, and absent judgment to no replacement decision. Map old status labels conservatively: closed to `COMPLETED`, approved to `APPROVED`, judgment completed to `REVIEW_PENDING`, and all earlier records to `DRAFT` or `JUDGMENT_PENDING` without marking business records complete.

- [ ] **Step 5: Run domain tests and existing tests**

Run: `node --experimental-strip-types --test tests/moc-domain.test.mjs tests/moc-engine.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit the domain foundation**

```bash
git add app/lib/moc app/lib/moc.ts tests/fixtures/moc-cases.ts tests/moc-domain.test.mjs
git commit -m "feat: add versioned MOC domain model"
```

---

### Task 2: Appendix 2 replacement criteria and decision engine

**Files:**
- Create: `app/lib/moc/replacement-criteria.ts`
- Create: `app/lib/moc/replacement-engine.ts`
- Test: `tests/replacement-engine.test.mjs`

**Interfaces:**
- Produces: `replacementCriteria`, `criteriaForAsset(assetType)`, `judgeReplacement(input)`.
- `judgeReplacement` returns `{ result, matchedCriteria, reasons, requiresCommittee }`.

- [ ] **Step 1: Write failing decision tests**

```ts
test("all required pump characteristics equal means simple replacement", () => {
  const result = judgeReplacement({ assetType: "PUMP", comparisons: {
    type: "SAME", material: "SAME", internalMaterial: "SAME", flangeSize: "SAME",
    flangeRating: "SAME", flangeFace: "SAME", capacity: "SAME", sealType: "SAME"
  }});
  assert.equal(result.result, "SIMPLE_REPLACEMENT");
});

test("one different required characteristic means change", () => {
  const result = judgeReplacement({ assetType: "PIPING", comparisons: { material: "DIFFERENT" } });
  assert.equal(result.result, "CHANGE");
});

test("unknown required characteristic needs committee review", () => {
  const result = judgeReplacement({ assetType: "VALVE", comparisons: { type: "UNKNOWN" } });
  assert.equal(result.result, "UNDETERMINED");
  assert.equal(result.requiresCommittee, true);
});
```

- [ ] **Step 2: Verify tests fail**

Run: `node --experimental-strip-types --test tests/replacement-engine.test.mjs`

Expected: FAIL because the engine is missing.

- [ ] **Step 3: Encode the Appendix 2 matrix once**

Use asset codes `VALVE`, `PIPING`, `FLANGE`, `PUMP`, `COMPRESSOR`, `TURBINE`, `RECIPROCATING_DRIVE`, `MOTOR`, `CONTROL_EQUIPMENT`, and `CHEMICAL`. Use characteristic codes `type`, `material`, `internalMaterial`, `nominalDiameter`, `nominalRating`, `pipeThickness`, `flangeSize`, `flangeRating`, `flangeFace`, `capacity`, `sealType`, `electricalRating`, `lubricationSystem`, `measurementRange`, `measurementUnit`, `sensingElement`, `composition`, and `handlingMethod`.

The matrix must exactly follow the ● marks on Appendix 2. Add operation-category items for welding procedure, heavy-lift procedure, test operation, shutdown, emergency operation, normal operation, alarm reset, control reset, new bypass, exchanger tube plugging, operating control method, purchasing procedure, equipment relocation, breather/vent, new-pipe connection, flare piping, tank inlet/outlet, pump suction/discharge, water/steam/conduit, temporary process piping, transfer piping, alternate-pump piping, temporary leak repair, hot tapping, lighting, safety valve, document/drawing control, and technical-management procedure.

- [ ] **Step 4: Implement pure replacement judgment**

Validate that every applicable matrix field is answered. Return `CHANGE` immediately when any applicable comparison is `DIFFERENT`; otherwise return `UNDETERMINED` when fields are missing or unknown; return `SIMPLE_REPLACEMENT` only when every applicable field is `SAME`. Include human-readable reasons and `붙임 2 변경판정 기준` in every matched criterion.

- [ ] **Step 5: Run replacement and regression tests**

Run: `node --experimental-strip-types --test tests/replacement-engine.test.mjs tests/moc-engine.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit replacement judgment**

```bash
git add app/lib/moc/replacement-criteria.ts app/lib/moc/replacement-engine.ts tests/replacement-engine.test.mjs
git commit -m "feat: implement Appendix 2 replacement judgment"
```

---

### Task 3: Appendix 3 grade rules and recommendation engine

**Files:**
- Create: `app/lib/moc/grade-rules.ts`
- Create: `app/lib/moc/grade-engine.ts`
- Test: `tests/grade-engine.test.mjs`

**Interfaces:**
- Produces: `gradeRules`, `recommendGrade(answeredRuleIds, unknownRuleIds)`.
- Returns `{ recommendedGrade, matchedRules, reasons, requiresCommittee, recommendedRiskAssessment }`.

- [ ] **Step 1: Write all required grade behavior tests**

```ts
test("grade 1 outranks grade 2", () => {
  const result = recommendGrade(["G1-ESD", "G2-PID-PIPE"], []);
  assert.equal(result.recommendedGrade, "1");
  assert.equal(result.recommendedRiskAssessment, "HAZOP");
});

test("grade 2 outranks grade 3", () => {
  assert.equal(recommendGrade(["G2-PID-PIPE", "G3-SIMPLE-VALVE"], []).recommendedGrade, "2");
});

test("grade 3 recommends checklist", () => {
  const result = recommendGrade(["G3-LIGHTING"], []);
  assert.equal(result.recommendedGrade, "3");
  assert.equal(result.recommendedRiskAssessment, "CHECK_LIST");
});

test("no match or unknown rule is not auto-confirmed", () => {
  assert.equal(recommendGrade([], ["G2-PID-PIPE"]).recommendedGrade, "UNDETERMINED");
});
```

- [ ] **Step 2: Verify tests fail**

Run: `node --experimental-strip-types --test tests/grade-engine.test.mjs`

Expected: FAIL because the rule module does not exist.

- [ ] **Step 3: Encode every Appendix 3 row**

Create stable IDs for all rows. Grade 1 includes designated-quantity projects, reactor structural expansion, flare stack structural expansion, 300 kW-or-more electrical structural expansion, the specified heat-source change, multi-equipment production expansion, boiler/RTO/SRP utility expansion, and Plant ESD interlock change/delete/add.

Grade 2 includes PSM material changes, PSM material-handling equipment, flammable gas/liquid, acute toxicity or 350°C/980 kPa conditions, every P&ID sub-row, every rotating-equipment sub-row, civil/building sub-rows, 3.3 kV-or-more and power-system electrical sub-rows, safety-device and alarm/control-setting changes, and safety-operating-procedure changes outside normal range.

Grade 3 includes normal-range work standards, all instrument sub-rows, all low-voltage/lighting/communications electrical sub-rows, all pipe/mechanical sub-rows, every minor rotating-equipment row, civil/HVAC rows, and every safety-improvement row from pages 5–6. Each rule stores `guidelineSection: "붙임 3 변경관리등급 기준"` and the full document wording.

- [ ] **Step 4: Implement deterministic highest-grade selection**

Resolve matched rule objects, sort grades by `{ "1": 0, "2": 1, "3": 2 }`, and never infer a grade when no known rule is selected. Set `requiresCommittee` for grades 1 and 2, or any undetermined result. Recommend `HAZOP` for 1/2 and `CHECK_LIST` for 3.

- [ ] **Step 5: Run grade tests and inspect rule coverage**

Run: `node --experimental-strip-types --test tests/grade-engine.test.mjs`

Expected: PASS, with explicit assertions that the rule collection contains grade 1, 2, and 3 entries and no duplicate IDs.

- [ ] **Step 6: Commit grade rules**

```bash
git add app/lib/moc/grade-rules.ts app/lib/moc/grade-engine.ts tests/grade-engine.test.mjs
git commit -m "feat: implement Appendix 3 grade recommendations"
```

---

### Task 4: Temporary-change validation and business-form defaults

**Files:**
- Create: `app/lib/moc/forms.ts`
- Create: `app/lib/moc/validation.ts`
- Test: `tests/moc-validation.test.mjs`

**Interfaces:**
- Produces: `implementationPlanTemplate`, `reviewTemplate`, `processSafetyDocumentTemplate`, `validateBasicInfo(info)`.

- [ ] **Step 1: Write failing validation and template tests**

```ts
import { validBasicInfo } from "./fixtures/moc-cases.ts";

test("temporary period above 30 days is rejected", () => {
  const errors = validateBasicInfo({ ...validBasicInfo, duration: "TEMPORARY", temporaryStartDate: "2026-08-01", temporaryEndDate: "2026-08-31" });
  assert.ok(errors.some(error => error.code === "TEMPORARY_PERIOD_EXCEEDED"));
});

test("review template contains all 16 guideline areas", () => {
  assert.equal(reviewTemplate.length, 16);
});
```

- [ ] **Step 2: Verify focused tests fail**

Run: `node --experimental-strip-types --test tests/moc-validation.test.mjs`

Expected: FAIL.

- [ ] **Step 3: Add exact Appendix forms as reusable data**

`implementationPlanTemplate` contains process safety information, risk assessment and corrective plan, operating procedure, maintenance, work permit, worker training, pre-startup inspection, emergency plan, completion report, and applicable law rows from Attachment 2.

`reviewTemplate` contains the 16 rows from Appendix 5. `processSafetyDocumentTemplate` contains MSDS, BFD/PFD, chemical process data, safe upper/lower limits, risk assessment, materials, P&ID, electrical/spec/control drawings, relief system, ventilation, design standards, and other affected records.

- [ ] **Step 4: Implement basic-info validation**

Require title, reason, description, target equipment/process, work type, before state, after state, change kind, and duration. For temporary changes require both dates and calculate an inclusive maximum of 30 calendar days. Return structured `{ field, code, message, action }` errors.

- [ ] **Step 5: Run validation tests**

Run: `node --experimental-strip-types --test tests/moc-validation.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit forms and validation**

```bash
git add app/lib/moc/forms.ts app/lib/moc/validation.ts tests/moc-validation.test.mjs
git commit -m "feat: add guideline forms and temporary validation"
```

---

### Task 5: Derived workflow and completion guards

**Files:**
- Create: `app/lib/moc/workflow.ts`
- Test: `tests/moc-workflow.test.mjs`

**Interfaces:**
- Produces: `deriveWorkflowStatus(item)`, `validateCompletion(item)`, `allowedWorkflowActions(item)`.

- [ ] **Step 1: Write failing workflow tests**

```ts
import { approvedImplementedCase, caseWithOpenPunchItem, grade2Case } from "./fixtures/moc-cases.ts";

test("grade 2 cannot implement before committee approval", () => {
  const item = grade2Case({ committee: { held: false, members: [], decision: null } });
  assert.equal(deriveWorkflowStatus(item), "COMMITTEE_REVIEW");
});

test("training and pre-startup inspection block completion", () => {
  const errors = validateCompletion(approvedImplementedCase({ trainingComplete: false, inspectionSuitable: false }));
  assert.deepEqual(errors.map(error => error.code), ["TRAINING_INCOMPLETE", "PRE_STARTUP_INCOMPLETE"]);
});

test("open punch item enters corrective action", () => {
  assert.equal(deriveWorkflowStatus(caseWithOpenPunchItem()), "CORRECTIVE_ACTION");
});
```

- [ ] **Step 2: Verify tests fail**

Run: `node --experimental-strip-types --test tests/moc-workflow.test.mjs`

Expected: FAIL.

- [ ] **Step 3: Implement business-derived state**

Simple replacement stops at `SIMPLE_REPLACEMENT`. Change without grade stays `GRADE_PENDING`. Grade 1/2 without committee decision stays `COMMITTEE_REVIEW`; grade 3 requires operating-part-leader approval but skips committee unless explicitly requested. Approved work moves through implementation, document updates, training, pre-startup inspection, corrective action, and completion based solely on corresponding records.

Emergency cases may record implementation before final approval but must show an outstanding post-review requirement and cannot become completed. Temporary cases require technical review, risk assessment, site tag, training, and restoration or permanent-conversion record.

- [ ] **Step 4: Implement exact completion guards**

Return errors for required approval, work incomplete, required document update incomplete, required training incomplete, inspection incomplete/unsuitable, open Punch List, incomplete review item, temporary restoration overdue, and emergency post-approval incomplete.

- [ ] **Step 5: Run workflow and complete engine suite**

Run: `npm test`

Expected: PASS.

- [ ] **Step 6: Commit workflow engine**

```bash
git add app/lib/moc/workflow.ts tests/moc-workflow.test.mjs
git commit -m "feat: derive MOC workflow from business records"
```

---

### Task 6: Extend D1 schema without making it a Vercel runtime dependency

**Files:**
- Modify: `db/schema.ts`
- Create: `drizzle/0001_guideline_moc.sql`
- Create: `app/lib/moc/repository.ts`
- Test: `tests/moc-schema.test.mjs`

**Interfaces:**
- Produces: `MocRepository` with `list(site)`, `get(id)`, `save(item)`, `remove(ids)`.
- Produces: `BrowserMocRepository` used by the demo; leaves a contract for a later D1 implementation.

- [ ] **Step 1: Write failing schema and repository tests**

Assert the migration adds `site`, `schema_version`, `basic_info_json`, `replacement_decision_json`, `grade_decision_json`, `workflow_json`, and `business_records_json` columns without dropping existing columns. Assert the browser repository round-trips `MocCaseV2` and keeps different sites isolated.

- [ ] **Step 2: Verify tests fail**

Run: `node --experimental-strip-types --test tests/moc-schema.test.mjs`

Expected: FAIL.

- [ ] **Step 3: Add additive D1 migration and schema fields**

Use nullable JSON text columns and `schema_version INTEGER NOT NULL DEFAULT 1`; do not drop legacy judgment or answer tables. Add `site TEXT` with a compatibility default and indexes for site/status and case number.

- [ ] **Step 4: Implement browser repository**

Read `safechange-cases`, normalize through `normalizeMocCasesV2`, write schema-versioned JSON only after successful parsing, and preserve unknown legacy properties. Store Reminder logs separately by case ID and delete them when the owning case is removed.

- [ ] **Step 5: Run schema tests and generation check**

Run: `node --experimental-strip-types --test tests/moc-schema.test.mjs`

Run: `npm run db:generate`

Expected: tests PASS and Drizzle reports no unintended destructive migration.

- [ ] **Step 6: Commit persistence contracts**

```bash
git add db/schema.ts drizzle/0001_guideline_moc.sql app/lib/moc/repository.ts tests/moc-schema.test.mjs
git commit -m "feat: add versioned MOC persistence contract"
```

---

### Task 7: Replace the new-case form and questionnaire flow

**Files:**
- Create: `app/components/moc/NewMocCaseForm.tsx`
- Create: `app/components/moc/ReplacementQuestionnaire.tsx`
- Create: `app/components/moc/GradeQuestionnaire.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Test: `tests/moc-ui-contract.test.mjs`

**Interfaces:**
- Consumes: domain defaults, criteria, validation, replacement and grade engines.
- Produces: a completed `MocCaseV2` decision while retaining the current `View`-based shell.

- [ ] **Step 1: Add failing UI contract tests**

Assert the first screen contains fields for title, reason, description, equipment/process, work type, before/after state, normal/emergency, temporary/permanent, and conditional temporary dates. Assert questionnaire components consume `criteriaForAsset` and `gradeRules` instead of duplicated arrays.

- [ ] **Step 2: Verify tests fail**

Run: `node --experimental-strip-types --test tests/moc-ui-contract.test.mjs`

Expected: FAIL.

- [ ] **Step 3: Implement the basic-information screen**

Reuse current cards, fields, buttons, progress bar, spacing, and responsive breakpoints. Show temporary dates only for temporary changes. Disable next until `validateBasicInfo` returns no error; show each returned message beside its field.

- [ ] **Step 4: Implement data-driven comparison and grade questions**

Keep one question per screen and previous/next/review behavior. Comparison answers are `SAME`, `DIFFERENT`, `UNKNOWN`, and `NOT_APPLICABLE` only where the source criterion allows it. When replacement result is change, show grouped grade-rule questions; when simple replacement, route directly to result; when undetermined, route to review-required result.

- [ ] **Step 5: Remove the old generic judgment path from active UI**

Keep legacy `judge` only for migration/backward display until all old records normalize. New cases must use `judgeReplacement` and `recommendGrade`; no new result may cite Mock guideline sections.

- [ ] **Step 6: Run UI contracts, typecheck, and lint**

Run: `node --experimental-strip-types --test tests/moc-ui-contract.test.mjs`

Run: `npx tsc --noEmit`

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 7: Commit new judgment UI**

```bash
git add app/components/moc app/page.tsx app/globals.css tests/moc-ui-contract.test.mjs
git commit -m "feat: add guideline-driven MOC judgment flow"
```

---

### Task 8: Guideline result, approval, and business-process workspace

**Files:**
- Create: `app/components/moc/MocDecisionResult.tsx`
- Create: `app/components/moc/MocProcessWorkspace.tsx`
- Create: `app/components/moc/ImplementationPlanPanel.tsx`
- Create: `app/components/moc/ReviewChecklistPanel.tsx`
- Create: `app/components/moc/DocumentUpdatePanel.tsx`
- Create: `app/components/moc/TrainingPanel.tsx`
- Create: `app/components/moc/PreStartupPanel.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Test: `tests/moc-process-ui.test.mjs`

**Interfaces:**
- Consumes: `deriveWorkflowStatus`, `validateCompletion`, templates, and case mutation callback.
- Produces: editable records for request/approval, committee, implementation, documents, education, inspection, and corrective actions.

- [ ] **Step 1: Write failing process UI tests**

Assert simple replacement result has no general-process start action. Assert grade 1/2 result states committee review is required, grade 3 states operating-part-leader approval, and all results show reasons and guideline references. Assert there is no `다음 단계 완료` control.

- [ ] **Step 2: Verify tests fail**

Run: `node --experimental-strip-types --test tests/moc-process-ui.test.mjs`

Expected: FAIL.

- [ ] **Step 3: Implement result and request/approval records**

Display replacement result, recommended grade, final grade, committee requirement, recommended risk assessment, matched rules, and disclaimer. Implement Attachment 1 fields and approval signatures. Permit final grade changes only after administrator password authorization and require an adjustment reason.

- [ ] **Step 4: Implement business panels from templates**

Every checklist row supports applicability, owner, planned date, completed date, confirmation, and note. Training records support audience, content, dates, trainer, attendees, and completion. Pre-startup supports inspection date, inspector, result, Punch List, corrective completion, reinspection, and final suitability.

- [ ] **Step 5: Connect state display to derived workflow**

Replace the old manual stepper button. After every business-record edit, persist the record, call `deriveWorkflowStatus`, append a history entry only when the derived status changes, and show the first unmet requirement as the next action.

- [ ] **Step 6: Run process UI, engine, type, and lint checks**

Run: `npm test`

Run: `npx tsc --noEmit`

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 7: Commit process workspace**

```bash
git add app/components/moc app/page.tsx app/globals.css tests/moc-process-ui.test.mjs
git commit -m "feat: add controlled MOC process workspace"
```

---

### Task 9: Synchronize dashboard, history, approvals, Reminder, and printable forms

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Test: `tests/moc-cross-view.test.mjs`

**Interfaces:**
- Consumes: the normalized case and derived status only.
- Produces: consistent labels, counts, details, and next actions across all existing menus.

- [ ] **Step 1: Write failing cross-view tests**

Assert the same user-entered title appears in dashboard, history, approvals, Reminder, and detail. Assert approval badge counts only selected-site cases that need approval. Assert simple replacements do not enter the approval queue. Assert the print view includes request/approval fields, evidence, grade recommendation, risk method, implementation plan, and signatures.

- [ ] **Step 2: Verify tests fail**

Run: `node --experimental-strip-types --test tests/moc-cross-view.test.mjs`

Expected: FAIL.

- [ ] **Step 3: Replace legacy status and target labels**

Use `workflow.status` and the replacement result consistently. Update dashboard statistics to judgment pending, review/approval, implementing, document update, training, pre-startup/corrective, and completed. Keep all queries scoped by `selectedSite`.

- [ ] **Step 4: Update details and print output**

Show basic information, every answered comparison and grade question, replacement/grade evidence, approval and committee records, implementation completion, document updates, training, inspection, Punch List, and status history. Unanswered or not-yet-judged items display `-`.

- [ ] **Step 5: Update Reminder rules**

Include overdue temporary restoration, missing post-emergency approval, stalled review/approval, upcoming due date, incomplete training before start, and open Punch List. Keep duplicate-send protection and delete logs with the case.

- [ ] **Step 6: Run tests and both builds**

Run: `npm test`

Run: `npx tsc --noEmit`

Run: `npm run lint`

Run: `npm run build`

Run: `npm run build:vercel`

Expected: PASS.

- [ ] **Step 7: Commit synchronized views**

```bash
git add app/page.tsx app/globals.css tests/moc-cross-view.test.mjs
git commit -m "feat: synchronize MOC workflow across views"
```

---

### Task 10: Documentation, full verification, and deployment handoff

**Files:**
- Modify: `README.md`
- Replace: `docs/DECISION_RULES.md`
- Modify: `docs/INTEGRATION.md`
- Create: `docs/GUIDELINE_TRACEABILITY.md`
- Modify: `safechange-moc-offline.html` only if the existing export script regenerates it deterministically.

**Interfaces:**
- Produces: rule traceability and deployment-ready, verified artifacts.

- [ ] **Step 1: Document guideline traceability**

Map Appendix 2 matrix groups, every Appendix 3 grade group, Attachment 1 fields, Attachment 2 plan rows, Appendix 5 review rows, temporary/emergency requirements, and completion guards to their data files and tests. Explicitly state that the system grade is a recommendation and identify document interpretation limits.

- [ ] **Step 2: Document storage behavior and future D1 connection**

Explain browser-local Vercel/ChatGPT demo storage, per-browser limitations, the `MocRepository` contract, D1 migration, and the later API methods required for shared operation.

- [ ] **Step 3: Run complete automated verification**

Run: `npm test`

Run: `npx tsc --noEmit`

Run: `npm run lint`

Run: `npm run build`

Run: `npm run build:vercel`

Expected: all commands exit 0.

- [ ] **Step 4: Run browser scenario A**

Start the development server, enter, select each site, create a pump case with all required characteristics equal, confirm `단순교체`, confirm reasons, confirm no approval-queue entry, refresh, and confirm history persistence.

- [ ] **Step 5: Run browser scenario B**

Create a grade 3 change, confirm Check List recommendation, complete leader approval, implementation plan, implementation, training, suitable pre-startup inspection, and final completion. Confirm every dashboard and history status changes from the saved records without a manual next-step button.

- [ ] **Step 6: Run browser scenario C**

Create a P&ID piping change, confirm grade 2 and HAZOP, verify committee and approval are required, then complete implementation, required document updates, training, inspection, and completion.

- [ ] **Step 7: Run browser scenario D and negative guards**

Confirm a 31-day temporary period is rejected. Save a valid temporary change, confirm technical review/risk assessment/site tag/training/restoration requirements, and verify incomplete education, unsuitable inspection, or open Punch List blocks completion.

- [ ] **Step 8: Commit documentation and verified artifacts**

```bash
git add README.md docs safechange-moc-offline.html
git commit -m "docs: document guideline-aligned MOC workflow"
```

- [ ] **Step 9: Push and verify public deployments**

Push `main` to `https://github.com/jsung1119-spec/MOC_Project`, wait for the Vercel production deployment, publish the matching ChatGPT Sites build, and verify all three URLs show the same version.
