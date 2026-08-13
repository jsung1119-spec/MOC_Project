import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { createMocCase, judge, normalizeMocCases, visibleQuestions } from "../app/lib/moc.ts";
import { casesForSite, isSite, remindersForCases, sites } from "../app/lib/sites.ts";

test("application starts without sample cases and excludes legacy sample history", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /useState<MocCase\[\]>\(\[\]\)/);
  assert.match(page, /LEGACY_SAMPLE_CASE_IDS/);
  assert.match(page, /filter\(\(item\) => !LEGACY_SAMPLE_CASE_IDS\.has\(item\.id\)\)/);
});

test("database health check uses the Cloudflare D1 binding without Neon", async () => {
  const route = await readFile(new URL("../app/api/health/db/route.ts", import.meta.url), "utf8");
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");

  assert.match(route, /await import\("@\/db"\)/);
  assert.match(route, /getDb\(\)/);
  assert.doesNotMatch(route, /verifyPostgresConnection|@neondatabase/);
  assert.doesNotMatch(packageJson, /@neondatabase\/serverless/);
  await assert.rejects(access(new URL("../db/postgres.ts", import.meta.url)));
});

test("Vercel health check reports browser-local demo mode without D1 access", async () => {
  const route = await readFile(new URL("../app/api/health/db/route.ts", import.meta.url), "utf8");

  assert.match(route, /process\.env\.VERCEL === "1"/);
  assert.match(route, /database: "Browser-local demo"/);
});

test("Vercel demo uses a dedicated build command while preserving the Cloudflare build", async () => {
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  const vercelConfig = await readFile(new URL("../vercel.json", import.meta.url), "utf8");

  assert.match(packageJson, /"build": "vinext build"/);
  assert.match(packageJson, /"build:vercel": "next build"/);
  assert.match(vercelConfig, /"framework": "nextjs"/);
  assert.match(vercelConfig, /"buildCommand": "npm run build:vercel"/);
});

test("Vercel demo build does not require downloading Google Fonts", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(layout, /next\/font\/google/);
  assert.doesNotMatch(layout, /Geist_Mono|Geist\(/);
});

test("Vercel build allows the TypeScript import extensions used by the test runner", async () => {
  const tsconfig = await readFile(new URL("../tsconfig.json", import.meta.url), "utf8");

  assert.match(tsconfig, /"allowImportingTsExtensions": true/);
});

test("Vercel build has an isolated declaration for the Cloudflare D1 binding", async () => {
  const declaration = await readFile(new URL("../types/cloudflare-workers.d.ts", import.meta.url), "utf8");

  assert.match(declaration, /declare module "cloudflare:workers"/);
  assert.match(declaration, /export const env: \{ DB: any \}/);
});

test("Vercel type checking excludes the Cloudflare Worker entry point", async () => {
  const tsconfig = await readFile(new URL("../tsconfig.json", import.meta.url), "utf8");

  assert.match(tsconfig, /"exclude": \["node_modules", "worker"\]/);
});

test("typography uses the requested Nixgon style and strengthens hierarchy", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /--font-body:"NIXGONM-Vb","닉스곤체 2\.0"/);
  assert.match(css, /--font-heading:"NIXGONM-Vb"/);
  assert.match(css, /h1,h2,h3,\.eyebrow,\.topbar b\{font-family:var\(--font-heading\);font-weight:800\}/);
});

test("dashboard omits its date label", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(page, /<span className="eyebrow">2026\uB144 7\uC6D4 29\uC77C \uC218\uC694\uC77C<\/span>/);
});

test("admin navigation uses the MVP password gate", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /const ADMIN_PASSWORD\s*=\s*["']0000["']/);
  assert.match(page, /AdminPasswordPrompt/);
  assert.match(page, /\uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4\. \uB2E4\uC2DC \uC785\uB825\uD574 \uC8FC\uC138\uC694\./);
});

test("admin password prompt omits the obsolete heading", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(page, />\uAE30\uC900 \uAD00\uB9AC \uC811\uADFC</);
  assert.match(page, /aria-label="\uAE30\uC900 \uAD00\uB9AC \uBE44\uBC00\uBC88\uD638 \uC785\uB825"/);
});

