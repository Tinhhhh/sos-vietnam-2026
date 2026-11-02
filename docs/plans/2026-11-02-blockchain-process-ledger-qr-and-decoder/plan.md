# Blockchain Transaction Process Ledger, Scannable QR & Block Decoder Portal Plan

## Metadata

- Date: `2026-11-02`
- Status: `in_progress`
- Plan: `docs/plans/2026-11-02-blockchain-process-ledger-qr-and-decoder/plan.md`
- Evidence: `docs/plans/2026-11-02-blockchain-process-ledger-qr-and-decoder/evidence.md`
- Benchmark: `docs/plans/2026-11-02-blockchain-process-ledger-qr-and-decoder/benchmark.md`
- Actual status: `docs/plans/2026-11-02-blockchain-process-ledger-qr-and-decoder/actual-status.md`

## Goal

Upgrade SOS Vietnam's Blockchain Ledger on Staging (`https://sos-vietnam-2026.onrender.com/`) into a lightweight, transaction-grade Case Process Ledger that:
1. Seals every SOS incident step (`1_SOS_TRIGGER`, `2B_CASE_ESCALATED`, `3_OFFICER_DISPATCH`, `3A_OFFICER_APPROACHING`, `3B_OFFICER_ARRIVED`, `4_CASE_RESOLVED`, `4B_FAKE_ALARM`) with full actor identities and exact elapsed durations (who reported, who accepted, receive timestamp, response time, actual travel time to scene, on-scene handling time, total case duration) without requiring heavy 5-second audio/video recordings.
2. Fixes the broken ISO/IEC 18004 QR code generator so 100% of generated QR codes scan cleanly on phones and OpenCV `QRCodeDetector`.
3. Provides an official Vietnamese **Blockchain Cross-Verification & Block/JSON Dossier Decoder Portal** (`/tra-cuu-blockchain.html`) where officers, citizens, and inspectors can:
   - Cross-check any `TxHash`, `Block #`, or `Case ID` directly against the authoritative server ledger to confirm whether data is genuine.
   - Upload or paste an exported `HoSo_PhapLy_ChuoiKhoi_*.json` file (or raw block JSON) to **decode** cryptographic block records into a clear, printable Vietnamese incident timeline AND run dual **Offline WebCrypto SHA-256 Re-Hash + Online Server Ledger Cross-Check** to detect even 1-character tampering.

## Rules

- Complete P0 actual status before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence in `evidence.md` and benchmark measurements in `benchmark.md` as each slice completes.
- Refresh `actual-status.md` after each completed slice.
- Run `anvien detect-changes --repo sos-vietnam-2026 --scope all` before every implementation-slice commit.
- Build and validate against the real Docker container (`docker build -t sos-vietnam:local .`) with Playwright + OpenCV QR decoding before pushing to Render Staging (`https://sos-vietnam-2026.onrender.com/`).
- Never touch production `https://sosvie.site`. Never create temporary folders outside `.tmp/`.

## Problem

1. **QR Code Unscannable**: `generateQrCodeMatrix` in `services/blockchain-ledger-service.js:1318-1326` wrote the 15 BCH format-information bits with transposed `[row][col]` coordinates, resulting in `0%` camera/OpenCV decode rate.
2. **Incomplete Transaction Process Blocks & Heavy Audio Default**: Case blocks missed `approaching`, `arrived`, `escalated`, and `flag-fake` transitions and lacked travel/on-scene/total duration metrics; Stealth SOS recorded 5s audio chunks continuously by default; and `POST /api/dispatcher/blockchain/verify` read stale field names (`b.payload.actionType`, `latestBlock.hash`, `b.isoTime`), breaking 0-media-file hash display and omitting full `payload` objects from exported `.json` dossiers.
3. **Missing Official Verification Page & Block/JSON Decoder Software**: Users had no dedicated portal to cross-verify a Blockchain code (`TxHash` / `Block #` / `Case ID`) or decode an exported `.json` dossier into human-readable Vietnamese case details.

## Scope

- `services/blockchain-ledger-service.js`
- `server.js`
- `tra-cuu-blockchain.html` (new)
- `js/blockchain-verifier-portal.js` (new)
- `css/style.css`
- `js/stealth-sos.js`
- `dispatcher.html`
- `js/dispatcher.js`
- `index.html`
- `cap-phat-the.html`
- `sw.js`
- `playwright/verify-blockchain-process-qr-decoder.mjs` (new reusable Playwright + OpenCV E2E verification suite)

## Non-Goals

- Deploying to production `https://sosvie.site`.
- Requiring external paid EVM gas fees or third-party browser CDN scripts (must satisfy strict CSP `script-src 'self' 'unsafe-inline'`).

## Requirements

1. **Transaction-Grade Process Blocks**:
   - `1_SOS_TRIGGER`: reporter name, reporter phone (PII-masked publicly, full for authenticated officers), CCCD/cardID if DePIN, channel (`WEB_SOS` / `WEB_STEALTH` / `IOT_4G`), GPS (`lat`, `lng`, `accuracy`), address, agency, incident tags, notes, initial routed unit, `triggeredAt`.
   - `2B_CASE_ESCALATED`: previous unit, escalated unit, reason, `escalatedAt`, `waitBeforeEscalationSeconds`.
   - `3_OFFICER_DISPATCH`: accepting officer rank, name, full title, account username, phone, unit name, station address, channel (`web_dispatcher` / `zalo_bot`), `dispatchedAt`, `responseTimeSeconds`, `etaMinutes`.
   - `3A_OFFICER_APPROACHING` & `3B_OFFICER_ARRIVED`: confirming officer & unit, `approachingAt` / `arrivedAt`, `travelTimeSeconds` (`arrivedAt - dispatchedAt`), `totalToSceneSeconds` (`arrivedAt - triggeredAt`), comparison vs `etaMinutes`.
   - `4_CASE_RESOLVED` & `4B_FAKE_ALARM`: closing actor (`dispatcher` / `citizen`), officer/unit, `resolvedAt`, `onSceneHandlingSeconds` (`resolvedAt - arrivedAt` when `arrivedAt` present), `totalCaseDurationSeconds` (`resolvedAt - triggeredAt`), resolution note / Decree 144 fake-alarm reason, and consolidated `processSummary`.
2. **Lightweight Default (No Mandatory Heavy Audio/Video)**:
   - `js/stealth-sos.js` disables automatic 5-second `MediaRecorder` blob uploads by default (`enableAudioRecording = false` unless explicitly opted in), keeping covert SOS trigger + live GPS watch lightweight and fast.
   - `POST /api/dispatcher/blockchain/verify` verifies 0-media transaction chains with 100% populated hashes (`txHash` / `payloadDigest`), working QR code pointing to `${origin}/tra-cuu-blockchain.html?tx=${txHash}&case=${incidentId}`, and complete decodable `lifecycleBlocks` in exported `.json`.
