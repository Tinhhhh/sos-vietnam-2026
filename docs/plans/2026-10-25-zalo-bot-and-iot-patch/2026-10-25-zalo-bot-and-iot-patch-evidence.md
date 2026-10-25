# Hierarchical Zalo Bot Dispatch and Standalone IoT/Zalo FE-BE Patch Evidence Ledger

## Metadata

- Date: `2026-10-25`
- Plan: `docs/plans/2026-10-25-zalo-bot-and-iot-patch/2026-10-25-zalo-bot-and-iot-patch-plan.md`
- Evidence: `docs/plans/2026-10-25-zalo-bot-and-iot-patch/2026-10-25-zalo-bot-and-iot-patch-evidence.md`
- Benchmark: `docs/plans/2026-10-25-zalo-bot-and-iot-patch/2026-10-25-zalo-bot-and-iot-patch-benchmark.md`
- Actual status: `docs/plans/2026-10-25-zalo-bot-and-iot-patch/2026-10-25-zalo-bot-and-iot-patch-actual-status.md`

## Evidence Rules

Format: `E<phase>-<item>-<kind><n>`

## E0 - P0 Evidence

Matching plan item(s): `P0-A`

- `E0-P0A-ANV1`: Ran `anvien analyze --force` and `anvien status` at commit `19c1af1` -> `Status: up-to-date` (383 files, 43,697 nodes, `stale: false`).
- `E0-P0A-FD1`: Ran `anvien file-detail server.js --repo sos-vietnam-2026 --json` -> 6 related service files (`runtime-data-store.js`, `security-crypto-service.js`, `security-firewall-middleware.js`, `turn-credentials-service.js`, `national-bando-sync-service.js`, `excel-report-service.js`), 1,343 symbols, `risk: high`.
- `E0-P0A-FD2`: Ran `anvien file-detail js/dispatcher.js --repo sos-vietnam-2026 --json` -> 1 related file (`js/map-controller.js`), `risk: high`.
- `E0-P0A-FD3`: Ran `anvien file-detail dispatcher.html --repo sos-vietnam-2026 --json` -> 0 graph edges, `risk: low`.
- `E0-P0A-IMP1`: Ran `anvien impact symbol "generateMultiChannelDispatch" --repo sos-vietnam-2026 --direction upstream`, `anvien impact symbol "broadcastToDispatchers"`, and `anvien impact symbol "notifyCitizen"` -> `HIGH`/`CRITICAL` scope warnings; existing function signatures will be preserved 100% and only called as consumers.
- `E0-P0A-GIT1`: `git log -n 6 --oneline` confirmed commits `391f0f8..19c1af1` contain the ESP32-C3 SuperMini, 5s 1/2/3 button routing, server-side Vietnamese TTS (`/api/tts/vi`), C4ISR IoT card formatting, and Kit 4G GPS ESP32-C3 TDM2421 (Quectel EG800K) standalone SIM + GNSS integration.
- `E0-P0A-SRC1`: Confirmed `services/zalo-bot-service.js` does not yet exist; `server.js` currently generates only passive `https://zalo.me/` links in `generateMultiChannelDispatch`.
- `E0-P0A-SRC2`: Inspected `server.js` lines 4115-4415 (SOS create + 15-minute escalation timer) and lines 4923-5104 (`/api/dispatcher/accept` & `/api/dispatcher/escalate`).
- `E0-P0A-SEC1`: Inspected `services/security-firewall-middleware.js` lines 23-29 & 158-189 and `server.js` lines 2503-2558 -> `AI_BOT_SIGNATURES` includes `'go-http-client'`, requiring `POST /api/zalo/webhook` and `GET /api/zalo/quick-accept` to be routed with dedicated secret-token / HMAC verification prior to `checkAntiBot`.
- `E0-P0A-FEBE1`: Read-only inspection of `C:\Users\dienv\Desktop\Data4Life\Dự án\sos-vietnam-2026-BE` (`IncidentController.java`, `SecurityConfig.java`, `CreateIncidentRequest.java`, `DispatchRequest.java`, `IncidentService.java`, `EmergencyType.java`, `IncidentResponse.java`) confirmed Java 21 + Spring Boot 3.4.2 package `com.sosvietnam` with `EmergencyType` values `POLICE`, `FIRE`, `AMBULANCE`, `TRAFFIC`.

