# SOS Vietnam 2026 — Web3 DePIN Blockchain Ledger, Hardware Anti-Spoofing & Stealth SOS Plan

## Metadata

- Date: `2026-11-02`
- Status: `complete`
- Plan: `docs/plans/2026-11-02-web3-depin-and-stealth-sos/2026-11-02-web3-depin-and-stealth-sos-plan.md`
- Evidence: `docs/plans/2026-11-02-web3-depin-and-stealth-sos/2026-11-02-web3-depin-and-stealth-sos-evidence.md`
- Benchmark: `docs/plans/2026-11-02-web3-depin-and-stealth-sos/2026-11-02-web3-depin-and-stealth-sos-benchmark.md`
- Actual status: `docs/plans/2026-11-02-web3-depin-and-stealth-sos/2026-11-02-web3-depin-and-stealth-sos-actual-status.md`

## Goal

Upgrade SOS Vietnam 2026 (`https://sos-vietnam-2026.onrender.com` Staging Sandbox and `https://sosvie.site` Production) to a **Hybrid Web3 Security & DePIN** architecture covering all 5 specification deliverables:
1. Internal Blockchain Ledger (`Chain ID: 842026` / `84202600`) + Multi-Chain EVM readiness (`NDA Chain`, `Polygon Amoy`), Hardware ESP32-C3 + `CapPhatTheSOS.exe` `bc_seal` / `live_evidence_hash` anti-spoofing on `/api/hardware-sos`, and immutable 4-step Case Lifecycle sealing (`1_SOS_TRIGGER`, `2_EVIDENCE_SEAL`, `3_OFFICER_DISPATCH`, `4_CASE_RESOLVED`).
2. Multi-tier Field Evidence Storage (Cloudinary / Supabase Storage partitioned by `SOS_VIETNAM_OFFICIAL` vs `SOS_RENDER_SANDBOX` + encrypted `.runtime-data/evidence-media/` vault fallback) with pre-upload RAM `SHA-256` hashing (`POST /api/sos/upload-evidence`).
3. Dispatcher Command Center **BẢO CHỨNG CHUỖI KHỐI (WEB3 / BLOCKCHAIN LEDGER)** panel (`.bc-security-panel`) inside `#activeIncidentDrawer`.
4. Live Server-Side `SHA-256` Integrity Audit (`runIntegrityCheck()`) re-hashing raw stored evidence bytes against `originalBlockchainHash`, legal dossier extraction, original file download, and Block QR code.
5. Citizen Web Emergency Camouflage (`js/stealth-sos.js`): **5.1 Fake Incoming Call (iOS UI)** (3s delay, fullscreen, ring/vibrate, `"Ba"`, Green Answer -> 6-button keypad, `00:01` timer, Vietnamese `speechSynthesis`, `WakeLock`, `"Danh bạ"` `#000000` proximity blackout, covert 5000ms `MediaRecorder` + browser `SHA-256` upload, **3-tap Red Hangup guard**) and **5.2 Blackout Stealth Mode** (`#000000` `100vw x 100vh` `z-index: 999999`, `WakeLock`, covert 5s audio + continuous GPS, **4-tap unlock guard**).
6. Web Serial DePIN Card Provisioning & Verification Portal (`cap-phat-the.html` + `js/depin-card-portal.js` synced 100% with `DAC_TA_DONG_BO_WEB_VA_AI.md`: Web Serial UART `115200 bps 8N1`, `TEST` vs `REAL` 1-time Genesis lock & `Block #2+` hash chaining, dual-secret SHA-256 verifier, Tactical E10 palette) AND Live Staging Deployment + E2E Verification on `https://sos-vietnam-2026.onrender.com/` (explicitly NOT deploying to `sosvie.site` yet).

## Rules

- Complete P0 actual status before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence as work completes.
- Record benchmarkable counts or measurements when they are taken.
- Update later phase status assumptions, next actions, and work steps when actual-status evidence changes the repo state.
- After completing a phase or implementation slice and refreshing `actual-status.md`, update the next affected phase's work steps as needed to match the latest repo reality, while preserving that phase's original goal, scope, acceptance criteria, and major phase order.
- Run Anvien detect-changes before every implementation-slice commit when implementation work was performed.
- For public runtime or UI-facing changes, validate the real user-visible runtime with browser or Playwright evidence.
- For app/runtime validation, full build must include Docker image/container build. If Docker is missing or not run, full build is incomplete.
- Any Playwright validation must target the real built Docker/container runtime. Running Playwright against a host dev server, framework dev mode, mocked server, or source-run shortcut is not valid runtime evidence.
- If the Docker runtime cannot be built or started, the slice/plan is blocked; do not replace it with dev-server Playwright evidence.
- Playwright evidence must record the Docker build/run or compose command, container/service name, exposed URL, Playwright command, and screenshot/trace/result.
- Every implementation phase is decomposed into narrow executable slices (`P1-A`, `P1-B`, `P2-A`, `P2-B`, `P3-A`, `P3-B`, `P4-A`, `P4-B`).
- Hidden fallback is forbidden. When cloud ENV keys (`CLOUDINARY_*` / `SUPABASE_*`) are absent, the storage adapter explicitly records `storageProvider: "local-encrypted-vault"` in both API responses and UI metadata rather than pretending to be Cloudinary.
- All temporary directories created during QA/runtime checks must reside strictly under `c:\Users\dienv\Desktop\sos_vietnam_2026_web_hosting\.tmp\`.

## Problem

1. Hardware SOS cards (`ESP32-C3 TDM2421 + 4G EG800K`) provisioned via `CapPhatTheSOS.exe` now transmit `cardID`, `button`, `type`, `target_unit`, `unit_title`, `user_name`, `user_phone`, `user_cccd`, `hw_mac`, `bc_seal`, `live_evidence_hash`, and `chain_id` to `POST /api/hardware-sos`, but the Web backend currently ignores those fields, performs no cryptographic anti-spoofing check, and returns no Blockchain receipt (`blockNumber`, `txHash`).
2. Field audio/video evidence and SOS dispatch lifecycle events (`1_SOS_TRIGGER`, `2_EVIDENCE_SEAL`, `3_OFFICER_DISPATCH`, `4_CASE_RESOLVED`) are not cryptographically sealed onto an immutable ledger, nor can dispatchers perform a live byte-level `SHA-256` re-hash integrity audit with legal extraction and QR verification.
3. Victims facing an attacker directly in real life cannot openly tap an SOS screen or speak to 113; the Citizen Web app currently lacks **Fake Incoming Call (iOS UI)** and **Blackout Stealth Mode** with background 5-second `MediaRecorder` `SHA-256` evidence streaming and multi-tap anti-attacker exit guards.

## Scope

- New backend ESM services:
  - `services/blockchain-ledger-service.js`
  - `services/evidence-storage-service.js`
- Backend HTTP/SSE integration in `server.js`:
  - `POST /api/hardware-sos` & `GET /api/hardware-sos`
  - Lifecycle sealing across `/api/sos/create`, `/api/sos/upload-evidence`, `/api/sos/media`, `/api/dispatcher/accept`, `performZaloIncidentAccept`, `/api/dispatcher/update-status`, and `/api/sos/citizen-safe`
  - `POST /api/sos/upload-evidence`, `POST /api/sos/stealth-gps`, `GET /api/sos/evidence-file/:incidentId/:evidenceId`
  - `GET /api/blockchain/status`, `GET /api/blockchain/explorer/:txOrBlock`, `POST /api/dispatcher/blockchain/verify`
  - `CONTENT_SECURITY_POLICY` update for Cloudinary/Supabase media playback
- Dispatcher UI:
  - `dispatcher.html`, `css/style.css`, `js/dispatcher.js` (`.bc-security-panel` + `runIntegrityCheck()` + playable Stealth audio list + QR & legal dossier export)
- Citizen Stealth UI:
  - `js/stealth-sos.js`, `index.html`, `css/style.css`, `js/app.js`, `sw.js`
- Reusable Docker Playwright E2E verification:
  - `playwright/verify-web3-depin-and-stealth-sos.mjs`
  - `Reports/qa/playwright/2026-11-02-web3-depin-stealth-sos/qa-report.{json,md}`

## Non-Goals

- Modifying external C++ desktop provisioning tool `CapPhatTheSOS.exe` or Arduino ESP32-C3 C++ firmware.
- Running a RAM-heavy Ganache node inside Render Free 512MB container (replaced per user decision A3 by cryptographically hash-chained AES-256-GCM ledger + native EVM JSON-RPC relay when RPC URLs are configured).
- Altering unrelated uncommitted presentation/video files in the workspace.

## Requirements

1. **Shared Secret & Dual `bc_seal` Compatibility**:
   - `COMMAND_SECRET_KEY = process.env.COMMAND_SECRET_KEY || "BTL_CSCD_E10_D1_SOS_VIETNAM_2026"`.
   - Accept `bc_seal` matching either C++ `SHA256(cardID|userName|userPhone|userCCCD|COMMAND_SECRET_KEY)` or ESP32-C3 `SHA256(cardID|userName|userPhone|userCCCD|hwMacID|COMMAND_SECRET_KEY)` (case-insensitive hex, optional `0x` prefix), and verify `live_evidence_hash = SHA256(cardID|hwMacID|unitCode|currentLat,currentLon|bc_seal)` across float formatting variants (`raw`, `toFixed(6)`, `Number`). Preserve 100% backward compatibility for legacy IoT requests without `bc_seal` (tagged `UNSEALED_LEGACY_IOT`), while flagging invalid `bc_seal` as `SPOOF_SUSPECTED`.
2. **Environment Auto-Detection (`SYSTEM_CONFIG`)**:
   - Host `sosvie.site` / `www.sosvie.site` -> `chainId: 842026`, `storageFolder: "SOS_VIETNAM_OFFICIAL"`, `"HỆ THỐNG CHÍNH THỨC (PRODUCTION)"`.
   - All other hosts (`sos-vietnam-2026.onrender.com`, `localhost`, `127.0.0.1`) -> `chainId: 84202600`, `storageFolder: "SOS_RENDER_SANDBOX"`, `"MÔI TRƯỜNG THỬ NGHIỆM (TEST SANDBOX)"` (with UI network selector displaying `842026` / `NDA` / `POLYGON` per spec).
3. **4-Step Case Lifecycle Sealing**:
   - `1_SOS_TRIGGER`, `2_EVIDENCE_SEAL`, `3_OFFICER_DISPATCH` (recording exact `responseTimeSeconds = round((Block3 - Block1)/1000)`), and `4_CASE_RESOLVED` sealed sequentially starting from Block `#101` and persisted via `runtime-data-store.js`.
