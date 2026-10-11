# Station Dedup And Post-Merger Audit Plan

## Metadata

- Date: `2026-10-11`
- Status: `completed`
- Plan: `docs/plans/2026-10-11-station-dedup-and-post-merger-audit/2026-10-11-station-dedup-and-post-merger-audit-plan.md`
- Evidence: `docs/plans/2026-10-11-station-dedup-and-post-merger-audit/2026-10-11-station-dedup-and-post-merger-audit-evidence.md`
- Benchmark: `docs/plans/2026-10-11-station-dedup-and-post-merger-audit/2026-10-11-station-dedup-and-post-merger-audit-benchmark.md`
- Actual status: `docs/plans/2026-10-11-station-dedup-and-post-merger-audit/2026-10-11-station-dedup-and-post-merger-audit-actual-status.md`

## Goal

Audit and clean up all police and emergency agency stations across Cần Thơ and all 34 provinces so that:
1. Abolished pre-merger wards (e.g. `Công An Phường An Cư`, `Công An Phường Thới Bình`, `Công An Phường Xuân Khánh` merged into `Phường Ninh Kiều`, `An Khánh`/`Hưng Lợi` merged into `Phường Tân An`, `An Hòa` merged into `Phường Cái Khế`, `Mỹ Khánh` merged into `Phường An Bình`, `Trà Nóc` merged into `Phường Thới An Đông`, `Lê Bình` merged into `Phường Cái Răng`) and fake placeholder units (`Công An Khu Vực Sở Tại`) are completely removed from `vn-stations-directory.json` and `agency-accounts`.
2. Duplicate station entries (`st-hcm-ca-*` vs `st-hcm_ca_*`, `st-hn-ca-*` vs `st-hn_ca_*`, `st-csgt` vs `st-ct-csgt-pc08`, `st-cuuho` vs `st-ct-pccc-pc07`) and misplaced provincial headquarters (`st-congan` at generic `10.033333, 105.783333` instead of `Số 9A Trần Phú, Phường Cái Khế` at `10.045250, 105.781820`) are deduplicated and normalized so every post-merger ward has strictly 1 official grass-roots police station.
3. When a user selects a specific ward on the map (`highlightWardBoundary` / `showWardStationPin`), the map filters out overlapping/duplicate markers and clearly displays only valid, existing stations without ghost pins.

## Rules

- Complete P0 actual status before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence as work completes.
- Record benchmarkable counts or measurements when they are taken.
- Update later phase status assumptions, next actions, and work steps when actual-status evidence changes the repo state.
- After completing a phase or implementation slice and refreshing `actual-status.md`, update the next affected phase's work steps as needed to match the latest repo reality, while preserving that phase's original goal, scope, acceptance criteria, and major phase order.
- Run Anvien detect-changes before every implementation-slice commit when implementation work was performed.
- For public runtime or UI-facing changes, validate the real user-visible runtime with browser or Playwright evidence.
- Keep the standard planner structure.

## Problem

When the user selected `Phường Ninh Kiều (Cần Thơ)` on the map (`media_1791702140832_4e032b31.png`), 6–7 police pins appeared simultaneously inside the purple boundary of `Phường Ninh Kiều`:
1. `Công An Phường Ninh Kiều` (`Số 72, đường Phan Đình Phùng, phường Ninh Kiều, thành phố Cần Thơ`, `lat: 10.030506, lng: 105.786384`) — the ONLY official post-merger ward police headquarters for Phường Ninh Kiều (`sap_nhap: "Tân An, Thới Bình, Xuân Khánh"`).
2. `Công An Phường An Cư` (`st-capancuct`) — abolished pre-merger ward (merged into Phường Ninh Kiều).
3. `Công An Phường Thới Bình` (`st-capthoibinhct`) — abolished pre-merger ward (merged into Phường Ninh Kiều).
4. `Công An Phường Xuân Khánh` (`st-capxuankhanhct`) — abolished pre-merger ward (merged into Phường Ninh Kiều).
5. `Công An Khu Vực Sở Tại` (`st-caxkhuvucsotaica`, `ward: "Khu Vực Sở Tại"`, `lat: 10.034, lng: 105.78`) — a fake/test placeholder entry sitting in the middle of Phường Ninh Kiều.
6. `Công an TP Cần Thơ` (`st-congan`) and `Trực ban Cảnh sát giao thông — Công an TP Cần Thơ` (`st-csgt`), both plotted at identical generic coordinates `10.033333, 105.783333` inside Phường Ninh Kiều, even though `Số 9A Trần Phú, phường Cái Khế` is located at `10.045250, 105.781820` in Phường Cái Khế and PC08 is already represented by `st-ct-csgt-pc08` (`10.0475, 105.7835`).
7. Across the nationwide `assets/vn-stations-directory.json`, there were also 203 duplicate `(province, ward, agency)` station entries (mostly `st-hcm-ca-*` + `st-hcm_ca_*` and `st-hn-ca-*` + `st-hn_ca_*`) and 23 Quảng Trị entries where `s.ward` retained the `"CAX "` / `"CAP "` prefix instead of the canonical `"Xã "` / `"Phường "` prefix.

