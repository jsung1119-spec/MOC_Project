# 포스코퓨처엠 CI 적용 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 입장 화면과 사이드바의 SafeChange 브랜드 영역을 포스코퓨처엠 국문 CI로 교체한다.

**Architecture:** 제공된 PNG를 정적 자산으로 추가하고, 기존 브랜드 마크·텍스트 조합을 재사용 가능한 이미지 요소로 바꾼다. CSS는 이미지의 원본 비율을 유지하며 데스크톱과 모바일 모두에서 사업장 선택 메뉴와 겹치지 않게 제한한다.

**Tech Stack:** React, TypeScript, CSS, Vinext build.

## Global Constraints

- 제공된 포스코퓨처엠 국문 PNG만 사용한다.
- 이미지 비율을 왜곡하지 않는다.
- 입장 버튼, 사업장 선택, 메뉴 구조는 변경하지 않는다.
- 사이드바와 모바일에서 사업장 선택 메뉴를 가리지 않는다.

---

### Task 1: CI 자산과 브랜드 영역 교체

**Files:**

- Create: `public/posco-future-m-ci-ko.png`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**

- Produces: `BrandLogo` component using `/posco-future-m-ci-ko.png` with `alt="포스코퓨처엠"`.

- [ ] **Step 1: Write the failing verification**

Add a source-level test that checks `app/page.tsx` includes `/posco-future-m-ci-ko.png` and no longer renders `brand-mark` in the entry or sidebar brand blocks.

- [ ] **Step 2: Run the verification**

Run: `npm test`

Expected: FAIL because the CI asset reference does not exist.

- [ ] **Step 3: Implement the replacement**

Copy the provided PNG to `public/posco-future-m-ci-ko.png`. Replace both existing brand mark/text blocks with `BrandLogo`. Add CSS for an intrinsic-height image, desktop maximum width within the 236px sidebar, and a smaller mobile maximum width that preserves the 170px site selector.

- [ ] **Step 4: Verify**

Run: `npm test && npm run build`

Expected: all tests pass and the build completes without errors.

- [ ] **Step 5: Commit**

Commit: `git add public/posco-future-m-ci-ko.png app/page.tsx app/globals.css tests/moc-engine.test.mjs && git commit -m "feat: apply posco future m ci"`

## Plan Self-Review

- Asset, entry brand, sidebar brand, desktop constraint, mobile constraint, and existing feature preservation are all covered by Task 1.
- No placeholder instructions or inconsistent names remain.
