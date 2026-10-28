# Unified Live Zalo Chat Board, Compact Sticky Bot Lifecycle & 34-Province Group Directory Evidence Ledger

## Metadata

- Date: `2026-10-28`
- Plan: `docs/plans/2026-10-28-zalo-bot-live-chat-unified/2026-10-28-zalo-bot-live-chat-unified-plan.md`
- Evidence: `docs/plans/2026-10-28-zalo-bot-live-chat-unified/2026-10-28-zalo-bot-live-chat-unified-evidence.md`
- Benchmark: `docs/plans/2026-10-28-zalo-bot-live-chat-unified/2026-10-28-zalo-bot-live-chat-unified-benchmark.md`
- Actual status: `docs/plans/2026-10-28-zalo-bot-live-chat-unified/2026-10-28-zalo-bot-live-chat-unified-actual-status.md`

## Evidence Rules

Format: `E<phase>-<item>-<kind><n>`

## E0 - P0 Evidence

Matching plan item(s): `P0-A`

- `E0-P0A-ANV1`: Executed `anvien analyze --force` and `anvien list` at commit `b34774a` (`sos-vietnam-2026`) -> `files=451`, `nodes=73144`, `relationships=77851`, `stale=false`.
- `E0-P0A-REA1`: Reverse-engineered `C:\Users\dienv\AppData\Local\Programs\QuanLy_TieuDoan_CSCD\CompanyDesktop.dll` (SHA-256 `fd47c39fe7170cd67267c886aa9d1573c85df8502777c5b2e31608bd9c955cce`) and `Ho_So_Luu_Tru\Database\company_master.sqlite` via `rea` MCP (`ev_d5c2f143cae4b05eec047433693384b18636115782b0136d9e40420834b981b6`, `ev_987cc3b4717e4d0a0df35d0053b9f6bdab9cc9e80e43ed48479db6e37a2ebfa7`, `ev_2a13f886d29064d1ce9cf5cc5bbaa32ff7c5c324b93dc02278cf6ae4313a2fa5`). Verified `ZaloConvEntry` (`Id`, `Name`, `IsGroup`, `LastSnippet`, `TimeText`, `UnreadCount`, `LastTimestamp`), `ZaloUnitSelectionState`, `ZaloTacticalAssets` (`NormalizeUnitShortCode`, `NormalizeVietnameseSearch`, tactical folder rail), and sticky background session management that persists continuously until explicit `ResetZaloSessionForFreshQrAsync` / `TriggerZaloQrConnectOrSwitchAsync`.
- `E0-P0A-FD1`: Ran `anvien file-detail services/zalo-bot-service.js --repo sos-vietnam-2026 --json` and MCP `impact` -> `symbolCount=604`, `exported=6`, `inboundRefCount=3`, `outboundRefCount=10`, `localRelationshipCount=159`, `risk=high`; symbol upstream blast radius: `handleIncomingMessage` (`HIGH`, `impactedCount=2`), `updateConfig` (`CRITICAL`, `impactedCount=1`), `getPublicStatus` (`CRITICAL`, `impactedCount=2`).
- `E0-P0A-FD2`: Ran `anvien file-detail server.js --repo sos-vietnam-2026 --json` and MCP `impact` -> `symbolCount=1515`, `outboundRefCount=36`, `localRelationshipCount=142`, `risk=high`; symbol upstream blast radius: `getZaloViewerContext` (`LOW`, `impactedCount=0`), `performZaloIncidentAccept` (`HIGH`, `impactedCount=1`).
- `E0-P0A-FD3`: Ran `anvien file-detail dispatcher.html --repo sos-vietnam-2026 --json` -> `symbolCount=0`, `risk=low`.
- `E0-P0A-FD4`: Inspected `js/dispatcher.js` lines `6420–6515`, `10122–10286`, and `15925–16881` -> confirmed `EventSource('/api/dispatcher/stream')` SSE subscription and current Zalo modal controller methods.
- `E0-P0A-FD5`: Ran `anvien file-detail playwright/verify-zalo-bot-dispatch.mjs --repo sos-vietnam-2026 --json` and read lines `1–1000` -> `symbolCount=167`, 21 existing E2E assertions documented.
- `E0-P0A-SRC1`: Inspected `services/zalo-bot-service.js` lines `440–515` and `2499–2856` -> confirmed only outbound `state.outboxLog` (60 items) is stored; non-command incoming Zalo messages are ignored and no SSE live chat event or web-to-Zalo reply API exists.
- `E0-P0A-SRC2`: Inspected `services/zalo-bot-service.js` lines `2858–3025` & `3405–3420` and `js/dispatcher.js` lines `16055–16090` -> confirmed `restoreBackup` + Browser Vault lacks an explicit `botExplicitlyCleared` flag and lacks a periodic background webhook/polling keep-alive watchdog.
- `E0-P0A-GEO1`: Inspected `assets/vn-diadanh-index.json` (`34` `tinh`, `3,467` `xa`) and `assets/vn-stations-directory.json` (`3,717` `stations`) -> confirmed complete 34-province dataset (`Cần Thơ`, `TP. Hồ Chí Minh`, `Hà Nội`, `Đà Nẵng`, `Hải Phòng`, `Huế`, etc.) is available locally in `server.js`.
- `E0-P0A-DKR1`: Inspected `Dockerfile` lines `1–37` and `services/runtime-data-store.js` lines `15–23` & `services/security-crypto-service.js` lines `11–20` -> noted `NODE_ENV=production` requires `SOS_RUNTIME_DATA_DIR`, `SOS_MASTER_SECRET`, and `SOS_TOKEN_SECRET` if not supplied via host env.

