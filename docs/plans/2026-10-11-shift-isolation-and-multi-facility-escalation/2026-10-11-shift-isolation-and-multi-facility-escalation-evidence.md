# Evidence Ledger

## Baseline & Implementation Evidence

- **EV-01 (R1 Baseline)**: `js/dispatcher.js:334` previously evaluated `this.currentDutyShift` without checking `this.currentOfficer`; `restoreDutyShift()` read global `sos_duty_shift` and fetched `/api/dispatcher/duty-shift` before login; `dispatcher.html:42` omitted `#dutyShiftModal` from `body:not(.officer-authenticated)`.
- **EV-02 (R2/R5 Baseline)**: `assets/hanoi-official-417-stations.json` and `assets/vn-stations-directory.json` contained `Bảo tàng Công an Hà Nội`, `Báo An ninh Thủ đô`, `Bệnh viện CATP Hà Nội`, `Nhà nghỉ dưỡng Suối Hai`, and 9 administrative/company records, plus 115 `&amp;` strings.
- **EV-03 (R3 Baseline)**: `js/map-controller.js:1042` rendered auxiliary stations without distance `km` or `[Cơ sở gần nhất]` badge; `renderActiveIncidentDrawer()` in `js/dispatcher.js:10972` did not render `wardFacilities`.
- **EV-04 (R4 Baseline)**: `server.js:1423` hardcoded `initialLevel = 'province'` for `fire` and `csgt`, bypassing nearest squad radius assignment, and lacked `POST /api/dispatcher/escalate` and 15-minute countdown UI.
- **EV-05 (R1 Verification — `Reports/qa/playwright/test-shift-isolation-gatekeeping.json`)**: `node playwright/test-shift-isolation-gatekeeping.cjs` passed `10/10` assertions:
  - Unauthenticated visitor triggers `0` alert dialogs even when `localStorage` is polluted with an expired shift.
  - `#dutyShiftModal` and `#substituteOfficerModal` are hidden under `body:not(.officer-authenticated)`.
  - Unit A (`cahanioi`) and Unit B (`csgthanoi`) store duty shifts under `sos_duty_shift_cahanioi` and `sos_duty_shift_csgthanoi` with zero cross-unit contamination.
- **EV-06 (R2/R5 Verification — `Reports/qa/playwright/verify-hanoi-417-multi-facility-nearest.json`)**:
  - `node scripts/parse-hanoi-417-stations.mjs` & `node scripts/merge-hanoi-directory.mjs` sanitized all 5 JSON files: `404` operational Hanoi stations (`329` `ward_police`, `67` `regional_squad`, `8` `city_hq`), `0` non-operational leaks, `0` `&amp;` entities, and `404/404` valid ANTD `source_url` & Google Maps links.
- **EV-07 (R3 Verification — `Reports/qa/playwright/verify-hanoi-417-multi-facility-nearest.json`)**:
  - Dispatch near `116 Quán Thánh` selects `st-hn-ca-005-ba-dinh` (`Cơ sở 4`, `isNearest: true`); dispatch near `37 Điện Biên Phủ` selects `st-hn-ca-004-ba-dinh` (`Trụ sở chính`, `isNearest: true`).
  - Map UI renders primary + auxiliary pins for `Phường Ba Đình` (2 pins) and `Phường Bạch Mai` (5 pins) with `[Cơ sở gần nhất]` badge and distance `km`, plus full facility list in `#drawerWardFacilitiesSection`.
- **EV-08 (R4 Verification — `Reports/qa/playwright/verify-hanoi-417-multi-facility-nearest.json`)**:
  - PCCC&CNCH SOS routes to nearest regional squad (`Đội Cảnh Sát PCCC & CNCH Khu Vực Hoàn Kiếm`, `isRegionalSquad: true`, `currentLevel: 'ward'`, `escalationStatus: 'PENDING_LOCAL'`) with City HQ `Trụ sở Phòng Cảnh sát PCCC và CNCH` as `provinceUnit`.
  - CSGT SOS routes to nearest regional squad (`Phòng Cảnh sát giao thông - Đội CSGT đường bộ số 1 - Cơ sở 1`) and escalates via `POST /api/dispatcher/escalate` to `Phòng Cảnh sát giao thông - Trụ sở chính` (`currentLevel: 'province'`, `status: 'escalated'`, `escalationStatus: 'ESCALATED_CITY_HQ'`).
  - Active Incident Drawer renders `#drawerEscalationTimerCard` with live `MM:SS` countdown (`14:52`) and `#btnEscalateCityHq` (`⚡ Chuyển cấp Thành phố`).
- **EV-09 (P6-A Strict Operational Whitelist & Simultaneous Multi-Facility Map Pins — `Reports/qa/playwright/verify-hanoi-417-multi-facility-nearest.json`)**:
  - Enforced strict operational whitelist in `scripts/parse-hanoi-417-stations.mjs`, `scripts/merge-hanoi-directory.mjs`, `server.js`, and `js/map-controller.js`: purged all 48 non-emergency/administrative bureaus (`Văn phòng cơ quan CSĐT`, `Phòng Cảnh sát kinh tế`, `Phòng Cảnh sát QLHC về TTXH`, `Phòng quản lý xuất nhập cảnh`, `Thanh tra CATP`, `Trại tạm giam`, `Phòng Cảnh sát hình sự`, `Phòng Cảnh sát cơ động`, `Phòng CSĐT tội phạm về ma túy`, `Phòng Hồ sơ nghiệp vụ`, `Cơ sở Đăng ký xe`, `Đội Sát hạch GPLX`, `Đội Đèn tín hiệu`), leaving exactly `369` ANTD operational units (`314` ward police facilities + `38` PCCC&CNCH units + `17` CSGT units).
  - Updated `js/map-controller.js` (`loadAllStationsMarkers`, `updateVisibleStationPins`, `showWardStationPin`) and disabled stale browser caching of `/js/map-controller.js` in `server.js`: verified that selecting `Phường Hoàn Kiếm` renders all 6 facilities simultaneously on the map (`1` primary pin + `5` auxiliary pins: `Trụ sở chính`, `Cơ sở 2`, `Cơ sở 3`, `Cơ sở 4`, `Cơ sở 5`, `Cơ sở 6`) with full names and non-overlapping coordinates.