test("return to entry clears access and site selection while preserving work history", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const normalizedPage = page.replaceAll("\r\n", "\n");
  const returnBlock = normalizedPage.match(/function returnToEntry\(\)[\s\S]*?\n  }\n  function enterApplication/)?.[0] ?? "";

  assert.match(returnBlock, /setSelectedSite\(null\)/);
  assert.match(returnBlock, /localStorage\.removeItem\("safechange-selected-site"\)/);
  assert.match(returnBlock, /setAdminAuthorized\(false\)/);
  assert.doesNotMatch(returnBlock, /setCases\(/);
  assert.doesNotMatch(returnBlock, /safechange-cases/);
  assert.match(page, /const siteCases = selectedSite \? casesForSite\(cases, selectedSite\) : \[\]/);
  assert.match(page, /const reminders = remindersForCases\(gradeConfirmedCases\)/);
});

test("homepage never restores a previously selected business site", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const hydrationBlock = page.match(/const saved = localStorage\.getItem\("safechange-cases"\);[\s\S]*?finally \{ setHydrated\(true\); \}/)?.[0] ?? "";

  assert.match(hydrationBlock, /localStorage\.removeItem\("safechange-selected-site"\)/);
  assert.doesNotMatch(hydrationBlock, /setSelectedSite/);
  assert.doesNotMatch(page, /localStorage\.setItem\("safechange-selected-site"/);
});

test("browser back, history deletion, and approval use the shared administrator workflow", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /window\.addEventListener\("popstate", onPopState\)/);
  assert.match(page, /window\.history\.pushState\(\{ safechange: "entered" \}/);
  assert.match(page, /type AdminPromptMode = "access" \| "delete-history"/);
  assert.match(page, /const ADMIN_PASSWORD = "0000"/);
  assert.match(page, /requestHistoryDeletion/);
  assert.match(page, /!deletedIds\.has\(item\.id\)/);
  assert.match(page, /key: "approvals"/);
  assert.match(page, /function Approvals/);
  assert.match(page, /공장장\/리더/);
  assert.match(page, /승인하기/);
});

test("completed judgments remain on the result screen and enter the approval queue", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const normalizedPage = page.replaceAll("\r\n", "\n");
  const judgmentBlock = normalizedPage.match(/function runJudgment\(\)[\s\S]*?\n  }\n\n  if \(!hydrated\)/)?.[0] ?? "";

  assert.match(judgmentBlock, /status: "JUDGMENT_COMPLETED"/);
  assert.doesNotMatch(judgmentBlock, /go\("approvals"\)/);
  assert.match(page, /function isApprovalQueueCase\(c: MocCase\)/);
  assert.match(page, /onClick=\{\(\) => onApprove\(item\.id\)\}/);
});

test("approval navigation shows a selected-site pending count badge", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /function isApprovalQueueCase/);
  assert.match(page, /const approvalPendingCount = siteCases\.filter\(isApprovalQueueCase\)\.length;/);
  assert.match(page, /approvalPendingCount > 0 && <em>\{approvalPendingCount\}<\/em>/);
  assert.match(page, /function resolvedGrade\(c: MocCase\)/);
  assert.match(page, /c\.approval\?\.approved/);
});

test("dashboard chart filters are cleared when leaving the history screen", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const goBlock = page.match(/function go\(next: View\)[\s\S]*?\n  }/)?.[0] ?? "";

  assert.match(goBlock, /if \(next !== "history"\) setFilter\(""\)/);
  assert.match(page, /onHistory=\{\(chartFilter\) => \{ setFilter\(chartFilter \?\? ""\); go\("history"\); \}\}/);
});

test("new MOC cases require and persist a user-provided work title", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /function startCase\(type: WorkType, title: string\)/);
  assert.match(page, /createMocCase\(\{ id, cases, workType: type, site: selectedSite \}\).*title: title\.trim\(\)/s);
  assert.match(page, /const \[title, setTitle\] = useState\(""\)/);
  assert.match(page, /disabled=\{!selected \|\| !title\.trim\(\)\}/);
});

