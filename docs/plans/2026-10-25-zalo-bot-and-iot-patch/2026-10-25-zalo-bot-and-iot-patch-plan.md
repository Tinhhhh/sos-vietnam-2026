# Hierarchical Zalo Bot Dispatch and Standalone IoT/Zalo FE-BE Patch Plan

## Metadata

- Date: `2026-10-25`
- Status: `complete`
- Plan: `docs/plans/2026-10-25-zalo-bot-and-iot-patch/2026-10-25-zalo-bot-and-iot-patch-plan.md`
- Evidence: `docs/plans/2026-10-25-zalo-bot-and-iot-patch/2026-10-25-zalo-bot-and-iot-patch-evidence.md`
- Benchmark: `docs/plans/2026-10-25-zalo-bot-and-iot-patch/2026-10-25-zalo-bot-and-iot-patch-benchmark.md`
- Actual status: `docs/plans/2026-10-25-zalo-bot-and-iot-patch/2026-10-25-zalo-bot-and-iot-patch-actual-status.md`

## Goal

1. Implement the **Hierarchical Zalo Bot Dispatch & Two-Way Field Acceptance System** (`services/zalo-bot-service.js`, `server.js`, `dispatcher.html`, `js/dispatcher.js`) for SOS Vietnam 2026 so that:
   - 1 Central Zalo Bot (`bot.zaloplatforms.com` / `bot-api.zaloplatforms.com`) smartly routes SOS alerts (both Citizen Web PWA and Kit 4G GPS ESP32-C3 TDM2421 Wearable SOS) to the exact registered Zalo `chat_id`s (Group chat or 1-1 officer chat) matching `{ province, ward, agency, level }`.
   - Officers and unit groups self-onboard without exposing personal phone numbers via `/ketnoi <UNIT_CODE>` (e.g., `/ketnoi cap_tanan`, `/ketnoi csgt_cantho`, `/ketnoi pccc_cantho`, `/ketnoi chihuy_cantho`, or any station/account code).
   - Officers away from the command desk (e.g., eating lunch or patrolling) can accept incidents two-way directly from Zalo via a **1-tap HMAC-signed link** (`/api/zalo/quick-accept`) OR by replying **`TN` / `TN <SOS_ID>`** in Zalo chat, immediately transitioning the incident to `dispatching`, stopping PC alarms/timers, updating SSE dispatchers & citizens, and confirming in Zalo.
   - Automatic **3-minute Nag Reminder** (configurable fast Demo Mode: 20s) to the local unit if still `pending`, and **15-minute Escalation Alert** (Demo Mode: 45s) to the Provincial/City HQ Zalo Group.
2. Package the **entire Hardware Signal Chip (ESP32-C3 / TDM2421 4G GPS + Vietnamese TTS) + Zalo Bot Dispatch** upgrade into a **clean, standalone FE + BE Patch Update Package** (`patches/patch-iot-chip-and-zalo-bot-20261025/` and `patches/SOS_VIETNAM_2026_PATCH_IOT_CHIP_VA_ZALO_BOT_FE_BE_20261025.zip`) tailored to both the Node.js Web Hosting Gateway and the main `sos-vietnam-2026-FE` (React 19 + Vite) & `sos-vietnam-2026-BE` (Java 21 + Spring Boot 3.4.2) repositories so the user can hand it directly to his main web team.

## Rules

- Complete P0 actual status before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence as work completes.
- Record benchmarkable counts or measurements when they are taken.
- Keep temporary files strictly inside `.tmp/` within the repo; never create temporary directories directly on `C:\`.
- Run Anvien `analyze --force` and `detect-changes` before committing implementation slices.
- Preserve existing `notifyCitizen` and `broadcastToDispatchers` contracts (`CRITICAL` blast-radius scope warning: call-only, do not alter their signatures).
- Do not stage unrelated pre-existing modified files in the working tree.

## Problem

1. When grassroots officers (e.g., *Công an Phường Tân An*, *CSGT*, *PCCC & CNCH*) step away from the PC command screen (lunch break, field patrol), they may miss live web SOS alerts even though they carry smartphones with Zalo.
2. Collecting personal phone numbers of thousands of officers across 3,321 wards is operationally impractical and breaks Zalo OA follower rules; a zero-phone-number `/ketnoi <MA_DON_VI>` Bot Zalo group/chat binding solves this cleanly.
3. `services/security-firewall-middleware.js` blocks `go-http-client` User-Agents in `checkAntiBot`, which would block inbound Zalo webhook `POST /api/zalo/webhook` unless routed safely with `X-Bot-Api-Secret-Token` verification prior to the generic AI-bot UA filter.
4. The user runs a separate main web stack (`FE` + `BE`) in addition to `sos_vietnam_2026_web_hosting`, so all IoT Chip + Zalo Bot additions must also be exported as a standalone, well-documented FE + BE patch package.

## Scope

- `services/zalo-bot-service.js` (new modular Zalo Bot Platform service)
- `server.js` (Zalo webhook/quick-accept/management routes + SOS create/escalate/accept/resolve hooks)
- `dispatcher.html` (Top-bar `Bot Zalo` trigger button + `#zaloBotConfigModal` pairing & test UI)
- `js/dispatcher.js` (`initZaloBotModal`, token config, `/ketnoi` copy buttons, live connected units list, test & simulate buttons)
- `playwright/verify-zalo-bot-dispatch.mjs` & `Reports/qa/playwright/` (automated end-to-end verification)
- `patches/patch-iot-chip-and-zalo-bot-20261025/` & `patches/SOS_VIETNAM_2026_PATCH_IOT_CHIP_VA_ZALO_BOT_FE_BE_20261025.zip` (standalone FE + BE + Firmware + Gateway update bundle)

