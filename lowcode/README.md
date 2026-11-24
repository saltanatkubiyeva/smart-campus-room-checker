# Low-code version (Practice 13) — Appsmith

Same Smart Campus contract as the code-based tab "Contract check (P13)", built in
**Appsmith Cloud** (free trial workspace).

- Live app (public, deployed view): https://smart-campus.appsmith.com/app/smart-campus-room-checker-low-code/page1-6b05810f998af5f9e41e02fd
- Export: `appsmith/smart-campus-room-checker-lowcode.json` (Appsmith → Import → choose this file)
- The only script: `appsmith/Rules.js` (verbatim copy of the JS Object `Rules` from the editor)
- Parity test: `../tests/lowcodeParity.test.ts` runs `Rules.js` against `src/lib/contract.ts`
  for 1,818 inputs and checks that both return the same reasonCode and availability.

## Widgets (configured visually)

| Widget | Type | Configuration |
|---|---|---|
| Text1 | Text | title, fixed current time 09:00, bookings list |
| Input1 | Input (single-line text) | label "Start time (HH:MM)", default `10:30`, onTextChanged → `Rules.clear()` |
| Input2 | Input (number) | label "Duration (minutes)", default `60`, onTextChanged → `{{Rules.clear()}}` |
| Select1 | Select | options Open / Blocked, default `Open`, search off, onOptionChange → `{{Rules.clear()}}` |
| Button1 | Button | "Check availability", onClick → `{{Rules.check()}}` |
| Text2 | Text | `{{Rules.label()}}`; text colour bound to the result (green / red / amber) |
| Table1 | Table (read-only) | data `{{Rules.bookings}}`, id column hidden, no inline editing |
| Text3 | Text | `Checks run: N — bookings unchanged: yes/no` (compares with the snapshot taken by `Rules.init()` on page load) |

`Rules.init` is set to run **on page load**. No datasource, no query, no API, no secret,
no custom JS library (checked in the export: `datasourceList` = 0, `customJSLibList` = 0).

## Limitations (clearly labelled)

- The booking rules are written a second time in Appsmith JS; they are not shared with
  `src/lib/contract.ts` (kept equal only by the parity test).
- `Rules.runTests()` is a self-check inside the same object; the UI tests T1–T8 were run by
  hand in the deployed app (screenshots in `report/screenshots/`).
- In the editor preview the line "bookings unchanged" shows `no` until the page is reloaded,
  because `init()` runs only on page load; the deployed app shows `yes`.
- Versioning: Appsmith Git connect is not configured (free trial); history = this JSON export.
- The Appsmith trial ends after 15 days; afterwards the workspace may require a paid plan.