## Scope

- `assets/vn-stations-directory.json`, `assets/agency-accounts.seed.json`, `.runtime-data/agency-accounts.json`
- `server.js` (`syncAllDirectoriesFromAgencyAccounts`)
- `js/map-controller.js` (`updateVisibleStationPins`, `showWardStationPin`, `highlightWardBoundary`, `clearWardBoundary`)
- `js/dispatcher.js` (`showWardHud`)
- `scripts/clean-abolished-and-duplicate-stations.mjs`
- `playwright/verify-ninh-kieu-station-dedup.cjs`

## Non-Goals

- Changing post-merger polygon boundaries in `assets/vn-wards-simplified.geojson`.
- Modifying unrelated SOS reporting or dispatch features.

## Requirements

1. Zero abolished pre-merger wards or fake placeholder stations (`Khu Vực Sở Tại`) in `assets/vn-stations-directory.json`, `assets/agency-accounts.seed.json`, and `.runtime-data/agency-accounts.json`.
2. Zero duplicate `(province, ward, agency)` ward-level police stations across all 34 provinces in `assets/vn-stations-directory.json` (1 ward = 1 official post-merger Công an xã/phường/đặc khu, plus the 2 official KCN police posts in Cần Thơ).
3. Provincial headquarters in Cần Thơ (`Công an TP Cần Thơ`, `PC08`, `PC07`) deduplicated (`st-csgt` merged with `st-ct-csgt-pc08`, `st-cuuho` merged with `st-ct-pccc-pc07`) and positioned at their true coordinates in Phường Cái Khế (`10.045250, 105.781820` and `10.0475, 105.7835`) instead of generic `10.033333, 105.783333` inside Phường Ninh Kiều.
4. When a ward is selected on the map (`this.currentWardBoundary`), `updateVisibleStationPins()` and `showWardStationPin()` must not render duplicate overlapping markers for the selected ward, and only valid stations are displayed.

## Acceptance Criteria

- Selecting `Phường Ninh Kiều` (`Cần Thơ`) on the map displays `Công An Phường Ninh Kiều` (`Số 72, đường Phan Đình Phùng, phường Ninh Kiều, thành phố Cần Thơ`, `02923820938`, `Thượng tá Phạm Hiền Tài`) and zero abolished pre-merger or fake pins (`An Cư`, `Thới Bình`, `Xuân Khánh`, `Khu Vực Sở Tại`, or misplaced `10.033333, 105.783333` pins).
- Nationwide audit confirms 0 duplicate `(province, ward, agency)` ward police stations.
- Playwright verification script passes all assertions and writes `.json` and `.md` QA reports to `Reports/qa/playwright/`.

## Checklist

- [x] P0-A: Complete actual status before implementation work.
  - Goal: establish the real current state of station directories, agency accounts, server sync logic, and map pin rendering.
  - Work Steps: inspect `assets/vn-stations-directory.json`, `assets/cantho-official-105-stations.json`, `assets/vn-wards-simplified.geojson`, `assets/agency-accounts.seed.json`, `server.js`, and `js/map-controller.js`; run Anvien `file-detail` and `impact`; record findings in `actual-status.md`, `evidence.md`, and `benchmark.md`.
  - Implementation Gate: no implementation or editing starts until `2026-10-11-station-dedup-and-post-merger-audit-actual-status.md` has a final P0 decision.
  - Acceptance: actual status identifies all 10 abolished/fake Cần Thơ stations, 203 duplicate ward stations across 34 provinces, 3 misplaced/duplicate provincial entries in Cần Thơ, 23 Quảng Trị ward prefix mismatches, and map marker overlap behavior.