## Non-Goals

- Modifying unrelated Data4Life `.docx` / `.pptx` files in the working tree.
- Directly committing to external `C:\Users\dienv\Desktop\Data4Life\Dự án` repositories without explicit request (instead, deliver a clean, self-contained patch bundle inside `patches/` ready for the user to send to his main FE & BE team).

## Requirements

1. **Zalo Bot Platform Integration (`bot.zaloplatforms.com`)**:
   - Outbound `POST https://bot-api.zaloplatforms.com/bot<TOKEN>/sendMessage` (`{ chat_id, text }`, <= 2000 chars).
   - Dual inbound ingress: `POST /api/zalo/webhook` (auto-registered via `setWebhook` when public `https://` origin is available, verified via `secret_token`) + automatic `getUpdates` long-polling fallback when running without HTTPS webhook.
2. **Smart Territorial & Agency Routing**:
   - Match bindings by normalized `{ province, ward, agency, level }` (plus optional `receiveAll` supervisory chat).
   - Built-in preset codes (`cap_tanan`, `cap_longtuyen`, `csgt_cantho`, `pccc_cantho`, `chihuy_cantho`) AND dynamic lookup for all accounts in `AGENCY_ACCOUNTS` and 3,717 stations in `vn-stations-directory.json`.
3. **Two-Way Field Acceptance & Escalation**:
   - 1-tap HMAC-SHA256 signed URL `GET /api/zalo/quick-accept?id=...&chat=...&sig=...` rendering a responsive mobile Vietnamese confirmation screen with 1-tap Google Maps navigation & citizen phone call.
   - Chat reply `TN` or `TN <SOS_ID>` in Zalo group/private chat accepts the incident immediately.
   - 3-minute nag reminder (`⚠️ NHẮC KHẨN LẦN 2`) if still `pending`, and 15-minute escalation notification to Provincial/City HQ Zalo group (plus optional Fast Demo Mode: 20s reminder / 45s escalation).
4. **Standalone FE + BE Patch Bundle**:
   - Self-contained directory & `.zip` archive containing Web Hosting `.patch`, `FE` React/Vite public & API module files, `BE` Spring Boot Java 21 controllers/service + `SecurityConfig` snippet, ESP32-C3 TDM2421 4G GPS firmware, and step-by-step Vietnamese integration manual.

## Acceptance Criteria

- `node --check services/zalo-bot-service.js`, `node --check server.js`, and `node --check js/dispatcher.js` pass with 0 errors.
- End-to-end automated verification proves:
  1. `/ketnoi cap_tanan` binds a Zalo group `chat_id` to *Công An Phường Tân An, TP. Cần Thơ*.
  2. Creating an SOS in Phường Tân An routes only to `cap_tanan` (not unrelated wards), triggers the nag reminder when unaccepted, and escalates to `chihuy_cantho` upon escalation.
  3. Clicking `/api/zalo/quick-accept` OR sending `TN` via `/api/zalo/webhook` transitions the SOS to `dispatching`, cancels nag/escalation timers, and updates `dispatcher.html` in real time.
  4. `#zaloBotConfigModal` opens cleanly on `dispatcher.html`, displays preset `/ketnoi` commands, saves config, and lists linked Zalo chats.
- Standalone patch bundle `patches/SOS_VIETNAM_2026_PATCH_IOT_CHIP_VA_ZALO_BOT_FE_BE_20261025.zip` exists and contains complete FE, BE, Gateway, and Firmware files.

## Checklist

