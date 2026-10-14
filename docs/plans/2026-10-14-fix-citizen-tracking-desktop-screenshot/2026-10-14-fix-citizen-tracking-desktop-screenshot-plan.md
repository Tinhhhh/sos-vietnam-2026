# Fix Citizen Tracking Desktop Screenshot & Undefined Phone Plan

## Metadata

- Date: `2026-10-14`
- Status: `completed`
- Plan: `docs/plans/2026-10-14-fix-citizen-tracking-desktop-screenshot/2026-10-14-fix-citizen-tracking-desktop-screenshot-plan.md`
- Evidence: `docs/plans/2026-10-14-fix-citizen-tracking-desktop-screenshot/2026-10-14-fix-citizen-tracking-desktop-screenshot-evidence.md`
- Benchmark: `docs/plans/2026-10-14-fix-citizen-tracking-desktop-screenshot/2026-10-14-fix-citizen-tracking-desktop-screenshot-benchmark.md`
- Actual status: `docs/plans/2026-10-14-fix-citizen-tracking-desktop-screenshot/2026-10-14-fix-citizen-tracking-desktop-screenshot-actual-status.md`

## Goal

1. Fix the bug in `js/app.js` and `sos-vietnam-2026-FE/public/js/app.js` where `SĐT: undefined (5p)` was rendered on the Citizen Rescue Tracking Screen.
2. Ensure specific real station address is rendered instead of generic `Trụ sở đơn vị tiếp nhận`.
3. Fix button layout `.btn-call-unit` and `unit-actions-row` to prevent any text wrapping or edge clipping.
4. Run a Playwright automation script to generate a high-resolution, pixel-perfect desktop screenshot of the Citizen Rescue Progress and Multimedia Monitoring View.
5. Replace the corrupted image (with yellow arrow pointing to bug) in `SOS_VIETNAM_2026.docx` (Paragraph 110, `Hình 2.2h`) with the new clean screenshot.
6. Provide official QA reports and user-facing artifacts.

## Phase Checklist

### Phase 1: Code Fixes (Undefined Phone, Station Address, Button Styling)
- [x] **P1-A: Fix Phone and Address Resolution in `js/app.js` and FE public asset**
  - Goal: Ensure officer phone is never undefined and address displays actual police station address.
  - Work Steps:
    1. Update `js/app.js` lines 3110-3126 with robust fallback chain.
    2. Synchronize fix to `sos-vietnam-2026-FE/public/js/app.js`.
    3. Update `css/style.css` for `.btn-call-unit` with `white-space: nowrap; flex-shrink: 0`.
  - Implementation Gate: No `undefined` string can be produced under any dispatch state.
  - Acceptance: Code verified by unit test/inspection.

### Phase 2: Playwright Desktop Capture & Verification
- [x] **P2-A: Create and Run Playwright Script `capture-citizen-tracking-desktop.cjs`**
  - Goal: Launch Chromium on desktop viewport (1280x900), create/dispatch incident with Ninh Kiều or Ba Đình station, verify zero `undefined` in DOM, and capture `#sosTrackingView`.
  - Work Steps:
    1. Write reusable Playwright script in `playwright/capture-citizen-tracking-desktop.cjs`.
    2. Run test, saving screenshot to `Reports/qa/playwright/2026-10-14-citizen-tracking-desktop.png`.
    3. Verify DOM text has no "undefined".
    4. Save JSON and Markdown QA reports.
  - Implementation Gate: Server running on port 3000.
  - Acceptance: Test passes 100%, screenshot captured cleanly.

### Phase 3: Document Replacement & Reporting
- [x] **P3-A: Replace Image in `SOS_VIETNAM_2026.docx` & Export `SOS_VIETNAM_2026.pdf`**
  - Goal: Replace `rId18` in `SOS_VIETNAM_2026.docx` with the new screenshot and regenerate `SOS_VIETNAM_2026.pdf`.
  - Work Steps:
    1. Run python script to swap image blob of `rId18` with the new screenshot and update extent.
    2. Regenerate `SOS_VIETNAM_2026.pdf` via Word COM.
    3. Verify docx integrity and paragraph 111 image display.
    4. Copy screenshot to artifact directory and report to user.
  - Implementation Gate: P2-A screenshot exists.
  - Acceptance: Document updated without error.
