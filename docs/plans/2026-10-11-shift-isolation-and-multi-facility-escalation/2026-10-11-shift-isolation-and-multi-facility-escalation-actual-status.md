# Actual Status

## Current Status Matrix

| Requirement / Slice | File(s) | Classification | Evidence ID | Touch Mode | Plan Consequence |
|---|---|---|---|---|---|
| R1: Unauthenticated Shift Alert & Unit Scoping | `js/dispatcher.js`, `dispatcher.html`, `server.js` | `verified` (10/10 Playwright assertions pass; 0 unauthenticated alerts, unit-scoped `sos_duty_shift_${username}`) | `EV-01`, `EV-05` | `verify-only` | Completed in P1-A & verified in P5-A |
| R2 & R5: Non-Operational Cleansing & 417 Sync | `assets/*.json`, `scripts/*.mjs`, `server.js` | `verified` (48 non-operational/administrative bureaus purged -> 369 ANTD operational Hanoi units: 314 ward police, 38 PCCC&CNCH, 17 CSGT; 0 `&amp;`) | `EV-02`, `EV-06`, `EV-09` | `verify-only` | Completed in P2-A & P6-A |
| R3: Multi-Facility Map Popup & Drawer Nearest Badge | `js/map-controller.js`, `js/dispatcher.js`, `dispatcher.html` | `verified` (Multi-facility wards show all pins simultaneously on map—including all 6 facilities of Phường Hoàn Kiếm—with Haversine distance `km`, services, and `[Cơ sở gần nhất]` badge) | `EV-03`, `EV-07`, `EV-09` | `verify-only` | Completed in P3-A & P6-A |
| R4: PCCC/CSGT Radius Dispatch & 15-Min Escalation | `server.js`, `js/dispatcher.js`, `dispatcher.html` | `verified` (Regional squads route by Haversine radius across city; 15-min countdown timer + `POST /api/dispatcher/escalate` escalates to City HQ) | `EV-04`, `EV-08` | `verify-only` | Completed in P4-A & verified in P5-A |

## Status Refresh Log

- `2026-10-11T21:32:00+07:00`: Completed P0 baseline audit across all 5 requirements (R1-R5).
- `2026-10-11T22:11:00+07:00`: Completed P1-A through P5-A implementation and verified 100% Playwright E2E pass rate (27/27 assertions across both suites).
- `2026-10-11T22:55:00+07:00`: Completed P6-A strict operational police/PCCC/CSGT whitelist (purged all 48 non-emergency/administrative bureaus) and simultaneous multi-facility map pin rendering (verified 29/29 Playwright assertions including all 6 facilities of Phường Hoàn Kiếm).