- [x] P0-A: Complete actual status before implementation work.
  - Goal: establish the real current state, Anvien relationship/impact counts, security firewall constraints, and FE/BE target structures.
  - Work Steps: inspect `server.js`, `services/security-firewall-middleware.js`, `dispatcher.html`, `js/dispatcher.js`, and `sos-vietnam-2026-BE` DTOs; record baseline in `actual-status.md`, `evidence.md`, and `benchmark.md`.
  - Implementation Gate: `2026-10-25-zalo-bot-and-iot-patch-actual-status.md` has a final P0 decision.
  - Acceptance: actual status identifies `correct`, `partial`, and `missing` surfaces with exact `E0-P0A-*` evidence IDs.

### P1: Backend Zalo Bot Dispatch Engine & Server Lifecycle Wiring

- Phase Goal: Build `services/zalo-bot-service.js` and wire all webhook, quick-accept, management APIs, and SOS lifecycle hooks into `server.js`.
- Phase Boundary:
  - In scope: `services/zalo-bot-service.js`, `server.js`
  - Out of scope: `dispatcher.html`, `js/dispatcher.js`, `patches/`
  - Dependencies: `P0-A`
- Ordered Slice List:
  - P1-A: Implement `services/zalo-bot-service.js` (routing, `/ketnoi` onboarding, 2-way `TN` & HMAC quick-accept, 3m nag & 15m escalation, webhook + `getUpdates` polling)
  - P1-B: Wire `/api/zalo/*` routes and SOS create/accept/escalate/resolve hooks in `server.js`

- [x] P1-A: Implement `services/zalo-bot-service.js`
  - Goal: Create a self-contained ES module managing Zalo Bot config persistence, unit code resolution, territorial routing, outbound messages, inbound webhook/`getUpdates` command handling, 3-minute nag timers, and HMAC-signed quick-accept tokens.
  - Scope Boundary:
    - Editable: `services/zalo-bot-service.js`
    - Inspect-only: `services/runtime-data-store.js`, `assets/vn-stations-directory.json`
    - Preserve-only: `services/security-firewall-middleware.js`, `services/security-crypto-service.js`
    - Out of scope: `dispatcher.html`, `js/dispatcher.js`
  - Non-Goals: UI modal rendering.
  - Pre-flight Questions:
    - Data source: `readRuntimeData('zalo-bot-config.json', defaultState)` + `AGENCY_ACCOUNTS` + `STATIONS_DB`
    - Display permission: Token masked when returned to non-admin clients; HMAC-SHA256 signature required on `/api/zalo/quick-accept`
    - DB read flow: `readRuntimeData('zalo-bot-config.json')` on startup
    - DB write flow: `writeRuntimeData('zalo-bot-config.json')` on config update or `/ketnoi` / `/huyketnoi`
    - Render location: Mobile HTML confirmation page for `renderQuickAcceptHtml`
    - UI behavior flow: N/A (backend module)
    - Docker runtime: Node 20 runtime compatible (`fetch` built-in, zero external npm deps)
    - Playwright target: Verified via P2-A / P3-B runtime tests
    - Behavior test: Unit + HTTP webhook simulation test
    - Cleanup/quarantine: Test bindings removable via `/api/zalo/unlink`
    - External side effects: Calls `https://bot-api.zaloplatforms.com/bot<TOKEN>/*` when real `botToken` is configured; supports dry-run capture / outbox log for local verification without spamming external APIs
    - N/A notes: UI modal is in P2-A
  - Work Steps:
    1. Implement `ZaloBotService` in `services/zalo-bot-service.js` with persistent config (`botToken`, `webhookSecret`, `demoFastMode`, `reminderSec`, `bindings`, `outboxLog`), Vietnamese tone normalization, preset & dynamic unit lookup, territorial matching (`resolveTargetBindings`), outbound `sendZaloMessage`, 3-minute nag scheduler, 15-minute escalation sender, inbound update parser (`/start`, `/help`, `/ketnoi <code>`, `/huyketnoi`, `/danhsach`, `TN`, `TN <id>`), `getUpdates` background loop, and HMAC quick-accept HTML renderer.
       - UI flow check: Mobile quick-accept HTML includes Google Maps navigation button and `tel:` call button.
       - DB/data flow check: Persists via `writeRuntimeData('zalo-bot-config.json', ...)`.
       - Render location check: `/api/zalo/quick-accept` mobile HTML response.
       - Evidence target: `E1-P1A-MOD1`
  - Implementation Gate: `P0-A` complete and `runtime-data-store.js` interface verified.
  - Acceptance: `node --check services/zalo-bot-service.js` passes with exit code 0.
  - Evidence Targets: `E1-P1A-MOD1`
  - Actual-status Update: `services/zalo-bot-service.js`: `missing -> correct`
  - Commit Boundary: commit together with `P1-B` once server wiring is syntax- and HTTP-verified, or immediately after slice verification.