4. **Evidence Pre-Hash & Live Re-Hash Audit**:
   - Hash raw media bytes in RAM (`0x` + SHA-256 hex) before upload/persistence; store `{ evidenceId, mediaUrl, sha256Hash, clientSha256, blockNumber, txHash, storageProvider, storageFolder }`; on `runIntegrityCheck()`, re-read raw stored bytes, compute `currentServerFileHash`, compare with `originalBlockchainHash`, and render `"✔ XÁC THỰC THÀNH CÔNG (100% NGUYÊN VẸN) - ĐỦ TIÊU CHUẨN TRÍCH XUẤT LÀM CHỨNG CỨ PHÁP LÝ"` + original file download + SVG QR code.
5. **Citizen Stealth Camouflage**:
   - **Fake Incoming Call (iOS UI)**: 3s countdown -> fullscreen + ringtone + vibration -> Green Answer -> 6-button keypad + `00:01` timer + Vietnamese `speechSynthesis` (*"Alo, con đang ở đâu đó? Bố đang ra đón đây, bật định vị lên nhé."*) + `WakeLock` + `"Danh bạ"` `#000000` proximity blackout + covert silent SOS + 5000ms `MediaRecorder` + `crypto.subtle.digest('SHA-256')` upload to `/api/sos/upload-evidence` + **3 consecutive taps** on Red Hangup button required to exit.
   - **Blackout Stealth Mode**: `#000000` (`100vw`, `100vh`, `z-index: 999999`) + `WakeLock` + covert silent SOS + 5s `MediaRecorder` + continuous GPS + **4 consecutive taps** required to unlock.

## Acceptance Criteria

1. `POST /api/hardware-sos` with the spec Section 2.2 payload (`SOS_CSCD10_01`, `hw_mac: "A4CF128E3B09"`, valid `bc_seal` & `live_evidence_hash`) returns HTTP `200` with `hardwareAuth.verified === true`, `blockNumber >= 101`, and `txHash` (`0x...`), while tampered `bc_seal` returns `hardwareAuth.verified === false` (`SPOOF_SUSPECTED`) and legacy payloads remain 100% functional.
2. All 4 lifecycle actions (`1_SOS_TRIGGER`, `2_EVIDENCE_SEAL`, `3_OFFICER_DISPATCH`, `4_CASE_RESOLVED`) create linked blocks persisted across container restarts, with `3_OFFICER_DISPATCH` recording exact `responseTimeSeconds`.
3. Citizen Stealth Fake Incoming Call and Blackout Stealth Mode both trigger covert SOS + 5000ms `MediaRecorder` chunks + browser `SHA-256` digest + upload to `/api/sos/upload-evidence`, and strictly enforce the 3-tap Red Hangup guard and 4-tap Blackout unlock guard.
4. Clicking an incident in `dispatcher.html` renders `.bc-security-panel` with exact spec DOM IDs (`#bcNetworkSwitch`, `#uiHwMac`, `#uiAuthBadge`, `#uiEvidenceHash`, `#uiTxLink`, `#uiBlockNum`, `#uiAuditTimeline`), playable 5s Stealth audio clips, and `runIntegrityCheck()` producing `"✔ XÁC THỰC THÀNH CÔNG (100% NGUYÊN VẸN) - ĐỦ TIÊU CHUẨN TRÍCH XUẤT LÀM CHỨNG CỨ PHÁP LÝ"` + downloadable original audio + scannable SVG QR code.
5. Full Docker image `sos-vietnam:local` builds cleanly, runs healthy on `/healthz`, is opened visibly on the user's PC, and passes 100% of assertions in `playwright/verify-web3-depin-and-stealth-sos.mjs` against the running Docker container.

## Checklist

- [x] P0-A: Complete actual status before implementation work.
  - Goal: establish the real current state across backend, Dispatcher UI, Citizen UI, Anvien graph, and Docker runtime.
  - Work Steps: inspect source-of-truth files, run `anvien analyze --force`, `anvien file-detail`, and `anvien impact`, verify Docker Engine `v29.6.1`, classify each surface in `actual-status.md`, and record baseline metrics in `benchmark.md`.
  - Implementation Gate: no implementation or editing starts until `docs/plans/2026-11-02-web3-depin-and-stealth-sos/2026-11-02-web3-depin-and-stealth-sos-actual-status.md` has a final P0 decision.
  - Acceptance: actual status identifies `correct`, `partial`, and `missing` surfaces with exact `E0-P0A-*` evidence IDs (`P0 complete. Next phase can proceed unchanged`).

### P1: Hybrid Web3 Blockchain Ledger, Hardware DePIN Anti-Spoofing & Case Lifecycle Sealing

- Phase Goal: Build the persistent internal Blockchain Ledger + Multi-Chain EVM connector + Hardware `bc_seal`/`live_evidence_hash` verifier and seal `1_SOS_TRIGGER`, `3_OFFICER_DISPATCH`, and `4_CASE_RESOLVED` across all SOS lifecycle endpoints.
- Phase Boundary:
  - In scope: `services/blockchain-ledger-service.js` and `server.js` (`/api/hardware-sos`, `/api/sos/create`, `/api/dispatcher/accept`, `performZaloIncidentAccept`, `/api/dispatcher/update-status`, `/api/sos/citizen-safe`, `/api/blockchain/status`, `/api/blockchain/explorer/:txOrBlock`).
  - Out of scope: Audio/video binary upload (`P2`), Dispatcher HTML/JS UI (`P3`), Citizen Stealth UI (`P4`).
  - Dependencies: `P0-A`, `services/runtime-data-store.js` (preserve-only).
- Phase Implementation Rule: do not implement `P1` directly. Implement `P1-A`, verify it, record evidence, refresh actual-status, commit, then continue to `P1-B`.
- Ordered Slice List:
  - `P1-A`: Create `services/blockchain-ledger-service.js` (Ledger, DePIN Seal Verifier, Multi-Chain EVM Relay & SVG QR Generator)
  - `P1-B`: Wire `/api/hardware-sos` Anti-Spoofing, Case Lifecycle Hooks (`1_SOS_TRIGGER`, `3_OFFICER_DISPATCH`, `4_CASE_RESOLVED`) & Block Explorer Routes in `server.js`

- [x] P1-A: Create `services/blockchain-ledger-service.js` (Ledger, DePIN Seal Verifier, Multi-Chain EVM Relay & SVG QR Generator)
  - Goal: Implement a self-contained native ESM Blockchain & DePIN security service with persistent AES-256-GCM block storage starting at `#101`, dual-formula `bc_seal` + `live_evidence_hash` verification, Multi-Chain EVM JSON-RPC relay support (`842026`, `NDA`, `POLYGON`), and offline SVG QR generation.
  - Scope Boundary:
    - Editable: `services/blockchain-ledger-service.js`
    - Inspect-only: `services/runtime-data-store.js`, `services/security-crypto-service.js`
    - Preserve-only: `services/runtime-data-store.js`
    - Out of scope: `server.js`, frontend HTML/JS
  - Non-Goals: HTTP route wiring (`P1-B`) or media file storage (`P2-A`).
  - Pre-flight Questions:
    - Data source: Hardware payload fields + incident lifecycle metadata + `readRuntimeData('blockchain-ledger.json')`.
    - Display permission: Public block hash/receipt metadata omits raw citizen access tokens; PII is masked on public explorer views.
    - DB read flow: `readRuntimeData('blockchain-ledger.json', defaultState)` loads sequential block chain (`nextBlockNumber: 101`, `blocks: []`) on startup.
    - DB write flow: `writeToSOSBlockchain(actionType, caseId, payloadData, options)` appends signed block (`blockNumber`, `prevHash`, `txHash`, `chainId`, `payload`) and persists via `writeRuntimeData('blockchain-ledger.json', state)`.
    - Render location: N/A in `P1-A` (pure backend module; consumed by `server.js` in `P1-B` and `dispatcher.js` in `P3-B`).
    - UI behavior flow: N/A in `P1-A` (verified via direct Node ESM boundary check in `P1-A` and full Docker Playwright UI in `P4-B`).
    - Docker runtime: Compatible with Node 22 Alpine/Debian container in `Dockerfile` (zero native C++ addon dependencies).
    - Playwright target: Verified end-to-end in `P4-B` against `sos-vietnam:local`.
    - Behavior test: Node ESM verification proving C++ `bc_seal`, ESP32-C3 `bc_seal`, tampered `bc_seal` rejection, `live_evidence_hash` match, sequential blocks `#101 -> #102`, chain hash linkage verification, and SVG QR output.
    - Cleanup/quarantine: Test uses isolated `SOS_RUNTIME_DATA_DIR` under `.tmp/p1a-test` and deletes it immediately after verification.
    - External side effects: Optional non-blocking JSON-RPC relay only when `NDA_CHAIN_RPC_URL` or `POLYGON_AMOY_RPC_URL` + `BLOCKCHAIN_PRIVATE_KEY` are explicitly set.
    - N/A notes: UI/render checks are `N/A` because `P1-A` creates an unmounted backend service module.
  - Work Steps:
    1. Create `services/blockchain-ledger-service.js` implementing `resolveSystemBlockchainConfig(hostnameOrOrigin)`, `verifyHardwareDePINPayload(data)` (supporting both C++ and ESP32-C3 `bc_seal` formulas + `live_evidence_hash` float normalization + legacy unsealed fallback), `writeToSOSBlockchain(actionType, caseId, payloadData, options)`, `getIncidentBlockchainSummary(incidentId)`, `findBlockByTxOrNumber(ref)`, `verifyLedgerChainIntegrity(caseId)`, and a self-contained ISO-18004 QR Code SVG generator `generateQrCodeSvg(url)` (so QR codes render crisply offline/online without leaking URLs to third-party QR APIs).
       - UI flow check: N/A (backend ESM module).
       - DB/data flow check: Verify `blockchain-ledger.json` round-trips through `readRuntimeData`/`writeRuntimeData` with `nextBlockNumber` incrementing from `101` and `prevHash` chaining intact.
       - Render location check: N/A (mounted in `P1-B` / `P3-B`).
       - Mini QA for each completed implementation slice (MUST): Execute isolated Node ESM boundary test under `SOS_RUNTIME_DATA_DIR=.tmp/p1a-test` testing C++ `bc_seal`, ESP32 `bc_seal`, spoofed `bc_seal`, sequential block sealing, reload persistence, and SVG QR output; measure `writeToSOSBlockchain` latency for `B1`.
       - Evidence target: `E1-P1A-IMPL1`, `E1-P1A-VAL1`.
  - Implementation Gate:
    - Confirm `E0-P0A-GRAPH2` (`services/runtime-data-store.js` contract) before writing `services/blockchain-ledger-service.js`.
  - Acceptance:
    - Source: `services/blockchain-ledger-service.js` exports clean ESM functions with zero CommonJS `require`.
    - Runtime/UI: N/A (verified in `P1-B` / `P4-B`).
    - DB/data: Blocks `#101+` persist encrypted via `runtime-data-store.js` and survive service reload.
    - Behavior test: C++ formula, ESP32 formula, tampered signature detection, `live_evidence_hash`, chain linkage, and QR SVG generation all pass exit `0`.
    - Cleanup/quarantine: `.tmp/p1a-test` removed after test.
    - Evidence IDs: `E1-P1A-IMPL1`, `E1-P1A-VAL1`, `E1-P1A-GRAPH1`, `E1-P1A-COMMIT1`.
    - Actual-status rows refreshed: `services/blockchain-ledger-service.js` (`missing -> correct`).
  - Evidence Targets: `E1-P1A-IMPL1`, `E1-P1A-VAL1`, `E1-P1A-GRAPH1`, `E1-P1A-COMMIT1`.
  - Actual-status Update: Update `services/blockchain-ledger-service.js` row and append `R1` in `actual-status.md`.
  - Commit Boundary: Run `anvien analyze --force` + `anvien detect-changes --repo sos-vietnam-2026 --scope all` and commit `services/blockchain-ledger-service.js`.

