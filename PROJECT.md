# Project: SOS Vietnam 2026 — Dispatcher Upgrade & Multi-Facility Incident Engine

## Architecture

### 1. Client Architecture
- **Dispatcher Portal (`dispatcher.html`, `js/dispatcher.js`)**:
  - Tactical dashboard for duty officers across Police (`police`), Fire & Rescue (`cuuho`), and Traffic Police (`csgt`).
  - Auth gatekeeper (`cyberGatekeeperModal`, `cosmicPortalView`, class `officer-authenticated`).
  - Scoped Duty Shift Management (`sos_duty_shift_${username}`), shift countdown clock, handover modal.
  - Active Incident Drawer (`#activeIncidentDrawer`) with multi-facility ward directory and 15-minute escalation countdown timer (`#escalationCountdown`, `#btnEscalateCityHq`).
- **Interactive GIS Map (`js/map-controller.js`)**:
  - Mapbox GL JS engine rendering ward boundaries, emergency locations, and station pins.
  - Multi-facility ward pin layer: Primary pin (`.active-ward-reveal-pin`) and auxiliary pins (`.auxiliary-ward-pin`).
  - Multi-station interactive popups (`createPoliceStationPopupHtml`) with Haversine distance, administrative procedures, and `[Cơ sở gần nhất]` badge.
- **Citizen Portal (`index.html`, `js/app.js`)**:
  - Emergency SOS broadcast, GPS location acquisition, nearest police/fire/traffic station lookup.

### 2. Server Architecture (`server.js`)
- Node.js native HTTP/WebSocket/SSE server.
- **Station Directory & Spatial Engine**:
  - Loads `assets/vn-stations-directory.json` with fallback to `assets/hanoi-official-417-stations.json`.
  - Haversine distance calculator (`getDistanceKm`) for spatial proximity sorting.
  - `createJurisdictionHierarchy()`: Resolves ward police facilities, cross-ward specialized squads (PCCC & CSGT radius), and city headquarters tier.
- **Duty Shift Subsystem**:
  - In-memory & persisted scoped duty shifts by unit username (`unitDutyShifts` Map).
  - `/api/dispatcher/duty-shift` (GET/POST) with strict unit scoping.
  - Unit-scoped SSE broadcasts (`duty_shift_update`).
- **15-Minute Escalation Engine**:
  - Incident escalation timers (15 minutes).
  - `POST /api/dispatcher/escalate` endpoint for manual City HQ escalation.
  - WebSocket broadcast `INCIDENT_ESCALATED` to provincial command posts (`catphanoi`, `pccchanoi`, `csgthanoi`).

### 3. Data Architecture
- `assets/hanoi-official-417-stations.json`: Official Hanoi stations directory (sanitized, 404-414 valid stations, HTML entities decoded).
- `assets/vn-stations-directory.json`: Complete Vietnam station directory (sanitized of non-operational entities).
- `assets/agency-accounts.seed.json` & `.runtime-data/agency-accounts.json`: Dispatcher credential seed and runtime state (sanitized).

---