- [x] P1-B: Wire `/api/zalo/*` endpoints and SOS lifecycle hooks in `server.js`
  - Goal: Connect `zaloBotService` to `server.js` HTTP routes and SOS create / escalate / accept / resolve / clear flows, extracting reusable `acceptIncidentInternal` helper so web accept, Zalo `TN` reply, and Zalo 1-tap quick-accept execute the exact same authoritative acceptance transition.
  - Scope Boundary:
    - Editable: `server.js`
    - Inspect-only: `services/zalo-bot-service.js`, `services/security-firewall-middleware.js`
    - Preserve-only: `notifyCitizen`, `broadcastToDispatchers`, `generateMultiChannelDispatch`
    - Out of scope: `dispatcher.html`, `js/dispatcher.js`
  - Pre-flight Questions:
    - Data source: `incidents` Map + `zaloBotService`
    - Display permission: `POST /api/zalo/webhook` verified by `secret_token` (placed before `checkAntiBot` so `Go-http-client` is allowed); `GET /api/zalo/quick-accept` verified by HMAC signature; `/api/zalo/status`, `/api/zalo/config`, `/api/zalo/test-send`, `/api/zalo/unlink`, `/api/zalo/simulate-webhook` accessible to authenticated dispatchers/admins
    - DB read flow: Reads `incidents.get(id)` and `zaloBotService.getPublicStatus()`
    - DB write flow: Updates `incident` state + `saveIncidentHistory()` + `zaloBotService` state
    - Render location: JSON API + `/api/zalo/quick-accept` HTML
    - UI behavior flow: Accepting via Zalo broadcasts `sos_update` over SSE to all open `dispatcher.html` & citizen screens
    - Behavior test: HTTP API test verifying `/ketnoi`, SOS creation routing, `TN` acceptance, and quick-accept URL
    - Cleanup/quarantine: Test incidents & bindings cleaned after test
    - External side effects: Webhook auto-set when public HTTPS origin is provided
    - N/A notes: Frontend modal in P2-A
  - Work Steps:
    1. Import `createZaloBotService` in `server.js`, wire public `/api/zalo/webhook` & `/api/zalo/quick-accept` before `checkAntiBot`, add authenticated `/api/zalo/*` management endpoints, and hook `zaloBotService.onIncidentCreated`, `onIncidentEscalated`, and `onIncidentAcceptedOrClosed` into SOS create, 15m auto-escalation (supporting `demoFastMode` 45s escalation timer when enabled), manual escalate, accept, resolve, fake-alarm, and clear-all routes.
       - UI flow check: SSE `sos_update` fires immediately on Zalo accept.
       - DB/data flow check: `saveIncidentHistory()` persists Zalo acceptance timeline & dispatcher message.
       - Render location check: `/api/zalo/quick-accept` returns HTTP 200 HTML.
       - Evidence target: `E1-P1B-SRV1`
  - Implementation Gate: `anvien file-detail server.js` and symbol `impact` checks recorded in `E0`.
  - Acceptance: `node --check server.js` passes and local HTTP smoke test confirms `/api/zalo/status`, `/ketnoi`, SOS routing, and 2-way accept.
  - Evidence Targets: `E1-P1B-SRV1`, `E1-P1B-API1`
  - Actual-status Update: `server.js` Zalo hooks: `missing -> correct`
  - Commit Boundary: commit after P1 verification.

### P2: Tactical Dispatcher Zalo Bot Pairing & Control Modal (`dispatcher.html` + `js/dispatcher.js`)

- Phase Goal: Provide an intuitive visual UI right on `dispatcher.html` so the user/admin or ward officer can paste `BOT_TOKEN`, copy `/ketnoi` commands (including 1-click presets for *Công an Phường Tân An*, *CSGT*, *PCCC*, *Chỉ huy Tỉnh*), toggle Fast Demo Timers, view linked Zalo groups/officers, and fire test alerts.
- Phase Boundary:
  - In scope: `dispatcher.html`, `js/dispatcher.js`
  - Out of scope: unrelated modals
  - Dependencies: `P1-B`
- Ordered Slice List:
  - P2-A: Add `#btnHeaderZaloBot` + `#zaloBotConfigModal` in `dispatcher.html` and controller logic in `js/dispatcher.js`

