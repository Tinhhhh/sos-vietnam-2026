# Hà Nội 417 Police Stations Directory & Multi-Facility Nearest Dispatch Plan

## Metadata
- Date: `2026-10-11`
- Status: `ready_for_implementation`
- Plan: `docs/plans/2026-10-11-hanoi-417-police-stations-directory/2026-10-11-hanoi-417-police-stations-directory-plan.md`
- Actual Status: `docs/plans/2026-10-11-hanoi-417-police-stations-directory/2026-10-11-hanoi-417-police-stations-directory-actual-status.md`
- Evidence: `docs/plans/2026-10-11-hanoi-417-police-stations-directory/2026-10-11-hanoi-417-police-stations-directory-evidence.md`
- Benchmark: `docs/plans/2026-10-11-hanoi-417-police-stations-directory/2026-10-11-hanoi-417-police-stations-directory-benchmark.md`

## Goal
Integrate all 417 official headquarters and citizen reception facilities of Công an TP Hà Nội from the official An ninh Thủ đô gazette into the system, enable accurate multi-facility mapping on the interactive map, and ensure that when a citizen signals SOS, the system accurately dispatches the nearest police facility in that jurisdiction.

## Rules
- Complete P0 actual status before implementation work.
- Update each checklist item immediately when completed.
- Record evidence and benchmark numbers as work progresses.
- Run Anvien analyze & detect-changes before committing.
- Reusable Playwright test under `playwright/`, write JSON and Markdown evidence to `Reports/qa/playwright/`.
- Maintain Anvien blast radius reporting.

## Scope
- `scripts/parse-hanoi-417-stations.mjs`: Parser to extract all 417 facilities from `content.md`, resolve Google Maps redirects to `(lat, lng)`, resolve post-merger wards from `vn-wards-simplified.geojson`, and generate `assets/hanoi-official-417-stations.json`.
- `assets/vn-stations-directory.json`: Merge the 417 official Hà Nội stations into the directory.
- `assets/agency-accounts.seed.json` & `.runtime-data/agency-accounts.json`: Update agency accounts for Hà Nội facilities.
- `server.js`:
  - Enhance `resolveJurisdiction` and `findNearestStations` so that when multiple facilities exist within a ward, the nearest facility to the citizen's incident coordinates is returned as primary, with all facilities listed as alternates.
- `js/map-controller.js` & `js/dispatcher.js`:
  - Render all facilities when a ward is highlighted/inspected.
  - Display facility metadata: `Trụ sở chính`, `Cơ sở 2/3/4/5`, phone numbers, and services offered.
  - In SOS dispatch flow, recommend and route to the nearest facility.
- `playwright/verify-hanoi-417-multi-facility-nearest.cjs`: E2E test verifying map rendering of multi-facility wards (e.g. Ba Đình, Bạch Mai, Cửa Nam) and nearest facility dispatch calculation.

## Acceptance Criteria
1. Exactly 417 official facilities extracted with 100% data fidelity: `Tên trụ sở`, `Địa chỉ`, `Số điện thoại`, `Thủ tục, hành chính giải quyết`, `Bản đồ (lat, lng)`.
2. All 417 facilities properly assigned to their respective Hà Nội wards in `assets/vn-wards-simplified.geojson`.
3. `assets/vn-stations-directory.json` successfully contains the official 417 Hà Nội facilities alongside other provinces.
4. When selecting a multi-facility ward in Hà Nội (e.g. `Phường Ba Đình` or `Phường Bạch Mai`), all facilities are rendered with proper markers and popups.
5. When a citizen triggers an SOS inside a ward with multiple facilities, the system selects and assigns the nearest facility (shortest Haversine distance) while identifying all facility options.
6. Playwright E2E tests pass 100%, generating JSON and Markdown reports in `Reports/qa/playwright/`.

## Checklist

- [x] P0-A: Complete actual status before implementation work.
- [x] P1: Extract 417 Hà Nội facilities, resolve Google Maps coordinates, match wards, and compile `assets/hanoi-official-417-stations.json`.
- [x] P2: Merge 417 facilities into `assets/vn-stations-directory.json` and sync `agency-accounts.seed.json` & server directories.
- [x] P3: Implement multi-facility nearest dispatch resolution in `server.js` and frontend map/dispatcher (`js/map-controller.js`, `js/dispatcher.js`).
- [x] P4: Playwright verification, evidence recording, Anvien change detection, and commit.
