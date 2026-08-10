"use client";

import { useEffect, useState } from "react";
import {
  AnswerValue, Draft, MocCase, MocStatus, Question, WorkType, createMocCase, guidelines, judge,
  normalizeMocCases, optionMeta, questions, statusLabels, visibleQuestions,
} from "./lib/moc";
import { casesForSite, isSite, remindersForCases, Site, sites } from "./lib/sites";

type View = "dashboard" | "new" | "question" | "review" | "result" | "documents" | "draft" | "preview" | "progress" | "reminders" | "history" | "approvals" | "admin";
type AdminPromptMode = "access" | "delete-history";
const ADMIN_PASSWORD = "0000";
const LEGACY_SAMPLE_CASE_IDS = new Set(["moc-001", "moc-002", "moc-003", "moc-004", "moc-005"]);
const workTypes: { label: WorkType; icon: string; detail: string }[] = [
  { label: "기계 설비", icon: "⚙", detail: "펌프·압축기·탱크" }, { label: "배관", icon: "⌁", detail: "배관·밸브·가스켓" },
  { label: "전기", icon: "ϟ", detail: "전원·차단기·모터" }, { label: "계장", icon: "⌁", detail: "Logic·Set Point·계기" },
  { label: "운전조건", icon: "◫", detail: "온도·압력·유량" }, { label: "원료·화학물질", icon: "◉", detail: "원료·촉매·첨가제" },
  { label: "작업 절차", icon: "≡", detail: "운전·정비 절차" }, { label: "기타", icon: "＋", detail: "그 밖의 변경" },
];
const flow: { key: MocStatus; label: string; help: string }[] = [
  { key: "QUESTIONNAIRE_IN_PROGRESS", label: "대상 여부 판단", help: "질문 답변" },
  { key: "JUDGMENT_COMPLETED", label: "등급 판단", help: "규칙 기반 결과" },
  { key: "DOCUMENT_DRAFTING", label: "서류 초안 작성", help: "필수 내용 입력" },
  { key: "SUBMITTED", label: "검토 요청", help: "담당자 제출" },
  { key: "UNDER_REVIEW", label: "검토 완료", help: "검토 의견 반영" },
  { key: "APPROVED", label: "승인", help: "변경 승인" },
  { key: "WORK_IN_PROGRESS", label: "작업 수행", help: "현장 작업" },
  { key: "WORK_COMPLETED", label: "작업 완료 확인", help: "완료 확인서" },
  { key: "CLOSED", label: "최종 종결", help: "기록 보존" },
];

function cn(...parts: (string | false | null | undefined)[]) { return parts.filter(Boolean).join(" "); }
function fmt(date: string) { return date ? date.replaceAll("-", ". ") : "-"; }
function daysFrom(date: string) { return Math.ceil((new Date("2026-07-29").getTime() - new Date(date).getTime()) / 86400000); }
function gradeLabel(c?: MocCase) { return c?.judgment?.grade === "NONE" || !c?.judgment ? "-" : `${c.judgment.grade}등급`; }

