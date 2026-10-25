# Hierarchical Zalo Bot Dispatch and Standalone IoT/Zalo FE-BE Patch Actual Status

Title: Hierarchical Zalo Bot Dispatch and Standalone IoT/Zalo FE-BE Patch
Date: 2026-10-25
Status: Complete
Companion plan: `docs/plans/2026-10-25-zalo-bot-and-iot-patch/2026-10-25-zalo-bot-and-iot-patch-plan.md`
Companion evidence: `docs/plans/2026-10-25-zalo-bot-and-iot-patch/2026-10-25-zalo-bot-and-iot-patch-evidence.md`
Companion benchmark: `docs/plans/2026-10-25-zalo-bot-and-iot-patch/2026-10-25-zalo-bot-and-iot-patch-benchmark.md`

## Purpose

This file records the verified baseline state before implementing the Hierarchical Zalo Bot Dispatch system and packaging the standalone IoT Chip + Zalo Bot FE/BE update patch.

## Scope

Target scope:

- `services/zalo-bot-service.js`
- `server.js`
- `dispatcher.html`
- `js/dispatcher.js`
- `playwright/verify-zalo-bot-dispatch.mjs` & `Reports/qa/playwright/`
- `patches/patch-iot-chip-and-zalo-bot-20261025/` & `patches/SOS_VIETNAM_2026_PATCH_IOT_CHIP_VA_ZALO_BOT_FE_BE_20261025.zip`

Out of scope:

- Unrelated `.docx` / `.pptx` / `video_production` files in the workspace
- Direct commits to external repositories outside `sos_vietnam_2026_web_hosting`

## Relationship / Impact Evidence

| Unit / File / Surface | File Detail Evidence | Related File Count | Relationship Summary | Impact Note |
|-----------------------|----------------------|--------------------|----------------------|-------------|
| `server.js` | `E0-P0A-FD1` | 6 related files | Imports `runtime-data-store.js`, `security-crypto-service.js`, `security-firewall-middleware.js`, `turn-credentials-service.js`, `national-bando-sync-service.js`, `excel-report-service.js` | `high` (`notifyCitizen` / `broadcastToDispatchers` symbols are `CRITICAL` — call-only, preserve signatures) |
| `js/dispatcher.js` | `E0-P0A-FD2` | 1 related file | Imports `js/map-controller.js` | `high` scope warning — keep edits additive inside modal & SSE listener methods |
| `dispatcher.html` | `E0-P0A-FD3` | 0 graph edges | Loads `js/dispatcher.js` and CSS assets | `low` — avoid inline script CSP issues |
| `services/zalo-bot-service.js` | `E0-P0A-SRC1` | 1 planned import (`runtime-data-store.js`) | New modular service | `low` |

## Current Status Matrix

| Unit | Current State | Required State | Status | Relationship Count | Evidence | Next Plan Decision |
|------|---------------|----------------|--------|--------------------|----------|--------------------|
| Kit 4G GPS ESP32-C3 TDM2421 & `/api/hardware-sos` + `/api/tts/vi` | Preserved live on `server.js`, `js/dispatcher.js`, and `hardware/esp32_c3_tdm2421_4g_gps_sos/` AND packaged in standalone FE/BE update patch | Preserve runtime behavior AND include in standalone FE/BE update patch | `correct` | 6 related files | `E0-P0A-GIT1`, `E3-P3A-PKG1` | complete |
| `services/zalo-bot-service.js` | Implemented real Zalo Bot Platform (`bot.zaloplatforms.com`) service with `/ketnoi` binding, 9 presets + dynamic station/account lookup, territorial routing, 2-way `TN` & HMAC quick-accept, 3m nag & 15m escalation (plus 20s/45s Demo mode), webhook + `getUpdates` polling | Real Zalo Bot Platform service | `correct` | 1 related file | `E1-P1A-MOD1`, `E2-P2A-PW1` | complete |
| `server.js` Zalo routes & lifecycle hooks | Public `/api/zalo/webhook` & `/api/zalo/quick-accept` routed before `checkAntiBot`, authenticated `/api/dispatcher/zalo/*` & `/api/zalo/*` management APIs, and SOS create/escalate/accept/resolve hooks wired + rank deduplication | Full server lifecycle & security wiring | `correct` | 7 related files | `E1-P1B-SRV1`, `E1-P1B-API1`, `E2-P2A-PW1` | complete |
| `dispatcher.html` & `js/dispatcher.js` Zalo Bot UI | Header `#btnHeaderZaloBot` pill + Gear menu item + `#zaloBotConfigModal` + live SSE Zalo acceptance toast verified in Playwright E2E | Visual pairing & control modal | `correct` | 1 related file | `E2-P2A-UI1`, `E2-P2A-PW1` | complete |
| Standalone FE + BE Patch Bundle (`patches/`) | Complete 16-file `patches/patch-iot-chip-and-zalo-bot-20261025/` + `patches/SOS_VIETNAM_2026_PATCH_IOT_CHIP_VA_ZALO_BOT_FE_BE_20261025.zip` (419,187 bytes) matching `com.sosvietnam` Java 21 Spring Boot & React 19 Vite FE | Standalone FE + BE + Firmware patch archive | `correct` | 16 package files | `E3-P3A-PKG1` | complete |

## Status Refresh Log