test("approval navigation reuses the Reminder badge and opens work details", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const approvalBlock = page.match(/function Approvals[\s\S]*?\n}\r?\n\r?\nfunction MocReviewDetail/)?.[0] ?? "";
  const detailBlock = page.match(/function MocReviewDetail[\s\S]*?\n}\r?\n\r?\nfunction History/)?.[0] ?? "";

  assert.match(page, /item\.key === "approvals" && approvalPendingCount > 0 && <em>\{approvalPendingCount\}<\/em>/);
  assert.match(approvalBlock, /const \[selectedCase, setSelectedCase\] = useState<MocCase \| null>\(null\)/);
  assert.match(approvalBlock, /items\.filter\(isApprovalQueueCase\)/);
  assert.match(approvalBlock, /onClick=\{\(\) => setSelectedCase\(item\)\}/);
  assert.match(detailBlock, /전체 질문과 답변/);
  assert.match(detailBlock, /Object\.entries\(item\.answers\)/);
  assert.match(detailBlock, /replacementDecision\?\.comparisons/);
});

test("history deletion supports selecting multiple cases and progress does not expose manual advancement", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(page, /const \[pendingHistoryDeleteIds, setPendingHistoryDeleteIds\]/);
  assert.match(page, /selectedIds\.length === 0/);
  assert.match(page, /const \[selectedIds, setSelectedIds\] = useState<string\[\]>\(\[\]\)/);
  assert.match(page, /현재 목록 전체 선택/);
  assert.match(page, /type="checkbox"/);
  assert.match(page, /onRequestDelete\(selectedIds\)/);
  assert.match(page, /type="date"/);
  assert.match(page, /작성 기간 시작/);
  assert.match(page, /표시된 질문 전체 선택/);
  assert.match(page, /질문 삭제/);
  assert.match(page, /적용 항목/);
  assert.match(page, /!deletedIds\.has\(item\.id\)/);
  assert.match(css, /\.timeline>div>\.btn\.primary\{display:none\}/);
});

test("history table shows the currently selected site in the author and department column", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const historyBlock = page.match(/function History[\s\S]*?\n}\r?\n\r?\nfunction Admin/)?.[0] ?? "";

  assert.match(page, /<History items=\{siteCases\} site=\{selectedSite\}/);
  assert.match(historyBlock, /site: Site \| null/);
  assert.match(historyBlock, /<td>\{site \?\? c\.site\}<\/td>/);
  assert.doesNotMatch(historyBlock, /<td>\{c\.author\}<small>\{c\.department\}<\/small><\/td>/);
});

test("admin rows allocate available width to their primary content", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /\.admin-row\{display:grid;grid-template-columns:35px 40px minmax\(0,1fr\) auto auto/);
});

test("dashboard history link navigates directly without requiring a first case", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /onHistory=\{\(chartFilter\) => \{ setFilter\(chartFilter \?\? ""\); go\("history"\); \}\}/);
  assert.match(page, /onClick=\{\(\) => onHistory\(\)\}/);
  assert.doesNotMatch(page, /onOpen\(cases\[0\], "history"\)/);
});

test("dashboard donut charts use fixed work-type rainbow and grade colors", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /"기계 설비": "#e53935"/);
  assert.match(page, /"작업 절차": "#8e24aa"/);
  assert.match(page, /"기타": "#8a949e"/);
  assert.match(page, /"1등급": "#e53935"/);
  assert.match(page, /"2등급": "#fb8c00"/);
  assert.match(page, /"3등급": "#fdd835"/);
  assert.match(page, /"비대상": "#8a949e"/);
});

test("dashboard charts use the requested MOC case count titles", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /작업유형별 변경관리 건수/);
  assert.match(page, /변경관리 진행 건수/);
  assert.match(page, /등급별 변경관리 건수/);
});