function BrandLogo({ className = "" }: { className?: string }) {
  return <img className={`brand-logo ${className}`.trim()} src="/posco-future-m-ci-ko.png" alt="포스코퓨처엠" />;
}

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [cases, setCases] = useState<MocCase[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("saved");
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState("");
  const [reminderLogs, setReminderLogs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [adminAuthorized, setAdminAuthorized] = useState(false);
  const [adminPromptOpen, setAdminPromptOpen] = useState(false);
  const [adminPromptMode, setAdminPromptMode] = useState<AdminPromptMode>("access");
  const [pendingHistoryDeleteIds, setPendingHistoryDeleteIds] = useState<string[]>([]);
  const [questionList, setQuestionList] = useState<Question[]>(questions);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("safechange-cases");
      const savedQuestions = localStorage.getItem("safechange-questions");
      if (saved) setCases(normalizeMocCases(JSON.parse(saved)).filter((item) => !LEGACY_SAMPLE_CASE_IDS.has(item.id)));
      if (savedQuestions) setQuestionList(JSON.parse(savedQuestions));
      localStorage.removeItem("safechange-selected-site");
    } finally { setHydrated(true); }
  }, []);
  useEffect(() => {
    if (!hydrated || !entered) return;
    localStorage.setItem("safechange-cases", JSON.stringify(cases));
  }, [cases, entered, hydrated]);
  useEffect(() => {
    if (!hydrated || !entered) return;
    localStorage.setItem("safechange-questions", JSON.stringify(questionList));
  }, [questionList, entered, hydrated]);

  useEffect(() => {
    const onPopState = () => returnToEntry();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const siteCases = selectedSite ? casesForSite(cases, selectedSite) : [];
  const active = siteCases.find(c => c.id === activeId);
  const activeQuestions = active ? visibleQuestions(active.answers, questionList, active.workType) : questionList;
  const reminders = remindersForCases(siteCases);

  function notify(message: string) { setToast(message); setTimeout(() => setToast(""), 2600); }
  function updateCase(patch: Partial<MocCase>) {
    setSaveState("saving");
    setCases(prev => prev.map(c => c.id === activeId ? { ...c, ...patch } : c));
    setTimeout(() => setSaveState("saved"), 480);
  }
  function go(next: View) { setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function requestView(next: View) {
    if (next === "admin" && !adminAuthorized) {
      setAdminPromptMode("access");
      setAdminPromptOpen(true);
      return;
    }
    go(next);
  }
  function selectSite(site: Site) {
    setSelectedSite(site);
    setActiveId(casesForSite(cases, site)[0]?.id ?? "");
    go("dashboard");
  }
  function returnToEntry() {
    setSelectedSite(null);
    setView("dashboard");
    setActiveId("");
    setQuestionIndex(0);
    setSaveState("saved");
    setToast("");
    setFilter("");
    setAdminAuthorized(false);
    setAdminPromptOpen(false);
    try {
      localStorage.removeItem("safechange-selected-site");
    } catch {}
    setEntered(false);
  }
  function enterApplication() {
    window.history.pushState({ safechange: "entered" }, "");
    setEntered(true);
  }
  function requestHistoryDeletion(ids: string[] = []) {
    if (!selectedSite) return;
    if (ids.length === 0) {
      notify("삭제할 이력을 선택해 주세요.");
      return;
    }
    setPendingHistoryDeleteIds(ids);
    setAdminPromptMode("delete-history");
    setAdminPromptOpen(true);
  }
  function authorizeAdminAction() {
    if (adminPromptMode === "delete-history" && selectedSite) {
      const deletedIds = new Set(pendingHistoryDeleteIds);
      setCases((current) => current.filter((item) => !deletedIds.has(item.id)));
      setReminderLogs((current) => current.filter((id) => !deletedIds.has(id)));
      setPendingHistoryDeleteIds([]);
      setActiveId("");
      notify(`${selectedSite}의 작성 이력과 Reminder를 삭제했습니다.`);
    } else {
      setAdminAuthorized(true);
      go("admin");
    }
    setAdminPromptOpen(false);
    setAdminPromptMode("access");
  }
  function approveCase(id: string) {
    setCases((current) => current.map((item) => item.id === id ? { ...item, status: "APPROVED" } : item));
    notify("공장장/리더 승인 처리가 완료되었습니다.");
  }
  function startCase(type: WorkType) {
    if (!selectedSite) {
      notify("먼저 좌측 상단에서 사업장을 선택해 주세요.");
      return;
    }
    const id = `moc-${Date.now()}`;
    const item = createMocCase({ id, cases, workType: type, site: selectedSite });
    setCases(prev => [item, ...prev]); setActiveId(id); setQuestionIndex(0); go("question");
  }
  function answer(value: AnswerValue) {
    if (!active) return;
    const answers = { ...active.answers, [activeQuestions[questionIndex].id]: value };
    const validIds = new Set(visibleQuestions(answers, questionList, active.workType).map(q => q.id));
    Object.keys(answers).forEach(k => { if (!validIds.has(k)) delete answers[k]; });
    updateCase({ answers, status: "QUESTIONNAIRE_IN_PROGRESS" });
    if (value === "UNKNOWN") notify("검토 필요로 기록했습니다. 다음 질문을 계속 진행하세요.");
  }
  function runJudgment() {
    if (!active) return;
    const result = judge(active.answers);
    updateCase({ judgment: result, status: "SUBMITTED" });
    go("approvals");
  }

  if (!hydrated) return <div className="loading">SafeChange를 준비하고 있습니다…</div>;
  if (!entered) return <EntryScreen onEnter={enterApplication} />;

  const main = view === "dashboard" ? <Dashboard cases={siteCases} reminders={reminders} onNew={() => go("new")} onOpen={(c, v = "progress") => { setActiveId(c.id); go(v); }} onReminder={() => go("reminders")} onHistory={() => go("history")} />
    : view === "new" ? <NewCase onSelect={startCase} onBack={() => go("dashboard")} />
    : view === "question" && active ? <QuestionView item={active} list={activeQuestions} index={questionIndex} saveState={saveState} onAnswer={answer} onIndex={setQuestionIndex} onReview={() => go("review")} onHome={() => go("dashboard")} />
    : view === "review" && active ? <Review item={active} list={activeQuestions} onEdit={(i) => { setQuestionIndex(i); go("question"); }} onBack={() => go("question")} onJudge={runJudgment} />
    : view === "result" && active ? <Result item={active} onEdit={() => go("review")} onDocs={() => go("documents")} onPrint={() => go("preview")} onReview={() => { updateCase({ status: "SUBMITTED" }); notify("담당자 검토 요청을 기록했습니다."); }} />
    : view === "documents" && active ? <Documents item={active} onDraft={() => { updateCase({ status: "DOCUMENT_DRAFTING" }); go("draft"); }} onBack={() => go("result")} />
    : view === "draft" && active ? <DraftForm item={active} saveState={saveState} onChange={(draft) => updateCase({ draft, title: draft.equipment || active.title, dueDate: draft.endDate || active.dueDate, status: "DOCUMENT_DRAFTING" })} onPreview={() => go("preview")} onBack={() => go("documents")} />
    : view === "preview" && active ? <Preview item={active} onEdit={() => go("draft")} onSubmit={() => { updateCase({ status: "SUBMITTED" }); notify("검토 담당자에게 제출되었습니다."); }} />
    : view === "progress" && active ? <Progress item={active} onNext={() => { const i = flow.findIndex(s => s.key === active.status); const next = flow[Math.min(flow.length - 1, Math.max(0, i + 1))].key; updateCase({ status: next }); notify(`${statusLabels[next]} 상태로 변경했습니다.`); }} onContinue={() => go(active.judgment ? "documents" : "question")} />
    : view === "reminders" ? <Reminders items={reminders} logs={reminderLogs} onOpen={(c) => { setActiveId(c.id); go(c.judgment ? "draft" : "question"); }} onSend={(c) => { if (reminderLogs.includes(c.id)) return notify("오늘 이미 발송한 알림입니다."); setReminderLogs(v => [...v, c.id]); notify("Reminder 발송 로그를 기록했습니다."); }} />
    : view === "history" ? <History items={siteCases} filter={filter} onFilter={setFilter} onOpen={(c) => { setActiveId(c.id); go("progress"); }} onRequestDelete={requestHistoryDeletion} />
    : view === "approvals" ? <Approvals items={siteCases} onApprove={approveCase} />
    : view === "admin" ? <Admin items={questionList} onChange={setQuestionList} /> : null;

  return (
    <div className="app-shell">
      <Sidebar view={view} site={selectedSite} reminderCount={reminders.length} onSelectSite={selectSite} onGo={requestView} />
      <div className="app-main">
        <Header view={view} site={selectedSite} onReturnToEntry={returnToEntry} />
        <main className="content">{selectedSite ? main : <SiteSelectionPrompt />}</main>
      </div>
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
      {adminPromptOpen && <AdminPasswordPrompt mode={adminPromptMode} onCancel={() => setAdminPromptOpen(false)} onAuthorize={authorizeAdminAction} />}
    </div>
  );
}

function EntryScreen({ onEnter }: { onEnter: () => void }) {
  return <div className="entry-page"><section className="entry-card"><div className="entry-brand"><BrandLogo /></div><span className="security-chip">PSM 변경요소관리</span><h1>변경의 시작부터<br />안전한 완료까지</h1><p>사업장을 선택하고 변경요소관리 업무를 시작하세요.</p><button className="btn primary entry-button" onClick={onEnter}>입장 <span>→</span></button></section></div>;
}

function SiteSelector({ site, onSelect }: { site: Site | null; onSelect: (site: Site) => void }) {
  return <div className="site-selector"><label htmlFor="business-site">사업장</label><select id="business-site" value={site ?? ""} onChange={(event) => { const value = event.target.value; if (isSite(value)) onSelect(value); }}><option value="" disabled>사업장을 선택하세요</option>{sites.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>;
}

function SiteSelectionPrompt() {
  return <section className="site-selection-prompt"><span>⌖</span><h1>사업장을 선택해 주세요</h1><p>좌측 상단에서 업무를 진행할 사업장을 선택하면 해당 공장 기준으로 MOC 업무를 관리할 수 있습니다.</p></section>;
}

function Sidebar({ view, site, reminderCount, onSelectSite, onGo }: { view: View; site: Site | null; reminderCount: number; onSelectSite: (site: Site) => void; onGo: (v: View) => void }) {
  const nav: { key: View; icon: string; label: string }[] = [{ key: "dashboard", icon: "⌂", label: "대시보드" }, { key: "new", icon: "＋", label: "새 변경 판단" }, { key: "history", icon: "▤", label: "작성 이력" }, { key: "reminders", icon: "♧", label: "Reminder" }, { key: "approvals", icon: "✓", label: "검토/승인" }, { key: "admin", icon: "⚙", label: "기준 관리" }];
  return <aside className="sidebar"><div className="sidebar-brand"><BrandLogo /><SiteSelector site={site} onSelect={onSelectSite} /></div><nav>{nav.map((item) => <button key={item.key} className={cn(view === item.key && "active")} onClick={() => onGo(item.key)}><span>{item.icon}</span>{item.label}{item.key === "reminders" && <em>{reminderCount}</em>}</button>)}</nav></aside>;
}

function AdminPasswordPrompt({ mode, onCancel, onAuthorize }: { mode: AdminPromptMode; onCancel: () => void; onAuthorize: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== ADMIN_PASSWORD) {
      setError("비밀번호가 올바르지 않습니다. 다시 입력해 주세요.");
      return;
    }
    onAuthorize();
  }
  return <div role="presentation" style={{ position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "center", padding: 20, background: "rgba(9, 31, 47, .42)" }}>
    <form role="dialog" aria-modal="true" aria-label="기준 관리 비밀번호 입력" onSubmit={submit} className="card" style={{ width: "min(100%, 420px)", padding: 28, boxShadow: "0 20px 50px rgba(9, 31, 47, .3)" }}>
      <p>{mode === "delete-history" ? "선택한 사업장의 작성 이력과 Reminder를 삭제합니다. 관리자 비밀번호를 입력해 주세요." : "허용된 사용자만 기준 관리에 접근할 수 있습니다. 비밀번호를 입력해 주세요."}</p>
      <label className="field"><span>비밀번호</span><input autoFocus type="password" inputMode="numeric" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} aria-invalid={Boolean(error)} aria-describedby={error ? "admin-password-error" : undefined} /></label>
      {error && <p id="admin-password-error" role="alert" className="danger-text">{error}</p>}
      <div className="bottom-actions"><button type="button" className="btn ghost" onClick={onCancel}>취소</button><button type="submit" className="btn primary">입장</button></div>
    </form>
  </div>;
}

function Header({ view, site, onReturnToEntry }: { view: View; site: Site | null; onReturnToEntry: () => void }) {
  const titles: Partial<Record<View, string>> = { dashboard: "대시보드", new: "새 변경 판단", history: "작성 이력", reminders: "Reminder 센터", approvals: "검토/승인", admin: "기준 관리" };
  return <header className="topbar"><div><span className="crumb">PSM 변경요소관리</span><b>{titles[view] || "MOC 업무 지원"}</b></div><div className="header-actions"><button type="button" className="btn ghost" onClick={onReturnToEntry}>처음 화면으로</button><div className="site-context"><span>⌖</span><div><small>선택 사업장</small><b>{site ?? "사업장을 선택해 주세요"}</b></div></div></div></header>;
}

function Dashboard({ cases, reminders, onNew, onOpen, onReminder, onHistory }: { cases: MocCase[]; reminders: MocCase[]; onNew: () => void; onOpen: (c: MocCase, v?: View) => void; onReminder: () => void; onHistory: () => void }) {
  const stats = [
    ["판단 진행 중", cases.filter(c => c.status === "QUESTIONNAIRE_IN_PROGRESS").length, "navy"],
    ["초안 작성 중", cases.filter(c => c.status === "DOCUMENT_DRAFTING").length, "blue"],
    ["제출 대기", cases.filter(c => c.status === "READY_TO_SUBMIT").length, "amber"],
    ["검토 중", cases.filter(c => ["SUBMITTED", "UNDER_REVIEW"].includes(c.status)).length, "purple"],
    ["승인 완료", cases.filter(c => ["APPROVED", "CLOSED"].includes(c.status)).length, "green"],
    ["기한 초과", reminders.filter(c => c.dueDate < "2026-07-29").length, "red"],
  ];
  return <div className="page-stack">
    <section className="welcome"><div><h1>안녕하세요, 변경요소 관리 시스템입니다.</h1><p>오늘도 안전한 작업을 위해 변경 사항을 꼼꼼히 확인해 주세요.</p></div><button className="btn primary large" onClick={onNew}><span>＋</span> 새 변경 판단 시작</button></section>
    <section className="stats-grid">{stats.map(([label, count, color]) => <div className={`stat ${color}`} key={String(label)}><div><span>{label}</span><b>{count}</b><small>건</small></div><i>{color === "red" ? "!" : color === "green" ? "✓" : "→"}</i></div>)}</section>
    <section className="dashboard-grid">
      <div className="card recent"><div className="card-head"><div><h2>최근 작성 목록</h2><p>최근 작업 중인 변경요소관리 건입니다.</p></div><button className="text-btn" onClick={onHistory}>전체 보기 →</button></div>
        <div className="table-wrap"><table><thead><tr><th>작업명</th><th>작업 유형</th><th>MOC 판단</th><th>등급</th><th>현재 상태</th><th>완료 예정일</th><th></th></tr></thead><tbody>{cases.slice(0, 5).map(c => <tr key={c.id}><td><b>{c.title}</b><small>{c.caseNumber}</small></td><td>{c.workType}</td><td>{c.judgment ? <Badge tone={c.judgment.isMocTarget ? "red" : "gray"}>{c.judgment.isMocTarget ? "대상" : "비대상"}</Badge> : "-"}</td><td><b>{gradeLabel(c)}</b></td><td><Badge tone={c.status === "CLOSED" ? "green" : c.status === "UNDER_REVIEW" ? "purple" : "blue"}>{statusLabels[c.status]}</Badge></td><td className={cn(c.dueDate < "2026-07-29" && c.status !== "CLOSED" && "danger-text")}>{fmt(c.dueDate)}</td><td><button className="row-action" onClick={() => onOpen(c)}>{c.status === "CLOSED" ? "상세" : "이어서"} →</button></td></tr>)}</tbody></table></div>
      </div>
      <div className="card reminder-card"><div className="card-head"><div><span className="mini-icon amber">!</span><h2>미완료 Reminder</h2></div><Badge tone="amber">{reminders.length}건</Badge></div>
        {reminders.slice(0, 2).map(c => <div className="reminder-mini" key={c.id}><div><Badge tone={c.dueDate < "2026-07-29" ? "red" : "amber"}>{c.dueDate < "2026-07-29" ? `${daysFrom(c.dueDate)}일 초과` : "마감 임박"}</Badge><h3>{c.title}</h3><p>{statusLabels[c.status]} · {fmt(c.dueDate)}까지</p></div><button onClick={() => onOpen(c, c.judgment ? "draft" : "question")}>이어서 작성 →</button></div>)}
        <button className="btn soft full" onClick={onReminder}>Reminder 전체 보기</button>
      </div>
    </section>
    <section className="safety-note"><span>✓</span><div><b>판단 전 확인해 주세요</b><p>이 시스템의 결과는 업무지침 기반 작성 지원 결과입니다. 최종 판정은 담당자 검토가 필요할 수 있습니다.</p></div><button>업무지침 보기 →</button></section>
  </div>;
}

function NewCase({ onSelect, onBack }: { onSelect: (t: WorkType) => void; onBack: () => void }) {
  const [selected, setSelected] = useState<WorkType | null>(null);
  return <div className="focused-page"><StepHeader current={1} total={4} title="변경 항목 선택" onHome={onBack}/>
    <section className="question-card start-card"><span className="eyebrow">STEP 01</span><h1>어떤 항목을 변경하려고 하나요?</h1><p>가장 가까운 작업 유형 하나를 선택해 주세요. 선택에 따라 맞춤 질문을 안내합니다.</p>
      <div className="worktype-grid">{workTypes.map(w => <button key={w.label} onClick={() => setSelected(w.label)} className={cn(selected === w.label && "selected")}><i>{w.icon}</i><div><b>{w.label}</b><small>{w.detail}</small></div><span>{selected === w.label ? "✓" : "›"}</span></button>)}</div>
      <div className="question-footer"><button className="btn ghost" onClick={onBack}>← 이전</button><button className="btn primary" disabled={!selected} onClick={() => selected && onSelect(selected)}>다음 단계 →</button></div>
    </section></div>;
}

function StepHeader({ current, total, title, onHome }: { current: number; total: number; title: string; onHome: () => void }) {
  return <div className="step-head"><button className="back-link" onClick={onHome}>⌂ 처음으로</button><div><span>{title}</span><b>{current} / {total}</b></div><div className="progress-track"><i style={{ width: `${(current / total) * 100}%` }}/></div></div>;
}

function QuestionView({ item, list, index, saveState, onAnswer, onIndex, onReview, onHome }: { item: MocCase; list: typeof questions; index: number; saveState: string; onAnswer: (v: AnswerValue) => void; onIndex: (n: number) => void; onReview: () => void; onHome: () => void }) {
  const q = list[Math.min(index, list.length - 1)]; const answer = item.answers[q.id];
  return <div className="focused-page"><StepHeader current={index + 1} total={list.length} title={`${item.workType} 변경 판단`} onHome={onHome}/>
    <section className="question-card"><div className="question-meta"><Badge tone="blue">질문 {String(index + 1).padStart(2, "0")}</Badge><span>{q.category}</span><SaveIndicator state={saveState}/></div><h1>{q.text}</h1><p className="question-help"><span>i</span>{q.description}</p>
      <div className="answer-grid">{(Object.keys(optionMeta) as AnswerValue[]).map(v => <button className={cn(answer === v && "selected", v === "UNKNOWN" && "unknown")} key={v} onClick={() => onAnswer(v)}><span className="radio">{answer === v && "●"}</span><b>{optionMeta[v].label}</b>{v === "UNKNOWN" && <small>검토 필요로 기록됩니다</small>}</button>)}</div>
      {answer === "UNKNOWN" && <div className="unknown-help"><b>잘 모르셔도 괜찮습니다.</b><p>현재 답변은 검토 필요로 기록됩니다. 설비 명판·도면·담당 엔지니어를 통해 확인해 주세요.</p></div>}
      <div className="guideline-link">▤ 관련 기준: {q.guidelineSection}</div>
      <div className="question-footer"><button className="btn ghost" disabled={index === 0} onClick={() => onIndex(Math.max(0, index - 1))}>← 이전</button><button className="btn soft" onClick={() => notifyLocal("현재까지 답변을 저장했습니다.")}>임시 저장</button>{index < list.length - 1 ? <button className="btn primary" disabled={!answer} onClick={() => onIndex(index + 1)}>다음 질문 →</button> : <button className="btn primary" disabled={!answer} onClick={onReview}>답변 검토 →</button>}</div>
    </section></div>;
}
function notifyLocal(message: string) { window.dispatchEvent(new CustomEvent("safechange-notice", { detail: message })); }
function SaveIndicator({ state }: { state: string }) { return <span className={cn("save-indicator", state)}>{state === "saving" ? "◌ 저장 중" : state === "error" ? "! 저장 실패" : "✓ 자동 저장됨"}</span>; }

function Review({ item, list, onEdit, onBack, onJudge }: { item: MocCase; list: typeof questions; onEdit: (i: number) => void; onBack: () => void; onJudge: () => void }) {
  const unknownCount = Object.values(item.answers).filter(v => v === "UNKNOWN").length;
  return <div className="focused-page wide"><StepHeader current={3} total={4} title="답변 검토" onHome={onBack}/><section className="review-intro"><div><span className="eyebrow">최종 판단 전 확인</span><h1>답변 내용을 검토해 주세요</h1><p>수정이 필요한 항목은 해당 질문으로 돌아가 변경할 수 있습니다.</p></div><div className="review-summary"><span><b>{list.length}</b>전체 질문</span><span><b>{Object.keys(item.answers).length}</b>응답 완료</span><span className={cn(unknownCount > 0 && "warn")}><b>{unknownCount}</b>검토 필요</span></div></section>
    {unknownCount > 0 && <div className="notice amber"><b>!</b><div><strong>담당자 검토가 필요한 답변이 있습니다.</strong><p>‘잘 모르겠음’ 답변은 자동 판단에 포함되지만 최종 확정 전 담당자가 확인해야 합니다.</p></div></div>}
    <section className="card answer-review">{list.map((q, i) => <div key={q.id}><span className="qnum">{String(i + 1).padStart(2, "0")}</span><div><b>{q.text}</b><small>{q.guidelineSection}</small></div><Badge tone={item.answers[q.id] === "UNKNOWN" ? "amber" : item.answers[q.id] === "YES" ? "blue" : "gray"}>{item.answers[q.id] ? optionMeta[item.answers[q.id]].short : "미응답"}</Badge><button onClick={() => onEdit(i)}>수정</button></div>)}</section>
    <div className="sticky-actions"><button className="btn ghost" onClick={onBack}>← 이전</button><span>✓ 모든 답변은 자동 저장되었습니다.</span><button className="btn primary large" disabled={list.some(q => !item.answers[q.id])} onClick={onJudge}>최종 판단 실행 →</button></div>
  </div>;
}

function Result({ item, onEdit, onDocs, onPrint, onReview }: { item: MocCase; onEdit: () => void; onDocs: () => void; onPrint: () => void; onReview: () => void }) {
  const j = item.judgment!; const target = j.isMocTarget;
  return <div className="focused-page wide"><div className={cn("result-hero", target ? "target" : "non-target")}><div className="result-icon">{j.requiresHumanReview ? "!" : target ? "✓" : "○"}</div><div><span className="eyebrow">판단이 완료되었습니다</span><h1>{j.requiresHumanReview ? "담당자 검토가 필요합니다" : target ? "변경요소관리 대상입니다" : "변경요소관리 비대상입니다"}</h1><p>{j.summary}</p></div><div className="result-meta"><span>대상 여부<b>{j.requiresHumanReview ? "검토 필요" : target ? "대상" : "비대상"}</b></span><span>변경 등급<b>{j.grade === "NONE" ? "-" : `${j.grade}등급`}</b></span><span>위험도<b>{j.riskLevel === "HIGH" ? "높음" : j.riskLevel === "MEDIUM" ? "중간" : j.riskLevel === "REVIEW_REQUIRED" ? "검토 필요" : "낮음"}</b></span></div></div>
    <div className="result-grid"><section className="card"><div className="card-head"><div><h2>판단 근거</h2><p>적용된 Mock 규칙과 업무지침 조항입니다.</p></div><Badge tone="blue">{j.evidences.length}개 적용</Badge></div><div className="evidence-list">{j.evidences.map((e, i) => <div key={e.ruleId}><span>{i + 1}</span><div><b>{e.title}</b><p>{e.description}</p><small>▤ {e.guidelineSection} · {e.ruleId}</small></div></div>)}</div></section>
      <aside className="card result-side"><h2>다음 단계</h2>{target ? <><div className="next-doc"><span>▤</span><div><b>필요 서류 확인</b><p>{j.requiredDocumentIds.length}개의 서류가 필요합니다.</p></div></div><button className="btn primary full" onClick={onDocs}>필요 서류 확인 →</button></> : <><div className="next-doc"><span>✓</span><div><b>비대상 판단 이력 저장</b><p>관리번호와 판단 근거가 보존됩니다.</p></div></div><button className="btn primary full" onClick={onPrint}>비대상 확인서 보기 →</button></>}<button className="btn soft full" onClick={onReview}>담당자 검토 요청</button></aside></div>
    {j.conflicts.map(c => <div className="notice red" key={c}><b>!</b><div><strong>상충 답변</strong><p>{c}</p></div></div>)}
    <div className="disclaimer"><span>i</span><p>본 결과는 업무지침 기반의 작성 지원 결과이며, 최종 판정은 담당자 검토가 필요할 수 있습니다.</p></div>
    <div className="bottom-actions"><button className="btn ghost" onClick={onEdit}>← 답변 수정</button><button className="btn soft" onClick={onPrint}>인쇄 / PDF 보기</button>{target && <button className="btn primary" onClick={onDocs}>필요 서류 확인 →</button>}</div>
  </div>;
}

function Documents({ item, onDraft, onBack }: { item: MocCase; onDraft: () => void; onBack: () => void }) {
  const docs = item.judgment?.requiredDocumentIds || [];
  return <div className="focused-page wide"><div className="page-title"><div><span className="eyebrow">{item.caseNumber} · {gradeLabel(item)}</span><h1>필요 서류를 준비해 주세요</h1><p>판단 등급과 답변에 따라 자동으로 구성된 체크리스트입니다.</p></div><div className="completion-ring"><b>0</b><span>/ {docs.length} 완료</span></div></div>
    <div className="doc-list">{docs.map((doc, i) => <div className="doc-row card" key={doc}><span className="doc-check">○</span><div className="doc-main"><b>{doc}</b><small>{i < 3 ? "필수 서류" : "답변에 따라 필요"}</small></div><Badge tone={i < 3 ? "red" : "gray"}>{i < 3 ? "필수" : "선택"}</Badge><div className="doc-time">◷ 약 {8 + i * 3}분</div><Badge tone="gray">미작성</Badge><button className="btn soft" onClick={onDraft}>작성 시작 →</button></div>)}</div>
    <div className="bottom-actions"><button className="btn ghost" onClick={onBack}>← 판단 결과</button><button className="btn primary" onClick={onDraft}>첫 문서 작성 시작 →</button></div>
  </div>;
}

function DraftForm({ item, saveState, onChange, onPreview, onBack }: { item: MocCase; saveState: string; onChange: (d: Draft) => void; onPreview: () => void; onBack: () => void }) {
  const d = item.draft; const set = <K extends keyof Draft>(key: K, value: Draft[K]) => onChange({ ...d, [key]: value });
  const required = ["equipment", "purpose", "before", "after", "startDate", "endDate", "owner", "hazards", "safeguards"] as (keyof Draft)[];
  const missing = required.filter(k => !d[k]).length;
  return <div className="focused-page wide"><div className="page-title"><div><span className="eyebrow">{item.caseNumber} · 변경요소관리 신청서</span><h1>문서 초안 작성</h1><p>판단 답변에서 가져온 내용은 수정할 수 있습니다.</p></div><SaveIndicator state={saveState}/></div>
    {missing > 0 && <div className="notice amber"><b>!</b><div><strong>필수 항목 {missing}개가 남았습니다.</strong><p>주황색 표시가 있는 입력란을 작성하면 미리보기를 제출할 수 있습니다.</p></div></div>}
    <section className="form-card card"><h2>기본 정보</h2><div className="form-grid"><Field label="작업명 / 변경 대상 설비" required value={d.equipment} onChange={v => set("equipment", v)} placeholder="예: T-101 이송배관"/><Field label="담당 부서" value={d.department} onChange={v => set("department", v)}/><Field label="작성자" value={d.author} onChange={v => set("author", v)}/><Field label="작업 책임자" required value={d.owner} onChange={v => set("owner", v)} placeholder="성명 입력"/><Field label="작업 예정일" required type="date" value={d.startDate} onChange={v => set("startDate", v)}/><Field label="완료 예정일" required type="date" value={d.endDate} onChange={v => set("endDate", v)}/></div></section>
    <section className="form-card card"><h2>변경 내용</h2><div className="form-grid one"><Field label="변경 목적" required area value={d.purpose} onChange={v => set("purpose", v)} placeholder="변경이 필요한 이유와 기대 효과를 입력하세요."/><Field label="변경 전 상태" required area value={d.before} onChange={v => set("before", v)} placeholder="현재 설비·운전 상태를 구체적으로 입력하세요."/><Field label="변경 후 상태" required area value={d.after} onChange={v => set("after", v)} placeholder="변경되는 규격과 조건을 구체적으로 입력하세요."/></div></section>
    <section className="form-card card"><h2>위험요인 및 안전조치</h2><div className="form-grid"><Field label="예상 위험요인" required area value={d.hazards} onChange={v => set("hazards", v)} placeholder="누출, 화재, 감전 등"/><Field label="안전조치" required area value={d.safeguards} onChange={v => set("safeguards", v)} placeholder="차단, LOTO, 가스측정 등"/></div><div className="check-row">{[["education", "교육 필요"], ["drawingRevision", "도면 개정 필요"], ["procedureRevision", "절차서 개정 필요"]].map(([k,l]) => <label key={k}><input type="checkbox" checked={Boolean(d[k as keyof Draft])} onChange={e => set(k as keyof Draft, e.target.checked)}/><span>✓</span>{l}</label>)}</div></section>
    <section className="form-card card upload"><span>↑</span><div><b>첨부파일</b><p>도면, 사진, 사양서 등을 여기에 끌어 놓거나 선택하세요. (MVP 데모)</p></div><button className="btn soft">파일 선택</button></section>
    <div className="bottom-actions"><button className="btn ghost" onClick={onBack}>← 서류 목록</button><span>입력 내용은 자동 저장됩니다.</span><button className="btn primary" onClick={onPreview}>미리보기 →</button></div>
  </div>;
}
function Field({ label, value, onChange, required, placeholder, type = "text", area }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string; type?: string; area?: boolean }) {
  return <label className={cn("field", required && !value && "missing")}><span>{label}{required && <em>*</em>}</span>{area ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/> : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/>}</label>;
}

