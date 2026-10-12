# Tab Icons Alignment & Ward Geofence Resolution Evidence Ledger

## Metadata

- Date: `2026-10-12`
- Plan: `docs/plans/2026-10-12-tab-icons-alignment-and-ward-geofence-fix/2026-10-12-tab-icons-alignment-and-ward-geofence-fix-plan.md`
- Evidence: `docs/plans/2026-10-12-tab-icons-alignment-and-ward-geofence-fix/2026-10-12-tab-icons-alignment-and-ward-geofence-fix-evidence.md`
- Benchmark: `docs/plans/2026-10-12-tab-icons-alignment-and-ward-geofence-fix/2026-10-12-tab-icons-alignment-and-ward-geofence-fix-benchmark.md`
- Actual status: `docs/plans/2026-10-12-tab-icons-alignment-and-ward-geofence-fix/2026-10-12-tab-icons-alignment-and-ward-geofence-fix-actual-status.md`

## Evidence Sections

### E0: Initial Audit & Problem Proof
- `E0-AUDIT-1`: Audit of 766 stations against `vn-wards-simplified.geojson` revealed 33 grassroots stations where GPS coordinates placed the station inside a neighboring ward's polygon, causing `getWardBoundaryFeature` to return the wrong polygon.
- `E0-CAIKHE-1`: CAP Cái Khế (`10.043366, 105.773396`) returned `ward-92-diaphanhanhchinhcapxa_2025_203` (Phường Ninh Kiều) instead of `ward-92-diaphanhanhchinhcapxa_2025_202` (Phường Cái Khế).
- `E0-ICONS-1`: Inspection of user screenshot `media_1791819406504_992a2e74.png` confirmed icon ⚠️ on `Sự Cố ( 82 )` and 📄 on `Lịch Sử ( 10 )` overflowed 8-9px past the pill border due to equal `flex: 1 1 0` with content length exceeding container width.

### E1: Implementation & Code Facts
- `E1-P1A-SERVER1`: Updated `getWardBoundaryFeature` in `server.js` (lines 1035-1075) to prioritize exact and partial ward name matches within the province before evaluating raw GPS point-in-polygon.
- `E1-P1A-DIR1`: Updated `assets/vn-stations-directory.json` entry `st-ct-28-ph-ng-c-i-kh` with accurate coordinates `lat: 10.0498, lng: 105.7785`, address `Số 138 Đường Trần Phú, Phường Cái Khế, Thành phố Cần Thơ`, and `wardId: ward-92-diaphanhanhchinhcapxa_2025_202`.
- `E1-P1B-CSS1`: Refactored `.sidebar-tab-btn` in `css/style.css` and `css/tactical-responsive.css` to use proportional flex ratios (`1.15` for Incidents/History, `0.82` for Stations/Enterprises, `1.06` for Hospitals) with `overflow: hidden !important;`, `box-sizing: border-box !important;`, and `letter-spacing: -0.2px !important;`.
- `E1-P1B-HTML1`: Separated icons from text in `dispatcher.html` (`.tab-btn-text` span) to eliminate extraneous flex gaps inside badge parentheses.

### E2: Playwright Validation & Visual Proof
- `E2-P2A-TEST1`: Playwright suite `playwright/verify-tab-icons-and-cai-khe-ward.mjs` executed and achieved **12/12 PASS (100%)**:
  1. `[PASS]` Sidebar sub-tabs container `#sidebarTabsNav` is present.
  2. `[PASS]` Tab `#tabBtnIncidents` icon strictly inside boundaries (`overflowLeft: 0`, `overflowRight: 0`).
  3. `[PASS]` Tab `#tabBtnHistory` icon strictly inside boundaries.
  4. `[PASS]` Tab `#tabBtnStations` icon strictly inside boundaries.
  5. `[PASS]` Tab `#tabBtnEnterprises` icon strictly inside boundaries.
  6. `[PASS]` Tab `#tabBtnHospitals` icon strictly inside boundaries.
  7. `[PASS]` All 5 sidebar tabs aligned on single row (`maxTopDiff: 0px`).
  8. `[PASS]` Double-digit badge Tab `#tabBtnIncidents` (`Sự Cố (82)`) icon strictly inside boundaries.
  9. `[PASS]` Double-digit badge Tab `#tabBtnHistory` (`Lịch Sử (10)`) icon strictly inside boundaries.
  10. `[PASS]` API `/api/geo/locate-ward` returns `ok: true` for Phường Cái Khế.
  11. `[PASS]` API returns Phường Cái Khế boundary id: `ward-92-diaphanhanhchinhcapxa_2025_202`.
  12. `[PASS]` Station click highlights Phường Cái Khế without defaulting to Ninh Kiều.
- `E2-P2A-SHOT1`: `Reports/qa/playwright/2026-10-12-tab-icons-alignment-and-ward-geofence-fix/screenshots/sidebar-tabs-nav-aligned.png` proves all 5 icons inside boundaries with full "Bệnh Viện" text.
- `E2-P2A-SHOT2`: `Reports/qa/playwright/2026-10-12-tab-icons-alignment-and-ward-geofence-fix/screenshots/dispatcher-cai-khe-ward-highlighted.png` proves Phường Cái Khế highlighted on map with CAP Cái Khế pin inside its boundaries.