3. **100% Scannable QR Code**:
   - Fix format-bit coordinates in `services/blockchain-ledger-service.js` and support QR versions 1–10 (`<= 271` bytes EC Level L) so full staging/production verification URLs decode 100% in OpenCV `QRCodeDetector` and phone cameras.
4. **Verification & Decoder Portal (`/tra-cuu-blockchain.html`)**:
   - Live cross-check (`GET /api/blockchain/lookup?q=...`) for `TxHash`, `Block #`, or `Case ID`.
   - `.JSON` / Raw Block Decoder (`js/blockchain-verifier-portal.js` + `POST /api/blockchain/verify-dossier`) that decodes all blocks into a clean Vietnamese Process Timeline + Actor/Time table, runs **Offline WebCrypto SHA-256 Re-Hash** (`computeDeterministicTxHash` parity), and cross-checks against the live server ledger.
   - Live Recent Blocks feed (`GET /api/blockchain/recent`) with one-click inspect.

## Acceptance Criteria

- OpenCV `cv2.QRCodeDetector().detectAndDecode()` decodes 100% of QR codes rendered in Dispatcher `#verifyQrCodeBox`, `/tra-cuu-blockchain.html`, and `/api/blockchain/explorer/:ref` on both local Docker and live `https://sos-vietnam-2026.onrender.com/`.
- Full SOS lifecycle (`Trigger -> Accept -> Approaching -> Arrived -> Resolved`) seals sequential hash-chained blocks with non-null `responseTimeSeconds`, `travelTimeSeconds`, `onSceneHandlingSeconds`, and `totalCaseDurationSeconds` and `0` audio files required.
- Uploading an untouched `HoSo_PhapLy_ChuoiKhoi_*.json` file into `/tra-cuu-blockchain.html` renders the full Vietnamese decoded report and passes both **Offline SHA-256 Re-Hash** and **Online Server Cross-Check**; editing 1 character inside the `.json` file triggers an explicit red tamper alert identifying the exact corrupted Block `#`.
- Stealth SOS (`Giả Cuộc Gọi Đến` & `Giả Vờ Tắt Màn Hình`) creates a covert SOS + live GPS without uploading heavy audio files (`chunksUploaded === 0`).

## Checklist

- [x] P0-A: Complete actual status before implementation work.
  - Goal: establish the real current state from Anvien graph + source + OpenCV QR reproduction.
  - Work Steps: inspect source-of-truth files, run `anvien analyze --force` + `file-detail` + `impact`, reproduce QR failure via OpenCV, record `actual-status.md`, `evidence.md`, and `benchmark.md`.
  - Implementation Gate: `actual-status.md` has final P0 decision (`P0 complete. Next phase can proceed unchanged.`).
  - Acceptance: `E0-P0A-USER1`..`E0-P0A-SRC3` recorded.

### P1: Core Blockchain Ledger Engine, Scannable QR & Transaction Lifecycle APIs

- Phase Goal: Fix QR generation at the ledger engine, add rich 8-stage transaction process sealing & summary helpers, fix 0-media Live Audit & `.json` dossier export, and expose `/api/blockchain/lookup`, `/api/blockchain/verify-dossier`, and `/api/blockchain/recent`.
- Phase Boundary:
  - In scope: `services/blockchain-ledger-service.js`, `server.js`
  - Out of scope: Frontend HTML/CSS/JS files (`P2`)
  - Dependencies: `P0-A`
- Phase Implementation Rule: implement `P1-A`, verify & commit, then implement `P1-B`, verify & commit.
- Ordered Slice List:
  - `P1-A`: Fix ISO-18004 QR Generator & Add Process Summary, Lookup, Recent Feed & Dossier Verifier in `services/blockchain-ledger-service.js`
  - `P1-B`: Seal Transaction-Grade Process Lifecycle Blocks & Expose Lookup/Verify-Dossier/Recent Endpoints in `server.js`

