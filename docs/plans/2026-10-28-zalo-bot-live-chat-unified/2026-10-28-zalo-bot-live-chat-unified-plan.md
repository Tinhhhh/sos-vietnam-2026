# Unified Live Zalo Chat Board, Compact Sticky Bot Lifecycle & 34-Province Group Directory Plan

## Metadata

- Date: `2026-10-28`
- Status: `in_progress`
- Plan: `docs/plans/2026-10-28-zalo-bot-live-chat-unified/2026-10-28-zalo-bot-live-chat-unified-plan.md`
- Evidence: `docs/plans/2026-10-28-zalo-bot-live-chat-unified/2026-10-28-zalo-bot-live-chat-unified-evidence.md`
- Benchmark: `docs/plans/2026-10-28-zalo-bot-live-chat-unified/2026-10-28-zalo-bot-live-chat-unified-benchmark.md`
- Actual status: `docs/plans/2026-10-28-zalo-bot-live-chat-unified/2026-10-28-zalo-bot-live-chat-unified-actual-status.md`

## Goal

Upgrade and deploy (`https://sos-vietnam-2026.onrender.com/`) the Zalo Bot integration into a **Unified Live Zalo Chat & Tactical Bot Hub**, modeled on the persistent session & tactical conversation-rail architecture of `C:\Users\dienv\AppData\Local\Programs\QuanLy_TieuDoan_CSCD`:

1. **Live Two-Way Zalo Chat Board (`Bảng Chat Zalo Trực Tiếp`)**:
   - Capture, persist, and stream via SSE (`zalo_live_event`) **both inbound and outbound** Zalo messages (conversational group/user messages, photos/stickers/attachments, `/kn` & `/ketnoi` commands, `/tn` acceptances, SOS dispatch alerts, mass broadcasts, and direct dispatcher web replies).
   - Provide a live conversation rail (with tactical folders: `Tất cả`, `Chưa đọc`, `Xã/Phường`, `Tỉnh/Chuyên ngành`, `Chưa gắn`) alongside a real-time chat thread and direct reply composer (`POST /api/dispatcher/zalo/send-message`) so dispatchers can view live Zalo messages and reply directly from the web dashboard.
2. **Compact Integrated "Thêm Bot Zalo" Control + Continuous Sticky Bot Lifecycle**:
   - Integrate the "Thêm / Đặt lại Bot Zalo" configuration cleanly into **one compact top bar + collapsible inline drawer** inside the unified Zalo hub instead of sprawling separate configuration cards.
   - Guarantee continuous sticky bot persistence (`zalo-bot-config.json` + redundant encrypted `zalo-bot-sticky-vault.json` + Browser Vault `sos_zalo_bot_vault_v1` + 45s background health/keep-alive watchdog with automatic `setWebhook` / `getUpdates` fallback + `Dockerfile` `SOS_RUNTIME_DATA_DIR=/var/lib/sos-data` default) so the configured bot stays active continuously and **only** changes when the user explicitly clicks **Xóa Bot** (`clearToken: true`, setting `botExplicitlyCleared: true` so vaults never resurrect a deleted bot) or **Đặt lại Bot mới** (explicit new `botToken`).
3. **Short, Memorable Group Connection Syntax + Collapsible 34-Province/City Accordion Directory**:
   - Support ultra-short, easy-to-remember connection commands `/kn <shortCode> <password>` and `kn <shortCode> <password>` (e.g., `/kn ct.tanan Congan@113`, `/kn hcm.saigon Congan@113`, `/kn hn.badinh Congan@113`, `/kn ct.csgt Csgt@113`) while keeping 100% backward compatibility with `/ketnoi ...` and preserving strict dispatcher password verification (`requirePairingPassword`) + brute-force lockout.
   - Organize all 34 provinces/cities (`TP. Cần Thơ`, `TP.HCM`, `Thành phố Hà Nội`, `TP. Đà Nẵng`, `TP. Hải Phòng`, `TP. Huế`, and all 28 remaining provinces from `assets/vn-diadanh-index.json` + `assets/vn-stations-directory.json`) into **collapsible accordion folder sections** ("sổ dạng mục"), each expanding to show Provincial Command / Specialized units (`Chỉ Huy CA`, `CSGT`, `PCCC & CNCH`, `Cấp Cứu 115`) and Ward/Commune Police (`Công An Phường/Xã`) with 1-click short command copy and instant search.