## Feature Inventory

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Unauthenticated Shift Alert Suppression | Block alert `⏰ THÔNG BÁO HẾT GIỜ KÍP TRỰC BAN` when `!this.currentOfficer` or unauthenticated | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Shift Storage Unit Scoping | Replace global storage keys (`sos_duty_shift`, `SOS_ACTIVE_DUTY_SHIFT`) with `sos_duty_shift_${username}` | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Server Duty Shift Scoping | Map `unitDutyShifts` by username in `server.js`; scope SSE `duty_shift_update` broadcasts | M1 | ORIGINAL_REQUEST §R1 |
| 4 | CSS Modal Gatekeeping | Hide `#dutyShiftModal` and `#substituteOfficerModal` under `body:not(.officer-authenticated)` | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Non-Operational Data Cleansing | Purge 13 non-operational entities from all 5 dataset files and runtime stores | M2 | ORIGINAL_REQUEST §R2 |
| 6 | Search & Directory Filter Guards | Defend `/api/stations/all` and `/api/geocode/suggest` against non-operational entity leaks | M2 | ORIGINAL_REQUEST §R2 |
| 7 | HTML Entity Sanitization | Clean 115 unescaped `&amp;` strings in PCCC station records | M2 | ORIGINAL_REQUEST §R5 |
| 8 | Official 417 Stations Dataset Sync | Verify 100% metadata consistency (name, address, hotline, procedures, maps, GPS) | M2 | ORIGINAL_REQUEST §R5 |
| 9 | Multi-Facility Ward GIS Pins | Display all station pins for multi-facility wards (Ba Đình, Bạch Mai) on map | M3 | ORIGINAL_REQUEST §R3 |
| 10 | Enhanced Station Popup & Distance | Add Haversine distance, procedures, and `[Cơ sở gần nhất]` badge to map popup | M3 | ORIGINAL_REQUEST §R3 |
| 11 | Multi-Facility Incident Drawer | Render full list of ward facilities with distance and procedures in `#activeIncidentDrawer` | M3 | ORIGINAL_REQUEST §R3 |
| 12 | Automatic Nearest Station Assignment | Automatically pick closest facility by Haversine distance for SOS emergency routing | M3 | ORIGINAL_REQUEST §R3 |
| 13 | Cross-Ward Radius Routing (PCCC/CSGT) | Route fire/traffic incidents to closest regional squad by geographic radius across city | M4 | ORIGINAL_REQUEST §R4 |
| 14 | 15-Minute Countdown Timer Engine | Render live 15-minute countdown (`MM:SS`) on dashboard card and drawer; turn red on expiration | M4 | ORIGINAL_REQUEST §R4 |
| 15 | Manual City HQ Escalation Button | Add "Chuyển cấp Thành phố" button and `POST /api/dispatcher/escalate` API | M4 | ORIGINAL_REQUEST §R4 |
| 16 | Comprehensive E2E Playwright Suite | Automated test suite verifying R1-R5 acceptance criteria passing 100% | M5 / Test Track | ORIGINAL_REQUEST §Acceptance |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Duty Shift Isolation & Gatekeeping | Fix alert loop, unit-scoped storage, CSS modal gatekeeping, backend shift scoping | none | PLANNED |
| M2 | Data Sanitization & 417 Sync | Cleanse 13 non-operational entities, decode `&amp;`, sync official dataset, defensive API filters | none | PLANNED |
| M3 | Multi-Facility GIS & Nearest Routing | Map pin multi-display, enhanced popup with badge & km, drawer multi-facility list, auto nearest | M2 | PLANNED |
| M4 | Specialized Squads & 15-Min Escalation | Cross-ward radius routing for PCCC/CSGT, 15-min countdown loop, red alert, escalate button & API | M1, M3 | PLANNED |
| M5 | Final E2E Test Suite & Acceptance Gate | 100% Playwright test pass across all criteria, Review, Challenger, and Forensic Audit pass | M1, M2, M3, M4 | PLANNED |

---

## Interface Contracts

### 1. Duty Shift Contract (`dispatcher` ↔ `server.js`)
- **Storage Key**: `localStorage.getItem("sos_duty_shift_" + username.toLowerCase())`
- **GET `/api/dispatcher/duty-shift`**:
  - Request: Header `Authorization: Bearer <token>` or session officer username query `?username=<username>`.
  - Response: `{ ok: true, dutyShift: { username, officerName, shiftName, startTime, endTime, ... } | null }`.
  - Unauthenticated visitor returns: `{ ok: true, dutyShift: null }`.
- **POST `/api/dispatcher/duty-shift`**:
  - Body: `{ username, officerName, shiftName, startTime, endTime, notes }`.
  - Response: `{ ok: true, dutyShift: { ... } }`.
- **SSE `duty_shift_update`**:
  - Event payload: `{ username, shift: { ... } }`.
  - Client handler: Ignore if `payload.username !== this.currentOfficer.username`.

