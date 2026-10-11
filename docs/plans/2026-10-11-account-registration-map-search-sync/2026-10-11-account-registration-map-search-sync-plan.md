# Account Registration & Map Location Search Synchronization Plan

## Metadata

- Date: `2026-10-11`
- Status: `completed`
- Plan: `docs/plans/2026-10-11-account-registration-map-search-sync/2026-10-11-account-registration-map-search-sync-plan.md`
- Evidence: `docs/plans/2026-10-11-account-registration-map-search-sync/2026-10-11-account-registration-map-search-sync-evidence.md`
- Benchmark: `docs/plans/2026-10-11-account-registration-map-search-sync/2026-10-11-account-registration-map-search-sync-benchmark.md`
- Actual status: `docs/plans/2026-10-11-account-registration-map-search-sync/2026-10-11-account-registration-map-search-sync-actual-status.md`

## Goal

Synchronize 100% of agency accounts across Cần Thơ and all 34 provinces/cities with the verified station directory (`vn-stations-directory.json` & `cantho-official-105-stations.json`) and 3,321 wards GeoJSON (`vn-wards-simplified.geojson`), fix `/api/geocode/search` so it prioritizes verified station & ward coordinates and never ignores `q` or matches placeholder strings, and upgrade the Account Creation/Edit Modal & Map Location Picker (`GHIM VỊ TRÍ TRỤ SỞ TRỰC TIẾP TRÊN BẢN ĐỒ`) so account registration/editing and map search match the main tactical map (Images 1 & 4) 100%.

## Rules

- Complete P0 actual status before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence as work completes.
- Record benchmarkable counts or measurements when they are taken.
- Update later phase status assumptions, next actions, and work steps when actual-status evidence changes the repo state.
- Run Anvien detect-changes before every implementation-slice commit when implementation work was performed.
- For public runtime or UI-facing changes, validate the real user-visible runtime with browser or Playwright evidence.
- Keep the standard planner structure.

## Problem

1. **Account Database Desynchronization (`agency-accounts.seed.json`, `agency-accounts.json`, `.runtime-data/agency-accounts.json`)**:
   - Accounts such as `capcaikhect`, `capanbinhct`, `capbinhthuyct`, `caphungphuct`, `csgt` had `ward: "Toàn Thành Phố"`, `address: "Chưa công bố địa chỉ trực ban trên nguồn đã kiểm chứng"`, generic `officerName` (`"Trực ban Công an phường Cái Khế"`), and generic `email` (`"capcaikhect@sos.gov.vn"`), while `vn-stations-directory.json` / `cantho-official-105-stations.json` already had the official data (`234 Phạm Ngũ Lão, phường Cái Khế, thành phố Cần Thơ`, `lat: 10.043366, lng: 105.773396`, `Trần Sơn Lam, Trung tá`, `0903101070`, `phuongcaikhe@cantho.gov.vn`).
   - 192 accounts across Hà Nội, TP.HCM, and other provinces had truncated `officerRank` (`"Đại"`, `"Thượng"`, `"Trung"`, `"Thiếu"`) and duplicated ranks in `officerName`.
   - Duplicate station entries (`st-capcaikhect`, `st-capanbinhct`, `st-capbinhthuyct`, `st-caphungphuct`) were generated in `vn-stations-directory.json` with `10.033333, 105.783333`.
2. **Broken `/api/geocode/search` in `server.js`**:
   - Line 5543 `const searchQuery = [addr, ward, prov, 'Việt Nam'].filter(Boolean).join(', ') || q || 'Cần Thơ, Việt Nam';` completely ignored `q` because `prov` defaulted to `'Cần Thơ'`, making `[addr, ward, prov, 'Việt Nam']` always evaluate to `'Cần Thơ, Việt Nam'` whenever `q` was passed from the Map Picker search box! Photon then geocoded `'Cần Thơ, Việt Nam'` to `10.032930, 105.810155` (middle of Cầu Cần Thơ on Sông Hậu, Image 2).
   - Step 1 in `/api/geocode/search` matched against `AGENCY_ACCOUNTS` instead of `stationsDirectory.stations`, and matched placeholder strings `"Toàn Thành Phố"` and `"Chưa công bố địa chỉ trực ban trên nguồn đã kiểm chứng"`, causing `capcaikhect` to match `csgt` (`10.033333, 105.783333`, Image 3).
3. **Account Creation/Edit Modal & Map Location Picker (`js/dispatcher.js`, `dispatcher.html`)**:
   - Opening `openEditAccountModal` or selecting a Province/Ward did not auto-sync with `this.stationsList` or provide a ward autocomplete datalist for the 3,321 wards across 34 provinces.
   - `openLocationPicker('account')` copied placeholder text `"Chưa công bố địa chỉ..."` into `#inputLocationPickerSearch`, disabled station pins on the picker map, and did not highlight the ward boundary or show autocomplete suggestions for stations/wards.

