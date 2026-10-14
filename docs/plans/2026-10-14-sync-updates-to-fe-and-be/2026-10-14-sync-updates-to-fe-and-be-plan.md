# Synchronize Muse AI Updates to FE and BE Repositories Plan

## Metadata

- Date: `2026-10-14`
- Status: `complete`
- Plan: `docs/plans/2026-10-14-sync-updates-to-fe-and-be/2026-10-14-sync-updates-to-fe-and-be-plan.md`
- Evidence: `docs/plans/2026-10-14-sync-updates-to-fe-and-be/2026-10-14-sync-updates-to-fe-and-be-evidence.md`
- Benchmark: `docs/plans/2026-10-14-sync-updates-to-fe-and-be/2026-10-14-sync-updates-to-fe-and-be-benchmark.md`
- Actual status: `docs/plans/2026-10-14-sync-updates-to-fe-and-be/2026-10-14-sync-updates-to-fe-and-be-actual-status.md`

## Goal

Synchronize the latest updates and Muse AI patches (Real-time GeoIP OSINT, non-blocking toast incident acceptance, GPS vehicle movement trail, small-screen responsive fixes, and 3,717 rescue stations data) into the independent repositories:
1. `sos-vietnam-2026-FE` (React 19 + Vite) on branch `update-2026-10-13`.
2. `sos-vietnam-2026-BE` (Java 21 + Spring Boot) on branch `update-2026-10-13`.
Then validate builds, commit the changes with clear messages, and push both to GitHub.

## Rules

- Complete P0 actual status before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence as work completes.
- Record benchmarkable counts or measurements when they are taken.
- Code first; tests/builds verified after code is in place.
- Keep temporary directories strictly inside `.tmp/` within the repo. Never create files directly on `C:\`.
- Maintain Decree 30/2020/NĐ-CP formatting and administrative standard: 34 provinces, 2-tier local governance (Cấp Xã/Phường & Cấp Tỉnh/TP).

## Problem

The main Web Hosting repo (`sos_vietnam_2026_web_hosting`) received multiple critical updates:
1. Muse AI patch `sos-vietnam-2026-fix-vehicle-tracking-20261013.patch`: GPS breadcrumb vehicle trail, OSRM route dedup, ETA estimation.
2. Muse AI patch `sos-vietnam-2026-fix-osint-real-20261014.patch`: Real-time GeoIP lookup via `ip-api.com` with `#osintGeoIpDisplay` DOM element.
3. Muse AI patch `sos-vietnam-2026-fix-accept-alert-20261014.patch`: Replaced blocking `alert()` with non-blocking `showToast` notification when an officer accepts an incident.
4. Responsive polish for phones <=375px and <=480px.
5. Upgrade to 3,717 nationwide rescue stations across 34 provinces.

The separate Frontend (`sos-vietnam-2026-FE`) and Backend (`sos-vietnam-2026-BE`) repositories on branch `update-2026-10-13` did not have these October 14 enhancements.

## Scope

### Target Scope
- `sos-vietnam-2026-FE`:
  - `public/dispatcher.html`
  - `public/js/dispatcher.js`
  - `public/js/map-controller.js`
  - `public/js/app.js`
  - `public/css/tactical-responsive.css`
  - `src/features/incident-tracking/components/incident-tracking-view.jsx`
- `sos-vietnam-2026-BE`:
  - `src/main/resources/data/rescue_stations.json` (3,717 stations directory sync)
- Git commit & push on branch `update-2026-10-13` for both repositories.

### Out of Scope
- Architectural changes to PostgreSQL database schemas.
- Modifying authentication or security filter chains.

## Phase Checklist

### Phase 0: Baseline & Actual Status
- [x] **P0-A: Audit and Baseline Setup**
  - Goal: Audit differences between web_hosting, FE, and BE; establish baseline.
  - Work Steps:
    1. Inspect git status, branches, and diffs for both FE and BE.
    2. Check build readiness (`npm run build` and `mvnw.cmd compile`).
    3. Document findings in `actual-status.md`, `evidence.md`, and `benchmark.md`.
  - Implementation Gate: Diffs and build commands succeed.
  - Acceptance: Matrix filled and baseline verified.