- [x] P2-A: Add Zalo Bot Pairing Button & Modal in `dispatcher.html` and `js/dispatcher.js`
  - Goal: Render a prominent `Bot Zalo` button in the top dispatcher header (plus Gear menu entry) opening `#zaloBotConfigModal` with full token setup, `/ketnoi` command generator, preset unit cards, live linked chats list, test message trigger, and fast demo timer switch.
  - Scope Boundary:
    - Editable: `dispatcher.html`, `js/dispatcher.js`
    - Inspect-only: `css/dispatcher.css`
    - Preserve-only: `js/map-controller.js`
    - Out of scope: Citizen `index.html`
  - Pre-flight Questions:
    - Data source: `GET /api/zalo/status`
    - Display permission: Authenticated officer / admin on `dispatcher.html`
    - DB read flow: `fetch('/api/zalo/status')` when opening modal and after actions
    - DB write flow: `POST /api/zalo/config`, `POST /api/zalo/test-send`, `POST /api/zalo/unlink`, `POST /api/zalo/simulate-pair`
    - Render location: Header `#btnHeaderZaloBot` + `#zaloBotConfigModal`
    - UI behavior flow: Click `Bot Zalo` -> modal opens -> paste token / toggle Demo Mode / copy `/ketnoi cap_tanan` / simulate test or send real Zalo message -> toast + live table update
    - Playwright target: Reusable Playwright verification script `playwright/verify-zalo-bot-dispatch.mjs`
    - Cleanup/quarantine: Clean test bindings/incidents at end of Playwright run
    - External side effects: None during offline simulation; real Zalo API when token saved
    - N/A notes: None
  - Work Steps:
    1. Add `#btnHeaderZaloBot` pill in `dispatcher.html` header, Gear menu item `#gearMenuItemZaloBot`, and `#zaloBotConfigModal` dialog; bump `dispatcher.js` cache-buster query string.
    2. Implement `initZaloBotModal()`, `refreshZaloBotStatus()`, `/ketnoi` copy helpers, preset unit quick-copy/simulate buttons, and `sse` toast feedback when an incident is accepted from Zalo in `js/dispatcher.js`.
       - UI flow check: Modal opens/closes cleanly without inline script CSP violations.
       - DB/data flow check: Config & bindings persist across page reloads.
       - Render location check: `#zaloBotConfigModal` visible and responsive on desktop & mobile.
       - Evidence target: `E2-P2A-UI1`, `E2-P2A-PW1`
  - Implementation Gate: `anvien file-detail js/dispatcher.js` and `dispatcher.html` recorded.
  - Acceptance: `node --check js/dispatcher.js` passes and Playwright E2E test passes with QA report in `Reports/qa/playwright/`.
  - Evidence Targets: `E2-P2A-UI1`, `E2-P2A-PW1`
  - Actual-status Update: `dispatcher.html` & `js/dispatcher.js` Zalo UI: `missing -> correct`
  - Commit Boundary: commit after P2 verification.

### P3: Standalone FE + BE Patch Update Package (`patches/`)

- Phase Goal: Package the complete **Hardware Signal Chip (ESP32-C3 / TDM2421 4G GPS + Vietnamese TTS) + Zalo Bot Dispatch** feature set into a clean, separate update package (`patches/patch-iot-chip-and-zalo-bot-20261025/` + `.zip`) ready for the user to send to his main Web FE (`React 19 + Vite`) and BE (`Java 21 + Spring Boot 3.4.2` / Node Gateway) team.
- Phase Boundary:
  - In scope: `patches/patch-iot-chip-and-zalo-bot-20261025/**`, `patches/SOS_VIETNAM_2026_PATCH_IOT_CHIP_VA_ZALO_BOT_FE_BE_20261025.zip`
  - Out of scope: Modifying external repositories outside `sos_vietnam_2026_web_hosting`
  - Dependencies: `P1-B`, `P2-A`
- Ordered Slice List:
  - P3-A: Generate standalone FE, BE (Spring Boot Java 21 + Node Gateway), Firmware, `.patch` diff, Vietnamese integration guide, and `.zip` bundle

