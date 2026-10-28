# Unified Live Zalo Chat Board, Compact Sticky Bot Lifecycle & 34-Province Group Directory Actual Status

Title: Unified Live Zalo Chat Board, Compact Sticky Bot Lifecycle & 34-Province Group Directory
Date: 2026-10-28
Status: P2-A Complete — Proceeding to P2-B (Docker Build & Playwright E2E)
Companion plan: `docs/plans/2026-10-28-zalo-bot-live-chat-unified/2026-10-28-zalo-bot-live-chat-unified-plan.md`
Companion evidence: `docs/plans/2026-10-28-zalo-bot-live-chat-unified/2026-10-28-zalo-bot-live-chat-unified-evidence.md`
Companion benchmark: `docs/plans/2026-10-28-zalo-bot-live-chat-unified/2026-10-28-zalo-bot-live-chat-unified-benchmark.md`

## Purpose

Record the verified baseline of `sos-vietnam-2026` (commit `b34774a`) and the reverse-engineered reference battalion/company desktop application (`C:\Users\dienv\AppData\Local\Programs\QuanLy_TieuDoan_CSCD`) prior to implementing the Unified Live Zalo Chat Board, Compact Sticky Bot Lifecycle, Short `/kn` Pairing Syntax, and 34-Province Collapsible Directory.

## Scope

Target scope:
- `services/zalo-bot-service.js`
- `server.js`
- `Dockerfile`
- `dispatcher.html`
- `js/dispatcher.js`
- `playwright/verify-zalo-bot-dispatch.mjs` & `Reports/qa/playwright/`
- `patches/patch-iot-chip-and-zalo-bot-20261025/` & `patches/SOS_VIETNAM_2026_PATCH_IOT_CHIP_VA_ZALO_BOT_FE_BE_20261025.zip`

Out of scope:
- Unrelated dirty/untracked files in `git status` (`Reports/SLIDE_*`, `scripts/*.py`, `ihanoi-pc-sandbox/`, `.docx` files).

## Relationship / Impact Evidence

| Unit / File / Surface | File Detail Evidence | Related File Count | Relationship Summary | Impact Note |
|-----------------------|----------------------|--------------------|----------------------|-------------|
| `services/zalo-bot-service.js` | `E0-P0A-FD1` | 4 outbound / 1 inbound (`server.js`) | `symbolCount=604`, `exported=6`, `inbound=3`, `outbound=10`, `local=159`, `unresolved=1944`, `linkedFlows=52` | File `high`; `updateConfig` (`CRITICAL`, `d=1`), `getPublicStatus` (`CRITICAL`, `d=2`), `handleIncomingMessage` (`HIGH`, `d=1`) — preserve existing signatures & return keys |
| `server.js` | `E0-P0A-FD2` | 36 outbound refs | `symbolCount=1515`, `inbound=0`, `outbound=36`, `local=142`, `unresolved=6414`, `linkedFlows=24` | File `high`; `getZaloViewerContext` (`LOW`), `performZaloIncidentAccept` (`HIGH`, `d=1`); do NOT alter `broadcastToDispatchers` signature |
| `dispatcher.html` | `E0-P0A-FD3` | 0 graph edges | `parseStatus=parsed`, loads `js/dispatcher.js` | `low` — keep CSP-compliant (no inline `<script>` blocks; respect `img-src`/`media-src`) |
| `js/dispatcher.js` | `E0-P0A-FD4` | Inspected directly (16,881 lines; Zalo section lines 15925–16881) | Calls `/api/dispatcher/zalo/*` and listens to `EventSource('/api/dispatcher/stream')` | Keep additive inside Zalo controller methods & `connectLiveStream()` |
| `playwright/verify-zalo-bot-dispatch.mjs` | `E0-P0A-FD5` | `symbolCount=167` | Existing 21-assertion Zalo E2E suite | Update only after code implementation (`AGENTS.md` Rule 6) |

## Current Status Matrix

| Unit | Current State | Required State | Status | Relationship Count | Evidence | Next Plan Decision |
|------|---------------|----------------|--------|--------------------|----------|--------------------|
| Reference `QuanLy_TieuDoan_CSCD` Zalo architecture | Reverse-engineered `CompanyDesktop.dll` (`ZaloConvEntry`, `ZaloUnitSelectionState`, `ZaloTacticalAssets`) & `company_master.sqlite` (`app_settings` tactical folders + sticky session lifecycle) | Reference model for left tactical folder rail, live chat thread, short unit normalization & sticky session | `correct` (inspected) | External reference | `E0-P0A-REA1` | Use patterns in `P1-A` & `P2-A` |
| Two-Way Live Zalo Chat Board (`zalo-bot-service.js`, `server.js`, `dispatcher.html`, `js/dispatcher.js`) | Only outbound `state.outboxLog` (60 items) exists; inbound Zalo chat messages are discarded unless `/ketnoi` or `/tn`, not streamed via SSE, and dispatchers cannot reply directly to a Zalo thread from Web | Persistent 2-way `chatMessages` + `conversations` ledger, real-time SSE `zalo_live_event`, direct web reply `POST /api/dispatcher/zalo/send-message`, and live split-pane chat UI | `missing` | 4 target files | `E0-P0A-SRC1` | Implement in `P1-A` & `P2-A` |
| Compact Integrated Bot Setup & Continuous Sticky Lifecycle (`zalo-bot-service.js`, `Dockerfile`, `dispatcher.html`, `js/dispatcher.js`) | Config card `1. CẤU HÌNH BOT ZALO TỔNG` stays sprawlingly expanded; Browser Vault lacks `botExplicitlyCleared` guard (can resurrect deleted token if another tab/vault holds it); startup lacks periodic keep-alive watchdog & dual server sticky vault; `Dockerfile` lacks default `SOS_RUNTIME_DATA_DIR` | Compact top bar + auto-collapsed setup drawer when active; dual encrypted server vault + 45s keep-alive watchdog (`setWebhook` / `getUpdates` auto-fallback); token changes **only** on explicit Delete or Reset New Bot | `partial` / `wrong` (vault resurrection risk) | 4 target files | `E0-P0A-SRC2`, `E0-P0A-DKR1` | Fix & upgrade in `P1-A` & `P2-A` |
| Short Group Connection Syntax & 34-Province Collapsible Directory | Verbose `/ketnoi cap_tanan Congan@113` and flat 9-card Cần Thơ preset grid; `vn-diadanh-index.json` (34 `tinh`, 3,467 `xa`) not exposed as collapsible province folders in Zalo modal | Ultra-short `/kn <prov>.<unit> <pass>` (e.g., `/kn ct.tanan Congan@113`, `/kn hcm.saigon Congan@113`, `/kn hn.badinh Congan@113`) + backward-compatible `/ketnoi` + collapsible 34-province accordion (`TP. Cần Thơ`, `TP.HCM`, `Thành phố Hà Nội`, ...) | `partial` | `vn-diadanh-index.json` + 4 target files | `E0-P0A-GEO1` | Implement in `P1-A` & `P2-A` |
| Existing Zalo SOS Routing, Media Storyboard, Quick-Accept & Broadcast | 21/21 E2E assertions passing in `verify-zalo-bot-dispatch.mjs` | Preserve 100% of existing security, routing, media, poster, broadcast, and quick-accept functionality | `correct` | Preserve-only contracts | `E0-P0A-FD1`, `E0-P0A-FD5` | Preserve & re-verify in `P2-B` |