- [x] P1-B: Wire `/api/hardware-sos` Anti-Spoofing, `DAC_TA` DePIN Card Chaining APIs, Case Lifecycle Hooks (`1_SOS_TRIGGER`, `3_OFFICER_DISPATCH`, `4_CASE_RESOLVED`) & Block Explorer Routes in `server.js`
  - Goal: Connect `blockchain-ledger-service.js` into `server.js` so `/api/hardware-sos` parses all new ESP32-C3 fields, verifies `bc_seal` & `live_evidence_hash`, returns `blockNumber` + `txHash`, seals `1_SOS_TRIGGER`, `3_OFFICER_DISPATCH` (with `responseTimeSeconds`), and `4_CASE_RESOLVED` across all sibling routes, and serves `/api/blockchain/status` + `/api/blockchain/explorer/:txOrBlock`.
  - Scope Boundary:
    - Editable: `server.js`
    - Inspect-only: `services/blockchain-ledger-service.js`, `services/zalo-bot-service.js`
    - Preserve-only: `services/security-firewall-middleware.js`, `services/runtime-data-store.js`
    - Out of scope: Binary media upload (`P2`), `dispatcher.html`/`js/dispatcher.js` (`P3`), `index.html`/`js/app.js` (`P4`).
  - Non-Goals: Cloud audio storage (`P2-A`/`P2-B`).
  - Pre-flight Questions:
    - Data source: Request body on `/api/hardware-sos`, `/api/sos/create`, `/api/dispatcher/accept`, `performZaloIncidentAccept`, `/api/dispatcher/update-status`, `/api/sos/citizen-safe`.
    - Display permission: `/api/blockchain/explorer/:txOrBlock` shows cryptographic seal, block number, timestamps, hardware MAC, and masked citizen contact (`090****567`) so scanning the QR proves authenticity without leaking full citizen phone/CCCD publicly; authenticated dispatchers receive full `incident.blockchain` & `incident.hardwareSecurity`.
    - DB read flow: `incidents` map + `blockchain-ledger.json` via `blockchain-ledger-service.js`.
    - DB write flow: Each lifecycle transition updates `incident.blockchain` (`latestBlockNumber`, `latestTxHash`, `latestHash`, `triggerTimestamp`, `responseTimeSeconds`, `auditTrail`) AND calls `saveIncidentHistory()`.
    - Render location: `/api/blockchain/explorer/:txOrBlock` HTML/JSON certificate page + REST/SSE JSON payloads (`sos_new`, `sos_update`).
    - UI behavior flow: QR / `uiTxLink` opens `/api/blockchain/explorer/:txHash` displaying verified Block certificate.
    - Docker runtime: Native HTTP routes in `server.js`.
    - Playwright target: Full browser E2E in `P4-B` against `sos-vietnam:local`.
    - Behavior test: Spin up `server.js` against isolated `.tmp/p1b-test` runtime dir and test `POST /api/hardware-sos` (spec Section 2.2 payload + tampered payload + legacy payload), `POST /api/dispatcher/accept` (`3_OFFICER_DISPATCH` + `responseTimeSeconds`), `POST /api/dispatcher/update-status` (`resolved` -> `4_CASE_RESOLVED`), and `GET /api/blockchain/explorer/:txHash`.
    - Cleanup/quarantine: Stop temporary test server and delete `.tmp/p1b-test`.
    - External side effects: None on local sandbox.
    - N/A notes: Dispatcher drawer DOM check is in `P3-B`/`P4-B`; `P1-B` validates HTTP + SSE + Explorer HTML boundaries directly.
  - Work Steps:
    1. Update `server.js` (`normalizeHardwareIncidentForDisplay`, `GET /api/hardware-sos`, `POST /api/hardware-sos`, `POST /api/sos/create`) to parse `cardID`, `button` (1/2/3), `type`, `target_unit`, `unit_title`, `user_name`, `user_phone`, `user_cccd`, `cccd`, `hw_mac`, `bc_seal`, `live_evidence_hash`, `chain_id`, verify hardware seal via `verifyHardwareDePINPayload`, seal `1_SOS_TRIGGER`, attach `incident.hardwareSecurity` + `incident.blockchain`, and return `blockNumber`, `txHash`, `chainId`, and `hardwareAuth` in the JSON response while guarding `server.js:5164` (`GET /api/sos/:id`) against sub-path collisions.
       - UI flow check: Verify `GET /api/blockchain/explorer/:txHash` renders a clean Vietnamese Web3 Block Certificate HTML page (and JSON when `?format=json` or `Accept: application/json`).
       - DB/data flow check: Verify `incident-history.json` and `blockchain-ledger.json` both persist `1_SOS_TRIGGER`, `3_OFFICER_DISPATCH` (including `performZaloIncidentAccept`), and `4_CASE_RESOLVED` (fixing missing `saveIncidentHistory()` on `/api/dispatcher/update-status` and `/api/sos/citizen-safe`).
       - Render location check: `/api/blockchain/explorer/:txOrBlock` and `/api/hardware-sos` JSON response.
       - Mini QA for each completed implementation slice (MUST): Boot isolated server instance (`SOS_RUNTIME_DATA_DIR=.tmp/p1b-test`), execute HTTP lifecycle flow (`POST /api/hardware-sos` -> login dispatcher -> `POST /api/dispatcher/accept` -> `POST /api/dispatcher/update-status` `resolved` -> `GET /api/blockchain/explorer/:txHash`), verify response codes, `responseTimeSeconds`, and persistence.
       - Evidence target: `E1-P1B-IMPL1`, `E1-P1B-VAL1`.
  - Implementation Gate:
    - Confirm `E0-P0A-GRAPH2` and `E0-P0A-GRAPH3` (`server.js` `HIGH` impact warning reviewed) before editing `server.js`.
  - Acceptance:
    - Source: All 3 non-media lifecycle events (`1_SOS_TRIGGER`, `3_OFFICER_DISPATCH`, `4_CASE_RESOLVED`) + hardware anti-spoofing + explorer endpoints are wired cleanly in `server.js`.
    - Runtime/UI: `/api/blockchain/explorer/:txHash` returns HTTP `200` certificate HTML.
    - DB/data: `incident.blockchain` and `blockchain-ledger.json` persist across all sibling accept/resolve routes.
    - Behavior test: Valid spec payload verified (`DePIN VERIFIED`), spoofed `bc_seal` flagged (`SPOOF_SUSPECTED`), legacy IoT preserved (`UNSEALED_LEGACY_IOT`), lifecycle blocks `#101 -> #102 -> #103` created with exact `responseTimeSeconds`.
    - Cleanup/quarantine: Temporary server process killed and `.tmp/p1b-test` removed.
    - Evidence IDs: `E1-P1B-IMPL1`, `E1-P1B-VAL1`, `E1-P1B-GRAPH1`, `E1-P1B-COMMIT1`.
    - Actual-status rows refreshed: `server.js` (`/api/hardware-sos` & Lifecycle Hooks: `partial -> correct`).
  - Evidence Targets: `E1-P1B-IMPL1`, `E1-P1B-VAL1`, `E1-P1B-GRAPH1`, `E1-P1B-COMMIT1`.
  - Actual-status Update: Update `server.js` lifecycle row and append `R2` in `actual-status.md`.
  - Commit Boundary: Run `anvien analyze --force` + `anvien detect-changes --repo sos-vietnam-2026 --scope all` and commit `server.js`.

### P2: Multi-Tier Field Evidence Storage, `SHA-256` Sealing & Live Integrity Audit API

- Phase Goal: Hash incoming 5-second field audio/video evidence in RAM (`SHA-256`) before durable storage (Cloudinary / Supabase partitioned by domain or encrypted `.runtime-data/evidence-media/` vault), seal `2_EVIDENCE_SEAL` blocks, and expose live byte-level `SHA-256` re-hash verification + legal dossier extraction API.
- Phase Boundary:
  - In scope: `services/evidence-storage-service.js` and `server.js` (`POST /api/sos/upload-evidence`, `POST /api/sos/stealth-gps`, `GET /api/sos/evidence-file/:incidentId/:evidenceId`, `POST /api/sos/media`, `POST /api/dispatcher/blockchain/verify`, `CONTENT_SECURITY_POLICY`).
  - Out of scope: Dispatcher UI (`P3`) and Citizen Stealth UI (`P4`).
  - Dependencies: `P1-A`, `P1-B`.
- Phase Implementation Rule: implement `P2-A`, verify & commit, then implement `P2-B`, verify & commit.
- Ordered Slice List:
  - `P2-A`: Create `services/evidence-storage-service.js` (RAM `SHA-256`, Cloudinary / Supabase Domain-Partitioned Upload & Encrypted Vault Adapter)
  - `P2-B`: Wire `POST /api/sos/upload-evidence`, Playback/Download Route, Sibling `/api/sos/media` Seal & `POST /api/dispatcher/blockchain/verify` Live Re-Hash API in `server.js`

