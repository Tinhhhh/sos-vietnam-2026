# Fix Citizen Tracking Desktop Screenshot & Undefined Phone Actual Status

Title: Fix Citizen Tracking Desktop Screenshot & Undefined Phone
Date: 2026-10-14
Status: P0 Complete
Companion plan: `docs/plans/2026-10-14-fix-citizen-tracking-desktop-screenshot/2026-10-14-fix-citizen-tracking-desktop-screenshot-plan.md`
Companion evidence: `docs/plans/2026-10-14-fix-citizen-tracking-desktop-screenshot/2026-10-14-fix-citizen-tracking-desktop-screenshot-evidence.md`
Companion benchmark: `docs/plans/2026-10-14-fix-citizen-tracking-desktop-screenshot/2026-10-14-fix-citizen-tracking-desktop-screenshot-benchmark.md`

## Purpose

This file records the real current state before implementation.
User reported: "chụp Màn hình Giám sát Tiến độ Ứng cứu và Đàm thoại Đa phương tiện phía Người Dân trên Desktop, như ảnh trên do ảnh trên bị lỗi".
The uploaded image contains defects:
1. `SĐT: undefined (5p)` caused by accessing `incident.dispatchUnit.officerPhone` when undefined.
2. `Trụ sở cơ sở: Trụ sở đơn vị tiếp nhận` fallback instead of real address.
3. Call unit button partially cut off on right edge.
4. Yellow annotation arrow embedded directly in the document image (`rId18` in `SOS_VIETNAM_2026.docx`).

## Scope

Target scope:
- `js/app.js` and `sos-vietnam-2026-FE/public/js/app.js`: Guard officer phone and station address fallback strings.
- `index.html` & `css/style.css`: Ensure `.btn-call-unit` and `.unit-actions-row` have `white-space: nowrap; flex-shrink: 0`.
- `playwright/capture-citizen-tracking-desktop.cjs`: Reusable Playwright script to launch browser and capture flawless desktop screenshot.
- `Reports/qa/playwright/2026-10-14-citizen-tracking-desktop.json` & `.md`: Official QA evidence.
- `C:\Users\dienv\Desktop\Data4Life\01_DE_XUAT_GIAI_PHAP\SOS_VIETNAM_2026.docx`: Replace `rId18` (Hình 2.2h) with new clean screenshot.

## Current Status Matrix

| Unit / Target | Reality Classification | Evidence ID | Touch Mode | Downstream Plan Consequence |
| :--- | :--- | :--- | :--- | :--- |
| `js/app.js` line 3112 | bug-undefined-phone | E0-P0A-BUG1 | targeted-fix | Guard `officerPhone` with multiple fallbacks |
| `js/app.js` line 3122 | fallback-address-generic | E0-P0A-BUG2 | targeted-fix | Use real station address if available |
| `css/style.css` | button-wrap-risk | E0-P0A-STYLE1 | targeted-fix | Add `white-space: nowrap; flex-shrink: 0` |
| `SOS_VIETNAM_2026.docx` (p110) | has-corrupted-arrow-image | E0-P0A-DOC1 | image-replace | Replace `rId18` with verified desktop screenshot |
| Playwright Script | missing-dedicated-script | E0-P0A-PW1 | new-file | Create `capture-citizen-tracking-desktop.cjs` |

## Status Refresh Log

| Timestamp | Phase | Trigger | Changes | Next Action |
| :--- | :--- | :--- | :--- | :--- |
| 2026-10-14T14:48:00+07:00 | P0 | Baseline Audit | Classified root causes of undefined phone & document image defect | Proceed to P1 fixes |
| 2026-10-14T14:58:00+07:00 | P3 | Completion | Fixed phone/address in app.js, updated css, passed Playwright, replaced rId18 in docx & regenerated pdf | Commit and report |