test("dashboard uses Reminder overdue data and a period-filtered writing versus completed bar chart", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(page, /function reminderCategory/);
  assert.match(page, /reminders\.filter\(\(item\) => reminderCategory\(item\) === "OVERDUE"\)/);
  assert.match(page, /function ProgressBarChart/);
  assert.match(page, /label: "작업 중"/);
  assert.match(page, /label: "변경완료"/);
  assert.match(page, /filter: "progress:WORKING"/);
  assert.match(page, /filter: "progress:COMPLETED"/);
  assert.match(page, /chartProgress = token\("progress:"\)/);
  assert.match(page, /replacementDecision\?\.result === "SIMPLE_REPLACEMENT"/);
  assert.match(page, /item\.judgment\?\.isMocTarget === false/);
  assert.match(page, /confirmedGrade\(item\) && item\.status === "CLOSED"/);
  assert.match(page, /#7cc7ee/);
  assert.match(page, /#1769aa/);
  assert.match(css, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /\.donut-card,\.progress-chart-card\{padding:26px\}/);
  assert.match(css, /\.donut-card h2,\.progress-chart-card h2\{font-size:19px\}/);
  assert.match(css, /\.donut-card>div>p,\.progress-chart-card>div>p\{font-size:12px;line-height:1\.65\}/);
});

test("dashboard limits summary cards and charts to the recent five years with year and month filters", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /const recentYears = Array\.from\(\{ length: 5 \}/);
  assert.match(page, /최근 5년치만 보여드립니다/);
  assert.match(page, /const \[selectedYear, setSelectedYear\] = useState\("ALL"\)/);
  assert.match(page, /const \[selectedMonth, setSelectedMonth\] = useState\("ALL"\)/);
  assert.match(page, /period:\$\{periodKey\}/);
  assert.match(page, /className=\{`stat \$\{color\} \$\{Number\(count\) > 0 \? "clickable" : ""\}`\}/);
  assert.match(page, /chartStatuses = token\("status:"\)/);
});

test("history continuation uses the same route as dashboard continuation", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const basic = await readFile(new URL("../app/components/moc/NewMocCaseForm.tsx", import.meta.url), "utf8");
  const replacement = await readFile(new URL("../app/components/moc/ReplacementQuestionnaire.tsx", import.meta.url), "utf8");
  const grade = await readFile(new URL("../app/components/moc/GradeQuestionnaire.tsx", import.meta.url), "utf8");

  assert.match(page, /function continueCase\(item: MocCase\)/);
  assert.match(page, /onOpen=\{continueCase\}/);
  assert.match(page, /onContinue=\{continueCase\}/);
  assert.match(page, /onClick=\{\(\) => c\.status === "CLOSED" \? setSelectedCase\(c\) : onContinue\(c\)\}/);
  assert.match(page, /onContinue=\{selectedCase\.status !== "CLOSED" \? \(\) => onContinue\(selectedCase\) : undefined\}/);
  assert.match(basic, /initialInfo\?: MocBasicInfo/);
  assert.match(replacement, /initialComparisons\?: Record<string, ComparisonValue>/);
  assert.match(grade, /initialAnswers\?: Record<string, RuleAnswer>/);
});

test("dashboard greeting is a fixed system message rather than a user name", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /안녕하세요, 변경요소 관리 시스템입니다\./);
  assert.doesNotMatch(page, /안녕하세요, 김현수님/);
});

test("entry and sidebar branding use the POSCO Future M CI asset", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const publicAsset = await readFile(new URL("../public/posco-future-m-ci-ko.png", import.meta.url));
  const entryScreen = page.match(/function EntryScreen[\s\S]*?\n}\n\nfunction SiteSelector/)?.[0] ?? "";
  const sidebar = page.match(/function Sidebar[\s\S]*?\n}\n\nfunction Header/)?.[0] ?? "";

  assert.ok(publicAsset.byteLength > 0);
  assert.match(page, /function BrandLogo/);
  assert.match(page, /src="\/posco-future-m-ci-ko\.png"/);
  assert.match(page, /alt="포스코퓨처엠"/);
  assert.doesNotMatch(entryScreen, /brand-mark/);
  assert.doesNotMatch(sidebar, /brand-mark/);
});

test("remindersForCases counts only open draft or due-soon cases in the selected site list", () => {
  const items = [
    { id: "draft", status: "DOCUMENT_DRAFTING", dueDate: "2026-08-10" },
    { id: "soon", status: "UNDER_REVIEW", dueDate: "2026-07-31" },
    { id: "closed", status: "CLOSED", dueDate: "2026-07-20" },
    { id: "later", status: "UNDER_REVIEW", dueDate: "2026-08-15" },
  ];

  assert.deepEqual(remindersForCases(items).map((item) => item.id), ["draft", "soon"]);
});

