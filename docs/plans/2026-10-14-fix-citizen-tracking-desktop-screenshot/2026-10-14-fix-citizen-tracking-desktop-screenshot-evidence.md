# Fix Citizen Tracking Desktop Screenshot & Undefined Phone Evidence Ledger

## Metadata

- Date: `2026-10-14`
- Plan: `docs/plans/2026-10-14-fix-citizen-tracking-desktop-screenshot/2026-10-14-fix-citizen-tracking-desktop-screenshot-plan.md`
- Evidence: `docs/plans/2026-10-14-fix-citizen-tracking-desktop-screenshot/2026-10-14-fix-citizen-tracking-desktop-screenshot-evidence.md`
- Benchmark: `docs/plans/2026-10-14-fix-citizen-tracking-desktop-screenshot/2026-10-14-fix-citizen-tracking-desktop-screenshot-benchmark.md`
- Actual status: `docs/plans/2026-10-14-fix-citizen-tracking-desktop-screenshot/2026-10-14-fix-citizen-tracking-desktop-screenshot-actual-status.md`

## E0 - Baseline Evidence

- `E0-P0A-BUG1`: Inspection of `js/app.js` line 3112 showed string interpolation of `incident.dispatchUnit.officerPhone` without checking if it is undefined or null, yielding literal `SĐT: undefined (5p)` on screen.
- `E0-P0A-BUG2`: `unitStationAddress` in `js/app.js` fell back to `Trụ sở đơn vị tiếp nhận` instead of resolving the actual address of the police station (`assigned.address || assigned.stationAddress`).
- `E0-P0A-STYLE1`: Button `btn-call-unit` lacked `white-space: nowrap` and `flex-shrink: 0`, risking clipping on narrow desktop cards.
- `E0-P0A-DOC1`: Extracted image `rId18` from `SOS_VIETNAM_2026.docx` confirmed presence of a yellow drawn arrow pointing at `SĐT: undefined (5p)`.
- `E0-P0A-PW1`: No existing Playwright script specifically targeted capturing the desktop citizen tracking view with a live dispatch incident.

## E1 - Implementation & Validation Evidence

- `E1-P1A-FIX`: Updated `js/app.js` and `sos-vietnam-2026-FE/public/js/app.js` with defensive phone resolution chain checking against string `'undefined'`, `'null'`, and missing attributes. Resolved real address `Số 02 Nguyễn Trãi, Phường Tân An, Q. Ninh Kiều, TP. Cần Thơ`.
- `E1-P1B-CSS`: Added `white-space: nowrap; flex-shrink: 0; display: inline-flex;` to `.btn-call-unit` and `flex-wrap: nowrap` to `.unit-actions-row`.
- `E1-P2A-PW`: Executed `playwright/capture-citizen-tracking-desktop.cjs`. 6/6 assertions passed. Saved evidence to `Reports/qa/playwright/2026-10-14-citizen-tracking-desktop.json`, `.md`, and `.png`.
- `E1-P3A-DOCX`: Replaced `rId18` (image10.png) in `SOS_VIETNAM_2026.docx` with new clean 1656x2308 screenshot. Adjusted extent proportionally to cx=4600000, cy=6411111. Verified docx integrity (357 paragraphs).
- `E1-P3B-PDF`: Regenerated `SOS_VIETNAM_2026.pdf` using Word COM automation. Verified clean generation.
