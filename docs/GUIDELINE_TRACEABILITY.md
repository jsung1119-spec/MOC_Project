# 변경관리 지침 추적성

이 문서는 제공된 `변경관리_지침.pdf`와 `변경관리_붙임, 첨부.pdf`의 주요 요구사항이 코드와 테스트 어디에 반영됐는지 연결합니다. 시스템 판정은 작성 지원을 위한 추천이며, 실제 현장 적용 전 PSM 담당자의 원문 대조와 승인이 필요합니다.

| 지침/양식 영역 | 구현 데이터·로직 | 화면 | 검증 테스트 |
|---|---|---|---|
| 변경 기본정보 및 변경 요청 | `app/lib/moc/types.ts`, `app/lib/moc/validation.ts` | `NewMocCaseForm.tsx` | `moc-validation.test.mjs`, `moc-ui-contract.test.mjs` |
| 붙임 2 변경/단순교체 판정표 | `replacement-criteria.ts`, `replacement-engine.ts` | `ReplacementQuestionnaire.tsx`, `MocDecisionResult.tsx` | `replacement-engine.test.mjs` |
| 붙임 3 변경관리 등급 기준 | `grade-rules.ts`, `grade-engine.ts` | `GradeQuestionnaire.tsx`, `MocDecisionResult.tsx` | `grade-engine.test.mjs` |
| 첨부 1 변경관리 신청·승인 | `types.ts`의 `ApprovalRecord`, `CommitteeRecord` | `MocProcessWorkspace.tsx` | `moc-process-ui.test.mjs`, `moc-workflow.test.mjs` |
| 첨부 2 변경 실행계획 | `forms.ts`의 `implementationPlanTemplate` | `MocProcessWorkspace.tsx` | `moc-validation.test.mjs`, `moc-process-ui.test.mjs` |
| 붙임 5 사전 검토 16개 항목 | `forms.ts`의 `reviewTemplate` | `MocProcessWorkspace.tsx` | `moc-validation.test.mjs`, `moc-workflow.test.mjs` |
| 공정안전자료 개정 | `forms.ts`의 `processSafetyDocumentTemplate` | `MocProcessWorkspace.tsx` | `moc-validation.test.mjs`, `moc-workflow.test.mjs` |
| 작업자 교육 | `types.ts`의 `TrainingRecord` | `MocProcessWorkspace.tsx` | `moc-workflow.test.mjs`, `moc-reminders.test.mjs` |
| 가동 전 점검·Punch List·재점검 | `types.ts`의 `PreStartupInspection`, `PunchItem` | `MocProcessWorkspace.tsx` | `moc-workflow.test.mjs` |
| 임시변경 30일 제한·표찰·원상복구 | `validation.ts`, `workflow.ts` | 기본정보·프로세스 작업공간 | `moc-validation.test.mjs`, `moc-workflow.test.mjs`, `moc-reminders.test.mjs` |
| 비상변경 사후 검토 | `workflow.ts`, `sites.ts` | 프로세스 작업공간·Reminder | `moc-workflow.test.mjs`, `moc-reminders.test.mjs` |
| 사업장별 저장·이력·승인 동기화 | `repository.ts`, `sites.ts` | 대시보드·작성 이력·검토/승인 | `moc-schema.test.mjs`, `moc-cross-view.test.mjs` |
| D1 추가형 스키마 | `db/schema.ts`, `drizzle/0001_guideline_moc.sql` | 추후 서버 Repository | `moc-schema.test.mjs` |

## 판정 원칙

- 붙임 2의 해당 비교항목이 모두 동일해야만 `SIMPLE_REPLACEMENT`로 판정합니다.
- 하나라도 다르면 `CHANGE`, 미응답 또는 불확실 항목이 있으면 `UNDETERMINED`로 기록하고 담당자/위원회 검토를 요구합니다.
- 붙임 3의 여러 등급 기준이 동시에 일치하면 1등급, 2등급, 3등급 순으로 높은 등급을 추천합니다.
- 1·2등급은 HAZOP과 변경관리위원회 심의, 3등급은 Check List와 설비운전파트장 승인 경로를 기본으로 제시합니다.
- 추천등급과 최종등급을 분리하며, 조정 시 사유를 남깁니다.

## 종결 차단 조건

`app/lib/moc/workflow.ts`는 다음 중 하나라도 남아 있으면 종결 상태를 만들지 않습니다.

- 필요한 위원회 심의 또는 승인 미완료
- 실행계획·사전 검토·작업 수행 미완료
- 필요한 공정안전자료 개정 미완료
- 필수 교육 미완료
- 가동 전 점검 부적합 또는 미완료
- 미조치 Punch List
- 임시변경 기술검토·위험성평가·표찰·원상복구 미완료
- 비상변경 사후 검토 미완료

## 해석 및 적용 한계

- PDF 표의 표시와 문구를 데이터로 옮겼으나, 법적 효력이나 회사 공식 해석을 대신하지 않습니다.
- 설비 분류가 여러 항목에 걸치거나 현장 조건이 문서 예시와 다르면 자동 확정하지 않고 담당자 검토가 필요합니다.
- 지침 개정 시 기존 건은 당시 규칙 스냅샷을 보존하고, 승인된 새 버전은 신규 건에만 적용해야 합니다.
- 공개 Vercel/ChatGPT 시연본은 브라우저 로컬 저장 방식이므로 사용자·기기 간 공동업무와 공식 기록보존에 사용할 수 없습니다.
