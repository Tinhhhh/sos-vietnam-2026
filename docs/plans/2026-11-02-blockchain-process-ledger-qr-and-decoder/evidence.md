# Blockchain Transaction Process Ledger, Scannable QR & Block Decoder Portal Evidence Ledger

## Metadata

- Date: `2026-11-02`
- Plan: `docs/plans/2026-11-02-blockchain-process-ledger-qr-and-decoder/plan.md`
- Evidence: `docs/plans/2026-11-02-blockchain-process-ledger-qr-and-decoder/evidence.md`
- Benchmark: `docs/plans/2026-11-02-blockchain-process-ledger-qr-and-decoder/benchmark.md`
- Actual status: `docs/plans/2026-11-02-blockchain-process-ledger-qr-and-decoder/actual-status.md`

## Evidence Rules

- Stable phase-scoped evidence IDs follow `E<phase>-<item>-<kind><n>`.
- All temporary artifacts stay strictly inside repo-local `.tmp/`.
- Production domain `https://sosvie.site` is strictly untouched; staging verification targets local Docker container `sos-vietnam:local` and Render Staging `https://sos-vietnam-2026.onrender.com/`.

## E0 - P0 Evidence

Matching plan item(s): `P0-A`

- `E0-P0A-USER1`: User reported four concrete requirements on `2026-11-02`:
  1. Record full transaction-style case process details in Blockchain blocks (who reported, who accepted, receive timestamp, response duration, travel duration to scene, on-scene handling duration, total process duration) without requiring heavy 5-second audio/video recordings.
  2. Fix the broken QR code inside `.bc-security-panel` / Explorer so camera scanners decode it reliably.
  3. Provide a clear cross-verification page where anyone with a Blockchain hash / Block `#` / Case ID can verify whether the record genuinely exists on the system ledger.
  4. Provide a built-in Block & `.JSON` dossier decoder software tool so exported `HoSo_PhapLy_ChuoiKhoi_*.json` files or raw block payloads can be decoded into readable Vietnamese incident process reports and mathematically verified against tampering.
- `E0-P0A-GRAPH1`: Executed `anvien analyze --force` on `sos-vietnam-2026` (`86b1848`): `files: scanned=503 parsed_code=162 failed=0`, `graph: nodes=83665 relationships=89250`.
- `E0-P0A-FD1`: `anvien file-detail services/blockchain-ledger-service.js --repo sos-vietnam-2026 --json` (`symbolCount=324, exportedSymbolCount=17, inboundRefCount=17, outboundRefCount=8, localRelationshipCount=111, linkedFlowCount=21, risk=high`).
- `E0-P0A-FD2`: `anvien file-detail server.js --repo sos-vietnam-2026 --json` (`symbolCount=1719, outboundRefCount=65, localRelationshipCount=155, linkedFlowCount=21, risk=high`).
- `E0-P0A-FD3`: `anvien file-detail js/stealth-sos.js --repo sos-vietnam-2026 --json` (`symbolCount=173, exportedSymbolCount=2, localRelationshipCount=31, linkedFlowCount=3, risk=high`).
- `E0-P0A-FD4`: `anvien file-detail` on `dispatcher.html`, `index.html`, `cap-phat-the.html`, `css/style.css` (`risk=low`) and `sw.js` (`symbolCount=2, risk=high`); `js/dispatcher.js` (`17,858` lines) inspected directly at lines `17479-17845`.
- `E0-P0A-QR1`: OpenCV `cv2.QRCodeDetector().detectAndDecode(...)` run against existing rendered QR screenshots returned `decoded: ''` despite detecting the 3 finder patterns (`pts: True`). Source inspection of `services/blockchain-ledger-service.js:1318-1326` confirmed `[row][col]` transposition in the 15 BCH format-information bits (`modules[8][i]` instead of `modules[i][8]`, etc.). Testing the exact transposed coordinate fix in memory immediately decoded `https://sos-vietnam-2026.onrender.com/tra-cuu-blockchain.html?tx=0x...` via `cv2.QRCodeDetector()`.
- `E0-P0A-SRC1`: Source inspection of `server.js:2013-2091`, `5521-5607`, `6769-6780`, `6803-6940`, `6954-7012`, `7040-7110`, `7905-7965` confirmed:
  - `POST /api/dispatcher/update-status` (`6969-6989`) does NOT seal blocks for `approaching` or `arrived` and does NOT compute `travelTimeSeconds` or `onSceneHandlingSeconds` or `totalCaseDurationSeconds`.
  - Auto/manual escalation (`5568`, `6803`) and fake-alarm flagging (`7040`) do NOT seal `2B_CASE_ESCALATED` or `4B_FAKE_ALARM` blocks.
  - `POST /api/dispatcher/blockchain/verify` (`6044`, `6099`, `6120`, `6140-6148`) read non-existent fields (`b.payload?.actionType` instead of `b.action`, `latestBlock?.hash` instead of `latestBlock?.txHash` / `payloadDigest`, `b.isoTime` instead of `b.timestamp`), leaving 0-media-file verifications with blank hashes and stripping `payload` from exported `lifecycleBlocks`.