function Preview({ item, onEdit, onSubmit }: { item: MocCase; onEdit: () => void; onSubmit: () => void }) {
  const d = item.draft; const j = item.judgment || judge(item.answers);
  return <div className="preview-page"><div className="preview-toolbar"><button className="btn ghost" onClick={onEdit}>← 편집</button><span>A4 인쇄 미리보기</span><div><button className="btn soft" onClick={() => window.print()}>인쇄 / PDF</button><button className="btn primary" onClick={onSubmit}>검토 요청 제출</button></div></div>
    <article className="a4"><div className="doc-header"><div className="doc-logo">SAFE<br/>CHANGE</div><div><h1>변경요소관리 신청서</h1><p>MANAGEMENT OF CHANGE REQUEST</p></div><table><tbody><tr><th>관리번호</th><td>{item.caseNumber}</td></tr><tr><th>작성일</th><td>{fmt(item.createdAt)}</td></tr></tbody></table></div>
      <table className="paper-table"><tbody><tr><th>작업명</th><td colSpan={3}>{d.equipment || item.title}</td></tr><tr><th>작업 유형</th><td>{item.workType}</td><th>담당 부서</th><td>{d.department}</td></tr><tr><th>작업 예정일</th><td>{fmt(d.startDate)}</td><th>완료 예정일</th><td>{fmt(d.endDate)}</td></tr></tbody></table>
      <h2 className="paper-heading">1. 변경 개요</h2><div className="paper-section"><b>변경 목적</b><p>{d.purpose || "미입력"}</p></div><div className="paper-columns"><div><b>변경 전</b><p>{d.before || "미입력"}</p></div><div><b>변경 후</b><p>{d.after || "미입력"}</p></div></div>
      <h2 className="paper-heading">2. MOC 판단 결과</h2><div className="paper-result"><span>대상 여부<b>{j.isMocTarget ? "대상" : "비대상"}</b></span><span>등급<b>{j.grade === "NONE" ? "-" : `${j.grade}등급`}</b></span><span>위험도<b>{j.riskLevel}</b></span></div>
      <div className="paper-section"><b>판단 근거</b><ul>{j.evidences.map(e => <li key={e.ruleId}>{e.title} — {e.guidelineSection}</li>)}</ul></div>
      <h2 className="paper-heading">3. 위험요인 및 안전조치</h2><div className="paper-columns"><div><b>예상 위험요인</b><p>{d.hazards || "미입력"}</p></div><div><b>안전조치</b><p>{d.safeguards || "미입력"}</p></div></div>
      <h2 className="paper-heading">4. 필요 서류</h2><div className="paper-docs">{j.requiredDocumentIds.map(x => <span key={x}>□ {x}</span>)}</div>
      <div className="signatures"><span><b>작성</b><i>{d.author}</i></span><span><b>검토</b><i>서명</i></span><span><b>승인</b><i>서명</i></span></div>
      <p className="paper-note">본 문서는 Mock 업무지침을 기준으로 작성된 초안이며, 최종 판정은 담당자 검토를 거쳐야 합니다.</p>
    </article>
  </div>;
}

