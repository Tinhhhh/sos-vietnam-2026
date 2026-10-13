# Plan: Apply Muse AI Real GPS Vehicle Tracking & Movement Trail Patch

Title: Apply Muse AI Real GPS Vehicle Tracking & Movement Trail Patch
Date: 2026-10-13
Status: Completed
Companion actual-status: `docs/plans/2026-10-13-apply-muse-ai-vehicle-tracking-patch/2026-10-13-apply-muse-ai-vehicle-tracking-patch-actual-status.md`
Companion evidence: `docs/plans/2026-10-13-apply-muse-ai-vehicle-tracking-patch/2026-10-13-apply-muse-ai-vehicle-tracking-patch-evidence.md`
Companion benchmark: `docs/plans/2026-10-13-apply-muse-ai-vehicle-tracking-patch/2026-10-13-apply-muse-ai-vehicle-tracking-patch-benchmark.md`

---

## 1. Goal

Integrate the official patch `sos-vietnam-2026-fix-vehicle-tracking-20261013.patch` from `C:\Users\dienv\Desktop\Data4Life\muse ai`:
1. Replace fake vehicle simulation with real GPS tracking (`startRealVehicleTracking`) using `navigator.geolocation.watchPosition` when an officer responds to an incident, streaming throttled positions to `/api/dispatcher/update-vehicle`.
2. Provide a 20-second automatic fallback to simulation if hardware GPS is unavailable or denied, ensuring test and demo compatibility.
3. Record vehicle movement trail (breadcrumb path) capped at 200 points on `server.js` and render as a dynamic dashed cyan line (`#38bdf8`, line-width 4, dashed `[2, 1.5]`) via `MapController.addVehicleTrailPoint` on both Dispatcher and Citizen map interfaces.
4. Stop vehicle tracking and clean up watchers when the incident status changes to `arrived` or `resolved`.

---

## 2. Rules & Constraints

1. Keep temporary files strictly inside `.tmp/` within the working repository. Never create temp files directly on `C:\`.
2. Maintain documentation integrity.
3. Preserve all existing docstrings and comments.
4. Execute syntax validation and Playwright verification.

---

## 3. Scope & Boundaries

- **In Scope**:
  - `sos_vietnam_2026_web_hosting`:
    - `js/app.js`: Draw vehicle movement trail from incoming SSE `vehicle_pos` events.
    - `js/map-controller.js`: Implement `addVehicleTrailPoint` and `clearVehicleTrail`.
    - `js/dispatcher.js`: Implement `startRealVehicleTracking` and `stopVehicleTracking`.
    - `server.js`: Maintain `incident.vehicleTrail` and broadcast in `vehicle_pos`.
- **Out of Scope**:
  - React FE modifications (React FE uses standard incident tracking view).

---

## 4. Phase Checklist

### P0: Actual Status Baseline Classification
- [x] **P0-A**: Inspect vehicle tracking patch, check `git apply --check --include="js/*"`, verify Anvien freshness, and populate `actual-status.md`.
  - *Goal*: Confirm baseline before applying changes.
  - *Work Steps*: Test patch against working tree and establish matrix rows.
  - *Implementation Gate*: `git apply --check --include="js/*"` succeeds.
  - *Acceptance*: `actual-status.md` populated.

### P1: Apply Vehicle Tracking Patch
- [x] **P1-A**: Apply JS files from patch (`js/app.js`, `js/dispatcher.js`, `js/map-controller.js`) and update `server.js` `/api/dispatcher/update-vehicle`.
  - *Goal*: Wire real GPS tracking, trail rendering, and server-side trail persistence.
  - *Work Steps*: Run `git apply --include="js/*"` and update `server.js`.
  - *Implementation Gate*: `node -c server.js` and ES module syntax checks pass.
  - *Acceptance*: All 4 files updated with 0 errors.

### P2: Verification, Evidence Recording, & Git Commit
- [x] **P2-A**: Restart server process, execute Playwright test suite for vehicle tracking trail and API, run Anvien change detection, and commit/push.
  - *Goal*: Verify live trail functionality and clean git state.
  - *Work Steps*:
    1. Restart `node server.js`.
    2. Run Playwright script to verify `MapController.addVehicleTrailPoint` and `/api/dispatcher/update-vehicle` trail response.
    3. Run `anvien detect-changes --repo sos-vietnam-2026 --scope all`.
    4. Commit and push changes.
  - *Implementation Gate*: Playwright tests pass (7/7 100% pass rate).
  - *Acceptance*: Evidence ledger completed and committed to git.