test("Reminder tabs and date-based postponement are interactive", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const reminderBlock = page.match(/function Reminders[\s\S]*?\n}\r?\n\r?\nfunction Approvals/)?.[0] ?? "";

  assert.match(reminderBlock, /setTab\(item\.key\)/);
  assert.match(reminderBlock, /FOLLOW_UP/);
  assert.match(reminderBlock, /UNSUBMITTED/);
  assert.match(reminderBlock, /type="date"/);
  assert.match(reminderBlock, /onSnooze\(id, snoozeDate\)/);
});

test("createMocCase assigns a new case to the selected business site", () => {
  const created = createMocCase({
    id: "moc-new",
    cases: [],
    workType: "기계 설비",
    site: "포항라임공장",
  });

  assert.equal(created.site, "포항라임공장");
  assert.deepEqual(casesForSite([created], "포항화성공장"), []);
});

test("normalizeMocCases assigns a default site only to legacy records without a valid site", () => {
  const [legacy, valid] = normalizeMocCases([
    { id: "legacy", title: "기존 건" },
    { id: "valid", title: "화성 건", site: "포항화성공장" },
  ]);

  assert.equal(legacy.site, "포항라임공장");
  assert.equal(valid.site, "포항화성공장");
});

test("valid site values are accepted only from the configured list", () => {
  assert.equal(isSite("포항라임공장"), true);
  assert.equal(isSite("없는공장"), false);
  assert.equal(isSite(null), false);
});

test("사업장 목록은 가나다순이며 선택한 사업장 건만 반환한다", () => {
  assert.deepEqual(sites, ["포항라임공장", "포항화성공장"]);

  const result = casesForSite([
    { id: "1", site: "포항라임공장" },
    { id: "2", site: "포항화성공장" },
  ], "포항화성공장");

  assert.deepEqual(result.map((item) => item.id), ["2"]);
});

test("시나리오 A: 동일 규격 단순 교체는 비대상", () => {
  const result = judge({ same_spec: "YES", capacity: "NO", material: "NO", operating: "NO", logic: "NO", hazard: "NO" });
  assert.equal(result.isMocTarget, false);
  assert.equal(result.grade, "NONE");
  assert.equal(result.requiresHumanReview, false);
  assert.ok(result.evidences.some((e) => e.ruleId === "R-001"));
});

test("시나리오 B: 재질 변경과 위험 증가 시 2등급", () => {
  const result = judge({ same_spec: "NO", material: "YES", operating: "NO", hazard: "YES", major: "NO" });
  assert.equal(result.isMocTarget, true);
  assert.equal(result.grade, "2");
  assert.equal(result.riskLevel, "MEDIUM");
  assert.ok(result.requiredDocumentIds.includes("위험성 검토서"));
});

test("시나리오 C: 불확실 답변은 담당자 검토 필요", () => {
  const result = judge({ same_spec: "NO", logic: "UNKNOWN", hazard: "UNKNOWN" });
  assert.equal(result.requiresHumanReview, true);
  assert.equal(result.riskLevel, "REVIEW_REQUIRED");
  assert.ok(result.evidences.some((e) => e.ruleId === "R-008"));
});

test("중대 공정조건 변경은 1등급", () => {
  const result = judge({ same_spec: "NO", hazard: "YES", major: "YES" });
  assert.equal(result.grade, "1");
  assert.equal(result.riskLevel, "HIGH");
});

test("동일 규격과 변경 항목 동시 선택은 상충으로 기록", () => {
  const result = judge({ same_spec: "YES", material: "YES", hazard: "NO" });
  assert.equal(result.requiresHumanReview, true);
  assert.equal(result.conflicts.length, 1);
});

test("위험 증가가 아니면 중대 변경 보충 질문을 숨김", () => {
  const list = visibleQuestions({ hazard: "NO" });
  assert.equal(list.some((q) => q.id === "major"), false);
});