function Progress({ item, onNext, onContinue }: { item: MocCase; onNext: () => void; onContinue: () => void }) {
  let current = flow.findIndex(s => s.key === item.status); if (current < 0) current = item.status === "READY_TO_SUBMIT" ? 2 : 0;
  return <div className="focused-page wide"><div className="page-title"><div><span className="eyebrow">{item.caseNumber}</span><h1>{item.title}</h1><p>{item.workType} · {item.department} · 작성자 {item.author}</p></div><Badge tone={item.status === "CLOSED" ? "green" : "blue"}>{statusLabels[item.status]}</Badge></div>
    <div className="case-overview card"><span>대상 여부<b>{item.judgment ? item.judgment.isMocTarget ? "MOC 대상" : "비대상" : "판단 중"}</b></span><span>등급<b>{gradeLabel(item)}</b></span><span>완료 예정일<b className={cn(item.dueDate < "2026-07-29" && "danger-text")}>{fmt(item.dueDate)}</b></span><span>진행률<b>{Math.round(((current + 1) / flow.length) * 100)}%</b></span></div>
    <section className="timeline-card card"><div className="card-head"><div><h2>진행 상태</h2><p>단계별 담당자와 완료 내역을 확인하세요.</p></div><button className="btn soft" onClick={onContinue}>이어서 작성</button></div><div className="timeline">{flow.map((s, i) => <div key={s.key} className={cn(i < current && "done", i === current && "current")}><span className="timeline-dot">{i < current ? "✓" : i + 1}</span><i/><div><b>{s.label}</b><p>{s.help}</p></div><div className="timeline-status">{i < current ? <><b>완료</b><small>2026. 07. {20 + i}</small></> : i === current ? <><Badge tone="blue">현재 단계</Badge><small>담당: {item.author}</small></> : <small>대기</small>}</div>{i === current && item.status !== "CLOSED" && <button className="btn primary" onClick={onNext}>다음 단계 완료</button>}</div>)}</div></section>
  </div>;
}

