# Admin Access and Layout Design

## Goal

Improve the dashboard and criteria-management experience by removing the dashboard date, adding a lightweight criteria-management password gate, and using the full row width for criteria entries.

## Scope

### Dashboard date removal

- Remove the date label rendered above the dashboard greeting.
- The date must not be rendered for either configured business site.
- Keep the fixed system greeting and all other dashboard actions unchanged.

### Criteria-management access gate

- Selecting the sidebar `기준 관리` item opens an in-app password prompt instead of the criteria-management page.
- The required password for this MVP is the literal value `0000`.
- A correct value navigates to the criteria-management page.
- A wrong or blank value keeps the prompt open and shows a clear re-entry message.
- The prompt supports keyboard submission with Enter, cancellation, and focus on its password field.
- Authorization exists only in current client memory. Reloading the page requires the password again.
- This is an MVP UI gate, not security suitable for protecting confidential administration data. A later server-backed role system must replace it.

### Criteria-management list layout

- Redesign each criteria row so its primary text consumes the formerly empty middle width.
- Question rows show drag handle, order, question title, metadata, `사용 중` status, and `편집` in one wide row on desktop.
- Long primary text wraps only when it cannot fit, rather than being constrained to a narrow right-side column.
- Guideline and decision-rule rows use the same flexible primary-text column.
- Preserve responsive behavior by allowing the row to stack logically on narrow screens.

## Data flow

`Sidebar` sends the requested view to the app shell. If the requested view is `admin` and this session is not authorized, the app displays `AdminPasswordPrompt`. A successful password match changes the session flag and then changes the view to `admin`. No case, site selection, or mock management data changes.

## Error handling

- Incorrect password: `비밀번호가 올바르지 않습니다. 다시 입력해 주세요.`
- Empty password uses the same message after submit.
- Cancel returns to the current page without changing authorization.

## Tests

- Source-level regression test confirms the removed dashboard date is no longer rendered.
- Source-level test confirms the password gate, exact MVP password, and invalid-password message are present.
- Source-level test confirms the admin row grid uses a flexible central content column rather than the prior constrained layout.
- Existing engine and UI regression tests remain green, followed by a production build.

## Out of scope

- Server-side authentication or storage of admin access.
- Changing the configured business sites, MOC judgment logic, or management data persistence.
- Any change to the deployed site’s access policy.