- [x] P1-A: Fix ISO-18004 QR Generator & Add Process Summary, Lookup, Recent Feed & Dossier Verifier in `services/blockchain-ledger-service.js`
  - Goal: Make `generateQrCodeSvg` 100% scannable up to Version 10 (`271` bytes), expand `LIFECYCLE_ACTIONS` to cover all 8 process stages, and add deterministic process-summary + lookup + dossier-verification methods on `BlockchainLedgerService`.
  - Scope Boundary:
    - Editable: `services/blockchain-ledger-service.js`
    - Inspect-only: `server.js`
    - Preserve-only: `services/runtime-data-store.js`, `services/evidence-storage-service.js`
    - Out of scope: UI files
  - Non-Goals: Changing existing `sealBlockSync` deterministic hash formula (`SHA256(JSON.stringify(record) + "|" + blockNumber + "|" + prevHash)` must remain 100% backward-compatible with existing blocks).
  - Pre-flight Questions:
    - Data source: `blockchain-ledger.json` via `runtime-data-store.js`
    - Display permission: `lookupLedger` and `getRecentBlocks` accept `{ includeRawPii: boolean }` so public callers receive masked phone/CCCD while authenticated officers receive full fields.
    - DB read flow: `loadLedger()` -> `state.blocks` -> `lookupLedger` / `verifyExportedDossier` / `getRecentBlocks`
    - DB write flow: `sealBlockSync()` -> `persistLedger()`
    - Render location: SVG string returned by `generateQrCodeSvg(text)`
    - UI behavior flow: N/A (backend service slice; consumed in `P1-B` and `P2-A`)
    - Docker runtime: Verified in full container in `P3-A` + direct Node + OpenCV CLI boundary test in `P1-A`
    - Playwright target: `P3-A` / `P3-B`
    - Behavior test: Node + Python OpenCV QR decode across short & 165-byte URLs + unit/integration test of `buildCaseProcessSummary`, `lookupLedger`, and `verifyExportedDossier` (intact vs 1-byte tampered).
    - Cleanup/quarantine: Temp test artifacts written only under `.tmp/` and cleaned after test.
    - External side effects: None.
    - N/A notes: Browser UI checks run in `P2`/`P3`.
  - Work Steps:
    1. Update `LIFECYCLE_ACTIONS` in `services/blockchain-ledger-service.js` to add `CASE_ESCALATED: '2B_CASE_ESCALATED'`, `OFFICER_APPROACHING: '3A_OFFICER_APPROACHING'`, `OFFICER_ARRIVED: '3B_OFFICER_ARRIVED'`, and `FAKE_ALARM_FLAGGED: '4B_FAKE_ALARM'` while preserving existing keys.
       - UI flow check: N/A (service constant export)
       - DB/data flow check: Action codes stored verbatim in `blockEntry.action` and `record.action`.
       - Render location check: Mapped to Vietnamese labels via exported `describeBlockchainActionVi(action)`.
       - Mini QA for each completed implementation slice (MUST): Node module import & action-label check.
       - Evidence target: `E1-P1A-ACT1`
    2. Fix `generateQrCodeMatrix` format-bit coordinates (`lines 1318-1326`) and extend QR version tables (`QR_CAPACITIES_L`, `QR_EC_CODEWORDS_PER_BLOCK_L`, `QR_NUM_BLOCKS_L`, `QR_ALIGNMENT_POSITIONS`) through Version 10 (`271` bytes) so long verification URLs never overflow.
       - UI flow check: N/A (SVG generator)
       - DB/data flow check: Pure deterministic function `text -> SVG`.
       - Render location check: Rendered in `#verifyQrCodeBox`, `/tra-cuu-blockchain.html`, and `/api/blockchain/explorer/:ref`.
       - Mini QA for each completed implementation slice (MUST): Render PNG from generated SVG and decode via Python `cv2.QRCodeDetector().detectAndDecode()` across 3 URL lengths (`48B`, `131B`, `185B`).
       - Evidence target: `E1-P1A-QR1`
    3. Add `buildCaseProcessSummary(caseBlocks, incidentMeta)`, `lookupLedger(query, { includeRawPii })`, `getRecentBlocks(limit, { includeRawPii })`, and `verifyExportedDossier(dossierPayload)` on `BlockchainLedgerService`.
       - UI flow check: N/A (backend service methods)
       - DB/data flow check: Recomputes `payloadDigest` and `txHash` per block and cross-matches `state.blocks` by `blockNumber` & `txHash`.
       - Render location check: JSON consumed by `/api/blockchain/*` in `P1-B`.
       - Mini QA for each completed implementation slice (MUST): Node verification proving intact dossier -> `verified: true, serverLedgerMatched: true` and 1-char mutated dossier -> `verified: false` with exact `corruptedBlocks` list.
       - Evidence target: `E1-P1A-VERIFY1`
  - Implementation Gate:
    - Anvien `file-detail` & `impact` already recorded (`E0-P0A-FD1`). Run `anvien detect-changes --repo sos-vietnam-2026 --scope all` before commit.
  - Acceptance:
    - Source: `services/blockchain-ledger-service.js` exports all existing symbols plus `describeBlockchainActionVi` and new `BlockchainLedgerService` methods.
    - Runtime/UI: OpenCV `QRCodeDetector` decodes 3/3 test QR codes (`100%`).
    - DB/data: `verifyExportedDossier` catches 1-char tamper in `payload.data` or `txHash`.
    - Behavior test: Node + OpenCV boundary verification passes `100%`.
    - Cleanup/quarantine: Temp test PNGs stay in `.tmp/`.
    - Evidence IDs: `E1-P1A-ACT1`, `E1-P1A-QR1`, `E1-P1A-VERIFY1`, `E1-P1A-DETECT1`
    - Actual-status rows refreshed: Row 1 & Row 2 in `actual-status.md`
  - Evidence Targets: `E1-P1A-ACT1`, `E1-P1A-QR1`, `E1-P1A-VERIFY1`, `E1-P1A-DETECT1`
  - Actual-status Update: Update QR & Ledger Service rows to `correct` (`R1`).
  - Commit Boundary: Commit `services/blockchain-ledger-service.js` + ledger updates after slice acceptance.