- [x] P3-A: Build Standalone FE + BE + Firmware Patch Update Bundle
  - Goal: Assemble `patches/patch-iot-chip-and-zalo-bot-20261025/` and compress `patches/SOS_VIETNAM_2026_PATCH_IOT_CHIP_VA_ZALO_BOT_FE_BE_20261025.zip` containing unified `.patch` diffs, `02_FRONTEND_FE_UPDATE` (`public/dispatcher.html`, `public/js/dispatcher.js`, React API helpers), `03_BACKEND_BE_SPRINGBOOT_UPDATE` (`HardwareSosController.java`, `ZaloBotController.java`, `VietnameseTtsController.java`, `ZaloBotDispatchService.java`, `SecurityConfig` patch), `04_FIRMWARE_CHIP_4G_GPS_ESP32C3`, and `HUONG_DAN_TICH_HOP_PATCH_FE_VA_BE.md`.
  - Scope Boundary:
    - Editable: `patches/patch-iot-chip-and-zalo-bot-20261025/**`, `patches/SOS_VIETNAM_2026_PATCH_IOT_CHIP_VA_ZALO_BOT_FE_BE_20261025.zip`
    - Inspect-only: `hardware/**`, `server.js`, `services/zalo-bot-service.js`, `dispatcher.html`, `js/dispatcher.js`
    - Preserve-only: External `Data4Life` folder
    - Out of scope: Unrelated presentation docs
  - Pre-flight Questions:
    - Data source: Verified source files from P1 & P2 + commits `391f0f8..HEAD`
    - Display permission: N/A (deliverable archive)
    - DB read/write flow: Documented in `HUONG_DAN_TICH_HOP_PATCH_FE_VA_BE.md`
    - Render location: `patches/` directory & `.zip` bundle
    - Behavior test: Verify `.zip` integrity, verify unified `.patch` non-empty & valid headers, and verify Java Spring Boot classes match `com.sosvietnam` types (`EmergencyType.POLICE`, `EmergencyType.TRAFFIC`, `EmergencyType.FIRE`, `CreateIncidentRequest`, `DispatchRequest`, `IncidentService`)
    - Cleanup/quarantine: Remove any `.tmp/` scratch files after packaging
    - External side effects: Push committed code to `origin main` (Render)
    - N/A notes: None
  - Work Steps:
    1. Export unified git patch (`5604a20..HEAD`) + organize `01_WEB_HOSTING_GATEWAY_PATCH`, `02_FRONTEND_FE_UPDATE`, `03_BACKEND_BE_SPRINGBOOT_UPDATE`, `04_FIRMWARE_CHIP_4G_GPS_ESP32C3`, and `HUONG_DAN_TICH_HOP_PATCH_FE_VA_BE.md`, then create `SOS_VIETNAM_2026_PATCH_IOT_CHIP_VA_ZALO_BOT_FE_BE_20261025.zip`.
       - UI flow check: N/A (patch package)
       - DB/data flow check: N/A
       - Render location check: `patches/` file inventory verified
       - Evidence target: `E3-P3A-PKG1`
  - Implementation Gate: `P1` and `P2` verified.
  - Acceptance: Patch directory and `.zip` archive verified complete and syntax-valid.
  - Evidence Targets: `E3-P3A-PKG1`
  - Actual-status Update: `patches/` bundle: `missing -> correct`
  - Commit Boundary: commit and push to `origin main`.

- [x] Pn-A: Supervisor acceptance review of implemented plan, evidence, benchmark, and patch package.
  - Goal: Verify all acceptance criteria, Anvien `detect-changes`, runtime E2E QA report, and standalone FE/BE patch bundle completeness.
  - Work Steps: Review every changed file, QA report, and patch archive against user requirements.
  - Implementation Gate: `P1-A`..`P3-A` complete.
  - Acceptance: All checks pass with zero regressions.
- [x] Pn-B: Remove dead work or temporary scratch artifacts created during this plan.
  - Goal: Ensure clean working tree for all plan-touched paths.
  - Work Steps: Clean `.tmp/` temporary test files and verify `git status`.
  - Implementation Gate: `Pn-A` passed.
  - Acceptance: Zero dead artifacts in diff.
- [x] Pn-C: Close the plan, commit, and deploy to Render (`origin main`).
  - Goal: Run final `anvien analyze --force` + `anvien detect-changes`, commit, push to `origin main`, and verify live HTTP 200 on Render.
  - Work Steps: Record closure evidence, commit, push, and verify live endpoint.
  - Implementation Gate: `Pn-B` passed.
  - Acceptance: Final commit pushed and plan marked `complete`.

### P4: Real-Zalo Group Field Feedback Fixes (Multi-Word `@Bot` `TN`, Officer Name Auto-Extraction & Exact Ward Assignment)

- [x] P4-A: Fix Multi-Word `@Bot Vĩnh Nam TN` & `/tn` Group Commands, Real Officer Name Extraction, Escalated Acceptance & Exact GPS Ward Alert Labels (`services/zalo-bot-service.js`, `server.js`)
  - Goal: Ensure `@Bot Vĩnh Nam TN` and `/tn` work reliably in real Zalo Groups, extract `from.display_name` (e.g. `Vĩnh An`) into `dispatchUnit` for both chat & 1-tap link accepts, support natural Vietnamese ward names in `/ketnoi <Phường/Xã, Tỉnh>` plus `POST /api/dispatcher/zalo/update-binding`, allow Ward units to accept `escalated` incidents if still unaccepted, protect `/api/zalo/quick-accept` from link-preview crawlers, and always display exact GPS Polygon Ward & Station in Zalo alerts.
  - Acceptance: `node --check services/zalo-bot-service.js` and `node --check server.js` pass with 0 errors.
