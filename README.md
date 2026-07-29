# SafeChange — PSM 변경요소관리 AI 비서 MVP

생산·정비 현장 구성원이 단계별 질문에 답해 MOC 대상 여부와 등급을 판단하고, 근거 확인부터 문서 초안·인쇄·상태·Reminder까지 이어서 처리하는 웹 MVP입니다.

## 실행

요구 환경은 Node.js 22.13 이상입니다.

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

- 아이디: `operator01`
- 비밀번호: `test1234`

검증:

```bash
npm test
npm run build
```

## 구현 범위

- 테스트 로그인과 실패 재입력
- 8개 작업 유형, 9개 조건부 질문, 선택 즉시 자동 저장
- 답변 검토/수정과 조건부 답변 무효화
- 별도 규칙 엔진의 대상·등급·위험도·근거·지침 판단
- 등급별 서류 체크리스트
- 자동 채움 문서 초안, 누락 표시, A4 인쇄/PDF 화면
- 9단계 상태 타임라인과 허용 순서 기반 진행
- 기한 초과/마감 임박 Reminder 및 중복 발송 로그 방지
- 검색 가능한 작성 이력과 Mock 기준 관리
- PC 우선 반응형 UI
- 3명 사용자, 진행 3건, 완료 2건, Reminder 2건 Mock 데이터

## 구조

- `app/page.tsx`: 전체 MVP 사용자 흐름과 화면
- `app/lib/moc.ts`: 질문 데이터, Mock 규칙 엔진, Seed
- `db/schema.ts`: D1/SQLite 전환 가능한 Drizzle 데이터 모델
- `drizzle/`: DB 마이그레이션
- `tests/moc-engine.test.mjs`: 핵심 판단 회귀 테스트
- `docs/DECISION_RULES.md`: 규칙 설명
- `docs/INTEGRATION.md`: 실제 지침·SSO·메일·사내 시스템 연계

## 데이터 저장

현재 브라우저 MVP는 답변과 초안을 즉시 기기 로컬 저장소에 보관해 새로고침 후 이어쓰기를 지원합니다. 배포 설정에는 Cloudflare D1 논리 바인딩과 전체 관계형 스키마가 포함되어 있습니다. 운영 전 `db/schema.ts`를 기준으로 서버 Route Handler/Repository를 연결하고 로그인 세션·권한 검증을 서버로 이동해야 합니다.

## 안전 고지

현재 판단 규칙과 업무지침은 교체 가능한 Mock 데이터입니다. 실제 PSM 판정 또는 현장 작업 승인에 직접 사용하면 안 됩니다. 운영 전 회사 업무지침 반영, PSM 담당자 승인, 회귀 테스트, 보안 검토가 필요합니다.
