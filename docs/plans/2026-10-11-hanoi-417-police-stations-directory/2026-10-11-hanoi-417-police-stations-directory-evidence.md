# Hà Nội 417 Police Stations Directory Evidence

## Metadata
- Date: `2026-10-11`
- Status: `in_progress`
- Plan: `docs/plans/2026-10-11-hanoi-417-police-stations-directory/2026-10-11-hanoi-417-police-stations-directory-plan.md`

## Phase Evidence Log

### P0-A: Initial State Evidence
- Parsed 417 rows from downloaded `content.md` (`https://anninhthudo.vn/chi-tiet-danh-sach-417-tru-so-diem-tiep-dan-kem-link-google-map-cua-cong-an-tp-ha-noi-post666267.antd`).
- Tested Google Maps shortlink resolution: HTTP 302 redirects yield exact `/@lat,lng` and `!3d<lat>!4d<lng>` coordinates.
- Tested ward matching: 412/417 matched directly on raw string matching, remaining 5 matched after Unicode diacritic normalization (`Hòa Lạc` vs `Hoà Lạc`, `Ứng Hòa` vs `Ứng Hoà`, `Văn Miếu - Quốc Tử Giám`).

### P1: Data Extraction and Coordinate Resolution
- Executed `scripts/parse-hanoi-417-stations.mjs`.
- Resolved 369 Google Maps shortlinks to verified coordinates via HTTP 302 redirect location inspection.
- Applied jittered centroid fallback for 48 stations without GPS coordinates in shortlinks.
- Matched 100% (126/126) of Hà Nội post-merger wards in `assets/vn-wards-simplified.geojson`.
- Output: `assets/hanoi-official-417-stations.json` (417 stations, 438,552 bytes).

### P2: Directory and Account Synchronization
- Executed `scripts/merge-hanoi-directory.mjs`.
- Merged the 417 official Hà Nội stations into `assets/vn-stations-directory.json`.
  - Nationwide total increased from 547 to 905 stations.
  - Hà Nội facilities increased from 74 to 432 (417 ward police facilities + 1 provincial command center + 14 specialized units).
  - Preserved all 473 non-Hà Nội stations.
- Synced `assets/agency-accounts.seed.json` (890 accounts) and `.runtime-data/agency-accounts.json` (421 accounts).

### P3: Multi-Facility Nearest Dispatch Implementation
- `server.js`:
  - `resolveJurisdiction`: Ensured polygon containment (`isPointInFeature`) runs before centroid fallback.
  - `createJurisdictionHierarchy`: Discovered all stations in the matched ward (`matchedWardStations`), sorted them by Haversine distance to citizen coordinates `(lat, lng)`, assigned the closest facility as `localUnit` (`assignedUnit`), populated `localUnit.id`, `localUnit.facility_type`, `localUnit.maps_url`, `localUnit.wardFacilities`, and `isNearestFacilityInWard`.
  - `syncAllDirectoriesFromAgencyAccounts`: Normalized ID comparisons so multi-facility wards don't collapse.
- `js/map-controller.js`:
  - `showWardStationPin`: Mounted primary pin (`.active-ward-reveal-pin`) for the nearest or main facility, and mounted auxiliary pins (`.auxiliary-ward-pin`) for all other facilities in the ward.
  - `createPoliceStationPopupHtml`: Displayed facility type badge, direct Google Maps link, and a list of all other facilities with addresses and contact numbers in that ward.
  - `clearActiveWardPin`: Cleanly unmounted both primary and auxiliary markers.
- `js/dispatcher.js`:
  - `showWardHud`: Displayed facility badges and integrated Google Maps navigation.
- `js/app.js`:
  - Citizen view renders facility badge, direct calling, and navigation link.

### P4: Playwright Automated Verification
- Executed `playwright/verify-hanoi-417-multi-facility-nearest.cjs`:
  - Directory total stations: `905 >= 900` (PASS)
  - Hà Nội total facilities: `432 >= 430` (PASS)
  - Hà Nội ward police facilities: `417 >= 417` (PASS)
  - Ba Đình multi-facility: 2 facilities (`Trụ sở chính` & `Cơ sở 4`) (PASS)
  - Bạch Mai multi-facility: 5 facilities (PASS)
  - Google Maps links: 417 valid links (PASS)
  - Nearest dispatch near Quán Thánh: `st-hn-ca-005-ba-dinh` (`Cơ sở 4`, 0 km) (PASS)
  - Nearest dispatch near Điện Biên Phủ: `st-hn-ca-004-ba-dinh` (`Trụ sở chính`, 0.01 km) (PASS)
  - UI Ba Đình: Primary pin + 1 auxiliary pin mounted (PASS)
  - UI Ba Đình popup: Google Maps link + multi-facility directory rendered (PASS)
  - UI Bạch Mai: Primary pin + 4 auxiliary pins (5 total) mounted (PASS)
  - Pin cleanup: `clearActiveWardPin` leaves 0 remaining pins (PASS)
- Written test reports:
  - `Reports/qa/playwright/verify-hanoi-417-multi-facility-nearest.json`
  - `Reports/qa/playwright/verify-hanoi-417-multi-facility-nearest.md`
  - Screenshots:
    - `Reports/qa/playwright/screenshots/hanoi-ba-dinh-multi-facility.png`
    - `Reports/qa/playwright/screenshots/hanoi-bach-mai-5-facilities.png`
