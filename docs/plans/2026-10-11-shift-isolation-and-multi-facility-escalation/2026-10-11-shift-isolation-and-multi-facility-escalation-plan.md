# Plan

## Metadata
- Title: `Shift Isolation, Non-Operational Data Cleansing, Multi-Facility GIS & 15-Minute City HQ Escalation`
- Date: `2026-10-11`
- Status: `completed`
- Plan: `docs/plans/2026-10-11-shift-isolation-and-multi-facility-escalation/2026-10-11-shift-isolation-and-multi-facility-escalation-plan.md`
- Actual Status: `docs/plans/2026-10-11-shift-isolation-and-multi-facility-escalation/2026-10-11-shift-isolation-and-multi-facility-escalation-actual-status.md`
- Evidence: `docs/plans/2026-10-11-shift-isolation-and-multi-facility-escalation/2026-10-11-shift-isolation-and-multi-facility-escalation-evidence.md`
- Benchmark: `docs/plans/2026-10-11-shift-isolation-and-multi-facility-escalation/2026-10-11-shift-isolation-and-multi-facility-escalation-benchmark.md`

## Goal
Resolve the unauthenticated shift expiry alert bug by scoping duty shifts strictly per authenticated officer/unit, purge non-operational entities (museum, newspaper, hospital, rest homes, enterprises) from the grassroots SOS station directory, enhance multi-facility ward map & drawer display with `[Cơ sở gần nhất]` badge and Haversine distance, and implement cross-ward nearest radius dispatch for specialized squads (PCCC & CSGT) with a 15-minute countdown timer and manual `Chuyển cấp Thành phố` escalation button.

## Rules
- Complete P0 actual status before implementation work.
- Run Anvien `file-detail` + `impact` before editing symbols/files.
- Update each checklist item immediately upon completion.
- Code first; run Playwright E2E verification after implementation.
- Run `anvien detect-changes` before committing.

## Scope
- `js/dispatcher.js`, `dispatcher.html`, `server.js`: Shift isolation, gatekeeping, CSS modal hiding, scoped `/api/dispatcher/duty-shift`.
- `assets/hanoi-official-417-stations.json`, `assets/vn-stations-directory.json`, `assets/agency-accounts.seed.json`, `assets/agency-accounts.json`, `.runtime-data/agency-accounts.json`, `scripts/parse-hanoi-417-stations.mjs`, `scripts/merge-hanoi-directory.mjs`: Remove non-operational entities, decode `&amp;`, tag PCCC/CSGT squads, sync ANTD official link.
- `js/map-controller.js`, `js/dispatcher.js`, `dispatcher.html`: Multi-facility popup & drawer with `[Cơ sở gần nhất]` badge, distance in `km`, and administrative services.
- `server.js`, `js/dispatcher.js`, `dispatcher.html`: Cross-ward radius routing for PCCC/CSGT squads, 15-minute countdown badge, and `POST /api/dispatcher/escalate` (`Chuyển cấp Thành phố`).
- `playwright/test-shift-isolation-gatekeeping.cjs`, `playwright/verify-hanoi-417-multi-facility-nearest.cjs`: Comprehensive E2E verification suites.

## Acceptance Criteria
1. Visiting `dispatcher.html` unauthenticated triggers zero alert dialogs and hides `#dutyShiftModal` / `#substituteOfficerModal`.
2. Duty shifts are saved and restored exclusively under `sos_duty_shift_${username}` and isolated per unit on both client and server.
3. Zero occurrences of `Bảo tàng Công an Hà Nội`, `Báo An ninh Thủ đô`, `Bệnh viện CATP Hà Nội`, or `Nhà nghỉ dưỡng Suối Hai` in SOS station directories or `/api/geocode/suggest`.
4. Clicking a multi-facility ward displays all facilities on the map and in the drawer with `[Cơ sở gần nhất]` badge and Haversine distance (`km`).
5. Specialized PCCC and CSGT incidents route to the nearest regional squad by geographic radius across the city, while displaying a 15-minute countdown and `Chuyển cấp Thành phố` escalation button to escalate to City HQ.
6. All Playwright E2E tests pass 100%.

## Phase Checklist

- [x] **P0-A: Baseline Actual Status & Anvien Impact Analysis**
  - Goal: Record baseline state of R1–R5 in `actual-status.md` and run Anvien `file-detail` + `impact` on target files.
  - Work Steps: Inspect `js/dispatcher.js`, `dispatcher.html`, `js/map-controller.js`, `server.js`, and dataset files; record blast radius.
  - Implementation Gate: Graph refreshed via `anvien analyze --force`.
  - Acceptance: `actual-status.md` populated and Anvien impact recorded.