- `E0-P0A-SRC2`: Source inspection of `js/stealth-sos.js:773` & `875` confirmed `startStealthEvidenceLoop` automatically records and uploads 5-second audio blobs every 5000ms by default, whereas the user requested lightweight transaction-grade blocks without mandatory heavy audio/video recording.
- `E0-P0A-SRC3`: Confirmed no `/tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, `/api/blockchain/lookup`, `/api/blockchain/verify-dossier`, or `/api/blockchain/recent` currently exist in the repository.

## E1 - P1 Evidence

Matching plan item(s): `P1-A`, `P1-B`

- `E1-P1A-ACT1`: Added 9 lifecycle action constants (`SOS_TRIGGER`, `EVIDENCE_SEAL`, `CASE_ESCALATED`, `OFFICER_DISPATCH`, `OFFICER_APPROACHING`, `OFFICER_ARRIVED`, `CASE_RESOLVED`, `FAKE_ALARM_FLAGGED`, `CARD_PROVISION_SEAL`) plus `describeBlockchainActionVi`, `formatDurationSecondsVi`, and `maskLedgerPii` in `services/blockchain-ledger-service.js:27-86`. Verified via `node .tmp/test-p1a.mjs` (`actionsChecked: 9`).
- `E1-P1A-QR1`: Fixed transposed `[row][col]` BCH format-information bits in `generateQrCodeMatrix` (`services/blockchain-ledger-service.js:2096-2110`) and set quiet-zone `margin = 4`. Verified via `python .tmp/test-p1a-qr.py` (`cv2.QRCodeDetector().detectAndDecode`): `3/3` (`100%`) exact string matches across `short_48B` (`49B`, matrix `29x29`), `medium_131B` (`128B`, matrix `41x41`), and `long_v8_185B` (`161B`, matrix `49x49`, Version 8 URL `https://sos-vietnam-2026.onrender.com/tra-cuu-blockchain.html?tx=0x...&case=SOS-...`), total generation latency `4.418ms`.
- `E1-P1A-VERIFY1`: Added `sanitizeBlockForView`, `describeBlockStepVi`, `buildCaseProcessSummary`, `lookupLedger`, `getRecentBlocks`, and `verifyExportedDossier` on `BlockchainLedgerService` (`services/blockchain-ledger-service.js:1091-1812`). Verified via `node .tmp/test-p1a.mjs`:
  - 5-stage SOS process (`1_SOS_TRIGGER -> 3_OFFICER_DISPATCH -> 3A_OFFICER_APPROACHING -> 3B_OFFICER_ARRIVED -> 4_CASE_RESOLVED`) produced exact elapsed metrics (`responseTimeSeconds=42`, `approachingTimeSeconds=208`, `travelTimeSeconds=288`, `totalToSceneSeconds=330`, `onSceneHandlingSeconds=405`, `totalCaseDurationSeconds=735`).
  - Public lookup masked phone (`090***789`), while authenticated officer lookup returned full phone (`0909123789`).
  - `verifyExportedDossier` returned `AUTHENTIC_AND_ON_LEDGER` (`0.983ms`) on intact dossier and `TAMPERED_DATA_DETECTED` (`tamperedBlockNumber: 102`) when `responseTimeSeconds` was mutated from `42` to `12`.