function Reminders({ items, logs, onOpen, onSend }: { items: MocCase[]; logs: string[]; onOpen: (c: MocCase) => void; onSend: (c: MocCase) => void }) {
  return <div className="page-stack"><div className="page-title"><div><span className="eyebrow">FOLLOW-UP CENTER</span><h1>미완료 업무를 놓치지 마세요</h1><p>마감 임박·기한 초과·미제출 건을 한곳에서 관리합니다.</p></div><Badge tone="amber">{items.length}건 확인 필요</Badge></div>
    <div className="reminder-tabs"><button className="active">전체 {items.length}</button><button>기한 초과 {items.filter(i => i.dueDate < "2026-07-29").length}</button><button>마감 임박</button><button>미제출</button></div>
    <div className="reminder-list">{items.map(c => <div className="reminder-full card" key={c.id}><div className={cn("urgency", c.dueDate < "2026-07-29" ? "late" : "soon")}><b>{c.dueDate < "2026-07-29" ? `D+${daysFrom(c.dueDate)}` : `D-${Math.abs(daysFrom(c.dueDate))}`}</b><small>{c.dueDate < "2026-07-29" ? "기한 초과" : "마감 임박"}</small></div><div className="reminder-content"><div><Badge tone="gray">{c.caseNumber}</Badge><h2>{c.title}</h2><p>현재 단계: <b>{statusLabels[c.status]}</b> · 미완료: {c.judgment ? "문서 초안 및 제출" : "질문 답변 및 판단"}</p></div><div className="due"><small>완료 예정일</small><b>{fmt(c.dueDate)}</b></div></div><div className="reminder-actions"><button className="btn ghost">알림 연기</button><button className="btn soft" disabled={logs.includes(c.id)} onClick={() => onSend(c)}>{logs.includes(c.id) ? "✓ 발송 완료" : "메일 로그 생성"}</button><button className="btn primary" onClick={() => onOpen(c)}>이어서 작성 →</button></div></div>)}</div>
    <section className="card mail-preview"><div><span>@</span><div><b>이메일 Reminder 예시</b><p>개발 환경에서는 실제 발송 대신 발송 이력을 기록합니다.</p></div></div><code>[알림] 변경요소관리 작성이 완료되지 않았습니다.<br/><br/>작업명 · 현재 진행 상태 · 미완료 항목 · 완료 예정일 · 서비스 바로가기</code></section>
  </div>;
}