4. **Full Docker Build, Playwright E2E Verification, Standalone Patch Sync & Render Deployment**:
   - Build the production Docker image, verify all existing and new behaviors via Playwright against the mounted container runtime, sync the `patches/patch-iot-chip-and-zalo-bot-20261025/` mirror, pass Supervisor review, commit cleanly without touching pre-existing unrelated worktree files, and push to `origin/main` (`https://sos-vietnam-2026.onrender.com/`).

## Rules

- Complete `P0` actual status with Anvien `file-detail` + `impact` evidence before editing runtime code.
- Update each checklist item immediately as it completes, recording evidence in `evidence.md` and metrics in `benchmark.md`.
- Keep all temporary files inside repo-local `.tmp/` (`c:\Users\dienv\Desktop\sos_vietnam_2026_web_hosting\.tmp\`); never create temp folders on `C:\`.
- **Blast-Radius Warning Discipline (`HIGH` / `CRITICAL`)**: `updateConfig`, `getPublicStatus`, `handleIncomingMessage`, and `performZaloIncidentAccept` carry `HIGH`/`CRITICAL` Anvien upstream blast-radius warnings. Keep all signature/return extensions strictly backward-compatible and do not modify `broadcastToDispatchers` or `notifyCitizen` signatures.
- **Code first**: Update `playwright/verify-zalo-bot-dispatch.mjs` only after runtime code implementation in `P1` and `P2-A` is complete.
- Validate UI & API behavior on the real built Docker container runtime via Playwright, saving `.json` and `.md` evidence under `Reports/qa/playwright/`.
- Run `anvien analyze --force` and `anvien detect-changes --repo sos-vietnam-2026 --scope all` before every implementation commit.
- Never stage or revert unrelated pre-existing dirty files in `git status`.

## Invariant Family Map

- **Family Name**: `ZaloBotUnifiedLiveChatAndStickyLifecycle`
- **Authority Source**: User requirements (2026-10-28), `AGENTS.md`, reference desktop binary `QuanLy_TieuDoan_CSCD` (`CompanyDesktop.dll` `ZaloConvEntry`, `ZaloUnitSelectionState`, `ZaloTacticalAssets`), and `docs/plans/2026-10-25-zalo-bot-and-iot-patch/`.
- **Primary Runtime Surfaces**:
  - `services/zalo-bot-service.js`
  - `server.js`
  - `dispatcher.html`
  - `js/dispatcher.js`
  - `Dockerfile`
- **Sibling Surfaces**:
  - `patches/patch-iot-chip-and-zalo-bot-20261025/01_WEB_HOSTING_GATEWAY_PATCH/{server.js,services/zalo-bot-service.js}`
  - `patches/patch-iot-chip-and-zalo-bot-20261025/02_FRONTEND_FE_UPDATE/public/{dispatcher.html,js/dispatcher.js}`
  - `patches/patch-iot-chip-and-zalo-bot-20261025/02_FRONTEND_FE_UPDATE/src/features/zalo-bot/{zaloBotApi.js,ZaloBotConfigModal.jsx}`
- **Forbidden Legacy Fallback / Anti-Patterns**:
  - Wiping or mutating `state.botToken` on transient Zalo HTTP errors, timeouts, empty token form saves, or unrelated setting toggles.
  - Resurrecting an explicitly deleted bot from `localStorage` vault when `botExplicitlyCleared === true`.
  - Dropping non-command inbound Zalo group/officer chat messages instead of persisting and streaming them to the Live Chat board.
  - Bypassing `requirePairingPassword` on `/kn` short commands when password protection is enabled.
- **Verify Matrix**:
  1. Primary path: Inbound Zalo webhook text/photo message -> stored in `chatMessages` -> streamed via SSE `zalo_live_event` -> rendered live in `#zaloLiveChatMessagesList` -> Dispatcher replies via `#inputZaloLiveChatReply` -> delivered via `POST /api/dispatcher/zalo/send-message` and rendered in thread.
  2. Sticky Bot lifecycle path: Configure token -> auto-collapses compact bot setup bar -> persists across config edits & container restart rehydration -> explicit Delete (`#btnClearZaloBotToken`) sets `botExplicitlyCleared: true` and does NOT resurrect on reload -> explicit Reset with new token switches bot cleanly.
  3. Short group pairing & 34-Province accordion path: Expand `TP. Cần Thơ`, `TP.HCM`, `Thành phố Hà Nội` accordion sections -> copy `/kn ct.tanan Congan@113` / `/kn hcm.saigon Congan@113` / `/kn hn.badinh Congan@113` -> reject wrong/missing password -> pair group via `/kn` -> route SOS & accept via `/tn` and quick-accept link.

## Scope

- `services/zalo-bot-service.js`
- `server.js`
- `Dockerfile`
- `dispatcher.html`
- `js/dispatcher.js`
- `playwright/verify-zalo-bot-dispatch.mjs` & `Reports/qa/playwright/`
- `patches/patch-iot-chip-and-zalo-bot-20261025/` & `patches/SOS_VIETNAM_2026_PATCH_IOT_CHIP_VA_ZALO_BOT_FE_BE_20261025.zip`

## Non-Goals

- Modifying citizen SOS reporting UI (`index.html` / `js/app.js`), which already supports photo/video storyboard forwarding.
- Touching unrelated `.docx`, `.pptx`, `Reports/SLIDE_*`, `scripts/*.py`, or `ihanoi-pc-sandbox/` files in the workspace.

## Acceptance Criteria

1. `node --check services/zalo-bot-service.js`, `node --check server.js`, and `node --check js/dispatcher.js` exit `0`.
2. Production Docker image builds cleanly (`docker build`) and passes `/healthz` without requiring manual `SOS_RUNTIME_DATA_DIR` / secret workarounds.
3. Live Zalo Chat Board displays real-time inbound & outbound Zalo messages via SSE (`zalo_live_event`) without page reload and allows dispatchers to send direct replies into any connected/discovered Zalo conversation.
4. "Thêm Bot Zalo" is compactly integrated into the unified Zalo hub header drawer, locks into continuous sticky mode once configured, survives restarts/reloads, and changes **only** on explicit Delete Bot or Reset New Bot (never resurrecting after explicit Delete).
5. Short commands (`/kn ct.tanan Congan@113`, `kn hcm.saigon Congan@113`, `/kn hn.badinh Congan@113`, plus legacy `/ketnoi ...`) enforce dispatcher password auth and bind groups accurately; the collapsible Province/City accordion renders all 34 provinces/cities (`TP. Cần Thơ`, `TP.HCM`, `Thành phố Hà Nội`, etc.).
6. Reusable Playwright QA suite passes 100% of original + new assertions against the built Docker container, Supervisor review yields `PASS`, and changes are committed cleanly and pushed to `origin/main` (`https://sos-vietnam-2026.onrender.com/`).

## Checklist

- [x] P0-A: Complete actual status, REA reference inspection, and Anvien blast-radius baseline before coding.
  - Goal: Verify `QuanLy_TieuDoan_CSCD` Zalo reference architecture, current `sos-vietnam-2026` Zalo gaps, and Anvien `file-detail` + `impact` blast radius.
  - Implementation Gate: `2026-10-28-zalo-bot-live-chat-unified-actual-status.md` completed with `E0-P0A-*` evidence IDs.
  - Acceptance: All target files/symbols classified (`correct`, `partial`, `missing`, `wrong`) with `Final P0 Decision` checked.

### P1: Backend Sticky Bot Watchdog, Two-Way Live Chat Stream, Short `/kn` Syntax & 34-Province Directory

- Phase Goal: Upgrade `services/zalo-bot-service.js`, `server.js`, and `Dockerfile` with continuous dual-vault sticky bot persistence + 45s keep-alive watchdog, two-way `chatMessages` & `conversations` ledger with SSE `zalo_live_event`, direct web-to-Zalo `sendChatMessage`, short `/kn <prov>.<unit>` pairing aliases, and the 34-province grouped directory API.
- Phase Boundary:
  - Editable: `services/zalo-bot-service.js`, `server.js`, `Dockerfile`
  - Inspect/Preserve-only: `services/runtime-data-store.js`, `services/security-crypto-service.js`, `assets/vn-diadanh-index.json`, `assets/vn-stations-directory.json`
  - Out of scope: `dispatcher.html`, `js/dispatcher.js`, `playwright/`
  - Dependencies: `P0-A`

- [x] P1-A: Implement continuous sticky bot persistence, two-way live chat ledger, short `/kn` pairing & 34-province directory in `services/zalo-bot-service.js`, `server.js`, and `Dockerfile`.
  - Goal: Close backend lifecycle, live chat, short pairing, and province directory contracts while keeping 100% backward compatibility on `updateConfig`, `getPublicStatus`, and `handleIncomingMessage`.
  - Work Steps:
    1. Add dual-vault persistence (`zalo-bot-config.json` + `zalo-bot-sticky-vault.json`), `botExplicitlyCleared` resurrection guard, and 45s background keep-alive watchdog (`startBotKeepAliveWatchdog`) in `services/zalo-bot-service.js`, plus production `SOS_RUNTIME_DATA_DIR=/var/lib/sos-data` safe runtime defaults in `Dockerfile` / `services/`.
    2. Add `state.chatMessages` (300-message ring buffer) + `state.conversations` (`ZaloConvEntry`-style metadata with `unreadCount`, `folder`, `isBound`), record all inbound messages (commands + regular chat + photos/stickers) and all outbound messages, implement `getChatBoardState`, `sendDispatcherChatMessage`, and `markConversationRead`, and emit `onLiveEvent` hooks.
    3. Add short command prefixes (`/kn`, `kn`, `/ghep`) + deterministic `<provCode>.<unitSlug>` short codes (`ct.tanan`, `ct.csgt`, `hcm.saigon`, `hn.badinh`, etc.) and `getProvinceDirectory(viewerCtx)` covering all 34 provinces/cities (`TP. Cần Thơ`, `TP.HCM`, `Thành phố Hà Nội`, ...) with Provincial Command/Specialized + Ward units.
    4. Wire `broadcastZaloLiveEvent` (authenticated dispatcher SSE `zalo_live_event`) and routes `GET /api/dispatcher/zalo/messages`, `POST /api/dispatcher/zalo/send-message`, `POST /api/dispatcher/zalo/mark-read`, and `GET /api/dispatcher/zalo/directory` (plus `/api/zalo/*` aliases) in `server.js`.
  - Acceptance: `node --check services/zalo-bot-service.js` and `node --check server.js` exit `0`; direct API smoke check confirms sticky bot rules, live chat history, `/kn` short pairing + password gate, and 34-province directory output.

### P2: Unified Live Zalo Chat UI, Compact Bot Bar, Collapsible Province Accordion & Docker Playwright E2E

- Phase Goal: Redesign `#zaloBotConfigModal` in `dispatcher.html` and `js/dispatcher.js` into a unified Live Zalo Chat + Compact Bot Bar + 34-Province Accordion hub, sync sibling patch files, build the Docker image, and validate end-to-end with Playwright.
- Phase Boundary:
  - Editable: `dispatcher.html`, `js/dispatcher.js`, `playwright/verify-zalo-bot-dispatch.mjs`, `patches/patch-iot-chip-and-zalo-bot-20261025/`
  - Dependencies: `P1-A`

- [x] P2-A: Implement Unified Zalo Live Chat Board, Compact Integrated Bot Drawer & Collapsible 34-Province Directory UI in `dispatcher.html` and `js/dispatcher.js` (plus `patches/` sync).
  - Goal: Deliver a clean, single-hub tactical Zalo experience with live SSE chat bubbles, direct reply input, compact collapsible bot setup bar (auto-locked when active; explicit Delete/Reset only), and collapsible `TP. Cần Thơ` / `TP.HCM` / `Thành phố Hà Nội` / 34-province accordion folders.
  - Work Steps:
    1. Upgrade `#zaloBotConfigModal` in `dispatcher.html` with the Compact Sticky Bot Header Bar + collapsible `#zaloCompactBotSetupDrawer`, Left Tactical Rail (tabs for `💬 Hội thoại & Nhóm`, `📂 Sổ Kết Nối 34 Tỉnh/TP`, `📢 Công Điện Chung`), and Right Live Zalo Chat Board (`#zaloLiveChatMessagesList` + `#inputZaloLiveChatReply` + `#btnSendZaloLiveChatReply`), preserving existing DOM IDs for backward compatibility.
    2. Upgrade `js/dispatcher.js` to listen to SSE `zalo_live_event`, render real-time inbound/outbound chat threads & unread badges, send direct web-to-Zalo replies, enforce `botExplicitlyCleared` in `sos_zalo_bot_vault_v1`, toggle the compact bot setup drawer cleanly, and render lazy-fast collapsible 34-province accordion sections with `/kn` 1-click copy & pair.
    3. Synchronize `patches/patch-iot-chip-and-zalo-bot-20261025/` (`01_WEB_HOSTING_GATEWAY_PATCH` & `02_FRONTEND_FE_UPDATE` including `zaloBotApi.js` and `ZaloBotConfigModal.jsx`).
  - Acceptance: `node --check js/dispatcher.js` exits `0`; all UI views, SSE listeners, and patch files are synchronized cleanly.

- [ ] P2-B: Build production Docker runtime and execute reusable Playwright E2E verification (`playwright/verify-zalo-bot-dispatch.mjs`).
  - Goal: Prove all original + new Live Chat, Sticky Bot, Short `/kn` Pairing, and 34-Province Accordion behaviors on the real built Docker container runtime.
  - Work Steps:
    1. Extend `playwright/verify-zalo-bot-dispatch.mjs` (code-first rule satisfied after `P1-A` + `P2-A`) to test: (a) Live inbound Zalo chat message streaming via SSE into `#zaloLiveChatMessagesList` without reload, (b) Direct web reply from `#inputZaloLiveChatReply` to Zalo `chatId`, (c) Compact Bot Drawer auto-collapse + continuous sticky persistence + explicit Delete non-resurrection + explicit Reset New Bot, and (d) Collapsible `TP. Cần Thơ`, `TP.HCM`, `Thành phố Hà Nội` province folders + `/kn ct.tanan Congan@113` / `/kn hcm.saigon Congan@113` short pairing & password gate.
    2. Build Docker image (`docker build -t sos-vietnam-2026:zalo-unified .`), start container on isolated port, run Playwright E2E against container, capture screenshots and `.json` + `.md` QA reports in `Reports/qa/playwright/`, and tear down temporary container.
  - Acceptance: 100% of Playwright E2E assertions PASS (`0 failed`) against the built Docker container; QA `.json`, `.md`, and `.png` artifacts saved in `Reports/qa/playwright/`.

### Pn: Supervisor Audit, Cleanup, Git Commit & Public Render Deployment

- [ ] Pn-A: Independent Supervisor Review (`PASS`/`REJECT`) against repo reality, Anvien `detect-changes`, and Docker Playwright evidence.
- [ ] Pn-B: Remove temporary `.tmp/rea` scratch files, stop any stray test containers, and verify clean git staging scope.
- [ ] Pn-C: Close plan ledgers (`status: complete`), commit scoped files cleanly, push `git push origin main`, and verify live deployment reachability on `https://sos-vietnam-2026.onrender.com/`.