- `E1-P1A-DETECT1`: Ran `anvien analyze --force` (`nodes=84547, relationships=90243`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` (`risk_level: critical` blast-radius warning acknowledged; all 17 existing exports preserved).
- `E1-P1B-LIFE1`: Upgraded `recordIncidentBlockchainEvent` and all SOS lifecycle transitions in `server.js` (`POST /api/sos/create`, auto-escalation timer, `POST /api/dispatcher/escalate`, `POST /api/dispatcher/accept`, `performZaloIncidentAccept`, `POST /api/dispatcher/update-status` for `approaching`/`arrived`/`resolved`, `POST /api/dispatcher/flag-fake`, and `POST /api/sos/citizen-safe`). Verified via `node .tmp/test-p1b.mjs` against real spawned `server.js` on port `3491` (`case1Blocks: 6`, `totalRecentBlocks: 8`, non-null `responseTimeSeconds`, `travelTimeSeconds`, `onSceneHandlingSeconds`, `totalCaseDurationSeconds`).
- `E1-P1B-AUDIT1`: Fixed `POST /api/dispatcher/blockchain/verify` (`server.js`) so 0-media cases populate `originalBlockchainHash` and `currentServerFileHash` with 66-char `0x...` `txHash` (`0xf61be9edce707460d974c44727fceca682459559f42ea2338ddc3d9f886decc9`), encode QR to `/tra-cuu-blockchain.html?tx=...&case=...` (decoded `100%` by OpenCV `QRCodeDetector`), and export `schemaVersion: '2.1-PROCESS-DOSSIER'` (`8,309` bytes for 6 blocks) with full `payload` & `payloadDigest`.
- `E1-P1B-API1`: Added `GET /api/blockchain/lookup`, `GET /api/blockchain/recent`, and `POST /api/blockchain/verify-dossier` in `server.js`. Verified public PII masking (`viewerRole: 'public'`, `091***888`) vs authenticated officer view (`viewerRole: 'officer'`, `0912345888`), intact dossier verification (`AUTHENTIC_AND_ON_LEDGER`), and 1-field tamper detection (`TAMPERED_DATA_DETECTED` at Block `#103`).
- `E1-P1B-DETECT1`: Ran `anvien analyze --force` (`nodes=84989, relationships=90700`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` (`risk_level: critical` blast-radius warning acknowledged; changes strictly scoped to blockchain lifecycle sealing & `/api/blockchain/*`).

## E2 - P2 Evidence

Matching plan item(s): `P2-A`, `P2-B`

- `E2-P2A-HTML1`: Created `tra-cuu-blockchain.html` (`182` lines) and appended scoped `.bcv-*` + `.bc-process-*` styles to `css/style.css`. Verified via `node .tmp/test-p2a.mjs`: `GET /tra-cuu-blockchain.html` -> HTTP `200`, `Content-Security-Policy` `script-src 'self'` satisfied with `0` external CDN script tags, both `#tabBtnLookup` and `#tabBtnDecoder` plus `#bcvRecentSection` and `@media print` report rules present.
- `E2-P2A-JS1`: Created `js/blockchain-verifier-portal.js` (`886` lines) implementing live `/api/blockchain/lookup` cross-check, drag-and-drop/upload + raw paste `.JSON` dossier decoder, WebCrypto `SHA-256` offline deterministic block re-hashing (`verifyDossierOfflineWebCrypto`), online `/api/blockchain/verify-dossier` cross-check, 1-click `#btnSimulateTamper` test, and live recent ledger table. Verified via `node --check js/blockchain-verifier-portal.js` (exit `0`) and `node .tmp/test-p2a.mjs`: 4-block dossier WebCrypto SHA-256 verification passed `4/4` blocks in `2.962ms`, and 1-field mutation (`travelTimeSeconds = 9999`) detected `corruptedCount: 1` in `0.543ms`.
- `E2-P2A-DETECT1`: Ran `anvien analyze --force` (`files: scanned=509 parsed_code=163 failed=0`, `graph: nodes=85870 relationships=91651`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` (`risk_level: "low"`).
- `E2-P2B-STEALTH1`: Updated `js/stealth-sos.js` (`initStealthSOS(app, options = {})`) so `isAudioRecordingEnabled()` defaults to `false` unless `options.enableAudioRecording` or `window.__SOS_ENABLE_STEALTH_AUDIO === true` is explicitly set, exposed `audioRecordingEnabled` in `window.__sosStealthStats`, bound `#btnCitizenVerifyBlockchain` to open `/tra-cuu-blockchain.html?case=<activeId>` without touching `js/app.js`, and updated `#stealthEmergencyBar` copy in `index.html`. Passed `node --check js/stealth-sos.js` (exit `0`).
- `E2-P2B-UI1`: Upgraded `#bcSecurityPanel` in `dispatcher.html`, `js/dispatcher.js`, and `css/style.css` (`132x132px` crisp QR SVG + `@media print` shell visibility), adding `#uiProcessSummaryBox` (`#uiProcReporter`, `#uiProcOfficer`, `#uiProcTimestamps`, `#uiProcDurResponse`, `#uiProcDurTravel`, `#uiProcDurScene`, `#uiProcDurTotal`), all 8 lifecycle action renderers in `#uiAuditTimeline`, `#btnOpenBcVerifierPortal` & `#btnOpenVerifierPortal` pointing to `/tra-cuu-blockchain.html?tx=...&case=...`, navigation links in `index.html` (`#btnNavBlockchainVerifier`, `#btnStealthBlockchainVerifier`, `#btnCitizenVerifyBlockchain`) and `cap-phat-the.html` (`#btnDePinOpenVerifier`), and bumped `sw.js` `CACHE_NAME` to `sos-vietnam-v2026-11-02-bc-process-decoder-v2`. Passed `node --check js/dispatcher.js` and `node --check sw.js` (exit `0`).
- `E2-P2B-DETECT1`: Ran `anvien analyze --force` (`files: scanned=509 parsed_code=163 failed=0`, `graph: nodes=85890 relationships=91674`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` (`risk_level: "medium"`, `degradedNodes: 0`, `totalResolutionGapCount: 0`).

## E3 - P3 Evidence

Matching plan item(s): `P3-A`, `P3-B`

*(To be recorded as P3 validation slices complete)*

## Closure Evidence

*(To be recorded at Pn-A, Pn-B, Pn-C)*
