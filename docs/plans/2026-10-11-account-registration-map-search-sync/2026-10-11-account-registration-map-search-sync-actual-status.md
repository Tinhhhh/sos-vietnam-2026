# Account Registration & Map Location Search Synchronization Actual Status

Title: Account Registration & Map Location Search Synchronization
Date: 2026-10-11
Status: P0 Complete
Companion plan: `docs/plans/2026-10-11-account-registration-map-search-sync/2026-10-11-account-registration-map-search-sync-plan.md`
Companion evidence: `docs/plans/2026-10-11-account-registration-map-search-sync/2026-10-11-account-registration-map-search-sync-evidence.md`
Companion benchmark: `docs/plans/2026-10-11-account-registration-map-search-sync/2026-10-11-account-registration-map-search-sync-benchmark.md`

## Purpose

This file records the real current state before implementation.

## Scope

Target scope:

- `assets/agency-accounts.seed.json`, `assets/agency-accounts.json`, `.runtime-data/agency-accounts.json`
- `assets/vn-stations-directory.json`
- `server.js` (`/api/geocode/search`, `syncAllDirectoriesFromAgencyAccounts`)
- `dispatcher.html` (`#adminAccountEditModal`, `#modalLocationPicker`)
- `js/dispatcher.js` (`openEditAccountModal`, `initAdminModal`, `initLocationPickerModal`, `openLocationPicker`)

Out of scope:

- Citizen SOS page (`index.html`, `js/app.js`)

## Relationship / Impact Evidence

| Unit / File / Surface | File Detail Evidence | Related File Count | Relationship Summary | Impact Note |
|-----------------------|----------------------|--------------------|----------------------|-------------|
| `server.js` | `E0-P0A-FD1` | 33 outbound, 15 flows | Main HTTP server & geocode/account APIs | high scope warning (`syncAllDirectoriesFromAgencyAccounts` impact is LOW, direct=1) |
| `js/dispatcher.js` | `E0-P0A-FD2` | 1 inbound/outbound (`map-controller.js`) | Dispatcher UI controller, account modal & map picker | medium scope warning |

## Current Status Matrix

| Unit | Current State | Required State | Status | Relationship Count | Evidence | Next Plan Decision |
|------|---------------|----------------|--------|--------------------|----------|--------------------|
| `agency-accounts.seed.json` & `.runtime-data/agency-accounts.json` | 5 accounts have `Chưa công bố địa chỉ trực ban trên nguồn đã kiểm chứng` & `ward: Toàn Thành Phố` (`capcaikhect`, `capanbinhct`, `capbinhthuyct`, `caphungphuct`, `csgt`); 192 accounts have truncated `officerRank` (`Đại`, `Thượng`, `Trung`, `Thiếu`); only 27 Cần Thơ accounts exist vs 105 official stations | All accounts synced with official stations & wards; 0 placeholder addresses; 0 truncated ranks; all 105 Cần Thơ official stations represented | `wrong` | 2 related files | `E0-P0A-DATA1`, `E0-P0A-DATA2` | edit P1-A |
| `server.js` (`/api/geocode/search`) | Ignores `q` when `addr`/`ward` are empty because `prov` defaults to `'Cần Thơ'`; matches `AGENCY_ACCOUNTS` placeholder strings (`Toàn Thành Phố`, `Chưa công bố...`) returning `10.033333, 105.783333` or Cầu Cần Thơ `10.032930, 105.810155` | Prioritize verified `stationsDirectory.stations` & `vnWardBoundaries.features`, strip placeholders, use `q` properly, return station metadata | `wrong` | 1 related file | `E0-P0A-SRC1` | edit P1-A |
| `dispatcher.html` & `js/dispatcher.js` (`#adminAccountEditModal` & `#modalLocationPicker`) | Copies placeholder address into search input; lacks ward datalist & live autocomplete; disables station pins & ward highlight on picker map | Auto-fill station/ward fields on selection/edit; show ward boundary & station pins on picker map; provide live search dropdown for stations, wards, and streets | `partial` | 2 related files | `E0-P0A-SRC2` | edit P2-A |

## Status Refresh Log

| Refresh | Date | Repo Basis | Changed Scope | Status Changes | Evidence | Next Phase Update |
|---------|------|------------|----------------|----------------|----------|-------------------|
| R0 | 2026-10-11 | `2a4d79e` | Account sync, `/api/geocode/search`, Account Modal & Map Picker | initial classification | `E0-P0A-FD1`, `E0-P0A-DATA1`, `E0-P0A-SRC1`, `E0-P0A-SRC2` | Proceed with P1-A then P2-A |

## Phase Touch Map

| Unit / File / Surface | Plan-Relevant Relationship File | Relationship to Target | Plan Item | Touch Mode | Evidence | Constraint |
|-----------------------|---------------------------------|------------------------|-----------|------------|----------|------------|
| `assets/agency-accounts.seed.json` | `.runtime-data/agency-accounts.json`, `assets/vn-stations-directory.json` | source-of-truth | P1-A | edit | `E0-P0A-DATA1` | Keep password hashes intact |
| `server.js` | `assets/vn-stations-directory.json`, `assets/vn-wards-simplified.geojson` | consumer | P1-A | edit | `E0-P0A-SRC1` | Scope edits to account sync & `/api/geocode/search` |
| `js/dispatcher.js` | `dispatcher.html`, `js/map-controller.js` | consumer | P2-A | edit | `E0-P0A-SRC2` | Scope edits to account modal & location picker |

## Final P0 Decision

- [x] P0 complete. Next phase can proceed unchanged.

Decision note:

Root causes of all 4 user screenshots are confirmed with exact line numbers and coordinate traces. Proceed to P1-A.