- [x] P2-A: Create `services/evidence-storage-service.js` (RAM `SHA-256`, Cloudinary / Supabase Domain-Partitioned Upload & Encrypted Vault Adapter)
  - Goal: Implement pre-storage in-RAM `SHA-256` hashing (`0x...`), automatic upload to Cloudinary (`SOS_VIETNAM_OFFICIAL` / `SOS_RENDER_SANDBOX`) or Supabase Storage when ENV credentials exist, durable AES-256-GCM local `.runtime-data/evidence-media/` vault storage when cloud credentials are absent, and byte-exact raw buffer retrieval for live re-hash audits.
  - Scope Boundary:
    - Editable: `services/evidence-storage-service.js`
    - Inspect-only: `services/security-crypto-service.js`, `services/runtime-data-store.js`
    - Preserve-only: `services/security-crypto-service.js`, `services/runtime-data-store.js`
    - Out of scope: `server.js`, frontend files
  - Non-Goals: HTTP multipart parsing (`P2-B`).
  - Pre-flight Questions:
    - Data source: Raw `Buffer` of 5s `audio/webm` / `audio/mp4` / `video/webm` / image evidence + hostname (`sosvie.site` vs sandbox).
    - Display permission: Vault files are never exposed as static `/assets/`; they are only read through `evidence-storage-service.js` via authorized API routes in `P2-B`.
    - DB read flow: `readEvidenceBuffer(evidenceRecord)` fetches bytes from `mediaUrl` (if Cloudinary/Supabase HTTPS) or decrypts `.runtime-data/evidence-media/<id>.bin.enc` (if local vault) and returns exact original `Buffer`.
    - DB write flow: `storeFieldEvidence({ incidentId, buffer, mimeType, fileName, hostname })` computes `sha256Hash` on raw `buffer` FIRST, uploads/encrypts, and returns `{ evidenceId, sha256Hash, sizeBytes, mimeType, storageProvider, storageFolder, mediaUrl, vaultFile }`.
    - Render location: N/A in `P2-A` (backend storage module).
    - UI behavior flow: N/A in `P2-A`.
    - Docker runtime: Stores local vault inside `SOS_RUNTIME_DATA_DIR/evidence-media`, which maps directly to `/var/lib/sos-data/evidence-media` Docker volume in `Dockerfile` / `docker-compose.yml`!
    - Playwright target: Verified end-to-end in `P4-B`.
    - Behavior test: Node ESM test writing synthetic 5s WebM audio bytes, verifying `sha256Hash`, reading raw bytes back, re-hashing (`100%` byte match), and testing tamper detection if encrypted file bytes are altered.
    - Cleanup/quarantine: Isolated `.tmp/p2a-test` directory deleted after verification.
    - External side effects: Zero external network calls when `CLOUDINARY_*` / `SUPABASE_*` env vars are unset.
    - N/A notes: UI checks are `N/A` for standalone storage adapter.
  - Work Steps:
    1. Implement `services/evidence-storage-service.js` with `computeSha256Hex(buffer)`, `storeFieldEvidence(...)` (Cloudinary signed upload -> Supabase Storage REST upload -> AES-256-GCM `.runtime-data/evidence-media/` vault), `readEvidenceRawBuffer(record)` (HTTPS fetch for cloud URLs or AES-256-GCM decrypt for local vault), and native `multipart/form-data` binary parser `parseMultipartFormData(buffer, contentType)` (so `server.js` cleanly receives `FormData` `Blob` uploads from browser `MediaRecorder` without needing Express/Multer!).
       - UI flow check: N/A (backend module).
       - DB/data flow check: Verify raw `Buffer` -> `sha256Hash` -> AES-256-GCM disk write -> decrypt read -> re-hash matches `sha256Hash` byte-for-byte, and `multipart/form-data` binary boundary parser preserves every byte (`0x00..0xFF`) without UTF-8 corruption.
       - Render location check: N/A.
       - Mini QA for each completed implementation slice (MUST): Run Node ESM verification on binary `Buffer` (`0x00..0xFF`), multipart `FormData` payload, `SOS_VIETNAM_OFFICIAL` vs `SOS_RENDER_SANDBOX` folder resolution, and measure hashing + storage latency for `B2`.
       - Evidence target: `E2-P2A-IMPL1`, `E2-P2A-VAL1`.
  - Implementation Gate:
    - Confirm `services/security-crypto-service.js` and `services/runtime-data-store.js` APIs before writing `services/evidence-storage-service.js`.
  - Acceptance:
    - Source: Pure ESM module with binary-safe `multipart/form-data` parser, Cloudinary/Supabase connectors, and AES-256-GCM vault.
    - Runtime/UI: N/A.
    - DB/data: Stored binary round-trips with `100%` identical `SHA-256`.
    - Behavior test: Binary multipart parse + vault encrypt/decrypt + tamper mismatch test pass exit `0`.
    - Cleanup/quarantine: `.tmp/p2a-test` removed.
    - Evidence IDs: `E2-P2A-IMPL1`, `E2-P2A-VAL1`, `E2-P2A-GRAPH1`, `E2-P2A-COMMIT1`.
    - Actual-status rows refreshed: `services/evidence-storage-service.js` (`missing -> correct`).
  - Evidence Targets: `E2-P2A-IMPL1`, `E2-P2A-VAL1`, `E2-P2A-GRAPH1`, `E2-P2A-COMMIT1`.
  - Actual-status Update: Update `services/evidence-storage-service.js` row and append `R3`.
  - Commit Boundary: Run `anvien analyze --force` + `anvien detect-changes --repo sos-vietnam-2026 --scope all` and commit `services/evidence-storage-service.js`.

- [x] P2-B: Wire `POST /api/sos/upload-evidence`, Playback/Download Route, Sibling `/api/sos/media` Seal & `POST /api/dispatcher/blockchain/verify` Live Re-Hash API in `server.js`
  - Goal: Expose `POST /api/sos/upload-evidence` (multipart `FormData` + JSON base64), `POST /api/sos/stealth-gps`, `GET /api/sos/evidence-file/:incidentId/:evidenceId`, `POST /api/dispatcher/blockchain/verify` (live server `SHA-256` re-hash + legal dossier + SVG QR), seal sibling `POST /api/sos/media` (`2_EVIDENCE_SEAL`), and allow Cloudinary/Supabase media in `CONTENT_SECURITY_POLICY`.
  - Scope Boundary:
    - Editable: `server.js`
    - Inspect-only: `services/evidence-storage-service.js`, `services/blockchain-ledger-service.js`
    - Preserve-only: `services/security-firewall-middleware.js`
    - Out of scope: `dispatcher.html`, `js/dispatcher.js`, `index.html`, `js/app.js`
  - Non-Goals: Frontend DOM rendering (`P3` & `P4`).
  - Pre-flight Questions:
    - Data source: Browser `MediaRecorder` 5s chunks (`FormData` with `file`, `incidentId`, `accessToken`, `clientSha256`, `lat`, `lng`, `stealthMode`, `chunkIndex`) + citizen chat media (`/api/sos/media`).
    - Display permission: `POST /api/sos/upload-evidence` and `POST /api/sos/stealth-gps` require valid `requireIncidentActor` (citizen `x-sos-access-token` / `accessToken` or authenticated dispatcher); `GET /api/sos/evidence-file/:incidentId/:evidenceId` requires authenticated dispatcher session OR valid signed download token / citizen token; `POST /api/dispatcher/blockchain/verify` requires authenticated dispatcher session (`/api/dispatcher/*` gate at `server.js:2872`).
    - DB read flow: `POST /api/dispatcher/blockchain/verify` loads incident + sealed `2_EVIDENCE_SEAL` / `1_SOS_TRIGGER` blocks, re-reads raw bytes via `readEvidenceRawBuffer`, computes `currentServerFileHash`, and compares against `originalBlockchainHash`.
    - DB write flow: Appends `{ evidenceId, mediaUrl, sha256Hash, clientSha256, clientHashMatched, blockNumber, txHash, mimeType, sizeBytes, durationMs, lat, lng, stealthMode, storageProvider, storageFolder, createdAt }` to `incident.evidenceRecords`, updates `incident.lat`/`incident.lng` if finite GPS provided, seals `2_EVIDENCE_SEAL` block, calls `saveIncidentHistory()`, and broadcasts `sos_update` to dispatchers.
    - Render location: Audio/video binary stream (`Range` / `Content-Disposition` download support) on `GET /api/sos/evidence-file/:incidentId/:evidenceId` + JSON verification certificate with `qrSvg` and `explorerUrl` on `POST /api/dispatcher/blockchain/verify`.
    - UI behavior flow: Verified via HTTP boundary test in `P2-B` and full Dispatcher/Citizen UI in `P4-B`.
    - Docker runtime: Native Node `http` stream/Buffer handling in `server.js`.
    - Playwright target: Full E2E in `P4-B`.
    - Behavior test: Upload real `FormData` binary audio chunk to `POST /api/sos/upload-evidence` with citizen `accessToken`, verify `clientSha256 === sha256Hash`, verify `2_EVIDENCE_SEAL` block created, fetch audio bytes via `GET /api/sos/evidence-file/...`, and invoke `POST /api/dispatcher/blockchain/verify` verifying `verified === true`, `conclusion === "✔ XÁC THỰC THÀNH CÔNG (100% NGUYÊN VẸN) - ĐỦ TIÊU CHUẨN TRÍCH XUẤT LÀM CHỨNG CỨ PHÁP LÝ"`, and `qrSvg`.
    - Cleanup/quarantine: Kill temporary server and remove `.tmp/p2b-test`.
    - External side effects: None.
    - N/A notes: Browser DOM check deferred to `P3-B`/`P4-B`.
  - Work Steps:
    1. Update `CONTENT_SECURITY_POLICY` in `server.js` (`media-src`, `img-src`, `connect-src` adding `https://res.cloudinary.com` and `https://*.supabase.co`) and wire `POST /api/sos/upload-evidence`, `POST /api/sos/stealth-gps`, `GET /api/sos/evidence-file/:incidentId/:evidenceId` (placed ABOVE line 5164 `GET /api/sos/:id`), `POST /api/dispatcher/blockchain/verify`, plus `2_EVIDENCE_SEAL` sealing inside `POST /api/sos/media`.
       - UI flow check: Verify `GET /api/sos/evidence-file/:incidentId/:evidenceId?download=1` returns `Content-Disposition: attachment` and exact binary bytes.
       - DB/data flow check: Verify `incident.evidenceRecords` + `incident.blockchain.auditTrail` persist in `incident-history.json` and `blockchain-ledger.json`.
       - Render location check: HTTP JSON & audio stream headers (`Accept-Ranges: bytes`, `Content-Type: audio/webm`).
       - Mini QA for each completed implementation slice (MUST): Boot isolated server (`SOS_RUNTIME_DATA_DIR=.tmp/p2b-test`), create SOS, upload binary `FormData` 5s chunk with `clientSha256`, verify `2_EVIDENCE_SEAL` block, login as `admin`, run `POST /api/dispatcher/blockchain/verify`, assert `100% NGUYÊN VẸN` match, download file, and measure live audit latency for `B2`.
       - Evidence target: `E2-P2B-IMPL1`, `E2-P2B-VAL1`.
  - Implementation Gate:
    - Re-confirm `server.js` impact and route ordering around line 5164 before editing.
  - Acceptance:
    - Source: All upload, GPS heartbeat, playback/download, `/api/sos/media` seal, and live verify routes wired in `server.js`.
    - Runtime/UI: `POST /api/dispatcher/blockchain/verify` returns exact Vietnamese legal conclusion, `downloadUrl`, `explorerUrl`, and `qrSvg`.
    - DB/data: `evidenceRecords` and `2_EVIDENCE_SEAL` blocks persist cleanly.
    - Behavior test: End-to-end API upload -> playback -> live re-hash verification passes exit `0` (plus negative test where unauthorized request without token is rejected with `401`/`403`).
    - Cleanup/quarantine: Stop test server and delete `.tmp/p2b-test`.
    - Evidence IDs: `E2-P2B-IMPL1`, `E2-P2B-VAL1`, `E2-P2B-GRAPH1`, `E2-P2B-COMMIT1`.
    - Actual-status rows refreshed: `server.js` (`/api/sos/upload-evidence` & verify API: `partial -> correct`).
  - Evidence Targets: `E2-P2B-IMPL1`, `E2-P2B-VAL1`, `E2-P2B-GRAPH1`, `E2-P2B-COMMIT1`.
  - Actual-status Update: Update `server.js` evidence/verify row and append `R4`.
  - Commit Boundary: Run `anvien analyze --force` + `anvien detect-changes --repo sos-vietnam-2026 --scope all` and commit `server.js`.

