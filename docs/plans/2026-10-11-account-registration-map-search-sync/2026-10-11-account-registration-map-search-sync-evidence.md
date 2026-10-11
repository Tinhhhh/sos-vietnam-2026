# Account Registration & Map Location Search Synchronization Evidence Ledger

## Metadata

- Date: `2026-10-11`
- Plan: `docs/plans/2026-10-11-account-registration-map-search-sync/2026-10-11-account-registration-map-search-sync-plan.md`
- Evidence: `docs/plans/2026-10-11-account-registration-map-search-sync/2026-10-11-account-registration-map-search-sync-evidence.md`
- Benchmark: `docs/plans/2026-10-11-account-registration-map-search-sync/2026-10-11-account-registration-map-search-sync-benchmark.md`
- Actual status: `docs/plans/2026-10-11-account-registration-map-search-sync/2026-10-11-account-registration-map-search-sync-actual-status.md`

## E0 - P0 Evidence

Matching plan item(s): `P0-A`

- `E0-P0A-FD1`: Ran `anvien analyze --force` and `anvien file-detail server.js --repo sos-vietnam-2026 --json` + `anvien impact symbol "syncAllDirectoriesFromAgencyAccounts" --repo sos-vietnam-2026 --direction upstream` (`risk: LOW`, `direct: 1`).
- `E0-P0A-DATA1`: Audited `assets/agency-accounts.seed.json` and `.runtime-data/agency-accounts.json` (453 accounts): found `capcaikhect`, `capanbinhct`, `capbinhthuyct`, `caphungphuct`, `csgt` with `address: "Chưa công bố địa chỉ trực ban trên nguồn đã kiểm chứng"` and `ward: "Toàn Thành Phố"`, plus 192 accounts with truncated `officerRank` (`Đại`: 75, `Thượng`: 63, `Trung`: 31, `Thiếu`: 23).
- `E0-P0A-DATA2`: Audited `assets/vn-stations-directory.json` (849 stations) and `assets/cantho-official-105-stations.json` (105 official Cần Thơ stations): confirmed `st-ct-28-ph-ng-c-i-kh` has `address: "234 Phạm Ngũ Lão, phường Cái Khế, thành phố Cần Thơ"`, `lat: 10.043366, lng: 105.773396`, `phone: "02923890379"`, `officer: "Trần Sơn Lam, Trung tá (SĐT: 0903101070)"`, `email: "phuongcaikhe@cantho.gov.vn"`, while duplicate `st-capcaikhect` had `10.033333, 105.783333`.
- `E0-P0A-SRC1`: Inspected `server.js` lines 5538-5593: confirmed line 5543 `const searchQuery = [addr, ward, prov, 'Việt Nam'].filter(Boolean).join(', ') || q || 'Cần Thơ, Việt Nam';` ignores `q` when `prov` defaults to `'Cần Thơ'`, causing Photon to geocode `'Cần Thơ, Việt Nam'` to `10.032930, 105.810155` (Cầu Cần Thơ, Image 2), and lines 5569-5592 match placeholder `Toàn Thành Phố` / `Chưa công bố...` against `csgt` (`10.033333, 105.783333`, Image 3).
- `E0-P0A-SRC2`: Inspected `js/dispatcher.js` lines 1703-1942 and 4067-4280: confirmed `openLocationPicker` copies placeholder address into `#inputLocationPickerSearch` and creates `MapController` with `{ disableStations: true }` without ward boundary or station pins.

## E1 - P1 Evidence

Matching plan item(s): `P1-A`

- `E1-P1A-SYNC`: Executed `node scripts/sync-accounts-and-stations.mjs`:
  - Cleaned `assets/vn-stations-directory.json` (845 verified stations, 0 duplicate `st-cap*` entries, all 105 Cần Thơ official stations synced).
  - Synchronized `assets/agency-accounts.seed.json`, `assets/agency-accounts.json`, and encrypted `.runtime-data/agency-accounts.json` across all 34 provinces (548 total accounts, 114 Cần Thơ accounts including all 105 official wards, 0 placeholder `"Chưa công bố..."` addresses, 213 broken half-ranks repaired to 0).
- `E1-P1A-API`: Verified `/api/geocode/search?q=Phường Cái Khế&province=Cần Thơ` and `/api/geocode/suggest?q=Cái Khế&province=Cần Thơ`:
  - Returns exact verified coordinates `lat: 10.043366, lng: 105.773396`, `address: "234 Phạm Ngũ Lão, phường Cái Khế, thành phố Cần Thơ"`, `phone: "02923890379"`, `sms: "0903101070"`, `email: "phuongcaikhe@cantho.gov.vn"`, `officerRank: "Trung tá"`, `officerName: "Trung tá Trần Sơn Lam"`, `source: "stations-directory"`.

## E2 - P2 Evidence

Matching plan item(s): `P2-A`

- `E2-P2A-UI`: Updated `dispatcher.html` (`#listProvinces` with all 34 official provinces, `#listWards`, `#listOfficerRanks`, `#locationPickerSearchDropdown`) and `js/dispatcher.js` (`syncAccountModalWithStation`, `populateAccountWardsDatalist`, `initLocationPickerModal`, `openLocationPicker`, `setLocationPickerPoint`).
- `E2-P2A-PW`: Executed `node playwright/verify-account-map-picker-sync.cjs` (`allPassed: true`, 6/6 assertions passed):
  - QA JSON: `Reports/qa/playwright/account-map-picker-sync-qa.json`
  - QA Markdown: `Reports/qa/playwright/account-map-picker-sync-qa.md`
  - Screenshots: `Reports/qa/playwright/capcaikhect-edit-modal-fixed.png`, `Reports/qa/playwright/capcaikhect-map-picker-fixed.png`, `Reports/qa/playwright/map-picker-live-suggestions.png`.

## Closure Evidence

- All P0, P1, and P2 checklist items completed and verified against live runtime and Playwright E2E assertions.