- [x] P4-B: Add Inline Connected-Group Unit/Ward Editor on Dispatcher UI (`dispatcher.html`, `js/dispatcher.js`)
  - Goal: Allow dispatchers/admins to edit a connected Zalo Group's custom title (e.g. `Trực Ban CA Phường Tân An`), Officer Name, Province, Ward/Commune, and Agency directly from `NHÓM / CÁN BỘ ĐÃ LIÊN KẾT` in 1 click, notifying the Zalo Group immediately.
  - Acceptance: `node --check js/dispatcher.js` passes and UI renders inline edit controls cleanly.
- [x] P4-C: Regression Verification (`playwright/verify-zalo-bot-dispatch.mjs`), Sync Standalone Patch ZIP & Deploy to Render
  - Goal: Verify all new real-Zalo behaviors in Playwright E2E suite, update `patches/patch-iot-chip-and-zalo-bot-20261025/` + `.zip`, run Anvien `analyze --force` + `detect-changes`, commit, and push to `origin/main`.
  - Acceptance: All Playwright assertions pass, `.zip` updated, and Render deploys latest commit.

### P5: Tactical Broadcast & Emergency System Notice Composer (Blast to All Connected Zalo Units)

- [x] P5-A: Implement `broadcastAnnouncement` in `services/zalo-bot-service.js` and `POST /api/dispatcher/zalo/broadcast` in `server.js`
  - Goal: Enable composing and blasting emergency directives, maintenance schedules, system updates, or severe weather alerts straight to all (or filtered by force/province) connected Zalo groups & officers (`chatId`-deduplicated), plus optional live SSE broadcast (`system_announcement`) to active Web Dispatcher consoles.
  - Work Steps:
    1. Add `broadcastAnnouncement({ category, title, message, senderLabel, targetScope, provinceFilter })` in `services/zalo-bot-service.js` with Vietnam timezone formatting, unique `chatId` deduplication, outbox logging (`stage: 'system_broadcast'`), and delivery summary counts.
    2. Add `POST /api/dispatcher/zalo/broadcast` and `/api/zalo/broadcast` in `server.js` with `securityFirewall.authenticate`, sender resolution from `req.officer`, and optional `broadcastToDispatchers('system_announcement', ...)`.
  - Implementation Gate: Anvien `analyze --force`, `file-detail`, and `impact` verified for `services/zalo-bot-service.js` and `server.js`.
  - Acceptance: `node --check services/zalo-bot-service.js` and `node --check server.js` exit `0`.
- [x] P5-B: Add Visual Broadcast & Maintenance Notice Composer UI in `dispatcher.html` and `js/dispatcher.js`
  - Goal: Render a prominent "PHÁT THÔNG BÁO KHẨN / BẢO TRÌ HỆ THỐNG TỚI TOÀN BỘ ZALO ĐƠN VỊ" section inside `#zaloBotConfigModal` with 1-click quick templates (Bảo trì & Cập nhật, Công điện trực chiến khẩn, Cảnh báo Thiên tai/Mưa bão, Hoàn tất nâng cấp), target scope selector (`Toàn bộ`, `Công an Xã/Phường`, `CSGT`, `PCCC`, `Y tế 115`, `Chỉ huy Tỉnh`), title & content inputs, live target count badge, 1-click blast button, and live SSE `system_announcement` banner/toast on `js/dispatcher.js`.
  - Work Steps:
    1. Add the Broadcast Composer card in `dispatcher.html` inside `#zaloBotConfigModal` and bump script cache-buster to `?v=20261025_zalo_bot_v4`.
    2. Wire template preset chips, live recipient count calculation, `POST /api/dispatcher/zalo/broadcast` submission, outbox refresh, and `system_announcement` SSE listener in `js/dispatcher.js`.
  - Implementation Gate: `P5-A` completed and `dispatcher.html` blast radius verified (`LOW`).
  - Acceptance: `node --check js/dispatcher.js` exits `0` and UI renders & submits cleanly.
- [x] P5-C: Playwright E2E Verification (`playwright/verify-zalo-bot-dispatch.mjs`), Sync Standalone Patch ZIP & Deploy to Render
  - Goal: Add E2E assertions verifying 1-click Maintenance/Emergency Broadcast blasts straight to all connected Zalo groups (`totalMatched`, `outboxLog` entries with `[THÔNG BÁO BẢO TRÌ & CẬP NHẬT HỆ THỐNG]`) and triggers SSE `system_announcement`, sync `patches/patch-iot-chip-and-zalo-bot-20261025/` (including React `ZaloBotConfigModal.jsx`, `zaloBotApi.js`, and Spring Boot `ZaloBotController.java` + `ZaloBotDispatchService.java`) + `.zip`, run Anvien `detect-changes`, commit, and push to `origin/main`.
  - Work Steps:
    1. Extend `playwright/verify-zalo-bot-dispatch.mjs` and run full E2E verification.
    2. Sync all patch files and rebuild `patches/SOS_VIETNAM_2026_PATCH_IOT_CHIP_VA_ZALO_BOT_FE_BE_20261025.zip`.
    3. Run `anvien analyze --force` + `anvien detect-changes`, commit explicit paths, push to `origin/main`, and restart local server on port `3000`.
  - Implementation Gate: `P5-A` and `P5-B` completed.
  - Acceptance: All Playwright E2E assertions pass (`0 failed`), `.zip` updated, and commit pushed to `origin/main`.