### Phase 1: Frontend (`sos-vietnam-2026-FE`) Synchronization
- [x] **P1-A: Synchronize Public Static Assets (Dispatcher, OSINT GeoIP, Toast, Vehicle Trail)**
  - Goal: Update `public/dispatcher.html`, `public/js/dispatcher.js`, `public/js/map-controller.js`, `public/js/app.js`, and `public/css/tactical-responsive.css` in FE with the exact verified code from web_hosting.
  - Work Steps:
    1. Copy/sync `dispatcher.html` to `sos-vietnam-2026-FE/public/dispatcher.html`.
    2. Copy/sync `js/dispatcher.js` to `sos-vietnam-2026-FE/public/js/dispatcher.js`.
    3. Copy/sync `js/map-controller.js` to `sos-vietnam-2026-FE/public/js/map-controller.js`.
    4. Copy/sync `js/app.js` to `sos-vietnam-2026-FE/public/js/app.js`.
    5. Copy/sync `css/tactical-responsive.css` to `sos-vietnam-2026-FE/public/css/tactical-responsive.css`.
  - Implementation Gate: Source files exist and are verified in web_hosting.
  - Acceptance: Diffs between web_hosting and FE public assets are 0 for these files.

- [x] **P1-B: Update React Citizen Tracking Component with Vehicle Trail Support**
  - Goal: Enhance `incident-tracking-view.jsx` in `sos-vietnam-2026-FE` to listen for SSE `vehicle_pos` and display live vehicle movement trail.
  - Work Steps:
    1. Add SSE event listener for `vehicle_pos` to `incident-tracking-view.jsx`.
    2. Add dynamic vehicle marker / breadcrumb line to MapLibre map on `vehicle_pos` updates.
    3. Clean up vehicle resources when incident ends or unmounts.
  - Implementation Gate: P1-A assets synced.
  - Acceptance: React component compiles cleanly without syntax or lint errors.

- [x] **P1-C: Frontend Build & Git Commit / Push**
  - Goal: Verify `npm run build` passes, commit changes with semantic message, and push to `origin/update-2026-10-13`.
  - Work Steps:
    1. Run `npm run build` in `sos-vietnam-2026-FE`.
    2. Review `git status` and `git diff`.
    3. Commit changes to branch `update-2026-10-13`.
    4. Push to `https://github.com/Tinhhhh/sos-vietnam-2026-FE.git`.
  - Implementation Gate: `npm run build` exits 0.
  - Acceptance: Remote branch `update-2026-10-13` updated on GitHub.

### Phase 2: Backend (`sos-vietnam-2026-BE`) Synchronization
- [x] **P2-A: Upgrade Nationwide Rescue Stations Seed Data to 3,717 Stations**
  - Goal: Sync `assets/vn-stations-directory.json` (3,717 stations) to `sos-vietnam-2026-BE/src/main/resources/data/rescue_stations.json`.
  - Work Steps:
    1. Inspect formatting compatibility with `DataSeeder.java`.
    2. Copy/format `assets/vn-stations-directory.json` into `src/main/resources/data/rescue_stations.json`.
    3. Verify station count equals 3,717.
  - Implementation Gate: Schema matches `DataSeeder.java` expected JSON structure.
  - Acceptance: File contains 3,717 stations and valid JSON.

- [x] **P2-B: Backend Compile & Git Commit / Push**
  - Goal: Verify `mvnw.cmd compile` passes, commit changes with semantic message, and push to `origin/update-2026-10-13`.
  - Work Steps:
    1. Run `mvnw.cmd compile` in `sos-vietnam-2026-BE`.
    2. Review `git status` and `git diff`.
    3. Commit changes to branch `update-2026-10-13`.
    4. Push to `https://github.com/Tinhhhh/sos-vietnam-2026-BE.git`.
  - Implementation Gate: `mvnw.cmd compile` exits 0.
  - Acceptance: Remote branch `update-2026-10-13` updated on GitHub.

### Phase 3: Final Verification & Reporting
- [x] **P3-A: Final Verification and Summary**
  - Goal: Verify GitHub remotes for both FE and BE; record final evidence and benchmark numbers.
  - Work Steps:
    1. Check git logs and push status on both repositories.
    2. Update `evidence.md`, `benchmark.md`, and `actual-status.md`.
    3. Report concise, clear results to the user.
  - Implementation Gate: Both FE and BE pushed.
  - Acceptance: 100% complete.