function Approvals({ items, onApprove }: { items: MocCase[]; onApprove: (id: string) => void }) {
  const pending = items.filter((item) => ["SUBMITTED", "UNDER_REVIEW"].includes(item.status));
  return <div className="page-stack"><div className="page-title"><div><span className="eyebrow">REVIEW · APPROVAL</span><h1>검토/승인</h1><p>제출된 변경 판단 자료를 공장장/리더가 확인하고 승인합니다.</p></div><Badge tone="purple">{pending.length}건 대기</Badge></div>
    <section className="card approval-card">{pending.length === 0 ? <div className="empty-state"><b>승인 대기 건이 없습니다.</b><p>문서 초안에서 검토 요청을 제출하면 이곳에 표시됩니다.</p></div> : pending.map((item) => <div className="approval-row" key={item.id}><div><Badge tone="purple">검토 요청</Badge><h2>{item.title}</h2><p>{item.caseNumber} · {item.workType} · 작성자 {item.author}</p></div><div className="approval-reviewer"><small>검토/승인자</small><strong>공장장/리더</strong></div><button className="btn primary" onClick={() => onApprove(item.id)}>승인하기</button></div>)}</section></div>;
}

function History({ items, filter, onFilter, onOpen, onRequestDelete }: { items: MocCase[]; filter: string; onFilter: (v: string) => void; onOpen: (c: MocCase) => void; onRequestDelete: (ids: string[]) => void }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [workType, setWorkType] = useState("전체");
  const [target, setTarget] = useState("전체");
  const [status, setStatus] = useState("전체");
  const shown = items.filter(c => {
    const matchText = [c.title, c.caseNumber, c.workType, c.author, statusLabels[c.status]].some(v => v.toLowerCase().includes(filter.toLowerCase()));
    const matchStart = !startDate || c.createdAt >= startDate;
    const matchEnd = !endDate || c.createdAt <= endDate;
    const matchType = workType === "전체" || c.workType === workType;
    const value = c.judgment ? (c.judgment.isMocTarget ? "대상" : "비대상") : "미판단";
    const matchTarget = target === "전체" || value === target;
    const matchStatus = status === "전체" || (status === "완료" ? ["APPROVED", "CLOSED"].includes(c.status) : !["APPROVED", "CLOSED"].includes(c.status));
    return matchText && matchStart && matchEnd && matchType && matchTarget && matchStatus;
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const toggleSelected = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const allSelected = shown.length > 0 && shown.every((item) => selectedIds.includes(item.id));
  const toggleAll = () => setSelectedIds(allSelected ? selectedIds.filter((id) => !shown.some((item) => item.id === id)) : [...new Set([...selectedIds, ...shown.map((item) => item.id)])]);
  return <div className="page-stack"><div className="page-title"><div><span className="eyebrow">MOC RECORDS</span><h1>작성 이력</h1><p>판단부터 종결까지 모든 변경 이력을 확인할 수 있습니다.</p></div><div className="history-actions"><button className="btn ghost" disabled={selectedIds.length === 0} onClick={() => onRequestDelete(selectedIds)}>이력 삭제</button><button className="btn primary">↓ 목록 내보내기</button></div></div>
    <section className="filter-card card"><label>통합 검색<input value={filter} onChange={e => onFilter(e.target.value)} placeholder="관리번호, 작업명, 작성자 검색"/></label><label>작성 기간 시작<input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}/></label><label>작성 기간 종료<input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}/></label><label>작업 유형<select value={workType} onChange={e => setWorkType(e.target.value)}><option>전체</option>{workTypes.map(w => <option key={w.label}>{w.label}</option>)}</select></label><label>대상 여부<select value={target} onChange={e => setTarget(e.target.value)}><option>전체</option><option>대상</option><option>비대상</option><option>미판단</option></select></label><label>진행 상태<select value={status} onChange={e => setStatus(e.target.value)}><option>전체</option><option>진행 중</option><option>완료</option></select></label></section>
    <section className="card history-card"><div className="card-head"><div><h2>전체 {shown.length}건</h2><p>최신 작성 순으로 표시됩니다.</p></div><span className="muted">{startDate || "전체 기간"} — {endDate || "오늘"}</span></div><div className="table-wrap"><table><thead><tr><th><input aria-label="현재 목록 전체 선택" type="checkbox" checked={allSelected} onChange={toggleAll}/></th><th>관리번호</th><th>작업명</th><th>작업 유형</th><th>대상 여부</th><th>등급</th><th>작성자 / 부서</th><th>작성일</th><th>상태</th><th></th></tr></thead><tbody>{shown.map(c => <tr key={c.id}><td><input aria-label={`${c.caseNumber} 선택`} type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelected(c.id)}/></td><td><b>{c.caseNumber}</b></td><td><b>{c.title}</b></td><td>{c.workType}</td><td>{c.judgment ? <Badge tone={c.judgment.isMocTarget ? "red" : "gray"}>{c.judgment.isMocTarget ? "대상" : "비대상"}</Badge> : "-"}</td><td>{gradeLabel(c)}</td><td>{c.author}<small>{c.department}</small></td><td>{fmt(c.createdAt)}</td><td><Badge tone={c.status === "CLOSED" ? "green" : "blue"}>{statusLabels[c.status]}</Badge></td><td><button className="row-action" onClick={() => onOpen(c)}>상세 보기 →</button></td></tr>)}</tbody></table></div></section>
  </div>;
}