- [x] **P1-A: Duty Shift Isolation & Unauthenticated Gatekeeping (R1)**
  - Goal: Prevent unauthenticated shift alerts and isolate duty shifts per unit on client and server.
  - Work Steps:
    1. Hide `#dutyShiftModal` and `#substituteOfficerModal` in `dispatcher.html` under `body:not(.officer-authenticated)`.
    2. Guard `updateClock()`, `restoreDutyShift()`, `openDutyShiftModal()`, and `openSubstituteModal()` in `js/dispatcher.js` with `this.currentOfficer` check.
    3. Remove global `sos_duty_shift` and `SOS_ACTIVE_DUTY_SHIFT` reads/writes; use `sos_duty_shift_${username.toLowerCase()}` exclusively; clear state on logout.
    4. Scope `/api/dispatcher/duty-shift` GET/POST and SSE `duty_shift_update` by `username` in `server.js`.
  - Implementation Gate: P0-A complete.
  - Acceptance: Unauthenticated visit shows 0 alerts; Unit A and Unit B shifts are completely isolated.

- [x] **P2-A: Non-Operational Data Cleansing & 417 Hanoi Dataset Sync (R2, R5)**
  - Goal: Purge non-operational entities, decode `&amp;` HTML entities, preserve ANTD source URL, and classify specialized PCCC/CSGT squads vs City HQs.
  - Work Steps:
    1. Sanitize `assets/hanoi-official-417-stations.json`, `assets/vn-stations-directory.json`, `assets/agency-accounts.seed.json`, `assets/agency-accounts.json`, and `.runtime-data/agency-accounts.json`.
    2. Update `scripts/parse-hanoi-417-stations.mjs` and `scripts/merge-hanoi-directory.mjs` with non-operational exclusion filters and HTML entity decoding.
    3. Add defensive filtering in `server.js` for station loading and `/api/geocode/suggest`.
  - Implementation Gate: P1-A complete.
  - Acceptance: Zero non-operational leaks in JSON files and live API responses; 0 `&amp;` strings remaining.

- [x] **P3-A: Multi-Facility GIS Display, Drawer & Nearest Routing (R3)**
  - Goal: Render all facilities of a ward on the map and in `#activeIncidentDrawer` with Haversine distance (`km`), services, and `[Cơ sở gần nhất]` badge.
  - Work Steps:
    1. Update `js/map-controller.js` (`showWardStationPin` and `createPoliceStationPopupHtml`) to calculate Haversine distance from active incident/user location and display `[Cơ sở gần nhất]`, distance `km`, role, and procedures for all facilities in the ward.
    2. Update `dispatcher.html` and `js/dispatcher.js` (`renderActiveIncidentDrawer`) to render the full `wardFacilities` list with `[Cơ sở gần nhất]` badge and click-to-focus on map.
  - Implementation Gate: P2-A complete.
  - Acceptance: Multi-facility wards display all pins, distances, and `[Cơ sở gần nhất]` badge in both map popup and incident drawer.

- [x] **P4-A: Specialized Squad Radius Dispatch & 15-Minute Escalation Engine (R4)**
  - Goal: Route PCCC & CSGT incidents to nearest regional squad by Haversine radius across the city, display a 15-minute countdown timer, and provide manual `Chuyển cấp Thành phố` escalation to City HQ.
  - Work Steps:
    1. Update `createJurisdictionHierarchy()` in `server.js` to route `fire` and `csgt` incidents (and specialized squads) to the nearest regional squad by Haversine radius across the city while setting City HQ (`Trụ sở chính`) as the escalation target.
    2. Add `POST /api/dispatcher/escalate` in `server.js` to escalate an incident to City HQ (`currentLevel = 'province'`, `escalationStatus = 'ESCALATED_CITY_HQ'`).
    3. Add live 15-minute countdown timer and `Chuyển cấp Thành phố` (`#btnEscalateCityHq`) button in `dispatcher.html` and `js/dispatcher.js`.
  - Implementation Gate: P3-A complete.
  - Acceptance: Fire/CSGT incidents route to nearest squad by radius; 15-minute timer counts down and `Chuyển cấp Thành phố` escalates incident to City HQ.

- [x] **P5-A: Full Playwright E2E Verification, Evidence Ledger & Git Commit**
  - Goal: Validate all R1–R5 acceptance criteria with automated Playwright tests, update existing regression tests, record evidence/benchmarks, run `anvien detect-changes`, and commit.
  - Work Steps:
    1. Run `playwright/test-shift-isolation-gatekeeping.cjs`, `playwright/verify-hanoi-417-multi-facility-nearest.cjs`, and comprehensive E2E test suite.
    2. Record outputs in `evidence.md`, `benchmark.md`, and `actual-status.md`.
    3. Run `anvien detect-changes` and commit implementation.
  - Implementation Gate: P4-A complete.
  - Acceptance: 100% Playwright tests pass with zero console/runtime errors.