## E1 - P1 Evidence

Matching plan item(s): `P1-A`

- `E1-P1A-CHK1`: Executed `node --check services/zalo-bot-service.js` and `node --check server.js` -> both exited `0`. Updated `Dockerfile` with `ENV SOS_RUNTIME_DATA_DIR=/var/lib/sos-data` matching container user `/var/lib/sos-data` directory.
- `E1-P1A-API1`: Executed boundary smoke verification directly against `createZaloBotService` + `assets/vn-diadanh-index.json` ->
  - Directory: `totalProvinces=34`, `totalWards=3451`, priority municipalities ordered first (`TP. Cần Thơ (103 xa/phuong)`, `TP.HCM (TP. Hồ Chí Minh) (167 xa/phuong)`, `Thành phố Hà Nội (266 xa/phuong)`), cold build `25.42ms`, warm cache `4.86ms`, UTF-8 search `'Tân An'` -> `12` matching provinces, `'ct.tanan'` -> `1` matching province (`/kn ct.tanan Congan@113`).
  - Short `/kn` pairing & two-way live chat ledger: `/kn ct.tanan Congan@113`, `/kn hcm.saigon Congan@113`, `/kn hn.badinh Congan@113` -> all `ketnoi_ok`; regular inbound officer chat persisted (`chatRecorded=true`); pairing password redaction verified (`leakedPass=false`); direct web-to-Zalo reply `sendDispatcherChatMessage` succeeded (`outOk=true`); emitted `11` `onLiveEvent` notifications.
  - Sticky bot lifecycle & explicit delete guard: `afterSet=true`, `afterEmptySave=true` (empty/unrelated saves preserve active token), `afterContainerResetRestore=true` (rehydrates from redundant encrypted `zalo-bot-sticky-vault.json`), `afterExplicitDeleteBlocked=true` (`explicitUserDelete: true` sets `botExplicitlyCleared=true` and blocks vault resurrection).
- `E1-P1A-ANV1`: Executed `anvien analyze --force` (`files=455`, `parsed_code=151`, `failed=0`, `nodes=74281`, `relationships=79181`) and MCP `detect_changes` (`repo=sos-vietnam-2026`, `scope=all`, `target_type=files`, `total=13` including pre-existing worktree files; `risk_level=critical` due to backward-compatible extensions on `updateConfig`, `getPublicStatus`, and `handleIncomingMessage`).

## E2 - P2 Evidence

Matching plan item(s): `P2-A`

- `E2-P2A-FD1`: Executed `anvien analyze --force`, `anvien file-detail` & `anvien impact` on `dispatcher.html`, `js/dispatcher.js`, `zaloBotApi.js`, and `ZaloBotConfigModal.jsx` prior to editing -> verified `risk=low` on `dispatcher.html` and `direct=0` upstream breakages on `ZaloBotConfigModal`.
- `E2-P2A-UI1`: Upgraded `#zaloBotConfigModal` in `dispatcher.html` and `js/dispatcher.js` (plus synced `patches/patch-iot-chip-and-zalo-bot-20261025/`):
  - Unified Compact Sticky Bot Bar (`#zaloUnifiedBotControlBar` + `#zaloStickyModeIndicator`) integrating status, token input, sticky lock indicator, explicit Delete (`explicitUserDelete: true` + `botExplicitlyCleared: true` in `sos_zalo_bot_vault_v1`), password lock toggle, and fast demo toggle into 1 compact section.
  - Collapsible 34-Province/City Directory (`#zaloProvinceAccordionSection` + `<details class="zalo-prov-folder">`) with lazy-expanded Provincial Command/Specialized & Ward Police units, `/kn` short command badges, 1-click Copy `/kn`, and instant search.
  - Live Two-Way Zalo Chat Board (`#zaloLiveChatBoardCard`) with tactical folders (`Tất cả`, `Chưa đọc`, `Xã/Phường`, `Tỉnh/Chuyên ngành`, `Chưa gắn`), real-time SSE `zalo_live_event` rendering, unread counters, and direct web-to-Zalo reply composer (`#inputZaloLiveChatReply` + `#btnSendZaloLiveChatReply`).
  - Executed `node --check js/dispatcher.js` and `node --check patches/patch-iot-chip-and-zalo-bot-20261025/02_FRONTEND_FE_UPDATE/src/features/zalo-bot/zaloBotApi.js` -> exited `0`.
- `E2-P2A-ANV1`: Executed `anvien analyze --force` (`files=455`, `nodes=75493`, `relationships=80615`) and `anvien detect-changes files --repo sos-vietnam-2026 --scope all` -> verified clean mirror sync and `degradedNodes=0`.