function Admin({ items, onChange }: { items: Question[]; onChange: (items: Question[]) => void }) {
  const [tab, setTab] = useState<"질문 관리" | "업무지침" | "판단 규칙">("질문 관리");
  const [editing, setEditing] = useState<Question | null>(null);
  const [workTypeFilter, setWorkTypeFilter] = useState("전체");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const tabs = ["질문 관리", "업무지침", "판단 규칙"] as const;
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const filteredQuestions = sorted.filter((question) => workTypeFilter === "전체" || !question.workTypes?.length || question.workTypes.includes(workTypeFilter as WorkType));
  const allQuestionsSelected = filteredQuestions.length > 0 && filteredQuestions.every((question) => selectedQuestionIds.includes(question.id));
  const saveQuestion = (question: Question) => {
    const exists = items.some((item) => item.id === question.id);
    onChange((exists ? items.map((item) => item.id === question.id ? question : item) : [...items, question]).sort((a, b) => a.order - b.order).map((item, index) => ({ ...item, order: index + 1 })));
    setEditing(null);
  };
  const move = (id: string, direction: -1 | 1) => {
    const index = sorted.findIndex((item) => item.id === id); const swap = index + direction;
    if (swap < 0 || swap >= sorted.length) return;
    const next = [...sorted]; [next[index], next[swap]] = [next[swap], next[index]];
    onChange(next.map((item, order) => ({ ...item, order: order + 1 })));
  };
  const newQuestion = (): Question => ({ id: `custom-${Date.now()}`, order: items.length + 1, category: "공통", text: "새 질문을 입력해 주세요.", description: "질문에 대한 보충 설명을 입력해 주세요.", guidelineSection: "MOC 업무지침", workTypes: [] });
  const toggleQuestion = (id: string) => setSelectedQuestionIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const toggleAllQuestions = () => setSelectedQuestionIds(allQuestionsSelected ? selectedQuestionIds.filter((id) => !filteredQuestions.some((question) => question.id === id)) : [...new Set([...selectedQuestionIds, ...filteredQuestions.map((question) => question.id)])]);
  const deleteQuestions = () => {
    if (!selectedQuestionIds.length) return;
    onChange(items.filter((question) => !selectedQuestionIds.includes(question.id)).map((question, index) => ({ ...question, order: index + 1 })));
    setSelectedQuestionIds([]);
  };
  return <div className="page-stack"><div className="page-title"><div><span className="eyebrow">ADMIN · MOCK DATA</span><h1>기준 관리</h1><p>질문, 업무지침, 판단 규칙을 관리합니다.</p></div><Badge tone="purple">ADMIN</Badge></div><div className="admin-tabs">{tabs.map((item) => <button className={cn(tab === item && "active")} onClick={() => setTab(item)} key={item}>{item}</button>)}</div><section className="card admin-card"><div className="card-head"><div><h2>{tab}</h2><p>질문 변경 내용은 저장 즉시 새 변경 판단에 반영됩니다.</p></div><div className="admin-header-actions">{tab === "질문 관리" && <button className="btn ghost" disabled={!selectedQuestionIds.length} onClick={deleteQuestions}>질문 삭제</button>}<button className="btn primary" onClick={() => tab === "질문 관리" && setEditing(newQuestion())}>＋ 새 항목</button></div></div>{tab === "질문 관리" && <><div className="question-filter"><label>적용 항목<select value={workTypeFilter} onChange={(event) => setWorkTypeFilter(event.target.value)}><option>전체</option>{workTypes.map((item) => <option key={item.label}>{item.label}</option>)}</select></label><span>{filteredQuestions.length}개 질문</span></div><div className="admin-row question-list-head"><input aria-label="표시된 질문 전체 선택" type="checkbox" checked={allQuestionsSelected} onChange={toggleAllQuestions}/><span>순서</span><span>질문 / 적용 항목</span><span>관리</span></div>{filteredQuestions.map((question) => { const index = sorted.findIndex((item) => item.id === question.id); return <div className="admin-row question-admin-row" key={question.id}><input aria-label={`${question.text} 선택`} type="checkbox" checked={selectedQuestionIds.includes(question.id)} onChange={() => toggleQuestion(question.id)}/><b>{question.order}</b><div><strong>{question.text}</strong><small>{question.category} · {question.workTypes?.join(", ") || "공통"} · {question.guidelineSection}</small></div><div className="admin-actions"><button onClick={() => move(question.id, -1)} disabled={index === 0}>↑</button><button onClick={() => move(question.id, 1)} disabled={index === sorted.length - 1}>↓</button><button onClick={() => setEditing(question)}>편집</button></div></div>; })}</>}{tab === "업무지침" && guidelines.map((guideline) => <div className="admin-row" key={guideline.code}><b>{guideline.code}</b><div><strong>{guideline.title}</strong><small>{guideline.content}</small></div><Badge tone="blue">v1.0</Badge><button>편집</button></div>)}{tab === "판단 규칙" && ["동일 규격 비대상", "재질 변경 대상", "운전조건 변경 대상", "위험도 증가 최소 2등급", "중대 변경 1등급", "불확실 답변 검토"].map((rule, index) => <div className="admin-row" key={rule}><b>R-{String(index + 1).padStart(3, "0")}</b><div><strong>{rule}</strong><small>우선순위 {10 - index} · JSON 조건/결과 분리</small></div><Badge tone="green">활성</Badge><button>편집</button></div>)}</section>{editing && <QuestionEditor question={editing} onCancel={() => setEditing(null)} onSave={saveQuestion}/>}</div>;
}