### P3: Dispatcher Command Center "Bảng Bảo Chứng Chuỗi Khối" & Legal Extraction UI

- Phase Goal: Embed the `.bc-security-panel` (**BẢO CHỨNG CHUỖI KHỐI (WEB3 / BLOCKCHAIN LEDGER)**) into `#activeIncidentDrawer` on `dispatcher.html` and bind live DePIN hardware identity, `SHA-256` hashes, Multi-Chain network switcher, immutable audit timeline with response time in seconds, playable 5s Stealth audio clips, and `runIntegrityCheck()` with legal extraction + QR code in `js/dispatcher.js`.
- Phase Boundary:
  - In scope: `dispatcher.html`, `css/style.css`, `js/dispatcher.js`.
  - Out of scope: Backend services (`P1`/`P2`) and Citizen Web Stealth UI (`P4`).
  - Dependencies: `P1-B`, `P2-B`.
- Phase Implementation Rule: implement `P3-A`, verify & commit, then implement `P3-B`, verify & commit.
- Ordered Slice List:
  - `P3-A`: Embed `.bc-security-panel` Markup & Tactical Web3 Styling in `dispatcher.html` and `css/style.css`
  - `P3-B`: Bind Real-Time Blockchain Drawer State, Playable Stealth Audio Evidence & `runIntegrityCheck()` Legal Extraction in `js/dispatcher.js`

- [x] P3-A: Embed `.bc-security-panel` Markup & Tactical Web3 Styling in `dispatcher.html` and `css/style.css`
  - Goal: Add the exact spec `.bc-security-panel` HTML structure inside `#activeIncidentDrawer` (`dispatcher.html`) plus responsive dark tactical cyber-ledger styling in `css/style.css`.
  - Scope Boundary:
    - Editable: `dispatcher.html`, `css/style.css`
    - Inspect-only: `js/dispatcher.js`
    - Preserve-only: Existing `#activeIncidentDrawer` elements (`#drawerSosId`, `#drawerMediaSection`, `#drawerChannelInfo`, `#drawerActionButtons`)
    - Out of scope: `js/dispatcher.js` logic (`P3-B`), `index.html` (`P4-A`)
  - Non-Goals: JavaScript event handlers (`P3-B`).
  - Pre-flight Questions:
    - Data source: Static DOM skeleton in `dispatcher.html` populated dynamically by `js/dispatcher.js` in `P3-B`.
    - Display permission: Inside `#activeIncidentDrawer` (visible to authenticated dispatchers; action buttons respect `readOnlySameTerritory`).
    - DB read flow: N/A (HTML/CSS slice).
    - DB write flow: N/A (HTML/CSS slice).
    - Render location: `dispatcher.html` `#activeIncidentDrawer` right above `#drawerChannelInfo`.
    - UI behavior flow: Panel renders `.bc-header` (`#bcNetworkSwitch` with `842026`, `NDA`, `POLYGON`), Section 1 (`#uiHwMac`, `#uiHwChannel`, `#uiAuthBadge`), Section 2 (`#uiEvidenceType`, `#uiSealBadge`, `#uiEvidenceHash`, `#uiTxLink`, `#uiBlockNum`, `#uiStealthEvidenceBox` / `#uiStealthEvidenceList`), Section 3 (`#uiAuditTimeline`), and Section 4 (`button.btn-verify[onclick="runIntegrityCheck()"]`, `#verifyResult`).
    - Docker runtime: Static HTML/CSS served by `server.js` inside `sos-vietnam:local`.
    - Playwright target: Verified visually and interactively in `P4-B`.
    - Behavior test: DOM/HTML integrity check verifying all required spec IDs exist uniquely in `dispatcher.html` with zero duplicate IDs or broken tags.
    - Cleanup/quarantine: None needed (pure static markup/CSS).
    - External side effects: None.
    - N/A notes: DB checks are `N/A` for static markup/CSS slice.
  - Work Steps:
    1. Insert `.bc-security-panel` into `dispatcher.html` inside `#activeIncidentDrawer` preserving every ID and class from Spec Section 3 (Hạng mục 3) plus `#uiStealthEvidenceList` for playing 5s covert audio clips, and add `.bc-security-panel` styles (`.pulse-dot`, `.bc-network-badge`, `.bc-hardware-box`, `.verified-tag`, `.spoof-tag`, `.bc-hash-box`, `.hash-code`, `.bc-timeline`, `.btn-verify`, `.verify-result`) in `css/style.css`.
       - UI flow check: Verify all spec IDs (`bcNetworkSwitch`, `uiHwMac`, `uiAuthBadge`, `uiEvidenceHash`, `uiTxLink`, `uiBlockNum`, `uiAuditTimeline`, `verifyResult`) and `onclick="runIntegrityCheck()"` exist cleanly in `dispatcher.html`.
       - DB/data flow check: N/A (static markup/CSS).
       - Render location check: Inside `#activeIncidentDrawer` between `#drawerMediaSection` and `#drawerChannelInfo`.
       - Mini QA for each completed implementation slice (MUST): Run HTML ID uniqueness & CSS syntax check script verifying zero duplicate IDs and balanced braces.
       - Evidence target: `E3-P3A-IMPL1`, `E3-P3A-VAL1`.
  - Implementation Gate:
    - Confirm `E0-P0A-GRAPH2`/`E0-P0A-GRAPH3` (`dispatcher.html` and `css/style.css` `LOW` risk) before editing.
  - Acceptance:
    - Source: Exact spec HTML structure & tactical CSS added without altering existing drawer IDs.
    - Runtime/UI: Panel styled cleanly for both desktop sidebar and mobile detail drawer (`<= 992px`).
    - DB/data: N/A.
    - Behavior test: ID & CSS structure check passes exit `0`.
    - Cleanup/quarantine: N/A.
    - Evidence IDs: `E3-P3A-IMPL1`, `E3-P3A-VAL1`, `E3-P3A-GRAPH1`, `E3-P3A-COMMIT1`.
    - Actual-status rows refreshed: `dispatcher.html` + `css/style.css` (`missing -> correct`).
  - Evidence Targets: `E3-P3A-IMPL1`, `E3-P3A-VAL1`, `E3-P3A-GRAPH1`, `E3-P3A-COMMIT1`.
  - Actual-status Update: Update `dispatcher.html` + `css/style.css` row and append `R5`.
  - Commit Boundary: Run `anvien analyze --force` + `anvien detect-changes --repo sos-vietnam-2026 --scope all` and commit `dispatcher.html` and `css/style.css`.