### P1: Nationwide Station & Account Deduplication and Post-Merger Cleanup

- Phase Goal: Remove all abolished pre-merger wards, fake test stations, and duplicate station entries from `assets/vn-stations-directory.json`, `assets/agency-accounts.seed.json`, `.runtime-data/agency-accounts.json`, and `server.js`.
- Phase Boundary:
  - In scope: `scripts/clean-abolished-and-duplicate-stations.mjs`, `assets/vn-stations-directory.json`, `assets/agency-accounts.seed.json`, `.runtime-data/agency-accounts.json`, `server.js`.
  - Out of scope: Frontend map rendering (`js/map-controller.js`, handled in `P2-A`).
  - Dependencies: `P0-A`.
- Phase Implementation Rule: Implement `P1-A`, verify data invariants, record evidence, refresh actual-status, commit, then continue to `P2-A`.
- Ordered Slice List:
  - P1-A: Clean abolished pre-merger stations, deduplicate nationwide directory & accounts, and harden `syncAllDirectoriesFromAgencyAccounts` in `server.js`.

- [x] P1-A: Clean abolished pre-merger stations, deduplicate nationwide directory & accounts, and harden `syncAllDirectoriesFromAgencyAccounts` in `server.js`
  - Goal: Ensure every post-merger ward across all 34 provinces has strictly 1 official grass-roots police station, zero abolished pre-merger wards or fake test units exist, and provincial headquarters in Cần Thơ have accurate non-overlapping coordinates.
  - Scope Boundary:
    - Editable: `scripts/clean-abolished-and-duplicate-stations.mjs`, `assets/vn-stations-directory.json`, `assets/agency-accounts.seed.json`, `.runtime-data/agency-accounts.json`, `server.js`
    - Inspect-only: `assets/cantho-official-105-stations.json`, `assets/vn-wards-simplified.geojson`
    - Preserve-only: `assets/ward-Suggested.json`
    - Out of scope: `js/map-controller.js`
  - Pre-flight Questions:
    - Why did `vn-stations-directory.json` have 3,544 entries instead of ~3,332? Because of 10 abolished/fake Cần Thơ ward accounts, 203 duplicate `st-hcm-ca-*`/`st-hcm_ca_*` and `st-hn-ca-*`/`st-hn_ca_*` entries, and duplicate provincial entries (`st-csgt`, `st-cuuho`).
  - Work Steps:
    1. Create and run `scripts/clean-abolished-and-duplicate-stations.mjs` to:
       - Remove the 10 abolished/fake Cần Thơ entries (`caxkhuvucsotaica`, `capancuct`, `capthoibinhct`, `capxuankhanhct`, `capankhanhct`, `caphungloict`, `capanhoact`, `caxmykhanhct`, `captranocct`, `caplebinhct`) from `agency-accounts.seed.json`, `.runtime-data/agency-accounts.json`, and `vn-stations-directory.json`.
       - Normalize Quảng Trị `s.ward` values (`CAX ` -> `Xã `, `CAP ` -> `Phường `, `CADK ` -> `Đặc khu `, strip ` - Cơ sở 1`) so they match `vn-wards-simplified.geojson`.
       - Deduplicate all `(province, ward, agency)` ward stations in `vn-stations-directory.json`, preferring canonical entries linked to active `agencyAccounts` and merging `accountId` / coordinates / phone / headName / address.
       - Fix `congan` (`st-congan`) in Cần Thơ to `level: "province"`, `ward: "Phường Cái Khế"`, `lat: 10.045250, lng: 105.781820` (`Số 9A Trần Phú, phường Cái Khế, TP Cần Thơ`), and merge duplicate `st-csgt` into `st-ct-csgt-pc08` (`lat: 10.0475, lng: 105.7835`) and `st-cuuho` into `st-ct-pccc-pc07` (`lat: 10.038, lng: 105.781`).
    2. Update `syncAllDirectoriesFromAgencyAccounts()` in `server.js` so it normalizes ward names when matching existing stations in `vn-stations-directory.json` (preventing hyphen vs underscore ID duplication) and skips creating duplicate stations for provincial accounts that already map to `st-ct-csgt-pc08` or `st-ct-pccc-pc07`.
  - Implementation Gate: `P0-A` complete and Anvien impact analysis recorded for `syncAllDirectoriesFromAgencyAccounts`.
  - Acceptance: `vn-stations-directory.json` has 0 abolished/fake wards, 0 duplicate `(province, ward, agency)` ward stations, Cần Thơ has 103 official post-merger wards + 2 KCN stations = 105 grass-roots police stations, and `node --check server.js` passes.
  - Evidence Targets: `E1-P1A-CLEAN1`, `E1-P1A-DETECT1`
  - Actual-status Update: Transition `assets/vn-stations-directory.json`, `assets/agency-accounts.seed.json`, and `server.js` to `correct`.
  - Commit Boundary: Commit after `P1-A` verification and `anvien detect-changes`.