| Refresh | Date | Repo Basis | Changed Scope | Status Changes | Evidence | Next Phase Update |
|---------|------|------------|----------------|----------------|----------|-------------------|
| R0 | 2026-10-25 | commit `19c1af1` | Full Zalo Bot + FE/BE Patch scope | Initial baseline classified | `E0-P0A-ANV1`, `E0-P0A-FD1..FD3`, `E0-P0A-SEC1`, `E0-P0A-FEBE1` | Proceed to `P1-A` |
| R1 | 2026-10-25 | working tree post-P1..P3 | `services/zalo-bot-service.js`, `server.js`, `dispatcher.html`, `js/dispatcher.js`, `patches/` | All `missing` surfaces transitioned to `correct` (8/8 E2E assertions passed; 16-file patch `.zip` verified) | `E1-P1A-MOD1`, `E1-P1B-SRV1`, `E2-P2A-PW1`, `E3-P3A-PKG1` | Proceed to `Pn-A..Pn-C` closure |
| R2 | 2026-10-25 | working tree post-P4 | `services/zalo-bot-service.js`, `server.js`, `dispatcher.html`, `js/dispatcher.js`, `playwright/verify-zalo-bot-dispatch.mjs`, `patches/` | Real Zalo Group `@Bot Vĩnh Nam TN` & `/tn`, `Vĩnh An` officer extraction, natural `/ketnoi Phường Tân An` & Web inline `✏️ Sửa Đơn Vị` verified (13/13 E2E assertions passed; `.zip` 456,008 bytes) | `E4-P4A-FIX1`, `E4-P4B-UI1`, `E4-P4C-PW1` | Close & deploy to Render |

## Phase Touch Map

| Unit / File / Surface | Plan-Relevant Relationship File | Relationship to Target | Plan Item | Touch Mode | Evidence | Constraint |
|-----------------------|---------------------------------|------------------------|-----------|------------|----------|------------|
| `services/zalo-bot-service.js` | `services/runtime-data-store.js` | dependency | `P1-A` | edit (create) / `runtime-data-store.js` preserve-only | `E0-P0A-FD1` | Use `readRuntimeData` / `writeRuntimeData` |
| `server.js` | `services/security-firewall-middleware.js` | security guard | `P1-B` | edit `server.js` / `security-firewall-middleware.js` preserve-only | `E0-P0A-SEC1` | Route `/api/zalo/webhook` & `/api/zalo/quick-accept` before `checkAntiBot` with cryptographic verification |
| `js/dispatcher.js` | `js/map-controller.js` | imported module | `P2-A` | edit `js/dispatcher.js` / `map-controller.js` preserve-only | `E0-P0A-FD2` | Non-blocking toast notifications; no inline script handlers |
| `patches/patch-iot-chip-and-zalo-bot-20261025/` | `sos-vietnam-2026-BE` (`EmergencyType`, `IncidentService`) | contract target | `P3-A` | create in `patches/` / external repos inspect-only | `E0-P0A-FEBE1` | Map step 1->`POLICE`, step 2->`TRAFFIC`, step 3->`FIRE` |

## Detailed Findings

### Security Firewall & Webhook Compatibility (`server.js` + `services/security-firewall-middleware.js`)

Current state:
`checkAntiBot` in `services/security-firewall-middleware.js` (line 28) rejects User-Agents matching `'go-http-client'`, `'python-requests'`, `'curl'`, etc.

Required state:
```text
POST /api/zalo/webhook (verified via X-Bot-Api-Secret-Token when configured) and GET /api/zalo/quick-accept (verified via HMAC-SHA256 signature) must be handled cleanly without false-positive AI-crawler 403 blocks.
```

Evidence: `E0-P0A-SEC1`
Classification: `missing`
Allowed next action: Handle `/api/zalo/webhook` and `/api/zalo/quick-accept` with dedicated token/HMAC verification before `checkAntiBot` in `server.js`.
Forbidden next action: Weakening `AI_BOT_SIGNATURES` globally for unrelated public routes.

## Next Phase Status Decisions

| Plan Item | Actual Status Finding | Required Status / Next-Action Update |
|-----------|-----------------------|--------------------------------------|
| `P1-A` | No Zalo Bot service exists yet; `runtime-data-store.js` ready | Keep `P1-A` unchanged |
| `P1-B` | `checkAntiBot` blocks `go-http-client`; `accept` logic in `/api/dispatcher/accept` can be shared | Route webhook & quick-accept before `checkAntiBot` and share acceptance helper |
| `P2-A` | Header `#gearSettingsWrap` in `dispatcher.html` has clean space for `#btnHeaderZaloBot` pill | Keep `P2-A` unchanged |
| `P3-A` | `sos-vietnam-2026-BE` uses `EmergencyType` (`POLICE`, `TRAFFIC`, `FIRE`, `AMBULANCE`) and `IncidentService` | Match exact `com.sosvietnam` types in BE patch files |

## Implementation Gate

- [x] Target scope is listed in Current Status Matrix.
- [x] Each target unit has a status.
- [x] Each status has evidence IDs.
- [x] Each target file has relationship count evidence from `file-detail` when applicable.
- [x] Phase Touch Map lists plan-relevant relationship files that can affect the current phase/slice.
- [x] Phase Touch Map defines touch mode for every plan-relevant relationship unit that may be affected.
- [x] Correct parts are marked preserve-only.
- [x] Partial, missing, wrong, unbound, and fake-or-stub parts have exact next actions.
- [x] Blockers are recorded, if any (none).
- [x] Next phase status assumptions, next action, and work steps have been updated from this status file when needed.
- [x] Status Refresh Log has an R0 baseline row.

## Final P0 Decision

- [x] P0 complete. Next phase can proceed unchanged.

Decision note:
All baseline graph, security, UI, and external FE/BE schema facts are verified with zero blockers. Proceeding to `P1-A`.