- [x] P3-B: Bind Real-Time Blockchain Drawer State, Playable Stealth Audio Evidence & `runIntegrityCheck()` Legal Extraction in `js/dispatcher.js`
  - Goal: Wire `js/dispatcher.js` (`updateDrawer`, SSE `sos_new`/`sos_update`, `#bcNetworkSwitch`, and global `window.runIntegrityCheck`) so selecting any Hardware or Citizen Web SOS displays live DePIN authentication, `SHA-256` evidence hashes, clickable `TxHash` explorer link, immutable audit trail (with officer response time in seconds), playable 5s Stealth audio clips, and one-click Live Integrity Audit rendering the legal conclusion, original file download button, printable/JSON legal report, and scannable Block QR code.
  - Scope Boundary:
    - Editable: `js/dispatcher.js`
    - Inspect-only: `dispatcher.html`, `server.js`
    - Preserve-only: Existing `selectIncident`, `handleAcceptSOS`, `handleUpdateStatus`, `openDispatcherVoiceCall`, `startDispatcherVideoCall` flows
    - Out of scope: Citizen Web (`P4-A`)
  - Non-Goals: Citizen Stealth recording (`P4-A`).
  - Pre-flight Questions:
    - Data source: `inc.hardwareSecurity`, `inc.blockchain`, `inc.evidenceRecords` from `/api/dispatcher/incidents` + SSE `sos_new`/`sos_update` + `POST /api/dispatcher/blockchain/verify`.
    - Display permission: Respects `inc.readOnlySameTerritory` (hides download/verify mutation actions for read-only neighboring units while showing ledger status to authorized officers).
    - DB read flow: Reads live incident state and invokes `POST /api/dispatcher/blockchain/verify` with `{ incidentId: inc.id, network: selectedNetwork }`.
    - DB write flow: `handleAcceptSOS` and `handleUpdateStatus` receive updated `data.incident` (with new `3_OFFICER_DISPATCH` / `4_CASE_RESOLVED` blocks) and immediately refresh `.bc-security-panel`!
    - Render location: `.bc-security-panel` inside `#activeIncidentDrawer` on `dispatcher.html` (plus bumped `?v=` cache query on `js/dispatcher.js` & `css/style.css` in `dispatcher.html` if needed so browsers load fresh assets).
    - UI behavior flow: Click incident -> `.bc-security-panel` renders MAC (`ESP32-C3 (eFuse MAC: A4CF128E3B09)` for hardware or `WEB-CITIZEN TLS/W3C WebCrypto` for web SOS), auth badge (`✔ ĐÃ XÁC THỰC TRÊN SỔ CÁI (DePIN VERIFIED)` / `⚠ CẢNH BÁO GIẢ MẠO CHỮ KÝ` / `ℹ THIẾT BỊ ĐỜI CŨ CHƯA KÝ`), latest `SHA-256`, `TxHash ↗`, `Block #`, playable Stealth audio clips, and `[Block #...] Trực ban tiếp nhận (Phản ứng: X giây)` -> Click `🛡️ KIỂM TRA TÍNH TOÀN VẸN CHỨNG CỨ (LIVE AUDIT)` -> `#verifyResult` shows `"✔ XÁC THỰC THÀNH CÔNG (100% NGUYÊN VẸN) - ĐỦ TIÊU CHUẨN TRÍCH XUẤT LÀM CHỨNG CỨ PHÁP LÝ"` + `currentServerFileHash === originalBlockchainHash` comparison + Download Original Evidence button + Download Legal Dossier (`.json` / Print biên bản) + SVG QR code!
    - Docker runtime: Served from `sos-vietnam:local` container.
    - Playwright target: Full browser E2E in `P4-B`.
    - Behavior test: `node --check js/dispatcher.js` syntax gate + full interactive Playwright verification in `P4-B`.
    - Cleanup/quarantine: N/A.
    - External side effects: None.
    - N/A notes: Full Docker Playwright UI sweep executes in `P4-B` once both Citizen Stealth (`P4-A`) and Dispatcher UI (`P3-B`) are mounted together.
  - Work Steps:
    1. Add `SYSTEM_CONFIG` (`sosvie.site` vs Sandbox), `renderBlockchainPanel(inc)`, `#bcNetworkSwitch` change handler (switching explorer/chain badge between `SOS VIETNAM CHAIN (ID: 842026 / 84202600)`, `NDA CHAIN QUỐC GIA`, and `POLYGON AMOY TESTNET`), playable Stealth audio list renderer, `runIntegrityCheckForSelectedIncident()`, legal biên bản exporter, and `window.runIntegrityCheck` binding in `js/dispatcher.js` (plus cache-buster bump in `dispatcher.html` script/style tags if present).
       - UI flow check: Verify `updateDrawer(inc)` refreshes `.bc-security-panel` on initial click, after `handleAcceptSOS`, after `handleUpdateStatus`, and on every incoming SSE `sos_update` (e.g., when a new 5s Stealth audio chunk arrives live!).
       - DB/data flow check: Verify `POST /api/dispatcher/blockchain/verify` uses session auth (`credentials: 'same-origin'` + Bearer token if stored) and renders server-returned `currentServerFileHash`, `originalBlockchainHash`, `downloadUrl`, `explorerUrl`, and `qrSvg`.
       - Render location check: `#activeIncidentDrawer .bc-security-panel` and `#verifyResult`.
       - Mini QA for each completed implementation slice (MUST): Run `node --check js/dispatcher.js` and boot local runtime check verifying `/dispatcher.html` serves updated `.bc-security-panel` + `js/dispatcher.js` cleanly with HTTP `200`.
       - Evidence target: `E3-P3B-IMPL1`, `E3-P3B-VAL1`.
  - Implementation Gate:
    - Inspect exact lines around `updateDrawer`, `handleAcceptSOS`, and `handleUpdateStatus` in `js/dispatcher.js` before editing.
  - Acceptance:
    - Source: `node --check js/dispatcher.js` passes exit `0`; `window.runIntegrityCheck` bound cleanly.
    - Runtime/UI: Selecting an incident populates all 4 `.bc-security-panel` sections accurately and updates live via SSE.
    - DB/data: Live audit displays real server-computed `SHA-256` comparison and working download/explorer links.
    - Behavior test: Syntax + HTTP boundary check in `P3-B`, full browser E2E in `P4-B`.
    - Cleanup/quarantine: Stop any temporary check server.
    - Evidence IDs: `E3-P3B-IMPL1`, `E3-P3B-VAL1`, `E3-P3B-GRAPH1`, `E3-P3B-COMMIT1`.
    - Actual-status rows refreshed: `js/dispatcher.js` (`partial -> correct`).
  - Evidence Targets: `E3-P3B-IMPL1`, `E3-P3B-VAL1`, `E3-P3B-GRAPH1`, `E3-P3B-COMMIT1`.
  - Actual-status Update: Update `js/dispatcher.js` row and append `R6`.
  - Commit Boundary: Run `anvien analyze --force` + `anvien detect-changes --repo sos-vietnam-2026 --scope all` and commit `js/dispatcher.js` (and `dispatcher.html` if cache-buster updated).

### P4: Citizen Web Emergency Camouflage (Stealth Mode & iOS Fake Call) & Full Docker E2E Validation

- Phase Goal: Deliver Citizen Web Emergency Camouflage (**5.1 Fake Incoming Call — iOS UI** and **5.2 Blackout Stealth Mode**) with covert silent SOS creation, 5-second `MediaRecorder` `SHA-256` field audio streaming, continuous GPS telemetry, and 3-tap/4-tap anti-attacker exit guards; then build the production Docker container `sos-vietnam:local`, open the live web app on the user's PC, and execute comprehensive Playwright E2E validation across all 5 Hạng mục.
- Phase Boundary:
  - In scope: `js/stealth-sos.js`, `index.html`, `css/style.css`, `js/app.js`, `sw.js`, `playwright/verify-web3-depin-and-stealth-sos.mjs`, `Reports/qa/playwright/2026-11-02-web3-depin-stealth-sos/*`.
  - Out of scope: Unrelated repo files.
  - Dependencies: `P1-B`, `P2-B`, `P3-B`.
- Phase Implementation Rule: implement `P4-A`, verify & commit, then execute `P4-B` (Docker build + live browser + Playwright E2E), record evidence & benchmarks, and commit.
- Ordered Slice List:
  - `P4-A`: Implement Citizen `js/stealth-sos.js` + Web Portal DePIN Card Sync (`cap-phat-the.html` & `js/depin-card-portal.js` per `DAC_TA_DONG_BO_WEB_VA_AI.md`) & Wire `index.html`, `css/style.css`, `js/app.js`, `sw.js`
  - `P4-B`: Build `sos-vietnam:local` Docker Container, Open Live Browser Runtime & Run End-to-End Playwright Suite (`playwright/verify-web3-depin-and-stealth-sos.mjs`)
  - `P4-C`: Push to `origin/main` & Live Staging Deployment + Browser & Playwright Verification on `https://sos-vietnam-2026.onrender.com/` (Keeping `sosvie.site` Untouched)