### 2. Multi-Facility Station Payload Contract (`server.js` ↔ `dispatcher` / `map-controller`)
- In `incident.jurisdiction`:
  ```json
  {
    "localStationId": "st-hn-ca-004-ba-dinh",
    "localStationName": "Công an Phường Ba Đình (Trụ sở chính)",
    "stationAddress": "80 Quán Thánh, Ba Đình, Hà Nội",
    "stationPhone": "02438232907",
    "distanceKm": 0.35,
    "isNearest": true,
    "wardFacilities": [
      {
        "id": "st-hn-ca-004-ba-dinh",
        "name": "Công an Phường Ba Đình (Trụ sở chính)",
        "role": "Trụ sở chính",
        "address": "80 Quán Thánh, Ba Đình, Hà Nội",
        "phone": "02438232907",
        "administrativeProcedures": "Đăng ký thường trú, cấp CCCD, khai báo tạm trú",
        "distanceKm": 0.35,
        "isNearest": true,
        "lat": 21.0401,
        "lng": 105.8392
      },
      {
        "id": "st-hn-ca-005-ba-dinh-cs2",
        "name": "Công an Phường Ba Đình - Cơ sở 2",
        "role": "Cơ sở 2",
        "address": "119 Phan Đình Phùng, Ba Đình, Hà Nội",
        "phone": "02438232908",
        "administrativeProcedures": "Tiếp nhận đơn thư, giải quyết trật tự đô thị",
        "distanceKm": 0.82,
        "isNearest": false,
        "lat": 21.0415,
        "lng": 105.8441
      }
    ]
  }
  ```

### 3. Escalation Engine Contract (`dispatcher` ↔ `server.js`)
- **POST `/api/dispatcher/escalate`**:
  - Body: `{ incidentId: string, escalatedBy: string, reason?: string }`
  - Validation: Incident must exist, officer authenticated.
  - State Mutation:
    - `incident.jurisdiction.previousLevel = incident.jurisdiction.currentLevel`
    - `incident.jurisdiction.currentLevel = 'province'`
    - `incident.jurisdiction.escalatedAt = new Date().toISOString()`
    - `incident.jurisdiction.escalatedBy = officer.username`
    - `incident.escalationStatus = 'ESCALATED_CITY_HQ'`
  - Response: `{ ok: true, incident: { ... } }`
  - Broadcast: WebSocket to City HQ dispatchers (`catphanoi`, `pccchanoi`, `csgthanoi`) and local station.

---

## Code Layout

- `js/dispatcher.js`:
  - Lines ~315–380: Duty clock & alert gatekeeping (Owned by M1)
  - Lines ~1080–1330: Duty shift storage scoping (Owned by M1)
  - Lines ~9410–9430: SSE duty shift event filter (Owned by M1)
  - Lines ~10880–11140: Incident Drawer multi-facility rendering (Owned by M3)
  - Lines ~10500–10850 & Card renderer: 15-minute countdown loop & Escalation UI (Owned by M4)
- `dispatcher.html`:
  - Lines ~40–60: CSS gatekeeping rules (Owned by M1)
  - Lines ~2187–2305: Incident Drawer multi-facility container & Escalation button (Owned by M3, M4)
- `js/map-controller.js`:
  - Lines ~673–892: Multi-facility pin rendering & incident coordinate reference (Owned by M3)
  - Lines ~957–1062: Police station popup HTML with `[Cơ sở gần nhất]` badge (Owned by M3)
- `server.js`:
  - Lines ~588, ~5270–5310: Backend unit duty shift Map & scoped SSE (Owned by M1)
  - Lines ~71–75, ~4900–4950: Station directory load & suggest defense filters (Owned by M2)
  - Lines ~1161–1476: Specialized squad Haversine radius routing (Owned by M4)
  - Lines ~4020–4050, ~4649+: 15-minute countdown escalation & `POST /api/dispatcher/escalate` (Owned by M4)
- `assets/*.json`:
  - Data sanitization & 417 dataset sync (Owned by M2)
- `playwright/`:
  - Test suites & verification scripts (Owned by E2E Testing Track)