- [x] P1-B: Seal Transaction-Grade Process Lifecycle Blocks & Expose Lookup/Verify-Dossier/Recent Endpoints in `server.js`
  - Goal: Seal rich actor + duration transaction blocks at every SOS lifecycle transition in `server.js`, fix 0-media Live Audit & `.json` dossier export in `POST /api/dispatcher/blockchain/verify`, update `/api/blockchain/explorer/:ref`, and add `GET /api/blockchain/lookup`, `POST /api/blockchain/verify-dossier`, and `GET /api/blockchain/recent`.
  - Scope Boundary:
    - Editable: `server.js`
    - Inspect-only: `services/blockchain-ledger-service.js`, `services/security-firewall-middleware.js`
    - Preserve-only: `services/zalo-bot-service.js`
    - Out of scope: Frontend HTML/JS/CSS (`P2`)
  - Non-Goals: Altering existing dispatcher authentication or station routing rules.
  - Pre-flight Questions:
    - Data source: In-memory/persisted `incidents` Map + `blockchainLedgerService`
    - Display permission: Public `/api/blockchain/lookup` & `/api/blockchain/recent` mask citizen `reporterPhone` and `userCCCD` unless valid officer session token is verified via `securityFirewall.extractToken(req)` + `securityCryptoService.verifySessionToken(token)`.
    - DB read flow: `incidents.get(caseId)` + `blockchainLedgerService.lookupLedger(...)`
    - DB write flow: Lifecycle route -> `recordIncidentBlockchainEvent(...)` -> `sealBlockSync` -> `saveIncidentHistory()`
    - Render location: JSON responses + `/api/blockchain/explorer/:ref` HTML certificate
    - UI behavior flow: Consumed by `/tra-cuu-blockchain.html` (`P2-A`) and `dispatcher.html` (`P2-B`)
    - Docker runtime: Verified via HTTP API smoke test in `P1-B` and full Docker Playwright in `P3-A`
    - Playwright target: `P3-A` / `P3-B`
    - Behavior test: Spawn server on ephemeral port with isolated `SOS_RUNTIME_DATA_DIR=.tmp/p1b-runtime`, run full `create -> accept -> approaching -> arrived -> resolved` + `verify` + `lookup` + `verify-dossier` (intact & tampered) + OpenCV QR decode on returned `qrSvg`.
    - Cleanup/quarantine: Isolated `.tmp/p1b-runtime` directory removed/ignored so real runtime state is untouched.
    - External side effects: None.
    - N/A notes: None.
  - Work Steps:
    1. Upgrade `recordIncidentBlockchainEvent` and all SOS lifecycle handlers in `server.js` (`/api/sos/create`, auto-escalation timer, `/api/dispatcher/escalate`, `/api/dispatcher/accept`, Zalo accept hook, `/api/dispatcher/update-status` for `approaching` / `arrived` / `resolved`, `/api/dispatcher/flag-fake`, `/api/sos/citizen-safe`) to track `incident.dispatchedAt`, `incident.approachingAt`, `incident.arrivedAt`, `incident.resolvedAt` and seal complete actor + timing metrics (`responseTimeSeconds`, `travelTimeSeconds`, `totalToSceneSeconds`, `onSceneHandlingSeconds`, `totalCaseDurationSeconds`, `processSummary`).
       - UI flow check: Updates `incident.blockchain.auditTrail` & `incident.blockchain.processSummary` broadcast via SSE `sos_update`.
       - DB/data flow check: Persisted to both `blockchain-ledger.json` and `incident-history.json`.
       - Render location check: `auditTrail` + `processSummary` in Dispatcher & Citizen views.
       - Mini QA for each completed implementation slice (MUST): Full 5-step API lifecycle test asserting non-null timings and 5 sealed blocks.
       - Evidence target: `E1-P1B-LIFE1`
    2. Fix `POST /api/dispatcher/blockchain/verify` (`server.js:6025-6165`) so:
       - `sealedBlock` matches `b.action === LIFECYCLE_ACTIONS.EVIDENCE_SEAL || b.payload?.action === LIFECYCLE_ACTIONS.EVIDENCE_SEAL`.
       - 0-media cases populate `originalBlockchainHash` and `currentServerFileHash` from `latestBlock.txHash` / recomputed `computeDeterministicTxHash` (never empty `""`!).
       - `verificationPortalUrl` is `${origin}/tra-cuu-blockchain.html?tx=${encodeURIComponent(txHash)}&case=${encodeURIComponent(incidentId)}`, encoded into `qrSvg`.
       - `legalDossier` includes `schemaVersion: '2.1-PROCESS-DOSSIER'`, `verificationPortalUrl`, `processSummary`, and full `lifecycleBlocks` (including `blockNumber`, `action`, `actionLabelVi`, `timestamp`, `prevHash`, `txHash`, `payloadDigest`, `evidenceHash`, `payload`) so exported `.json` files are 100% self-verifiable offline and online!
       - UI flow check: Live Audit button returns populated hash, QR, `verificationPortalUrl`, and `processSummary`.
       - DB/data flow check: Reads `caseBlocks` + `verifyCaseChainIntegrity`.
       - Render location check: `#verifyResult` in `dispatcher.html` and downloaded `.json` dossier.
       - Mini QA for each completed implementation slice (MUST): Verify 0-media SOS case returns `verified: true`, 66-char `0x...` hashes, scannable QR, and complete `lifecycleBlocks`.
       - Evidence target: `E1-P1B-AUDIT1`
    3. Add `GET /api/blockchain/lookup`, `POST /api/blockchain/verify-dossier`, and `GET /api/blockchain/recent` in `server.js`, and upgrade `/api/blockchain/explorer/:ref` HTML certificate to display the full Vietnamese process timeline, scannable QR, and direct button to open `/tra-cuu-blockchain.html?tx=...`.
       - UI flow check: Public vs officer PII masking verified.
       - DB/data flow check: Cross-references `blockchainLedgerService` + live `incidents` metadata.
       - Render location check: JSON APIs + `/api/blockchain/explorer/:ref` HTML.
       - Mini QA for each completed implementation slice (MUST): Query `/api/blockchain/lookup?q=<txHash>`, `?q=<blockNumber>`, `?q=<caseId>`, `/api/blockchain/recent`, and `POST /api/blockchain/verify-dossier` (valid + tampered).
       - Evidence target: `E1-P1B-API1`
  - Implementation Gate:
    - Run `anvien file-detail server.js --repo sos-vietnam-2026 --json` (already recorded in `E0-P0A-FD2`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` before commit.
  - Acceptance:
    - Source: `node --check server.js` exits `0`.
    - Runtime/UI: Ephemeral server integration test passes 100% of lifecycle, 0-media verify, QR decode, lookup, recent, and verify-dossier checks.
    - DB/data: Public lookup masks citizen phone/CCCD (`***`), authenticated officer token reveals full phone/CCCD.
    - Behavior test: Automated integration check passes.
    - Cleanup/quarantine: Ephemeral server stopped & `.tmp/p1b-runtime` cleaned.
    - Evidence IDs: `E1-P1B-LIFE1`, `E1-P1B-AUDIT1`, `E1-P1B-API1`, `E1-P1B-DETECT1`
    - Actual-status rows refreshed: Rows 3, 4, 5 in `actual-status.md`
  - Evidence Targets: `E1-P1B-LIFE1`, `E1-P1B-AUDIT1`, `E1-P1B-API1`, `E1-P1B-DETECT1`
  - Actual-status Update: Update `server.js` rows to `correct` (`R2`).
  - Commit Boundary: Commit `server.js` + ledger updates after slice acceptance.

### P2: Official Verification & Block Decoder Portal + Lightweight Stealth & Dispatcher Process UI

- Phase Goal: Deliver the user-facing **Cổng Đối Chứng Xác Thực & Giải Mã Hồ Sơ Chuỗi Khối** (`/tra-cuu-blockchain.html`), switch Stealth SOS to lightweight transaction-only default, and upgrade Dispatcher `.bc-security-panel` + navigation links across all portals.
- Phase Boundary:
  - In scope: `tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, `css/style.css`, `js/stealth-sos.js`, `dispatcher.html`, `js/dispatcher.js`, `index.html`, `cap-phat-the.html`, `sw.js`
  - Out of scope: Backend engine (`P1`, unless bug found)
  - Dependencies: `P1-A`, `P1-B`
- Phase Implementation Rule: implement `P2-A`, verify & commit, then implement `P2-B`, verify & commit.
- Ordered Slice List:
  - `P2-A`: Build `/tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, and Portal Styles in `css/style.css`
  - `P2-B`: Update `js/stealth-sos.js`, `dispatcher.html`, `js/dispatcher.js`, `index.html`, `cap-phat-the.html`, and `sw.js`

- [x] P2-A: Build `/tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, and Portal Styles in `css/style.css`
  - Goal: Provide an authoritative, crystal-clear Vietnamese Web Portal & Block Decoder software so anyone can cross-verify a Blockchain code (`TxHash` / `Block #` / `Case ID`) OR upload/paste an exported `.JSON` dossier / raw block to decode every detail of the SOS case and verify mathematical SHA-256 integrity.
  - Scope Boundary:
    - Editable: `tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, `css/style.css`
    - Inspect-only: `server.js`, `services/blockchain-ledger-service.js`
    - Preserve-only: Existing styles in `css/style.css`
    - Out of scope: `dispatcher.html` (`P2-B`)
  - Non-Goals: External JS dependencies (must run 100% natively under browser `crypto.subtle.digest('SHA-256', ...)` and strict CSP).
  - Pre-flight Questions:
    - Data source: `GET /api/blockchain/lookup`, `POST /api/blockchain/verify-dossier`, `GET /api/blockchain/recent`, `GET /api/blockchain/status`, plus local FileReader `.json` upload / paste.
    - Display permission: Automatically forwards `Authorization: Bearer <officerToken>` if officer is logged in on the browser so officers see unmasked dossier fields, while public citizens see PII-masked fields + full process timings & officer/unit accountability.
    - DB read flow: Query param `?tx=...` or `?case=...` or `?q=...` auto-triggers live ledger lookup on page load.
    - DB write flow: Read-only verification & decoding portal (zero ledger mutation).
    - Render location: `/tra-cuu-blockchain.html`
    - UI behavior flow:
      1. Tab/Section 1 — **Tra cứu & Đối chứng trực tiếp trên Sổ cái**: Search input (`TxHash` `0x...`, `Block #109`, `Mã ca SOS-...`) -> renders Authenticity Verdict Banner + 5-Card Process Summary (Người báo & Vị trí, Cán bộ & Đơn vị nhận ca, Thời gian tiếp nhận/phản ứng, Thời gian di chuyển tới hiện trường, Thời gian xử lý & hoàn tất) + Step-by-step Decoded Block Cards + Scannable QR + Print Biên bản button.
      2. Tab/Section 2 — **Phần mềm Giải mã & Giám định File Hồ Sơ (`.JSON` / Raw Block)**: Drag-and-drop or file picker for `HoSo_PhapLy_ChuoiKhoi_*.json` (or paste raw JSON) -> decodes every cryptographic field into plain Vietnamese, recomputes `payloadDigest` & `txHash` via WebCrypto `SHA-256` offline, AND cross-checks live against `/api/blockchain/verify-dossier` -> shows green `✔ KHỚP 100% MÃ BĂM SHA-256 & SỔ CÁI GỐC` or red `❌ PHÁT HIỆN CHỈNH SỬA TRÁI PHÉP TRONG FILE TẠI BLOCK #...`.
      3. Tab/Section 3 — **Sổ cái Giao dịch Thời gian thực**: Live recent blocks table with 1-click "Giải mã & Đối chứng" action.
    - Docker runtime: Verified in `P3-A`
    - Playwright target: `/tra-cuu-blockchain.html` in `P3-A` & `P3-B`
    - Behavior test: Headless browser / API + WebCrypto hash parity check.
    - Cleanup/quarantine: Temp logs in `.tmp/`.
    - External side effects: None.
    - N/A notes: None.
  - Work Steps:
    1. Create `tra-cuu-blockchain.html` with official SOS Vietnam Cyber-Tactical Navy/Gold/Cyan styling, 3 clear workflow zones (Live Lookup, `.JSON` File Decoder & Tamper Inspector, Recent Blocks Ledger), print-friendly report stylesheet (`@media print`), and navigation links back to `/`, `/dispatcher.html`, and `/cap-phat-the.html`.
       - UI flow check: Accessible on desktop & mobile viewports, URL query `?tx=...` auto-loads immediately.
       - DB/data flow check: Binds to `/api/blockchain/status`, `/api/blockchain/lookup`, `/api/blockchain/verify-dossier`, `/api/blockchain/recent`.
       - Render location check: `/tra-cuu-blockchain.html`
       - Mini QA for each completed implementation slice (MUST): Render & syntax check + HTTP `200` with CSP compliance.
       - Evidence target: `E2-P2A-HTML1`
    2. Create `js/blockchain-verifier-portal.js` + append scoped `.bcv-*` styles to `css/style.css`, implementing exact WebCrypto `SHA-256` deterministic block re-hashing (`JSON.stringify(record) + "|" + blockNumber + "|" + prevHash`), Vietnamese human-readable translator for every block field (`1_SOS_TRIGGER`..`4B_FAKE_ALARM`), `.json` file drag-drop/upload + raw JSON paste decoder, dual offline/online verification badges, and 1-click sample/recent block inspection.
       - UI flow check: Upload intact `.json` -> green verified + full Vietnamese process report; upload edited `.json` -> red tamper warning naming exact block `#`.
       - DB/data flow check: Exact byte-for-byte parity between `BlockchainLedgerService.computeDeterministicTxHash` (Node) and `recomputeBlockTxHashBrowser` (WebCrypto).
       - Render location check: `#bcvLookupResult`, `#bcvDecoderResult`, `#bcvRecentTableBody`.
       - Mini QA for each completed implementation slice (MUST): `node --check js/blockchain-verifier-portal.js` + browser smoke check.
       - Evidence target: `E2-P2A-JS1`
  - Implementation Gate:
    - Run `anvien detect-changes --repo sos-vietnam-2026 --scope all` before commit.
  - Acceptance:
    - Source: `tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, and `css/style.css` pass syntax & CSP rules (zero external scripts).
    - Runtime/UI: Portal loads `200 OK`, auto-queries `?tx=...`, decodes uploaded `.json` files into Vietnamese process timelines, and flags 1-byte edits.
    - DB/data: Offline WebCrypto hash matches server `txHash` 100%.
    - Behavior test: Verified in mini-QA + full Docker Playwright in `P3-A`.
    - Cleanup/quarantine: Temp logs in `.tmp/`.
    - Evidence IDs: `E2-P2A-HTML1`, `E2-P2A-JS1`, `E2-P2A-DETECT1`
    - Actual-status rows refreshed: Row 6 in `actual-status.md`
  - Evidence Targets: `E2-P2A-HTML1`, `E2-P2A-JS1`, `E2-P2A-DETECT1`
  - Actual-status Update: Update Portal row from `missing` -> `correct` (`R3`).
  - Commit Boundary: Commit `tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, `css/style.css` + ledger updates.

- [ ] P2-B: Update `js/stealth-sos.js`, `dispatcher.html`, `js/dispatcher.js`, `index.html`, `cap-phat-the.html`, and `sw.js`
  - Goal: Make Stealth SOS lightweight transaction-only by default (no automatic 5s audio file spam), upgrade Dispatcher `.bc-security-panel` to display the full **Giao Dịch Quy Trình Cứu Hộ** (Ai báo, Ai nhận, Phản ứng, Di chuyển, Xử lý tại chỗ, Tổng thời gian) + working QR + direct Decoder Portal button, and add `/tra-cuu-blockchain.html` navigation across `index.html`, `dispatcher.html`, `cap-phat-the.html`, and `sw.js`.
  - Scope Boundary:
    - Editable: `js/stealth-sos.js`, `dispatcher.html`, `js/dispatcher.js`, `index.html`, `cap-phat-the.html`, `sw.js`
    - Inspect-only: `tra-cuu-blockchain.html`, `server.js`
    - Preserve-only: `js/app.js`, `js/depin-card-portal.js`
    - Out of scope: Backend service files (`P1`)
  - Non-Goals: Breaking optional manual photo/video evidence upload if an officer/citizen explicitly attaches an image in chat.
  - Pre-flight Questions:
    - Data source: `incident.blockchain` (`auditTrail`, `processSummary`, `latestTxHash`, `latestBlockNumber`) and `POST /api/dispatcher/blockchain/verify`.
    - Display permission: Dispatcher sees full unmasked reporter & officer details in `#bcSecurityPanel`.
    - DB read flow: SSE `sos_new` / `sos_update` -> `renderBlockchainPanel(inc)` -> `runIntegrityCheckForSelectedIncident()`.
    - DB write flow: Stealth SOS sends `POST /api/sos/create` + `POST /api/sos/stealth-gps` without spamming `/api/sos/upload-evidence`.
    - Render location: `#bcSecurityPanel` (`dispatcher.html`), `#mainHeaderNav` & `#stealthEmergencyBar` & `#sosTrackingView` (`index.html`), `.e10-topbar` (`cap-phat-the.html`).
    - UI behavior flow: Dispatcher clicks case -> sees full process actor & timing breakdown -> clicks `KIỂM TRA TÍNH TOÀN VẸN & XUẤT HỒ SƠ BLOCK` -> sees scannable QR + `🔍 Mở Cổng Đối Chứng & Giải Mã` + `📄 Tải Hồ Sơ Block (.JSON)`.
    - Docker runtime: Full Docker build & Playwright E2E in `P3-A`.
    - Playwright target: `index.html`, `dispatcher.html`, `cap-phat-the.html`, `tra-cuu-blockchain.html`.
    - Behavior test: Syntax checks + Docker Playwright E2E in `P3-A`.
    - Cleanup/quarantine: Temp logs in `.tmp/`.
    - External side effects: None.
    - N/A notes: None.
  - Work Steps:
    1. Update `js/stealth-sos.js` (and description text in `index.html`) so automatic 5-second audio recording is disabled by default (`enableAudioRecording = Boolean(window.__SOS_ENABLE_STEALTH_AUDIO === true)`), keeping Fake Incoming Call iOS (`Ba`, 3-tap exit, proximity blackout) and Blackout Stealth (`#000000`, 4-tap exit) 100% instant and lightweight with covert SOS + live GPS sealing.
       - UI flow check: Fake Call & Blackout launch cleanly without microphone permission prompts or 5s audio upload traffic.
       - DB/data flow check: `1_SOS_TRIGGER` block + live GPS updates recorded; `chunksUploaded` stays `0` by default.
       - Render location check: `index.html` Stealth section & overlays.
       - Mini QA for each completed implementation slice (MUST): `node --check js/stealth-sos.js`.
       - Evidence target: `E2-P2B-STEALTH1`
    2. Upgrade `#bcSecurityPanel` in `dispatcher.html` and `renderBlockchainPanel` / `runIntegrityCheckForSelectedIncident` in `js/dispatcher.js` to display:
       - **Chi tiết Giao dịch Quy trình** box: Người báo & SĐT, Cán bộ tiếp nhận & Đơn vị, Thời gian phản ứng (`Xs`), Thời gian di chuyển tới hiện trường (`Yp Zs`), Thời gian xử lý & Tổng thời gian toàn trình.
       - Rich timeline entries for all 8 lifecycle block types (`1_SOS_TRIGGER`, `2B_CASE_ESCALATED`, `3_OFFICER_DISPATCH`, `3A_OFFICER_APPROACHING`, `3B_OFFICER_ARRIVED`, `4_CASE_RESOLVED`, `4B_FAKE_ALARM`, `2_EVIDENCE_SEAL`).
       - Updated `#verifyResult` with scannable QR pointing to `/tra-cuu-blockchain.html?tx=...`, button **`🔍 Đối Chứng & Giải Mã Hồ Sơ ↗`**, and **`📄 Tải Hồ Sơ Block (.JSON)`**.
       - Navigation links to `/tra-cuu-blockchain.html` in `dispatcher.html`, `index.html` (dock + tracking view), `cap-phat-the.html`, and updated `CACHE_NAME` + `STATIC_ASSETS` in `sw.js`.
       - UI flow check: Clicking `TxHash` or `Đối Chứng & Giải Mã Hồ Sơ` opens `/tra-cuu-blockchain.html?tx=...&case=...` pre-populated with that exact case!
       - DB/data flow check: Reads `inc.blockchain.processSummary` & `data.verificationPortalUrl`.
       - Render location check: `dispatcher.html`, `index.html`, `cap-phat-the.html`.
       - Mini QA for each completed implementation slice (MUST): `node --check js/dispatcher.js` & `node --check sw.js`.
       - Evidence target: `E2-P2B-UI1`
  - Implementation Gate:
    - Run `anvien detect-changes --repo sos-vietnam-2026 --scope all` before commit.
  - Acceptance:
    - Source: All JS files pass `node --check`.
    - Runtime/UI: Verified in real built Docker container (`P3-A`).
    - DB/data: Stealth SOS uploads `0` audio blobs by default; Dispatcher panel renders complete process timings & scannable QR.
    - Behavior test: Verified in `P3-A`.
    - Cleanup/quarantine: Temp logs in `.tmp/`.
    - Evidence IDs: `E2-P2B-STEALTH1`, `E2-P2B-UI1`, `E2-P2B-DETECT1`
    - Actual-status rows refreshed: Rows 7 & 8 in `actual-status.md`
  - Evidence Targets: `E2-P2B-STEALTH1`, `E2-P2B-UI1`, `E2-P2B-DETECT1`
  - Actual-status Update: Update Stealth & Dispatcher/Portal UI rows to `correct` (`R4`).
  - Commit Boundary: Commit `js/stealth-sos.js`, `dispatcher.html`, `js/dispatcher.js`, `index.html`, `cap-phat-the.html`, `sw.js` + ledger updates.

### P3: Full Docker Container Build, Reusable Playwright + OpenCV QR Suite & Live Render Staging Deployment

- Phase Goal: Prove 100% end-to-end runtime correctness first on the real built local Docker container (`sos-vietnam:local`), then push to `origin/main` and verify live on `https://sos-vietnam-2026.onrender.com/`.
- Phase Boundary:
  - In scope: `playwright/verify-blockchain-process-qr-decoder.mjs`, `Reports/qa/playwright/...`, Docker build/run, Render Staging deployment verification
  - Out of scope: Production `https://sosvie.site`
  - Dependencies: `P1-A`, `P1-B`, `P2-A`, `P2-B`
- Phase Implementation Rule: implement & pass `P3-A` on local Docker first, commit QA evidence, then push & pass `P3-B` on live Render Staging.
- Ordered Slice List:
  - `P3-A`: Build `sos-vietnam:local` Docker Image & Run End-to-End Playwright + OpenCV QR Scan + Dossier Tamper Verification
  - `P3-B`: Push to Render Staging (`https://sos-vietnam-2026.onrender.com/`) & Run Live Staging Playwright + OpenCV QR Verification

- [ ] P3-A: Build `sos-vietnam:local` Docker Image & Run End-to-End Playwright + OpenCV QR Scan + Dossier Tamper Verification
  - Goal: Build the production Docker image locally, start container `sos-vietnam-bc-qa`, and execute a comprehensive Playwright + OpenCV E2E suite proving every user requirement.
  - Scope Boundary:
    - Editable: `playwright/verify-blockchain-process-qr-decoder.mjs`, `Reports/qa/playwright/blockchain-process-qr-decoder-local.{json,md}`
    - Inspect-only: All app files
    - Preserve-only: Existing `playwright/` scripts
    - Out of scope: `https://sosvie.site`
  - Non-Goals: Dev-server shortcuts (must run against built Docker container).
  - Pre-flight Questions:
    - Data source: Container `sos-vietnam-bc-qa` exposed on `http://127.0.0.1:3410`
    - Display permission: Tests both authenticated Dispatcher session and unauthenticated public citizen Verification Portal.
    - DB read flow: Full browser UI -> API -> encrypted runtime ledger -> reload -> UI verification.
    - DB write flow: Citizen triggers SOS -> Dispatcher accepts -> updates `approaching` -> updates `arrived` -> updates `resolved` -> exports `.json` dossier.
    - Render location: Screenshots & QA reports in `Reports/qa/playwright/`.
    - UI behavior flow:
      1. Citizen triggers SOS (and Stealth Fake Call lightweight check: `chunksUploaded === 0`).
      2. Dispatcher logs in, accepts SOS, marks `approaching`, marks `arrived`, marks `resolved`.
      3. Dispatcher clicks `KIỂM TRA TÍNH TOÀN VẸN`, downloads `HoSo_PhapLy_ChuoiKhoi_*.json`, and screenshots `#verifyQrCodeBox`.
      4. OpenCV `cv2.QRCodeDetector().detectAndDecode()` decodes the actual screenshot of `#verifyQrCodeBox` and confirms it resolves to `/tra-cuu-blockchain.html?tx=0x...`!
      5. Browser opens the decoded QR URL (`/tra-cuu-blockchain.html?tx=...`) in a clean public context -> verifies `✔ DỮ LIỆU THẬT TRÊN SỔ CÁI HỆ THỐNG`, PII-masked phone, and all process timings (`responseTimeSeconds`, `travelTimeSeconds`, `onSceneHandlingSeconds`, `totalCaseDurationSeconds`).
      6. Uploads downloaded `.json` dossier into `/tra-cuu-blockchain.html` Decoder -> verifies `✔ KHỚP 100%` + full Vietnamese decoded timeline.
      7. Mutates 1 character inside `.json` dossier and uploads into Decoder -> verifies `❌ PHÁT HIỆN CHỈNH SỬA TRÁP PHÉP` naming the exact tampered Block `#`.
    - Docker runtime: `docker build -t sos-vietnam:local .` & `docker run -d --name sos-vietnam-bc-qa -p 3410:3000 sos-vietnam:local`
    - Playwright target: `http://127.0.0.1:3410`
    - Behavior test: `node playwright/verify-blockchain-process-qr-decoder.mjs --base-url http://127.0.0.1:3410 --report-prefix local`
    - Cleanup/quarantine: Stop and remove container `sos-vietnam-bc-qa` after verification.
    - External side effects: None.
    - N/A notes: None.
  - Work Steps:
    1. Create `playwright/verify-blockchain-process-qr-decoder.mjs` implementing all 7 E2E + OpenCV QR + `.json` tamper checks and emitting `.json` + `.md` QA reports to `Reports/qa/playwright/`.
       - UI flow check: Covers Citizen, Dispatcher, QR scan, Live Lookup, and `.JSON` File Decoder.
       - DB/data flow check: Full round-trip persistence & cryptographic re-hashing.
       - Render location check: Screenshots saved under `Reports/qa/playwright/screenshots/`.
       - Mini QA for each completed implementation slice (MUST): `node --check playwright/verify-blockchain-process-qr-decoder.mjs`.
       - Evidence target: `E3-P3A-SCRIPT1`
    2. Build `docker build -t sos-vietnam:local .`, run `sos-vietnam-bc-qa`, execute the Playwright + OpenCV suite to `100% PASS`, and remove `sos-vietnam-bc-qa`.
       - UI flow check: `100% PASS` across all assertions.
       - DB/data flow check: Verified inside non-root `USER sos` container environment.
       - Render location check: `Reports/qa/playwright/blockchain-process-qr-decoder-local.{json,md}`.
       - Mini QA for each completed implementation slice (MUST): Inspect screenshots & OpenCV decoded QR URL output.
       - Evidence target: `E3-P3A-DOCKER1`
  - Implementation Gate:
    - Full Docker build must succeed before Playwright runs; run `anvien detect-changes --repo sos-vietnam-2026 --scope all` before commit.
  - Acceptance:
    - Source: `playwright/verify-blockchain-process-qr-decoder.mjs` committed cleanly.
    - Runtime/UI: `100% PASS` on real Docker container + OpenCV QR decode `PASS`.
    - DB/data: Intact `.json` passes dual check; tampered `.json` fails with exact block number.
    - Behavior test: `Reports/qa/playwright/blockchain-process-qr-decoder-local.{json,md}` recorded.
    - Cleanup/quarantine: `docker rm -f sos-vietnam-bc-qa` verified clean.
    - Evidence IDs: `E3-P3A-SCRIPT1`, `E3-P3A-DOCKER1`, `E3-P3A-DETECT1`
    - Actual-status rows refreshed: All rows verified in local Docker (`R5`).
  - Evidence Targets: `E3-P3A-SCRIPT1`, `E3-P3A-DOCKER1`, `E3-P3A-DETECT1`
  - Actual-status Update: Record `R5` Docker E2E pass.
  - Commit Boundary: Commit `playwright/verify-blockchain-process-qr-decoder.mjs`, `Reports/qa/playwright/blockchain-process-qr-decoder-local.*`, and ledger updates.

- [ ] P3-B: Push to Render Staging (`https://sos-vietnam-2026.onrender.com/`) & Run Live Staging Playwright + OpenCV QR Verification
  - Goal: Deploy committed changes to `https://sos-vietnam-2026.onrender.com/` via `git push origin main`, wait for Render rollout using `schedule` timer (never shell `sleep`), and run `playwright/verify-blockchain-process-qr-decoder.mjs` directly against `https://sos-vietnam-2026.onrender.com/`.
  - Scope Boundary:
    - Editable: `Reports/qa/playwright/blockchain-process-qr-decoder-staging.{json,md}`, plan ledgers
    - Inspect-only: Live `https://sos-vietnam-2026.onrender.com/`
    - Preserve-only: Production `https://sosvie.site` (DO NOT TOUCH)
    - Out of scope: Any production repository/domain
  - Non-Goals: Deploying to `sosvie.site`.
  - Pre-flight Questions:
    - Data source: Live `https://sos-vietnam-2026.onrender.com/` (`Chain ID: 84202600`, `SOS_RENDER_SANDBOX`)
    - Display permission: Public vs authenticated Dispatcher verified live on HTTPS.
    - DB read flow: Live HTTPS lookup & `.json` dossier cross-check against Render server ledger.
    - DB write flow: Test incident resolved cleanly at end of E2E run so staging queue is left tidy.
    - Render location: `https://sos-vietnam-2026.onrender.com/tra-cuu-blockchain.html` & `/dispatcher.html`
    - UI behavior flow: Same 7-part E2E + OpenCV QR scan suite against live HTTPS Render URL.
    - Docker runtime: Live Render container built from `Dockerfile`.
    - Playwright target: `https://sos-vietnam-2026.onrender.com`
    - Behavior test: `node playwright/verify-blockchain-process-qr-decoder.mjs --base-url https://sos-vietnam-2026.onrender.com --report-prefix staging`
    - Cleanup/quarantine: Test SOS case marked `resolved` during the E2E flow so no dangling pending case remains in Dispatcher queue.
    - External side effects: Pushes commits to `origin/main` (`Tinhhhh/sos-vietnam-2026.git` staging repo).
    - N/A notes: None.
  - Work Steps:
    1. Push verified commits to `origin/main` and wait for `https://sos-vietnam-2026.onrender.com/tra-cuu-blockchain.html` & `/api/blockchain/lookup` to go live using `schedule` one-shot timers.
       - UI flow check: `/tra-cuu-blockchain.html` returns HTTP `200` on Render.
       - DB/data flow check: `/api/blockchain/status` reports `chainId: 84202600`.
       - Render location check: `https://sos-vietnam-2026.onrender.com/tra-cuu-blockchain.html`
       - Mini QA for each completed implementation slice (MUST): Live HTTP readiness check.
       - Evidence target: `E3-P3B-DEPLOY1`
    2. Run `node playwright/verify-blockchain-process-qr-decoder.mjs --base-url https://sos-vietnam-2026.onrender.com --report-prefix staging` and verify `100% PASS` including OpenCV QR scan of live Render screenshot.
       - UI flow check: `100% PASS` on live Render Staging.
       - DB/data flow check: Live `.json` dossier verified both offline and online against Render ledger.
       - Render location check: `Reports/qa/playwright/blockchain-process-qr-decoder-staging.{json,md}`
       - Mini QA for each completed implementation slice (MUST): Inspect staging screenshots & QA report.
       - Evidence target: `E3-P3B-STAGING1`
  - Implementation Gate:
    - `P3-A` must pass `100%` before pushing to `origin/main`.
  - Acceptance:
    - Source: Staging QA reports generated cleanly.
    - Runtime/UI: `100% PASS` on `https://sos-vietnam-2026.onrender.com/`.
    - DB/data: Live QR decodes to `https://sos-vietnam-2026.onrender.com/tra-cuu-blockchain.html?tx=0x...` and resolves `100% NGUYÊN VẸN`.
    - Behavior test: `Reports/qa/playwright/blockchain-process-qr-decoder-staging.{json,md}` recorded.
    - Cleanup/quarantine: Test incident closed (`resolved`) on staging.
    - Evidence IDs: `E3-P3B-DEPLOY1`, `E3-P3B-STAGING1`
    - Actual-status rows refreshed: `R6` live staging verified.
  - Evidence Targets: `E3-P3B-DEPLOY1`, `E3-P3B-STAGING1`
  - Actual-status Update: Record `R6` live staging pass.
  - Commit Boundary: Commit staging QA evidence & ledger updates.

- [ ] Pn-A: Call supervisor for the implemented-plan acceptance loop.
  - Goal: Zero-trust verification of all claims, changed files, QR scan proof, process timing blocks, and live Render Staging evidence using `.agents/skills/supervisor/SKILL.md`.
  - Work Steps:
    1. Audit all source diffs, Anvien `detect-changes`, Docker E2E, OpenCV QR proof, and live Staging E2E against `.agents/skills/supervisor/SKILL.md` and write supervisor verdict report.
    2. Fix any gap if found and re-verify until `PASS`.
  - Implementation Gate: `P1-A`..`P3-B` completed.
  - Acceptance: Supervisor verdict `PASS` recorded in `Reports/supervisor/`.

- [ ] Pn-B: Remove dead work created during this plan.
  - Goal: Clean up `.tmp/` scratch files created during this plan while preserving pre-existing unrelated workspace files.
  - Work Steps:
    1. Remove plan-created temp files inside `.tmp/` and verify no leftover Docker containers exist.
    2. Confirm `git status` shows only intended files and untouched pre-existing unrelated files.
  - Implementation Gate: Only remove temporary artifacts created by this plan.
  - Acceptance: Clean worktree & zero leftover QA containers.

- [ ] Pn-C: Close the plan.
  - Goal: Finalize `plan.md` (`Status: complete`), `actual-status.md`, `evidence.md`, `benchmark.md`, commit closure, and push to `origin/main`.
  - Work Steps:
    1. Update final metrics in `benchmark.md`, closure evidence in `evidence.md`, and mark `Status: complete` in `plan.md`.
    2. Commit plan closure & push to `origin/main`.
  - Implementation Gate: `Pn-A` and `Pn-B` passed.
  - Acceptance: Plan `complete` and synced with `origin/main`.

## Risk Notes

- **Unrelated Workspace Files**: Pre-existing untracked/modified files from earlier documentary/patch sessions exist in the working directory; always stage explicit file paths (`git add <explicit-files>`) and NEVER run `git add -A` or `git checkout -- .`.
- **Backward Compatibility of Existing Blocks**: `computeDeterministicTxHash` formula (`SHA256(JSON.stringify(record) + "|" + blockNumber + "|" + prevHash)`) MUST remain unchanged so all previously sealed blocks (`#101..#109+`) continue to pass `verifyCaseChainIntegrity` 100%.
- **CSP Compliance**: `server.js` enforces `script-src 'self' 'unsafe-inline'`; `/tra-cuu-blockchain.html` and `js/blockchain-verifier-portal.js` must use zero external script CDNs.
