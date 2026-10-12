# Tab Icons Alignment & Ward Geofence Resolution Plan

## Metadata

- Date: `2026-10-12`
- Status: `completed`
- Plan: `docs/plans/2026-10-12-tab-icons-alignment-and-ward-geofence-fix/2026-10-12-tab-icons-alignment-and-ward-geofence-fix-plan.md`
- Evidence: `docs/plans/2026-10-12-tab-icons-alignment-and-ward-geofence-fix/2026-10-12-tab-icons-alignment-and-ward-geofence-fix-evidence.md`
- Benchmark: `docs/plans/2026-10-12-tab-icons-alignment-and-ward-geofence-fix/2026-10-12-tab-icons-alignment-and-ward-geofence-fix-benchmark.md`
- Actual status: `docs/plans/2026-10-12-tab-icons-alignment-and-ward-geofence-fix/2026-10-12-tab-icons-alignment-and-ward-geofence-fix-actual-status.md`

## Goal

1. Fix sidebar navigation buttons (`#sidebarTabsNav`) icon alignment and overflow: ensure icons (⚠️ and 📄) are fully enclosed within the button pill borders without protruding outside or clipping.
2. Fix administrative ward boundary matching in `server.js` (`getWardBoundaryFeature` and `/api/geo/locate-ward`): ensure clicking "Công An Phường Cái Khế" (and any other ward across Vietnam) accurately highlights the declared ward polygon (`Phường Cái Khế`), never mistaking it for adjacent wards (`Phường Ninh Kiều`).
3. Audit and standardize coordinates for Công An Phường Cái Khế in `assets/vn-stations-directory.json` so the map pin accurately sits inside Phường Cái Khế.

## Rules

- Complete P0 actual status before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence as work completes.
- Record benchmarkable counts or measurements when they are taken.
- Run Anvien detect-changes before every implementation-slice commit when implementation work was performed.
- Validate with Playwright test and browser screenshot evidence.

## Problem

1. **Issue 9 (Tab Icons Overflowing Button Box)**:
   - On `#sidebarTabsNav`, `.sidebar-tab-btn` has `flex: 1 1 0 !important; min-width: 0 !important; padding: 5px 3px !important;`.
   - All 5 buttons are given equal width (~69px in 380px sidebar).
   - Buttons with badges (`Sự Cố ( 82 )`, `Lịch Sử ( 10 )`) have content width ~87px. Because flexbox centers the content (`justify-content: center`), the 18px overflow is centered, pushing the icon ~9px beyond the left border of the pill.
   - The flex child `<span>` containing the SVG and text nodes causes gaps inside `( 82 )`.

2. **Issue 10 (Cái Khế Mismatched into Ninh Kiều)**:
   - In `server.js`, `getWardBoundaryFeature` tests GPS coordinates using point-in-polygon *before* checking the ward name.
   - The station "Công An Phường Cái Khế" has coordinates `10.043366, 105.773396` (at the borderline). GPS point-in-polygon hit `Phường Ninh Kiều` (`ward-92-diaphanhanhchinhcapxa_2025_203`) and immediately returned it, completely bypassing the declared ward name `Phường Cái Khế`.
   - Nationwide audit revealed 33 stations whose GPS coordinates hit neighboring wards while their declared ward polygon was readily available in `vn-wards-simplified.geojson`.

## Scope

- Editable surfaces:
  - `server.js`: `getWardBoundaryFeature` logic prioritizing declared ward name over raw GPS.
  - `assets/vn-stations-directory.json`: `st-ct-28-ph-ng-c-i-kh` coordinates and address.
  - `css/style.css` & `css/tactical-responsive.css`: `.sidebar-tab-btn`, `#sidebarTabsNav`, flex ratios and badge layout.
  - `dispatcher.html`: markup of `#sidebarTabsNav` buttons.
- Out of scope:
  - Redesigning unrelated dispatch tabs or modifying official administrative GeoJSON geometries.

## Non-Goals

- Changing other municipal boundaries or modifying police department directory data unrelated to the mismatch.

## Requirements

1. Tab buttons in `#sidebarTabsNav` must maintain all 5 buttons on a single row, with proportional flex sizing so badges fit comfortably and icons are 100% inside the button border.
2. Clicking "Công An Phường Cái Khế" on the map or in the directory must return and highlight `Phường Cái Khế` (`ward-92-diaphanhanhchinhcapxa_2025_202`).
3. Pure GPS reverse-geocoding (when no ward name is passed, e.g. clicking an arbitrary map point) must continue to function correctly using point-in-polygon.
4. Pass 100% of Playwright tests.

## Acceptance Criteria

- [ ] AC1: Visual evidence shows all 5 tab buttons neatly aligned, icons inside borders, no clipping or overflowing.
- [ ] AC2: `/api/geo/locate-ward?lat=10.0505&lng=105.7741&ward=Phường Cái Khế&province=Cần Thơ` returns `Phường Cái Khế` boundary.
- [ ] AC3: Audit confirms 0 stations with existing GeoJSON polygons misresolving to other wards when declared ward is provided.
- [ ] AC4: Full test suite passes.

## Checklist

- [x] P0-A: Complete actual status before implementation work.
- [x] P1-A: Fix `getWardBoundaryFeature` in `server.js` and station coordinates in `assets/vn-stations-directory.json`.
- [x] P1-B: Fix `#sidebarTabsNav` button styles, flex ratios, and icon alignment in CSS and HTML.
- [x] P2-A: Validate with automated tests, Playwright visual snapshot, and record evidence.
- [x] P2-B: Anvien detect-changes, benchmark, and commit.
