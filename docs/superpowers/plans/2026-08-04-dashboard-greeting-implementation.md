# 대시보드 인사말 고정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 사업장에서 대시보드 인사말을 시스템 안내 문구로 고정한다.

**Architecture:** `Dashboard` 컴포넌트의 제목 텍스트만 교체한다. 제목은 선택 사업장이나 사용자 데이터에 의존하지 않는 정적 문자열로 유지한다.

**Tech Stack:** React, TypeScript, Node test runner.

## Global Constraints

- 제목은 정확히 `안녕하세요, 변경요소 관리 시스템입니다.`를 표시한다.
- 사업장 선택 상태에 따라 제목이 바뀌지 않는다.
- 날짜·안내문·상태 카드·사업장 선택 기능을 변경하지 않는다.

---

### Task 1: 고정 인사말 반영

**Files:**

- Modify: `app/page.tsx`
- Modify: `tests/moc-engine.test.mjs`

**Interfaces:**

- Produces: dashboard heading containing the exact fixed greeting.

- [ ] **Step 1: Write the failing test**

Add a source-level test that reads `app/page.tsx`, asserts it contains `안녕하세요, 변경요소 관리 시스템입니다.`, and does not contain the prior `안녕하세요, 김현수님` heading.

- [ ] **Step 2: Run the test**

Run: `npm test`

Expected: FAIL because the new greeting is absent.

- [ ] **Step 3: Implement the minimal change**

Replace only the `Dashboard` title with:

```tsx
<h1>안녕하세요, 변경요소 관리 시스템입니다.</h1>
```

- [ ] **Step 4: Verify**

Run: `npm test && npm run build`

Expected: all tests pass and the build completes without errors.

- [ ] **Step 5: Commit**

Commit: `git add app/page.tsx tests/moc-engine.test.mjs && git commit -m "feat: use fixed dashboard greeting"`

## Plan Self-Review

- The exact static heading and preservation of other dashboard content are covered.
- No placeholders or inconsistent identifiers remain.
