"use client";

import { useEffect, useState } from "react";
import {
  AnswerValue, Draft, MocCase, MocStatus, WorkType, emptyDraft, guidelines, judge,
  nextCaseNumber, optionMeta, questions, seedCases, statusLabels, visibleQuestions,
} from "./lib/moc";

type View = "dashboard" | "new" | "question" | "review" | "result" | "documents" | "draft" | "preview" | "progress" | "reminders" | "history" | "admin";
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

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginId, setLoginId] = useState("operator01");
  const [password, setPassword] = useState("test1234");
  const [loginError, setLoginError] = useState("");
  const [view, setView] = useState<View>("dashboard");
  const [cases, setCases] = useState<MocCase[]>(seedCases);
  const [activeId, setActiveId] = useState<string>(seedCases[0].id);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("saved");
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState("");
  const [reminderLogs, setReminderLogs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("safechange-cases");
      const session = localStorage.getItem("safechange-session");
      if (saved) setCases(JSON.parse(saved));
      if (new URLSearchParams(window.location.search).has("logout")) {
        localStorage.removeItem("safechange-session");
      } else if (session) setLoggedIn(true);
    } finally { setHydrated(true); }
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("safechange-cases", JSON.stringify(cases));
  }, [cases, hydrated]);

  const active = cases.find(c => c.id === activeId);
  const activeQuestions = active ? visibleQuestions(active.answers) : questions;
  const reminders = cases.filter(c => !["CLOSED", "WORK_COMPLETED"].includes(c.status) && (c.status === "DOCUMENT_DRAFTING" || c.dueDate <= "2026-07-31"));

  function notify(message: string) { setToast(message); setTimeout(() => setToast(""), 2600); }
  function updateCase(patch: Partial<MocCase>) {
    setSaveState("saving");
    setCases(prev => prev.map(c => c.id === activeId ? { ...c, ...patch } : c));
    setTimeout(() => setSaveState("saved"), 480);
  }
  function go(next: View) { setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function startCase(type: WorkType) {
    const id = `moc-${Date.now()}`;
    const item: MocCase = { id, caseNumber: nextCaseNumber(cases), title: `${type} 변경`, workType: type, author: "김현수", department: "생산1팀", status: "QUESTIONNAIRE_IN_PROGRESS", createdAt: "2026-07-29", dueDate: "2026-08-05", answers: {}, draft: emptyDraft() };
    setCases(prev => [item, ...prev]); setActiveId(id); setQuestionIndex(0); go("question");
  }
  function answer(value: AnswerValue) {
    if (!active) return;
    const answers = { ...active.answers, [activeQuestions[questionIndex].id]: value };
    const validIds = new Set(visibleQuestions(answers).map(q => q.id));
    Object.keys(answers).forEach(k => { if (!validIds.has(k)) delete answers[k]; });
    updateCase({ answers, status: "QUESTIONNAIRE_IN_PROGRESS" });
    if (value === "UNKNOWN") notify("검토 필요로 기록했습니다. 다음 질문을 계속 진행하세요.");
  }
  function runJudgment() {
    if (!active) return;
    const result = judge(active.answers);
    updateCase({ judgment: result, status: "JUDGMENT_COMPLETED" });
    go("result");
  }
  function login(e: React.FormEvent) {
    e.preventDefault();
    if (loginId === "operator01" && password === "test1234") {
      localStorage.setItem("safechange-session", "operator01"); setLoggedIn(true); setLoginError("");
    } else { setLoginError("아이디 또는 비밀번호가 올바르지 않습니다. 다시 입력해 주세요."); }
  }
  function logout() { localStorage.removeItem("safechange-session"); setLoggedIn(false); setView("dashboard"); }

  if (!hydrated) return <div className="loading">SafeChange를 준비하고 있습니다…</div>;
  if (!loggedIn) return <Login id={loginId} password={password} error={loginError} onId={setLoginId} onPassword={setPassword} onSubmit={login} />;

  const main = view === "dashboard" ? <Dashboard cases={cases} reminders={reminders} onNew={() => go("new")} onOpen={(c, v = "progress") => { setActiveId(c.id); go(v); }} onReminder={() => go("reminders")} />
    : view === "new" ? <NewCase onSelect={startCase} onBack={() => go("dashboard")} />
    : view === "question" && active ? <QuestionView item={active} list={activeQuestions} index={questionIndex} saveState={saveState} onAnswer={answer} onIndex={setQuestionIndex} onReview={() => go("review")} onHome={() => go("dashboard")} />
    : view === "review" && active ? <Review item={active} list={activeQuestions} onEdit={(i) => { setQuestionIndex(i); go("question"); }} onBack={() => go("question")} onJudge={runJudgment} />
    : view === "result" && active ? <Result item={active} onEdit={() => go("review")} onDocs={() => go("documents")} onPrint={() => go("preview")} onReview={() => { updateCase({ status: "SUBMITTED" }); notify("담당자 검토 요청을 기록했습니다."); }} />
    : view === "documents" && active ? <Documents item={active} onDraft={() => { updateCase({ status: "DOCUMENT_DRAFTING" }); go("draft"); }} onBack={() => go("result")} />
    : view === "draft" && active ? <DraftForm item={active} saveState={saveState} onChange={(draft) => updateCase({ draft, title: draft.equipment || active.title, dueDate: draft.endDate || active.dueDate, status: "DOCUMENT_DRAFTING" })} onPreview={() => go("preview")} onBack={() => go("documents")} />
    : view === "preview" && active ? <Preview item={active} onEdit={() => go("draft")} onSubmit={() => { updateCase({ status: "SUBMITTED" }); notify("검토 담당자에게 제출되었습니다."); }} />
    : view === "progress" && active ? <Progress item={active} onNext={() => { const i = flow.findIndex(s => s.key === active.status); const next = flow[Math.min(flow.length - 1, Math.max(0, i + 1))].key; updateCase({ status: next }); notify(`${statusLabels[next]} 상태로 변경했습니다.`); }} onContinue={() => go(active.judgment ? "documents" : "question")} />
    : view === "reminders" ? <Reminders items={reminders} logs={reminderLogs} onOpen={(c) => { setActiveId(c.id); go(c.judgment ? "draft" : "question"); }} onSend={(c) => { if (reminderLogs.includes(c.id)) return notify("오늘 이미 발송한 알림입니다."); setReminderLogs(v => [...v, c.id]); notify("Reminder 발송 로그를 기록했습니다."); }} />
    : view === "history" ? <History items={cases} filter={filter} onFilter={setFilter} onOpen={(c) => { setActiveId(c.id); go("progress"); }} />
    : view === "admin" ? <Admin /> : null;

  return (
    <div className="app-shell">
      <Sidebar view={view} onGo={go} />
      <div className="app-main">
        <Header view={view} onLogout={logout} />
        <main className="content">{main}</main>
      </div>
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}

function Login({ id, password, error, onId, onPassword, onSubmit }: { id: string; password: string; error: string; onId: (v: string) => void; onPassword: (v: string) => void; onSubmit: (e: React.FormEvent) => void }) {
  return <div className="login-page">
    <section className="login-story">
      <div className="brand brand-light"><span className="brand-mark">S</span><div><strong>SafeChange</strong><small>PSM MOC ASSISTANT</small></div></div>
      <div className="story-copy"><span className="eyebrow">현장을 더 안전하게, 판단은 더 명확하게</span><h1>변경의 시작부터<br/>안전한 완료까지</h1><p>복잡한 업무지침 대신, 단계별 질문에 답하세요.<br/>SafeChange가 판단 근거와 필요한 서류를 안내합니다.</p></div>
      <div className="trust-row"><div><b>01</b><span>규칙 기반<br/>정확한 판단</span></div><div><b>02</b><span>자동 저장<br/>간편한 작성</span></div><div><b>03</b><span>근거 조항<br/>투명한 결과</span></div></div>
      <div className="factory-lines" aria-hidden="true"><i/><i/><i/><i/></div>
    </section>
    <section className="login-panel">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="mobile-brand brand"><span className="brand-mark">S</span><strong>SafeChange</strong></div>
        <span className="security-chip">● 보안 접속</span><h2>안녕하세요</h2><p className="muted">PSM 변경요소관리 시스템에 로그인하세요.</p>
        {error && <div className="error-box"><b>!</b><span>{error}</span></div>}
        <label>아이디<input value={id} onChange={e => onId(e.target.value)} autoComplete="username" placeholder="아이디를 입력하세요"/></label>
        <label>비밀번호<input type="password" value={password} onChange={e => onPassword(e.target.value)} autoComplete="current-password" placeholder="비밀번호를 입력하세요"/></label>
        <button className="btn primary full" type="submit">로그인 <span>→</span></button>
        <div className="test-account"><b>테스트 계정</b><span>operator01</span><span>test1234</span></div>
        <p className="login-help">로그인에 문제가 있나요? <u>시스템 관리자에게 문의</u></p>
      </form>
      <p className="copyright">© 2026 SafeChange. PSM 업무지원 시스템</p>
    </section>
  </div>;
}

function Sidebar({ view, onGo }: { view: View; onGo: (v: View) => void }) {
  const nav: { key: View; icon: string; label: string }[] = [
    { key: "dashboard", icon: "⌂", label: "대시보드" }, { key: "new", icon: "＋", label: "새 변경 판단" },
    { key: "history", icon: "▤", label: "작성 이력" }, { key: "reminders", icon: "♧", label: "Reminder" },
    { key: "admin", icon: "⚙", label: "기준 관리" },
  ];
  return <aside className="sidebar"><div className="brand"><span className="brand-mark">S</span><div><strong>SafeChange</strong><small>PSM MOC ASSISTANT</small></div></div>
    <nav>{nav.map(n => <button key={n.key} className={cn(view === n.key && "active")} onClick={() => onGo(n.key)}><span>{n.icon}</span>{n.label}{n.key === "reminders" && <em>2</em>}</button>)}</nav>
    <div className="side-help"><span>?</span><b>도움이 필요하신가요?</b><small>MOC 업무지침과 자주 묻는 질문을 확인하세요.</small><button>도움말 보기 →</button></div>
    <div className="version">v1.0.0 · Mock guideline</div>
  </aside>;
}

function Header({ view, onLogout }: { view: View; onLogout: () => void }) {
  const titles: Partial<Record<View, string>> = { dashboard: "대시보드", new: "새 변경 판단", history: "작성 이력", reminders: "Reminder 센터", admin: "기준 관리" };
  return <header className="topbar"><div><span className="crumb">PSM 변경요소관리</span><b>{titles[view] || "MOC 업무 지원"}</b></div><div className="header-actions"><button className="icon-btn" aria-label="알림">♧<i>2</i></button><div className="user-avatar">김</div><div className="user-meta"><b>김현수</b><small>생산1팀 · Operator</small></div><button className="logout" onClick={onLogout}>로그아웃</button></div></header>;
}

function Dashboard({ cases, reminders, onNew, onOpen, onReminder }: { cases: MocCase[]; reminders: MocCase[]; onNew: () => void; onOpen: (c: MocCase, v?: View) => void; onReminder: () => void }) {
  const stats = [
    ["판단 진행 중", cases.filter(c => c.status === "QUESTIONNAIRE_IN_PROGRESS").length, "navy"],
    ["초안 작성 중", cases.filter(c => c.status === "DOCUMENT_DRAFTING").length, "blue"],
    ["제출 대기", cases.filter(c => c.status === "READY_TO_SUBMIT").length, "amber"],
    ["검토 중", cases.filter(c => ["SUBMITTED", "UNDER_REVIEW"].includes(c.status)).length, "purple"],
    ["승인 완료", cases.filter(c => ["APPROVED", "CLOSED"].includes(c.status)).length, "green"],
    ["기한 초과", reminders.filter(c => c.dueDate < "2026-07-29").length, "red"],
  ];
  return <div className="page-stack">
    <section className="welcome"><div><span className="eyebrow">2026년 7월 29일 수요일</span><h1>안녕하세요, 김현수님</h1><p>오늘도 안전한 작업을 위해 변경 사항을 꼼꼼히 확인해 주세요.</p></div><button className="btn primary large" onClick={onNew}><span>＋</span> 새 변경 판단 시작</button></section>
    <section className="stats-grid">{stats.map(([label, count, color]) => <div className={`stat ${color}`} key={String(label)}><div><span>{label}</span><b>{count}</b><small>건</small></div><i>{color === "red" ? "!" : color === "green" ? "✓" : "→"}</i></div>)}</section>
    <section className="dashboard-grid">
      <div className="card recent"><div className="card-head"><div><h2>최근 작성 목록</h2><p>최근 작업 중인 변경요소관리 건입니다.</p></div><button className="text-btn" onClick={() => onOpen(cases[0], "history")}>전체 보기 →</button></div>
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

function History({ items, filter, onFilter, onOpen }: { items: MocCase[]; filter: string; onFilter: (v: string) => void; onOpen: (c: MocCase) => void }) {
  const shown = items.filter(c => [c.title, c.caseNumber, c.workType, c.author, statusLabels[c.status]].some(v => v.toLowerCase().includes(filter.toLowerCase())));
  return <div className="page-stack"><div className="page-title"><div><span className="eyebrow">MOC RECORDS</span><h1>작성 이력</h1><p>판단부터 종결까지 모든 변경 이력을 확인할 수 있습니다.</p></div><button className="btn primary">↓ 목록 내보내기</button></div>
    <section className="filter-card card"><label>통합 검색<input value={filter} onChange={e => onFilter(e.target.value)} placeholder="관리번호, 작업명, 작성자 검색"/></label><label>작업 유형<select><option>전체</option>{workTypes.map(w => <option key={w.label}>{w.label}</option>)}</select></label><label>대상 여부<select><option>전체</option><option>대상</option><option>비대상</option></select></label><label>진행 상태<select><option>전체</option><option>진행 중</option><option>완료</option></select></label></section>
    <section className="card history-card"><div className="card-head"><div><h2>전체 {shown.length}건</h2><p>최신 작성 순으로 표시됩니다.</p></div><span className="muted">2026. 01. 01 — 2026. 07. 29</span></div><div className="table-wrap"><table><thead><tr><th>관리번호</th><th>작업명</th><th>작업 유형</th><th>대상 여부</th><th>등급</th><th>작성자 / 부서</th><th>작성일</th><th>상태</th><th></th></tr></thead><tbody>{shown.map(c => <tr key={c.id}><td><b>{c.caseNumber}</b></td><td><b>{c.title}</b></td><td>{c.workType}</td><td>{c.judgment ? <Badge tone={c.judgment.isMocTarget ? "red" : "gray"}>{c.judgment.isMocTarget ? "대상" : "비대상"}</Badge> : "-"}</td><td>{gradeLabel(c)}</td><td>{c.author}<small>{c.department}</small></td><td>{fmt(c.createdAt)}</td><td><Badge tone={c.status === "CLOSED" ? "green" : "blue"}>{statusLabels[c.status]}</Badge></td><td><button className="row-action" onClick={() => onOpen(c)}>상세 보기 →</button></td></tr>)}</tbody></table></div></section>
  </div>;
}

function Admin() {
  const [tab, setTab] = useState("질문 관리");
  return <div className="page-stack"><div className="page-title"><div><span className="eyebrow">ADMIN · MOCK DATA</span><h1>기준 관리</h1><p>실제 업무지침 제공 시 아래 데이터만 교체할 수 있도록 분리되어 있습니다.</p></div><Badge tone="purple">ADMIN</Badge></div>
    <div className="admin-tabs">{["질문 관리", "업무지침", "판단 규칙", "사용자"].map(t => <button className={cn(tab === t && "active")} onClick={() => setTab(t)} key={t}>{t}</button>)}</div>
    <section className="card admin-card"><div className="card-head"><div><h2>{tab}</h2><p>Mock 데이터 · 변경 내용은 다음 판단부터 적용됩니다.</p></div><button className="btn primary">＋ 새 항목</button></div>
      {tab === "질문 관리" && questions.map(q => <div className="admin-row" key={q.id}><span className="drag">⋮⋮</span><b>{q.order}</b><div><strong>{q.text}</strong><small>{q.category} · {q.guidelineSection}</small></div><Badge tone="green">사용 중</Badge><button>편집</button></div>)}
      {tab === "업무지침" && guidelines.map(g => <div className="admin-row" key={g.code}><b>{g.code}</b><div><strong>{g.title}</strong><small>{g.content}</small></div><Badge tone="blue">v1.0</Badge><button>편집</button></div>)}
      {tab === "판단 규칙" && ["동일 규격 비대상", "재질 변경 대상", "운전조건 변경 대상", "위험도 증가 최소 2등급", "중대 변경 1등급", "불확실 답변 검토"].map((x,i) => <div className="admin-row" key={x}><b>R-{String(i+1).padStart(3,"0")}</b><div><strong>{x}</strong><small>우선순위 {10 - i} · JSON 조건/결과 분리</small></div><Badge tone="green">활성</Badge><button>편집</button></div>)}
      {tab === "사용자" && [["operator01","김현수","생산1팀","USER"],["maint01","박준호","기계정비팀","USER"],["reviewer01","이서연","PSM검토팀","REVIEWER"]].map(u => <div className="admin-row" key={u[0]}><div className="user-avatar">{u[1][0]}</div><div><strong>{u[1]} · {u[0]}</strong><small>{u[2]}</small></div><Badge tone="purple">{u[3]}</Badge><button>편집</button></div>)}
    </section>
  </div>;
}

function Badge({ tone, children }: { tone: "red" | "gray" | "blue" | "green" | "amber" | "purple"; children: React.ReactNode }) { return <span className={`badge ${tone}`}>{children}</span>; }