### P2: Map Pin De-cluttering On Ward Selection & Live Playwright Verification

- Phase Goal: Prevent duplicate or unrelated ward police pins from cluttering a selected ward on the map and verify the live runtime with Playwright.
- Phase Boundary:
  - In scope: `js/map-controller.js`, `js/dispatcher.js`, `playwright/verify-ninh-kieu-station-dedup.cjs`, `Reports/qa/playwright/`
  - Out of scope: Backend routes.
  - Dependencies: `P1-A`.
- Phase Implementation Rule: Single slice `P2-A` because map pin filtering and live browser verification of that exact map view are tightly coupled.
- Ordered Slice List:
  - P2-A: Filter duplicate/unrelated ward pins during ward boundary selection in `js/map-controller.js` and verify via Playwright.

- [x] P2-A: Filter duplicate/unrelated ward pins during ward boundary selection in `js/map-controller.js` and verify via Playwright
  - Goal: When a user selects a specific ward on the map (`highlightWardBoundary`), ensure `updateVisibleStationPins()` does not render a duplicate marker on top of `activeWardStationMarker` or clutter the selected ward with neighboring wards' grass-roots pins, and verify with Playwright on `http://localhost:3000`.
  - Scope Boundary:
    - Editable: `js/map-controller.js`, `js/dispatcher.js`, `playwright/verify-ninh-kieu-station-dedup.cjs`, `Reports/qa/playwright/2026-10-11-station-dedup-verification.json`, `Reports/qa/playwright/2026-10-11-station-dedup-verification.md`
    - Inspect-only: `server.js`
    - Preserve-only: `assets/vn-stations-directory.json`
    - Out of scope: Unrelated UI modals.
  - Pre-flight Questions:
    - Why did `Phường Ninh Kiều` show two overlapping markers for `Công An Phường Ninh Kiều` plus neighboring pins? Because `showWardStationPin` creates `this.activeWardStationMarker` while `updateVisibleStationPins` also renders `st-can_tho-ninh_kieu` in `this.activeStationMarkersMap`.
  - Work Steps:
    1. In `js/map-controller.js` (`updateVisibleStationPins`, `highlightWardBoundary`, `clearWardBoundary`), when a specific ward boundary is selected (`this.currentWardBoundary` / `this.selectedWardKey`), skip rendering the duplicate grass-roots marker in `this.activeStationMarkersMap` for the ward already highlighted by `this.activeWardStationMarker`.
    2. In `js/map-controller.js` and `js/dispatcher.js`, prioritize grassroots ward police stations (`isWardPolice(s)`) so that selecting a ward selects `Công An Phường Ninh Kiều` (`Số 72, đường Phan Đình Phùng`, `Thượng tá Phạm Hiền Tài`) instead of provincial PC07 or medical units.
    3. Restart the server (`npm start`), run `node playwright/verify-ninh-kieu-station-dedup.cjs`, verify that selecting `Phường Ninh Kiều` in Cần Thơ shows `Công An Phường Ninh Kiều` (`Số 72, đường Phan Đình Phùng, phường Ninh Kiều, thành phố Cần Thơ`) with zero abolished/fake pins, and save `.json` + `.md` QA reports in `Reports/qa/playwright/`.
  - Implementation Gate: `P1-A` committed and `anvien impact` run on `updateVisibleStationPins` and `highlightWardBoundary`.
  - Acceptance: Playwright script passes 100% of assertions against `http://localhost:3000` and QA report + screenshot are recorded.
  - Evidence Targets: `E2-P2A-PW1`, `E2-P2A-DETECT1`
  - Actual-status Update: Transition `js/map-controller.js` and `js/dispatcher.js` to `correct`.
  - Commit Boundary: Commit and push to `origin/main`.