function QuestionEditor({ question, onCancel, onSave }: { question: Question; onCancel: () => void; onSave: (question: Question) => void }) {
  const [value, setValue] = useState(question);
  const toggleWorkType = (workType: WorkType) => setValue((current) => ({ ...current, workTypes: current.workTypes?.includes(workType) ? current.workTypes.filter((item) => item !== workType) : [...(current.workTypes || []), workType] }));
  return <div className="modal-backdrop"><section className="card question-editor"><div className="card-head"><div><h2>질문 편집</h2><p>적용 항목을 선택하지 않으면 모든 변경 판단에 표시됩니다.</p></div></div><label>질문<input value={value.text} onChange={event => setValue({ ...value, text: event.target.value })}/></label><label>보충 설명<textarea value={value.description} onChange={event => setValue({ ...value, description: event.target.value })}/></label><div className="editor-grid"><label>분류<input value={value.category} onChange={event => setValue({ ...value, category: event.target.value })}/></label><label>지침 조항<input value={value.guidelineSection} onChange={event => setValue({ ...value, guidelineSection: event.target.value })}/></label></div><fieldset><legend>적용 변경 항목</legend><div className="worktype-checks">{workTypes.map((item) => <label key={item.label}><input type="checkbox" checked={value.workTypes?.includes(item.label) || false} onChange={() => toggleWorkType(item.label)}/>{item.label}</label>)}</div></fieldset><div className="modal-actions"><button className="btn ghost" onClick={onCancel}>취소</button><button className="btn primary" disabled={!value.text.trim()} onClick={() => onSave(value)}>저장</button></div></section></div>;
}

function Badge({ tone, children }: { tone: "red" | "gray" | "blue" | "green" | "amber" | "purple"; children: React.ReactNode }) { return <span className={`badge ${tone}`}>{children}</span>; }