- [x] P4-A: Implement Citizen `js/stealth-sos.js` + Web Portal DePIN Card Sync (`cap-phat-the.html` & `js/depin-card-portal.js` per `DAC_TA_DONG_BO_WEB_VA_AI.md` v2.1) & Wire `index.html`, `css/style.css`, `js/app.js`, `sw.js`
  - Goal: Build the complete Citizen Emergency Camouflage experience on `index.html` (authentic iOS Incoming/Active Call UI + Blackout Stealth screen + covert silent SOS + 5000ms `MediaRecorder` browser `SHA-256` upload + continuous GPS + `WakeLock` + `speechSynthesis` + `"Danh bạ"` `#000000` toggle + **3-tap Red Hangup** & **4-tap Blackout unlock** guards) AND the Web Serial DePIN Card Provisioning & Verification Portal (`cap-phat-the.html` + `js/depin-card-portal.js` implementing Sections 1–7 of `DAC_TA_DONG_BO_WEB_VA_AI.md`: `115200 bps` Web Serial `READ_DATA`/`SET_*`/`SAVE_FLASH`/`WIPE_CARD`, Dual-Mode `TEST` vs `REAL` 1-time Genesis `#1` lock & `Block #2+` hash chaining, SHA-256 Seal Verifier, and Tactical E10 palette).
  - Scope Boundary:
    - Editable: `js/stealth-sos.js`, `cap-phat-the.html`, `js/depin-card-portal.js`, `index.html`, `css/style.css`, `js/app.js`, `sw.js`
    - Inspect-only: `server.js`
    - Preserve-only: Existing `#btnMasterSOS`, `#sosDetailModal`, `submitSOS()`, `startTracking()` normal flows in `js/app.js`
    - Out of scope: `dispatcher.html`, `js/dispatcher.js`
  - Non-Goals: Modifying normal non-stealth SOS modal workflow.
  - Pre-flight Questions:
    - Data source: Browser `navigator.geolocation`, `navigator.mediaDevices.getUserMedia({ audio: true })`, `MediaRecorder` (`5000ms` timeslice / segment recorder), `crypto.subtle.digest('SHA-256', arrayBuffer)`, and `app.activeIncident` / `app.citizenAccessToken` (or silent `POST /api/sos/create` when no SOS is active yet!).
    - Display permission: Public Citizen Web (`index.html`). While Fake Call or Blackout Stealth is active, zero SOS UI banners/toasts/alerts may leak on screen so an attacker looking at the phone sees ONLY an authentic iPhone phone call with `"Ba"` or a completely dead/off black screen (`#000000`)!
    - DB read flow: Reuses active `incident.id` + `citizenAccessToken` from `window.sosApp` / `sessionStorage`, or silently creates a new `police` Stealth SOS incident via `POST /api/sos/create` in the background.
    - DB write flow: Every `5000ms`, hashes audio chunk via `crypto.subtle.digest('SHA-256')` -> uploads `FormData` (`file`, `incidentId`, `accessToken`, `clientSha256`, `lat`, `lng`, `accuracy`, `stealthMode`, `chunkIndex`) to `POST /api/sos/upload-evidence` + streams GPS changes to `POST /api/sos/stealth-gps`.
    - Render location:
      - Trigger bar `#stealthEmergencyBar` on `index.html` inside `#sosTriggerView` (right below `#legalWarningHero`) AND compact quick-camo bar inside `#sosTrackingView`:
        - Button 1 (`#btnFakeIncomingCall`): **📞 Giả Cuộc Gọi Đến (iOS)** + inline caller-name customization chip (`#btnEditFakeCaller`, default `"Ba"`, persisted in `localStorage`).
        - Button 2 (`#btnBlackoutStealth`): **🌑 Giả Vờ Tắt Màn Hình**.
      - Fullscreen overlays appended at end of `<body>`:
        - `#iosFakeCallOverlay` (`z-index: 999998`, incoming call screen with `"Ba"`, `"di động"`, Remind Me / Message, Decline & Green `"Trả lời"` buttons -> active call screen with live `00:01` timer, 6 round iOS buttons `Tắt tiếng`, `Bàn phím`, `Loa ngoài`, `Thêm cuộc gọi`, `FaceTime`, `Danh bạ`, and Red End-Call button requiring **3 consecutive taps**; plus `#iosProximityBlackout` `#000000` layer toggled by `"Danh bạ"`!).
        - `#blackoutStealthOverlay` (`#000000`, `position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 999999`, zero visible UI, requiring **4 consecutive taps** within `1800ms` to unlock!).
    - UI behavior flow:
      - **5.1 Fake Call**: Click `#btnFakeIncomingCall` -> 3s subtle countdown pill (cancellable before 3s) -> `requestFullscreen()` (best-effort) + `#sfxIncomingCall` ringtone (with WebAudio iPhone marimba-style fallback synth so ringtone works even offline!) + `navigator.vibrate([800, 400, 800])` + covert silent SOS & 5s `MediaRecorder` start -> Click Green `"Trả lời"` -> stops ringtone, starts `00:01, 00:02...` timer, requests `navigator.wakeLock.request('screen')`, speaks *"Alo, con đang ở đâu đó? Bố đang ra đón đây, bật định vị lên nhé."* via `window.speechSynthesis` (`vi-VN`), clicking `"Danh bạ"` turns screen pitch-black `#000000` (tap twice or tap top to wake proximity), clicking Red Hangup 1x or 2x keeps call screen locked, clicking Red Hangup **3 consecutive times** exits Fake Call cleanly to `#sosTrackingView`!
      - **5.2 Blackout Stealth**: Click `#btnBlackoutStealth` -> immediately covers viewport with `#000000` (`100vw x 100vh`, `z-index: 999999`), requests `WakeLock` + `requestFullscreen()`, silently creates SOS + records 5s `MediaRecorder` `SHA-256` chunks + streams continuous GPS -> 1, 2, or 3 taps do NOT unlock -> **4 consecutive taps** unlock cleanly to `#sosTrackingView`!
    - Docker runtime: Served from `sos-vietnam:local` with updated `sw.js` cache name (`sos-vietnam-v2026-11-02-web3-stealth-v1`).
    - Playwright target: Full E2E verification in `P4-B`.
    - Behavior test: `node --check js/stealth-sos.js` + `node --check js/app.js` + `node --check sw.js` in `P4-A`, followed by full Docker + Chromium WebRTC `MediaRecorder` E2E in `P4-B`.
    - Cleanup/quarantine: Stops `MediaRecorder` tracks, `WakeLock`, vibration, and `speechSynthesis` cleanly on exit/unload.
    - External side effects: None.
    - N/A notes: None.
  - Work Steps:
    1. Create `js/stealth-sos.js` exporting `initStealthSOS(app)` + `SYSTEM_CONFIG` (`sosvie.site` vs Sandbox), add Stealth Camouflage UI cards & `#iosFakeCallOverlay` / `#blackoutStealthOverlay` markup & CSS in `index.html` and `css/style.css`, add minimal 4-line initialization hook in `js/app.js` (`window.sosApp = app; initStealthSOS(app);` + silent SOS helper `createCovertStealthSOS`), and bump `CACHE_NAME` + add `'/js/stealth-sos.js'` in `sw.js`.
       - UI flow check: Verify zero visual leaks during Fake Call / Blackout (no browser `alert()`, no SOS popup visible above `z-index: 999998/999999`), 3-tap Red Hangup guard, `"Danh bạ"` `#000000` proximity cover, and 4-tap Blackout unlock guard.
       - DB/data flow check: Verify covert SOS stores `citizenAccessToken` in `sessionStorage` and uploads 5000ms playable media segments (`MediaRecorder` clean segment stop/restart or WebM header-preserving 5s recorder so EVERY 5s chunk is independently playable in `<audio controls>` on the Dispatcher dashboard!) with browser `crypto.subtle.digest('SHA-256')` digest to `/api/sos/upload-evidence`.
       - Render location check: `#sosTriggerView`, `#sosTrackingView`, `#iosFakeCallOverlay`, `#blackoutStealthOverlay`.
       - Mini QA for each completed implementation slice (MUST): Run `node --check` on `js/stealth-sos.js`, `js/app.js`, and `sw.js`, and verify HTTP `200` static asset serving.
       - Evidence target: `E4-P4A-IMPL1`, `E4-P4A-VAL1`.
  - Implementation Gate:
    - Re-confirm `E0-P0A-GRAPH3` (`js/app.js` `CRITICAL` impact warning — keep `js/app.js` diff minimal and additive) before editing.
  - Acceptance:
    - Source: `js/stealth-sos.js`, `index.html`, `css/style.css`, `js/app.js`, and `sw.js` pass syntax and DOM checks.
    - Runtime/UI: Both Fake Incoming Call (iOS) and Blackout Stealth Mode work end-to-end with independently playable 5s audio segments.
    - DB/data: Browser `clientSha256` matches server `sha256Hash` (`clientHashMatched === true`) on every uploaded 5s segment.
    - Behavior test: Syntax checks in `P4-A` + full Docker Playwright E2E in `P4-B`.
    - Cleanup/quarantine: N/A.
    - Evidence IDs: `E4-P4A-IMPL1`, `E4-P4A-VAL1`, `E4-P4A-GRAPH1`, `E4-P4A-COMMIT1`.
    - Actual-status rows refreshed: `js/stealth-sos.js` + `index.html` + `js/app.js` + `sw.js` (`missing -> correct`).
  - Evidence Targets: `E4-P4A-IMPL1`, `E4-P4A-VAL1`, `E4-P4A-GRAPH1`, `E4-P4A-COMMIT1`.
  - Actual-status Update: Update Citizen Stealth row and append `R7`.
  - Commit Boundary: Run `anvien analyze --force` + `anvien detect-changes --repo sos-vietnam-2026 --scope all` and commit `js/stealth-sos.js`, `index.html`, `css/style.css`, `js/app.js`, and `sw.js`.