### P6: Dispatcher Password Authentication Gate on Zalo `/ketnoi` Onboarding

- [x] P6-A: Enforce Dispatcher Password Authentication & Brute-Force Protection on `/ketnoi` (`services/zalo-bot-service.js`, `server.js`)
  - Goal: Prevent unauthorized Zalo groups/units from binding to National Command (`tongtrucban`) or other units' SOS channels by requiring the target unit's Web Dispatcher password on `/ketnoi` (`Admin` for `tongtrucban`, `Congan@113` for Police, `Csgt@113` for CSGT, `Pccc@114` for PCCC, `Capcuu@115` for 115, `Cuuhoxe@113` for Traffic Rescue, plus `AGENCY_ACCOUNTS` custom `passwordHash` and optional per-unit `unitPasswords` override).
  - Work Steps:
    1. Import `defaultPasswordForAccount` (`services/agency-password-policy.js`) and `securityCryptoService` (`services/security-crypto-service.js`) in `services/zalo-bot-service.js`; implement `resolveDefaultPasswordForUnit`, `verifyUnitPairingPassword`, `parseKetnoiCommandArgs` (supporting `/ketnoi <code> <pass>`, `/ketnoi <Phường, Tỉnh> <pass>`, and `|` pipe syntax), and per-`chatId` brute-force lockout (`5` wrong attempts / `10` minutes).
    2. Mask cross-role/Admin pairing passwords in `getPublicStatus(viewerCtx)` for non-admin Web officers, enforce RBAC on `simulate-pair` & `update-binding` in `server.js`, and include pairing password in `/api/dispatcher/zalo/register-unit` command output.
  - Implementation Gate: Anvien `analyze --force`, `file-detail`, and `impact` verified for `services/agency-password-policy.js`, `services/zalo-bot-service.js`, and `server.js`.
  - Acceptance: `node --check services/zalo-bot-service.js` and `node --check server.js` exit `0`.
- [x] P6-B: Update Dispatcher Zalo Modal UI with Password-Protected `/ketnoi` Commands & Custom Unit Password (`dispatcher.html`, `js/dispatcher.js`)
  - Goal: Display password-authenticated `/ketnoi <mã> <mật_khẩu>` commands on `#zaloBotConfigModal` (respecting role visibility), add `#chkZaloRequirePairingPassword` security toggle in Step 1, and allow optional custom per-unit password override in Inline Unit Editor (`✏️ Sửa Đơn Vị`).
  - Acceptance: `node --check js/dispatcher.js` exits `0` and UI copies full `/ketnoi <unitCode> <password>` commands cleanly.
- [x] P6-C: Playwright Security E2E Verification (`playwright/verify-zalo-bot-dispatch.mjs`), Sync Standalone Patch ZIP & Deploy to Render
  - Goal: Verify missing-password rejection, wrong-password rejection (e.g., Ward password `Congan@113` rejected on `tongtrucban`), valid-password acceptance (`Admin` on `tongtrucban`, `Congan@113` on `cap_tanan`), sync `patches/patch-iot-chip-and-zalo-bot-20261025/` + `.zip`, run Anvien `detect-changes`, commit, and push to `origin/main`.
  - Acceptance: All `15/15` Playwright E2E assertions pass (`0 failed`), `.zip` updated, and commit pushed to `origin/main`.

## Risk Notes

- **Zalo Webhook Anti-Bot Filter**: `services/security-firewall-middleware.js` blocks `go-http-client` User-Agent. Placing `POST /api/zalo/webhook` (authenticated via `X-Bot-Api-Secret-Token` header) and `GET /api/zalo/quick-accept` (authenticated via HMAC-SHA256 signature) before `checkAntiBot` eliminates false-positive 403 blocks while keeping strict cryptographic authentication.
- **Unrelated Working Tree Edits**: Pre-existing unstaged changes in `.docx` / video scripts must remain untouched; stage explicit file paths only (`git add services/zalo-bot-service.js server.js dispatcher.html js/dispatcher.js playwright/... Reports/... patches/... docs/plans/...`).
