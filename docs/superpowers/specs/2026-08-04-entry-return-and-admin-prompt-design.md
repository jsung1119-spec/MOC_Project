# Entry Return and Admin Prompt Design

## Goal

Remove the unwanted criteria-management dialog heading and let users return to the first entry screen with all current session information cleared.

## Criteria-management prompt

- Remove the heading `기준 관리 접근` from the password dialog.
- Retain the explanatory sentence, password input, invalid-password feedback, cancel button, and `입장` submit button.
- Preserve the existing `0000` password behavior.

## Return to entry screen

- Add an always-visible `처음 화면으로` action in the application header after the user has entered the service.
- Selecting it returns to the original screen containing the `입장` button.
- Before returning, reset every in-memory session field: selected business site, current view, active case, question index, autosave indicator, toast, search filter, Reminder mail-log state, criteria-management authorization, and criteria-management dialog state.
- Reset the case list to immutable mock seed data so in-progress answers and document drafts are not retained.
- Remove the service-local `safechange-cases` and `safechange-selected-site` browser storage keys so re-entry begins as a fresh session after a refresh as well.
- Re-entry continues to require the criteria-management password when that area is selected.

## Error handling and accessibility

- The return action is a normal button with an explicit text label.
- Clearing storage must tolerate a browser-storage failure; the in-memory reset must still complete.
- No confirmation dialog is shown for this MVP; return is an intentional immediate session reset action.

## Tests

- Add source-level regression coverage that the obsolete password-dialog title is absent while its accessibility label remains meaningful.
- Add source-level coverage for a return action and reset handler that clears the specified browser storage keys and administrator authorization state.
- Existing tests and a production build must pass.

## Out of scope

- Persisting login identity or criteria-management authorization.
- Changing the password, business-site list, or MOC judgment rules.