- [x] P4-B: Build `sos-vietnam:local` Docker Container, Open Live Browser Runtime & Run End-to-End Playwright Suite (`playwright/verify-web3-depin-and-stealth-sos.mjs`)
  - Goal: Perform full production Docker build (`docker build -t sos-vietnam:local .`), start the real container runtime (`sos-vietnam-web3-qa`), open the running web app visibly on the user's PC, and run reusable Playwright E2E verification (`playwright/verify-web3-depin-and-stealth-sos.mjs`) proving all 5 Hạng mục end-to-end with screenshots and `.json`/`.md` QA reports.
  - Scope Boundary:
    - Editable: `playwright/verify-web3-depin-and-stealth-sos.mjs`, `Reports/qa/playwright/2026-11-02-web3-depin-stealth-sos/*` (plus targeted bug fixes in `P1`–`P4` files ONLY if real Docker E2E uncovers any defect)
    - Inspect-only: `Dockerfile`, `docker-compose.yml`
    - Preserve-only: `Dockerfile`
    - Out of scope: Unrelated repo files
  - Non-Goals: Deploying directly to production `sosvie.site` before staging verification.
  - Pre-flight Questions:
    - Data source: Live Docker container `sos-vietnam-web3-qa` backed by `.tmp/docker-web3-qa-data:/var/lib/sos-data`.
    - Display permission: Tests citizen public flow, hardware IoT gateway, and authenticated `admin` dispatcher flow.
    - DB read flow: Verifies persistence across container restart (`docker restart sos-vietnam-web3-qa`) so sealed blocks and encrypted audio vault survive restarts!
    - DB write flow: Writes isolated QA runtime data strictly inside `.tmp/docker-web3-qa-data`.
    - Render location: `http://127.0.0.1:3106` (`index.html`, `dispatcher.html`, `/api/blockchain/explorer/:txHash`).
    - UI behavior flow: Complete citizen -> hardware -> dispatcher -> live audit -> QR -> case resolved E2E loop.
    - Docker runtime: `docker build -t sos-vietnam:local .` + `docker run -d --name sos-vietnam-web3-qa -p 127.0.0.1:3106:3000 ... sos-vietnam:local`.
    - Playwright target: `http://127.0.0.1:3106` (built Docker container ONLY).
    - Behavior test: `node playwright/verify-web3-depin-and-stealth-sos.mjs` with Chromium `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream` verifying >= 14 product behavior assertions.
    - Cleanup/quarantine: After capturing all screenshots, reports, and visible browser check, `docker rm -f sos-vietnam-web3-qa` and remove `.tmp/docker-web3-qa-data` during `Pn-B`.
    - External side effects: Opens visible browser tab on user's PC per `AGENTS.md` Rule 8.
    - N/A notes: None.
  - Work Steps:
    1. Build Docker image `docker build -t sos-vietnam:local .`, launch container `sos-vietnam-web3-qa` on `127.0.0.1:3106` with `.tmp/docker-web3-qa-data:/var/lib/sos-data`, wait for `/healthz` HTTP `200`, and open `http://127.0.0.1:3106` visibly in the user's browser.
       - UI flow check: Confirm Citizen Stealth bar and Dispatcher `.bc-security-panel` load in the real container runtime.
       - DB/data flow check: Confirm `/var/lib/sos-data` stores encrypted ledger & media vault files.
       - Render location check: `http://127.0.0.1:3106/` and `http://127.0.0.1:3106/dispatcher.html`.
       - Mini QA for each completed implementation slice (MUST): Verify `/healthz` and visible browser launch.
       - Evidence target: `E4-P4B-ENV1`.
    2. Author and run `playwright/verify-web3-depin-and-stealth-sos.mjs` against `http://127.0.0.1:3106`, testing:
       - (1) `POST /api/hardware-sos` with spec Section 2.2 payload (`SOS_CSCD10_01`, `A4CF128E3B09`, valid `bc_seal` & `live_evidence_hash`) -> `DePIN VERIFIED` + `1_SOS_TRIGGER` Block `#101`;
       - (2) `POST /api/hardware-sos` with ESP32-C3 self-signed `bc_seal` formula -> `DePIN VERIFIED`;
       - (3) `POST /api/hardware-sos` with tampered `bc_seal` -> `SPOOF_SUSPECTED` (`verified: false`);
       - (4) Citizen Fake Incoming Call (iOS): click `#btnFakeIncomingCall` -> 3s countdown -> incoming call `"Ba"` -> click Green Answer -> `00:01+` timer + 6-button keypad -> click `"Danh bạ"` (`#000000` proximity blackout) -> wait >5.5s so real `MediaRecorder` records & uploads a 5s audio chunk with browser `SHA-256` to `/api/sos/upload-evidence` (`2_EVIDENCE_SEAL`, `clientHashMatched: true`) -> click Red Hangup 1x and 2x (must stay in Fake Call!) -> click Red Hangup 3x consecutively (exits cleanly!);
       - (5) Citizen Blackout Stealth Mode: click `#btnBlackoutStealth` -> `#000000` (`z-index: 999999`) -> tap 1x, 2x, 3x (must stay locked!) -> tap 4x consecutively (unlocks cleanly!);
       - (6) Dispatcher `dispatcher.html`: login `admin`, select Hardware SOS (`A4CF128E3B09` + `✔ ĐÃ XÁC THỰC TRÊN SỔ CÁI (DePIN VERIFIED)`), switch `#bcNetworkSwitch` (`842026` / `NDA` / `POLYGON`), then select Citizen Stealth SOS, verify playable `<audio>` clip loads `duration > 0` / HTTP `200`, click `TIẾP NHẬN & ĐIỀU ĐỘNG` -> verify `3_OFFICER_DISPATCH` block & `Phản ứng: X giây` in `#uiAuditTimeline`, click `🛡️ KIỂM TRA TÍNH TOÀN VẸN CHỨNG CỨ (LIVE AUDIT)` -> verify `"✔ XÁC THỰC THÀNH CÔNG (100% NGUYÊN VẸN) - ĐỦ TIÊU CHUẨN TRÍCH XUẤT LÀM CHỨNG CỨ PHÁP LÝ"`, original file download HTTP `200` matching `SHA-256`, SVG QR code rendered, and `/api/blockchain/explorer/:txHash` certificate HTTP `200`, then click `Hoàn tất ca` -> verify `4_CASE_RESOLVED` block;
       - (7) Restart Docker container (`docker restart sos-vietnam-web3-qa`) and re-run `POST /api/dispatcher/blockchain/verify` proving ledger + vault evidence survive restarts!
       - Emit `Reports/qa/playwright/2026-11-02-web3-depin-stealth-sos/qa-report.json` + `qa-report.md` + screenshots, and inspect screenshots via `read_file`.
       - UI flow check: Inspect captured screenshots of iOS Incoming Call, iOS Active Call 6-keypad, Dispatcher `.bc-security-panel`, Live Integrity Audit QR certificate, and Block Explorer page.
       - DB/data flow check: Verify post-restart `SHA-256` re-hash still matches `100%`.
       - Render location check: `Reports/qa/playwright/2026-11-02-web3-depin-stealth-sos/`.
       - Mini QA for each completed implementation slice (MUST): Execute `node playwright/verify-web3-depin-and-stealth-sos.mjs` against `http://127.0.0.1:3106` and visually inspect screenshots.
       - Evidence target: `E4-P4B-IMPL1`, `E4-P4B-VAL1`, `E4-P4B-VAL2`.
  - Implementation Gate:
    - Docker image `sos-vietnam:local` must build and pass `/healthz` before running Playwright.
  - Acceptance:
    - Source: Reusable `playwright/verify-web3-depin-and-stealth-sos.mjs` committed under `playwright/`.
    - Runtime/UI: 100% of E2E checks pass against built Docker container; screenshots verified visually with zero overlap, clipping, or broken text.
    - DB/data: Post-`docker restart` integrity check passes `100%`.
    - Behavior test: `qa-report.json` records `failedCount === 0`.
    - Cleanup/quarantine: QA runtime isolated in `.tmp/docker-web3-qa-data` (cleaned in `Pn-B`).
    - Evidence IDs: `E4-P4B-ENV1`, `E4-P4B-IMPL1`, `E4-P4B-VAL1`, `E4-P4B-VAL2`, `E4-P4B-GRAPH1`, `E4-P4B-COMMIT1`.
    - Actual-status rows refreshed: Docker + Playwright E2E row (`partial -> correct`).
  - Evidence Targets: `E4-P4B-ENV1`, `E4-P4B-IMPL1`, `E4-P4B-VAL1`, `E4-P4B-VAL2`, `E4-P4B-GRAPH1`, `E4-P4B-COMMIT1`.
  - Actual-status Update: Update Docker + Playwright row to `correct` and append `R8`.
  - Commit Boundary: Run `anvien analyze --force` + `anvien detect-changes --repo sos-vietnam-2026 --scope all` and commit `playwright/verify-web3-depin-and-stealth-sos.mjs` and `Reports/qa/playwright/2026-11-02-web3-depin-stealth-sos/*`.

- [x] P4-C: Push to `origin/main` & Live Staging Deployment + Browser & Playwright Verification on `https://sos-vietnam-2026.onrender.com/` (Keeping `sosvie.site` Untouched)
  - Goal: Deploy all verified commits to Render Staging (`https://sos-vietnam-2026.onrender.com/` via `git push origin main`, without touching production `sosvie.site`), wait for Render auto-deploy healthcheck (`/api/blockchain/status` -> `chainId: 84202600`, `SOS_RENDER_SANDBOX`), open `https://sos-vietnam-2026.onrender.com/` (`index.html`, `dispatcher.html`, `cap-phat-the.html`) visibly on the user's PC, and run live E2E Playwright verification against `https://sos-vietnam-2026.onrender.com/`.
  - Scope Boundary:
    - Editable: `Reports/qa/playwright/2026-11-02-web3-depin-stealth-sos/*`, plus `services/runtime-data-store.js` and `services/blockchain-ledger-service.js` (Render Free `EACCES: mkdir '/var/lib/sos-data'` non-hidden `os.tmpdir()` encrypted runtime fallback discovered on live Render Staging)
    - Preserve-only: `https://sosvie.site` (must NOT be modified or deployed to)
  - Acceptance:
    - `https://sos-vietnam-2026.onrender.com/` serves the updated Citizen Stealth UI, Dispatcher `.bc-security-panel`, and `cap-phat-the.html` DePIN Card Portal with `chainId: 84202600` (`SOS_RENDER_SANDBOX`), passing live Playwright E2E checks (`failedCount === 0`), while `sosvie.site` remains untouched.
  - Evidence Targets: `E4-P4C-ENV1`, `E4-P4C-VAL1`.
  - Actual-status Update: Update Render Staging live deployment row to `correct` and append `R9`.

- [x] Pn-A: Call supervisor for the implemented-plan acceptance loop.
  - Goal: verify the completed plan work against the accepted plan, actual-status decisions, evidence, benchmark, changed files, generated output, and validation results before closure.
  - Work Steps:
    1. Read `.agents/skills/supervisor/SKILL.md` and review the full completed plan work against all 5 Hạng mục in `d:\DOWNLOAD\t_i_li_u_c_t_k_thu_t_t_ch_h_p_web3_ng_y_trang_kh_n_c_p_sos_vi_t_nam.md`.
    2. Write supervisor audit report `Reports/qa/rp_supervisor_261102_<HHMMSS>_by_antigravity_web3_depin_stealth_sos.md`.
    3. If supervisor finds any gap, fix in the responsible slice and re-run supervisor review until PASS.
  - Implementation Gate: all planned implementation phases (`P1`–`P4`) must be completed before this review.
  - Acceptance: supervisor review passes with zero open blockers.
- [x] Pn-B: Remove dead work created during this plan.
  - Goal: ensure the final diff contains only artifacts that still serve the accepted plan and remove temporary QA containers / `.tmp/` directories.
  - Work Steps:
    1. Stop and remove QA container `sos-vietnam-web3-qa` (after final runtime verification) and clean `.tmp/docker-web3-qa-data` and any `.tmp/p*` scratch dirs created by this plan.
    2. Review `git status` and `git diff` to verify zero dead helpers, unused files, or accidental edits to pre-existing uncommitted files.
    3. Verify cleanup in supervisor report.
  - Implementation Gate: only remove artifacts created by this plan; preserve all pre-existing user uncommitted files.
  - Acceptance: zero temporary plan-created artifacts remain and supervisor passes cleanup.
- [x] Pn-C: Close the plan.
  - Goal: finish final validation, evidence, benchmark, detect-changes, commit, and final `complete` status across all 4 plan files.
  - Work Steps:
    1. Confirm Docker build + Playwright E2E evidence (`E4-P4B-*`) and supervisor report (`Pn-A`/`Pn-B`) are complete.
    2. Run `anvien analyze --force` and `anvien detect-changes --repo sos-vietnam-2026 --scope all`.
    3. Update `plan.md`, `actual-status.md`, `evidence.md`, and `benchmark.md` to final `complete` status with commit hashes.
    4. Commit the plan ledger & supervisor QA report (staging only plan-owned files) and verify `git status`.
  - Implementation Gate: `Pn-A` and `Pn-B` must pass.
  - Acceptance: final evidence, benchmarks, and commits are recorded, and all 4 plan files are closed cleanly.

## Risk Notes

- **Blast Radius (`server.js` `HIGH`, `js/app.js` `CRITICAL`)**: Keep edits inside `server.js` and `js/app.js` compact and modular by placing new logic in `services/blockchain-ledger-service.js`, `services/evidence-storage-service.js`, and `js/stealth-sos.js`.
- **Route Ordering in `server.js`**: Line 5164 (`urlPath.startsWith('/api/sos/') && req.method === 'GET'`) will swallow `GET /api/sos/evidence-file/...` unless placed above line 5164 and explicitly guarded.
- **`MediaRecorder` 5-Second Chunk Playability**: Calling `mediaRecorder.start(5000)` (`ondataavailable` timeslice) produces continuation clusters in `audio/webm` that lack the EBML/WebM initialization header on chunks `#2, #3...`, making individual chunks unplayable standalone! In `js/stealth-sos.js`, either stop/restart a clean `MediaRecorder` segment every `5000ms` (with gapless overlap/immediate restart on the active `MediaStream`) OR prepend the captured initialization header so **every single 5-second audio file** stored in Cloud/Vault is a valid, standalone, playable audio file with its own exact `SHA-256`! (Stopping & immediately restarting `MediaRecorder` on the already-open `MediaStream` takes `< 2ms`, keeps mic permission open continuously, and guarantees 100% standalone valid WebM/MP4 files for court/forensic playback!).
- **Dirty Worktree**: Pre-existing uncommitted presentation/video files exist in the workspace; stage ONLY exact plan-touched paths in every `git add` command.