## Status Refresh Log

| Refresh | Date | Repo Basis | Changed Scope | Status Changes | Evidence | Next Phase Update |
|---------|------|------------|----------------|----------------|----------|-------------------|
| R0 | 2026-10-28 | commit `b34774a` | Full Zalo Live Chat + Compact Sticky Bot + Short `/kn` + 34-Province Directory scope | Baseline established via Anvien + REA inspection | `E0-P0A-ANV1`, `E0-P0A-REA1`, `E0-P0A-FD1..FD5`, `E0-P0A-SRC1..2`, `E0-P0A-GEO1`, `E0-P0A-DKR1` | Proceed to `P1-A` |
| R1 | 2026-10-28 | working tree (`P1-A`) | `Dockerfile`, `services/zalo-bot-service.js`, `server.js` | Backend sticky bot dual-vault + 45s watchdog, two-way `chatMessages` & `conversations` + SSE `zalo_live_event`, short `/kn` pairing, and 34-province directory implemented & verified (`correct` on backend) | `E1-P1A-CHK1`, `E1-P1A-API1`, `E1-P1A-ANV1` | Proceed to `P2-A` |
| R2 | 2026-10-28 | commit `15286e7` + `P2-A` | `dispatcher.html`, `js/dispatcher.js`, `patches/patch-iot-chip-and-zalo-bot-20261025/*` | Unified Live Chat Board UI, Compact Sticky Bot Bar, Collapsible 34-Province Accordion, and FE/Gateway patch mirror completed (`correct` on code) | `E2-P2A-FD1`, `E2-P2A-UI1`, `E2-P2A-ANV1` | Proceed to `P2-B` |

## Phase Touch Map

| Unit / File / Surface | Plan-Relevant Relationship File | Relationship to Target | Plan Item | Touch Mode | Evidence | Constraint |
|-----------------------|---------------------------------|------------------------|-----------|------------|----------|------------|
| `services/zalo-bot-service.js` | `services/runtime-data-store.js` | Encrypted JSON persistence | `P1-A` | Edit `zalo-bot-service.js` / `runtime-data-store.js` preserve-only | `E0-P0A-FD1` | Preserve `updateConfig` & `getPublicStatus` return compatibility |
| `server.js` | `services/security-firewall-middleware.js` | Auth & anti-bot routing | `P1-A` | Edit `server.js` / `security-firewall-middleware.js` preserve-only | `E0-P0A-FD2` | Stream `zalo_live_event` only to authenticated dispatchers; do not alter `broadcastToDispatchers` signature |
| `Dockerfile` | `services/runtime-data-store.js`, `services/security-crypto-service.js` | Production container env | `P1-A` | Edit `Dockerfile` | `E0-P0A-DKR1` | Default `SOS_RUNTIME_DATA_DIR=/var/lib/sos-data` |
| `dispatcher.html` & `js/dispatcher.js` | `playwright/verify-zalo-bot-dispatch.mjs` | UI selectors & SSE events | `P2-A` | Edit `dispatcher.html`, `js/dispatcher.js` | `E0-P0A-FD3`, `E0-P0A-FD4` | Preserve key DOM hooks while unifying into single compact hub |
| `patches/patch-iot-chip-and-zalo-bot-20261025/` | Root gateway & FE files | Standalone mirror package | `P2-A` | Sync mirror files & `.zip` | `E0-P0A-FD1` | Keep FE/Gateway patch aligned |

## Implementation Gate

- [x] Target scope is listed in Current Status Matrix.
- [x] Each target unit has a status and evidence IDs.
- [x] Each target file has relationship count & blast-radius evidence from Anvien.
- [x] Phase Touch Map defines touch mode and constraints for all related files.
- [x] Correct parts are marked preserve-only.
- [x] Missing/partial/wrong parts have exact next actions.
- [x] Blockers recorded: none.
- [x] Status Refresh Log has R0 baseline row.

## Final P0 Decision

- [x] P0 complete. Next phase (`P1-A`) can proceed immediately.