## E1 - P1 Evidence

Matching plan item(s): `P1-A`, `P1-B`

- `E1-P1A-MOD1`: Created `services/zalo-bot-service.js` (1,307 lines) implementing `createZaloBotService` with persistent config (`zalo-bot-config.json`), 9 built-in `/ketnoi` presets (`cap_tanan`, `cap_ninhkieu`, `cap_longtuyen`, `cap_cairang`, `csgt_cantho`, `pccc_cantho`, `capcuu_cantho`, `chihuy_cantho`, `tongtrucban`), dynamic unit lookup from `AGENCY_ACCOUNTS` & `vn-stations-directory.json`, territorial ward/province/agency isolation (`resolveTargetBindings`), 3-minute nag reminder & 15-minute escalation alerts (plus 20s/45s Fast Demo Mode), HMAC-SHA256 1-tap `quick-accept` URL + mobile confirmation HTML, and dual inbound webhook + `getUpdates` polling. `node --check services/zalo-bot-service.js` exited `0`.
- `E1-P1B-SRV1`: Wired `POST /api/zalo/webhook` & `GET /api/zalo/quick-accept` before `securityFirewall.checkAntiBot` in `server.js`, added authenticated `/api/dispatcher/zalo/{status,config,register-unit,simulate-pair,test-send,unlink}` (plus `/api/zalo/*` aliases), hooked SOS create, auto-escalation, manual escalate, web accept, resolve, fake-alarm, clear-all, and rank-deduplicated `performZaloIncidentAccept`. `node --check server.js` exited `0`.
- `E1-P1B-API1`: Verified `POST /api/zalo/webhook` with `User-Agent: Go-http-client/1.1` returns HTTP `200 OK` without false-positive AI-Bot 403 block, and forged HMAC signature on `GET /api/zalo/quick-accept` is rejected with HTTP `403 Forbidden`.

## E2 - P2 Evidence

Matching plan item(s): `P2-A`

- `E2-P2A-UI1`: Added `#btnHeaderZaloBot` pill in `.header-nav-right-widgets`, `#gearMenuItemZaloBot` in `#gearDropdownMenu`, and `#zaloBotConfigModal` in `dispatcher.html`; implemented `initZaloBotModal()`, `openZaloBotModal()`, `refreshZaloBotStatus()`, `renderZaloBotStatus()`, and `handleZaloAcceptLiveSync()` in `js/dispatcher.js`. `node --check js/dispatcher.js` exited `0`.
- `E2-P2A-PW1`: Executed reusable Playwright E2E suite `node playwright/verify-zalo-bot-dispatch.mjs` against isolated runtime -> **8/8 assertions PASSED** (`Reports/qa/playwright/2026-10-25-zalo-bot-dispatch-qa.json` and `Reports/qa/playwright/2026-10-25-zalo-bot-dispatch-qa.md`), with visual verification of desktop modal screenshot (`Reports/qa/playwright/2026-10-25-zalo-bot-modal-verified.png`) and mobile 1-tap acceptance screenshot (`Reports/qa/playwright/2026-10-25-zalo-quick-accept-mobile.png`).

## E3 - P3 Evidence

Matching plan item(s): `P3-A`

- `E3-P3A-PKG1`: Assembled 16-file standalone patch package in `patches/patch-iot-chip-and-zalo-bot-20261025/` (`01_WEB_HOSTING_GATEWAY_PATCH`, `02_FRONTEND_FE_UPDATE`, `03_BACKEND_BE_SPRINGBOOT_UPDATE` matching `com.sosvietnam` Java 21 Spring Boot 3.4.2 DTOs, `04_FIRMWARE_CHIP_4G_GPS_ESP32C3`, and `HUONG_DAN_TICH_HOP_PATCH_FE_VA_BE.md`) and compressed into `patches/SOS_VIETNAM_2026_PATCH_IOT_CHIP_VA_ZALO_BOT_FE_BE_20261025.zip` (`419,187` bytes).

## Closure Evidence

- `En-CLOSE-1`: Cleaned `.tmp/zalo-qa-runtime`, ran `anvien analyze --force` + `anvien detect-changes --repo sos-vietnam-2026 --scope all`, verified all acceptance criteria, and prepared explicit-path git commit & Render deployment.