## Scope

- `assets/agency-accounts.seed.json`, `assets/agency-accounts.json`, `.runtime-data/agency-accounts.json`, `assets/vn-stations-directory.json`
- `server.js` (`/api/geocode/search`, `syncAllDirectoriesFromAgencyAccounts`)
- `dispatcher.html` (`#adminAccountEditModal`, `#modalLocationPicker`, province & ward datalists)
- `js/dispatcher.js` (`openEditAccountModal`, `initAdminModal`, `initLocationPickerModal`, `openLocationPicker`, `setLocationPickerPoint`)
- `playwright/verify-account-map-picker-sync.cjs`

## Non-Goals

- Changing Citizen SOS reporting UI or WebRTC voice call signaling.

## Requirements

1. Sync all accounts in `agency-accounts.seed.json`, `assets/agency-accounts.json`, and `.runtime-data/agency-accounts.json` with `vn-stations-directory.json` and `cantho-official-105-stations.json` (plus all 105 official Cần Thơ stations and all 34 provinces), eliminating all `"Chưa công bố..."` addresses, fixing all `ward: "Toàn Thành Phố"` on ward-level accounts, and fixing all 192 truncated `officerRank` values.
2. Fix `/api/geocode/search` in `server.js` to prioritize verified `stationsDirectory.stations` and `vnWardBoundaries.features`, strip placeholder text, respect `q`, and return full station metadata (`lat`, `lng`, `address`, `ward`, `province`, `phone`, `officerRank`, `officerName`, `officerSms`, `email`).
3. Upgrade `#adminAccountEditModal` and `#modalLocationPicker` in `dispatcher.html` and `js/dispatcher.js` so:
   - Selecting/typing Province & Ward or Unit Name auto-fills official headquarters address, GPS coordinates, phone, officer rank/name, and email matching Images 1 & 4.
   - Clicking `📍 Tìm GPS Từ Địa Chỉ` or opening `Chọn Trên Map` (`GHIM VỊ TRÍ TRỤ SỞ TRỰC TIẾP TRÊN BẢN ĐỒ`) resolves the exact station pin & ward boundary on the picker map, provides instant autocomplete dropdown for stations/wards/addresses, and never jumps to Cầu Cần Thơ (`10.032930, 105.810155`) or `10.033333, 105.783333`.

## Acceptance Criteria

- `capcaikhect` and all other ward/province accounts open in `CHỈNH SỬA TÀI KHOẢN` with exact ward (`Phường Cái Khế`), exact address (`234 Phạm Ngũ Lão, phường Cái Khế, thành phố Cần Thơ`), exact GPS (`10.043366, 105.773396`), rank (`Trung tá`), officer (`Trần Sơn Lam (SĐT: 0903101070)`), phone (`02923890379`), email (`phuongcaikhe@cantho.gov.vn`), matching Images 1 & 4 100%.
- Creating a new account or changing ward/unit name auto-populates coordinates and station info across all 34 provinces.
- Opening `Chọn Trên Map` and searching any ward/station/address in `GHIM VỊ TRÍ TRỤ SỞ TRỰC TIẾP TRÊN BẢN ĐỒ` positions the pin and ward polygon at the exact headquarters location and displays interactive search suggestions.

## Checklist

- [x] P0-A: Complete actual status before implementation work.
  - Goal: establish the real current state.
  - Work Steps: inspect source-of-truth files, classify each surface, record blocked or missing pieces, and update later phase status assumptions, next actions, and work steps from evidence.
  - Implementation Gate: no implementation or editing starts until `docs/plans/2026-10-11-account-registration-map-search-sync/2026-10-11-account-registration-map-search-sync-actual-status.md` has a final P0 decision.
  - Acceptance: actual status identifies correct, partial, missing/unbound, fake-or-stub, and blocked surfaces for this scope.

### P1: Synchronize Agency Accounts & Backend Geocode Search Engine

- Phase Goal: Clean and synchronize all agency accounts and station directory records across all 34 provinces (including all 105 Cần Thơ units) and fix `/api/geocode/search` in `server.js`.
- Phase Boundary:
  - In scope: `assets/agency-accounts.seed.json`, `assets/agency-accounts.json`, `.runtime-data/agency-accounts.json`, `assets/vn-stations-directory.json`, `server.js`
  - Out of scope: Frontend modal DOM
  - Dependencies: P0-A
- Ordered Slice List:
  - P1-A: Synchronize agency accounts & station directory data across all 34 provinces and fix `/api/geocode/search` in `server.js`.

