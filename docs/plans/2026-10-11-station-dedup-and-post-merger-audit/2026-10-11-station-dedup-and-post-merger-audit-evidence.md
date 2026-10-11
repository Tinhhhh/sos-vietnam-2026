# Station Dedup And Post-Merger Audit Evidence Ledger

## Metadata

- Date: `2026-10-11`
- Plan: `docs/plans/2026-10-11-station-dedup-and-post-merger-audit/2026-10-11-station-dedup-and-post-merger-audit-plan.md`
- Evidence: `docs/plans/2026-10-11-station-dedup-and-post-merger-audit/2026-10-11-station-dedup-and-post-merger-audit-evidence.md`
- Benchmark: `docs/plans/2026-10-11-station-dedup-and-post-merger-audit/2026-10-11-station-dedup-and-post-merger-audit-benchmark.md`
- Actual status: `docs/plans/2026-10-11-station-dedup-and-post-merger-audit/2026-10-11-station-dedup-and-post-merger-audit-actual-status.md`

## Evidence Rules

The evidence file explains why the work is known to be correct.

## E0 - P0 Evidence

Matching plan item(s): `P0-A`

- **`E0-P0A-FD1`**: Ran `anvien file-detail js/map-controller.js --repo sos-vietnam-2026 --json` and `anvien impact symbol "loadAllStationsMarkers"`, `"showWardStationPin"`, `"updateVisibleStationPins"`, `"highlightWardBoundary"`. Blast radius: `CRITICAL` (257 symbols, 19 linked flows).
- **`E0-P0A-FD2`**: Ran `anvien file-detail server.js --repo sos-vietnam-2026 --json` and `anvien impact symbol "syncAllDirectoriesFromAgencyAccounts"`. Blast radius: `CRITICAL` (24 linked flows).
- **`E0-P0A-AUDIT1`**: Audited `assets/vn-stations-directory.json` against `assets/vn-wards-simplified.geojson` (3,321 post-merger wards across 34 provinces) and `assets/cantho-official-105-stations.json` (105 official Cần Thơ grass-roots police stations). Found:
  1. 10 abolished pre-merger / fake ward stations & accounts in Cần Thơ: `caxkhuvucsotaica` (fake), `capancuct`, `capthoibinhct`, `capxuankhanhct`, `capankhanhct`, `caphungloict`, `capanhoact`, `caxmykhanhct`, `captranocct`, `caplebinhct`.
  2. 3 misplaced / duplicate provincial entries in Cần Thơ (`st-congan` at generic 10.033333, `st-csgt` duplicate, `st-cuuho` duplicate).
  3. 286 duplicate / non-canonical station entries across provinces.
  4. 23 Quảng Trị stations where `s.ward` retained `CAX `/`CAP ` prefixes.

## E1 - P1 Evidence

Matching plan item(s): `P1-A`

- **`E1-P1A-CLEAN1`**: Executed `scripts/clean-abolished-and-duplicate-stations.mjs`:
  - Removed 10 abolished pre-merger/fake Cần Thơ accounts from `assets/agency-accounts.seed.json`, `assets/agency-accounts.json`, and `.runtime-data/agency-accounts.json`.
  - Removed 12 abolished/duplicate stations from `assets/vn-stations-directory.json`.
  - Deduplicated 286 duplicate entries nationwide so that every post-merger ward has strictly 1 police station (0 duplicates).
  - Relocated `st-congan` to `Số 9A Trần Phú, Phường Cái Khế` (`lat: 10.045250, lng: 105.781820`), merged `st-csgt` with `st-ct-csgt-pc08` (`lat: 10.0475, lng: 105.7835`), and merged `st-cuuho` with `st-ct-pccc-pc07`.
  - Normalized all 23 Quảng Trị `s.ward` prefixes to canonical `"Xã "` / `"Phường "` / `"Đặc khu "`.
  - Hardened `syncAllDirectoriesFromAgencyAccounts()` in `server.js` to skip abolished accounts, map `csgt` and `cuuho` to canonical provincial stations, enforce `level: 'province'` for `congan`, and filter out duplicate IDs.
  - Verified with `node --check server.js` (pass).

## E2 - P2 Evidence

Matching plan item(s): `P2-A`

- **`E2-P2A-PW1`**: Updated `js/map-controller.js` and `js/dispatcher.js`:
  - Added grassroots ward police prioritization (`isWardPolice(s)`) in `showWardStationPin()` and `showWardHud()` so that ward selection prioritizes `Công An Phường Ninh Kiều` (`Số 72, đường Phan Đình Phùng`, `Thượng tá Phạm Hiền Tài`) instead of provincial PC07 or emergency hospital units.
  - In `updateVisibleStationPins()`, skipped mounting duplicate station markers when `this.activeWardStationMarker` is already rendered at the same location.
  - In `clearActiveWardPin()` and `clearWardBoundary()`, properly reset active coordinates and remounted normal station pins.
  - Executed Playwright end-to-end verification via `node playwright/verify-ninh-kieu-station-dedup.cjs`:
    - 10/10 assertions passed:
      1. `hudTitleMatchesNinhKieu`: true
      2. `hudAddressMatchesPhanDinhPhung`: true (`Số 72, đường Phan Đình Phùng, phường Ninh Kiều, thành phố Cần Thơ`)
      3. `hudPhoneMatchesOfficial`: true (`02923820938`)
      4. `hudOfficerMatchesPhamHienTai`: true (`Thượng tá Phạm Hiền Tài (SĐT: 0918357555)`)
      5. `noAbolishedAnCuPin`: true
      6. `noAbolishedThoiBinhPin`: true
      7. `noAbolishedXuanKhanhPin`: true
      8. `noFakeKhuVucSoTaiPin`: true
      9. `noMisplacedGenericConganAt10033`: true
      10. `onlyOneWardPolicePinInNinhKieu`: true
    - Captured screenshot: `Reports/qa/playwright/2026-10-11-ninh-kieu-station-dedup.png`.
    - Generated QA reports: `Reports/qa/playwright/2026-10-11-station-dedup-verification.json` and `.md`.
  - Also ran `node playwright/verify-cantho-tan-an-station-pin.cjs` regression check: 8/8 assertions passed!

## Closure Evidence

- Zero abolished pre-merger wards or fake test stations exist in the repository.
- Every post-merger ward has strictly 1 official grass-roots police station.
- Clean visual display verified on live runtime with Playwright.
