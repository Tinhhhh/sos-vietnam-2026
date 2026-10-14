# Plan: Apply Muse AI Accept Alert Patch (2026-10-14)

Title: Apply Muse AI Accept Alert Patch (Replace Blocking Alert with Non-blocking Toast)
Date: 2026-10-14
Status: Completed
Companion actual-status: `docs/plans/2026-10-14-apply-muse-ai-accept-alert-patch/actual-status.md`
Companion evidence: `docs/plans/2026-10-14-apply-muse-ai-accept-alert-patch/evidence.md`
Companion benchmark: `docs/plans/2026-10-14-apply-muse-ai-accept-alert-patch/benchmark.md`

---

## 1. Goal & Context

Apply the latest patch from Muse AI: `C:\Users\dienv\Desktop\Data4Life\muse ai\sos-vietnam-2026-fix-accept-alert-20261014.patch`.
- **Problem**: When a national command center account (`level: 'national'`, `username: 'admin'`, or `agency: 'chihuy'`) attempts to directly accept or update an incident, the dispatcher used a synchronous, blocking browser `alert(...)`. This modal alert dialog blocks the JavaScript event loop and freezes headless automated test runners (such as Playwright and CI/CD pipelines) waiting on UI interaction.
- **Solution**: Replace the blocking `alert(...)` calls in `js/dispatcher.js` (`handleAcceptIncident` and `handleUpdateStatus`) with the standard non-blocking `this.showToast?.(msg, 'warning')`.

---

## 2. Rules & Constraints

1. Keep temporary files strictly inside `.tmp/` within the repo. Never create temp files directly on `C:\`.
2. Do not clobber existing code (the patch also contained already-applied chunks for vehicle tracking and OSINT from earlier patches; only apply the authentic new alert fix).
3. Code first; tests should only be updated after behavior has been implemented in code.
4. Run full syntax check before validation (`node -c js/dispatcher.js`).
5. Validate UI behavior using a reusable Playwright test under `playwright/` and store official QA report under `Reports/qa/playwright/`.
6. Run change detection (`anvien detect-changes`) before git commit.
7. Commit and push to remote upon completion.

---

## 3. Phase Checklist

### P0: Patch Audit & Baseline Analysis
- [x] **P0-A**: Audit patch chunks against current codebase; isolate the authentic new accept alert fix from already-applied vehicle tracking / OSINT code.
  - *Goal*: Clarify exact lines to edit in `js/dispatcher.js`.
  - *Acceptance*: Verified patch delta documented in `actual-status.md`.

### P1: Implementation (Code First)
- [x] **P1-A**: Update `js/dispatcher.js` `handleAcceptIncident` to replace blocking `alert(...)` with `this.showToast?.(..., 'warning')`.
- [x] **P1-B**: Also modernize `handleUpdateStatus` in `js/dispatcher.js` to replace blocking `alert(...)` with `this.showToast?.(..., 'warning')` for consistency.
  - *Goal*: Eliminate blocking browser alert dialogs when national accounts interact with incidents.
  - *Acceptance*: Node syntax check passes (`node -c js/dispatcher.js`).

### P2: Verification & QA Testing
- [x] **P2-A**: Create/run Playwright automated test `playwright/verify-muse-ai-accept-alert.mjs` verifying:
  - Admin/National account attempting to accept an incident receives a non-blocking toast warning instead of a freezing browser alert dialog.
  - No dialog event triggered; UI remains responsive.
- [x] **P2-B**: Generate official QA report in `Reports/qa/playwright/` (both `.json` and `.md`).

### P3: Ledger Update, Change Detection & Git Commit
- [x] **P3-A**: Update plan ledgers (`actual-status.md`, `evidence.md`, `benchmark.md`, `plan.md`).
- [x] **P3-B**: Run Anvien `detect_changes`.
- [x] **P3-C**: Commit and push to git remote.