- [x] P1-A: Synchronize agency accounts & station directory data and fix `/api/geocode/search` in `server.js`.
  - Goal: Ensure every account in `agency-accounts` has verified address, ward, GPS coordinates, rank, officer name, phone, and email matching `vn-stations-directory.json` & `cantho-official-105-stations.json`, remove duplicate `st-cap*` fallback records, and fix `/api/geocode/search` to resolve verified stations, 3,321 wards, and street addresses accurately.
  - Scope Boundary:
    - Editable: `assets/agency-accounts.seed.json`, `assets/agency-accounts.json`, `.runtime-data/agency-accounts.json`, `assets/vn-stations-directory.json`, `server.js`
    - Inspect-only: `assets/cantho-official-105-stations.json`, `assets/vn-wards-simplified.geojson`
    - Preserve-only: `js/map-controller.js`
    - Out of scope: `index.html`
  - Work Steps:
    1. Run data normalization & synchronization script to align all accounts in `agency-accounts.seed.json`, `assets/agency-accounts.json`, and `.runtime-data/agency-accounts.json` with `vn-stations-directory.json` and `cantho-official-105-stations.json` (including all 105 Cần Thơ stations and all 34 provinces), fixing `ward`, `address`, `lat`, `lng`, `officerRank`, `officerName`, `officerPhone`, `officerSms`, `officerEmail`, and deduplicating `vn-stations-directory.json`.
    2. Fix `/api/geocode/search` and `syncAllDirectoriesFromAgencyAccounts` in `server.js` so `q` is respected, placeholder strings (`Chưa công bố...`, `Toàn Thành Phố`) are ignored, verified stations in `stationsDirectory.stations` and wards in `vnWardBoundaries.features` are searched first, and full station metadata is returned.
  - Implementation Gate: P0-A complete and Anvien impact analysis recorded.
  - Acceptance: 0 accounts with `"Chưa công bố..."` address, 0 accounts with broken rank (`Đại`, `Thượng`, `Trung`, `Thiếu`), `/api/geocode/search` returns exact coordinates `10.043366, 105.773396` and metadata for Phường Cái Khế and other wards across 34 provinces.
  - Commit Boundary: commit with P2-A after full Playwright verification.

### P2: Upgrade Account Creation/Edit Modal & Interactive Map Location Picker

- Phase Goal: Upgrade `#adminAccountEditModal` and `#modalLocationPicker` in `dispatcher.html` and `js/dispatcher.js` for automatic station/ward matching, live autocomplete search, and visual ward/station rendering on the picker map.
- Phase Boundary:
  - In scope: `dispatcher.html`, `js/dispatcher.js`, `playwright/verify-account-map-picker-sync.cjs`
  - Out of scope: Citizen portal
  - Dependencies: P1-A
- Ordered Slice List:
  - P2-A: Upgrade Account Modal auto-fill, 34-province / 3,321-ward datalists, and Map Location Picker search & station overlay.

- [x] P2-A: Upgrade Account Modal auto-fill and Map Location Picker search & station overlay.
  - Goal: Make creating/editing accounts and picking locations on the map 100% consistent with the main tactical map (Images 1 & 4).
  - Scope Boundary:
    - Editable: `dispatcher.html`, `js/dispatcher.js`, `playwright/verify-account-map-picker-sync.cjs`
    - Inspect-only: `js/map-controller.js`
  - Work Steps:
    1. Update `dispatcher.html` `#vietnamProvincesList` to the exact 34 provinces, add `<datalist id="vietnamWardsList">` for `#editAccWard`, and add a live search suggestions dropdown `#locationPickerSearchDropdown` inside `#modalLocationPicker`.
    2. Update `js/dispatcher.js` (`openEditAccountModal`, ward/province/agencyName change handlers, `#btnGeocodeAccAddress`, `initLocationPickerModal`, `openLocationPicker`, `setLocationPickerPoint`) to auto-match stations & wards, strip placeholder strings, render station pins & ward boundaries on `pickerMapController`, and provide instant search & autocomplete across all 3,321 wards and 849+ stations.
    3. Verify with Playwright (`playwright/verify-account-map-picker-sync.cjs`) and capture QA screenshots and JSON/MD evidence under `Reports/qa/playwright/`.
  - Implementation Gate: P1-A completed.
  - Acceptance: Playwright test passes all assertions for `capcaikhect` edit modal, new account creation auto-fill, and Map Location Picker search across Cần Thơ and other provinces.
  - Commit Boundary: commit and push to `origin/main`.

## Risk Notes

- `server.js` and `js/dispatcher.js` are high-centrality files; changes must be scoped strictly to account sync, `/api/geocode/search`, `#adminAccountEditModal`, and `#modalLocationPicker`.
