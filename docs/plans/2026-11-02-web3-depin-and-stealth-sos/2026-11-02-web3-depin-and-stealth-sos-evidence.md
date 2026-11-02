# SOS Vietnam 2026 — Web3 DePIN Blockchain Ledger, Hardware Anti-Spoofing & Stealth SOS Evidence Ledger

## Metadata

- Date: `2026-11-02`
- Plan: `docs/plans/2026-11-02-web3-depin-and-stealth-sos/2026-11-02-web3-depin-and-stealth-sos-plan.md`
- Evidence: `docs/plans/2026-11-02-web3-depin-and-stealth-sos/2026-11-02-web3-depin-and-stealth-sos-evidence.md`
- Benchmark: `docs/plans/2026-11-02-web3-depin-and-stealth-sos/2026-11-02-web3-depin-and-stealth-sos-benchmark.md`
- Actual status: `docs/plans/2026-11-02-web3-depin-and-stealth-sos/2026-11-02-web3-depin-and-stealth-sos-actual-status.md`

## Evidence Rules

The evidence file explains why the work is known to be correct.

It contains:

- metadata and companion files;
- evidence rules and stable `E<phase>-<item>-<kind><n>` IDs;
- `E0` (`P0-A`) baseline codebase, specification, Anvien graph/file-detail/impact, and Docker runtime precheck facts;
- `E1` (`P1-A`, `P1-B`) blockchain ledger service, hardware DePIN anti-spoofing, and 4-step lifecycle sealing proof;
- `E2` (`P2-A`, `P2-B`) multi-tier cloud/encrypted vault evidence storage, `SHA-256` sealing, and live integrity audit API proof;
- `E3` (`P3-A`, `P3-B`) Dispatcher Command Center `.bc-security-panel` and live legal dossier/QR extraction UI proof;
- `E4` (`P4-A`, `P4-B`) Citizen Stealth SOS (iOS Fake Incoming Call + Blackout Stealth Mode), Docker container build, and Playwright E2E proof;
- Closure Evidence (`Pn-A`, `Pn-B`, `Pn-C`): supervisor audit report, cleanup verification, Anvien `detect-changes`, and git commit hashes.

### Evidence ID Naming

Format: `E<phase>-<item>-<kind><n>`

Plan-local `<kind>` tokens:
- `SPEC`: Technical specification requirements and user architectural clarifications
- `GRAPH`: Anvien `analyze`, `file-detail`, `impact`, and `detect-changes` evidence
- `SRC`: Source-of-truth file inspection facts before or after edits
- `ENV`: Runtime / Docker / environment verification
- `IMPL`: Code implementation and file diff facts
- `VAL`: Boundary / API / unit / Docker / Playwright validation results
- `COMMIT`: Slice and closure git commit evidence

## E0 - P0 Evidence

Matching plan item(s): `P0-A`

- `E0-P0A-SPEC1`: Read full technical specification `d:\DOWNLOAD\t_i_li_u_c_t_k_thu_t_t_ch_h_p_web3_ng_y_trang_kh_n_c_p_sos_vi_t_nam.md` (lines 1–247), defining 5 deliverables for Staging (`https://sos-vietnam-2026.onrender.com`, `chainId: 84202600`, `SOS_RENDER_SANDBOX`) and Production (`https://sosvie.site`, `chainId: 842026`, `SOS_VIETNAM_OFFICIAL`):
  1. Hardware ESP32-C3 + `CapPhatTheSOS.exe` `SHARED SECRET` (`COMMAND_SECRET_KEY = "BTL_CSCD_E10_D1_SOS_VIETNAM_2026"`), dual `bc_seal` formulas, `live_evidence_hash`, `/api/hardware-sos` new fields (`cardID`, `button`, `type`, `target_unit`, `unit_title`, `user_name`, `user_phone`, `user_cccd`, `cccd`, `hw_mac`, `bc_seal`, `live_evidence_hash`, `chain_id`), and 4 lifecycle blocks (`1_SOS_TRIGGER`, `2_EVIDENCE_SEAL`, `3_OFFICER_DISPATCH`, `4_CASE_RESOLVED`).
  2. Field audio/video `SHA-256` RAM hashing prior to storage (`POST /api/sos/upload-evidence`), saving `{ mediaUrl, sha256Hash, blockNumber, txHash }`.
  3. Dispatcher `.bc-security-panel` (**BẢO CHỨNG CHUỖI KHỐI (WEB3 / BLOCKCHAIN LEDGER)**) with `#bcNetworkSwitch` (`842026` / `NDA` / `POLYGON`), `#uiHwMac`, `#uiAuthBadge`, `#uiEvidenceHash`, `#uiTxLink`, `#uiBlockNum`, `#uiAuditTimeline`, `runIntegrityCheck()`, and `#verifyResult`.
  4. Live Integrity Audit re-hashing raw stored file bytes (`currentServerFileHash` vs `originalBlockchainHash`), displaying `"✔ XÁC THỰC THÀNH CÔNG (100% NGUYÊN VẸN) - ĐỦ TIÊU CHUẨN TRÍCH XUẤT LÀM CHỨNG CỨ PHÁP LÝ"`, original file download, and Block QR code.
  5. Citizen Emergency Camouflage: **5.1 Fake Incoming Call (iOS UI)** (3s delay, `requestFullscreen`, ring/vibrate, default caller `"Ba"`, Green Answer -> 6-button keypad + `00:01` timer + Vietnamese `speechSynthesis` + `WakeLock` + `"Danh bạ"` `#000000` proximity blackout + covert 5000ms `MediaRecorder` + browser `crypto.subtle.digest('SHA-256')` upload + **3-tap Red Hangup guard**) and **5.2 Blackout Stealth Mode** (`#000000` `100vw x 100vh` `z-index: 999999` + `WakeLock` + covert 5s audio + continuous GPS + **4-tap unlock guard**).
- `E0-P0A-SPEC2`: User architectural clarifications (`ask_question` resolved):
  - Scope: Plan and implement all 5 Hạng mục in `c:\Users\dienv\Desktop\sos_vietnam_2026_web_hosting` with full E2E verification.
  - Storage: Multi-tier Storage Adapter supporting Cloudinary (`CLOUDINARY_URL` / `CLOUDINARY_CLOUD_NAME`+`API_KEY`+`API_SECRET`) and Supabase Storage (`SUPABASE_URL`+`SUPABASE_SERVICE_ROLE_KEY`) partitioned by `SOS_VIETNAM_OFFICIAL` / `SOS_RENDER_SANDBOX`, with automatic encrypted local vault fallback (`.runtime-data/evidence-media/`) when cloud ENV keys are absent so upload, playback, download, and live `SHA-256` re-hash work 100% out-of-the-box.
  - Blockchain: RAM-lightweight cryptographically chained Internal Blockchain Ledger (`Chain ID: 842026` / `84202600`, sequential blocks `#101, #102...`, `prevHash`, `txHash`, AES-256-GCM persisted via `runtime-data-store.js`) + ready EVM JSON-RPC connector (`NDA_CHAIN_RPC_URL`, `POLYGON_AMOY_RPC_URL`, `BLOCKCHAIN_PRIVATE_KEY`) without Ganache RAM overhead on Render Free.
- `E0-P0A-GRAPH1`: Ran `anvien analyze --force` at baseline commit `692aa10` (PASS, exit `0`): `scanned=488`, `parsed_code=157`, `failed=0`, `nodes=78102`, `relationships=83267`.
- `E0-P0A-GRAPH2`: Ran `anvien file-detail <path> --repo sos-vietnam-2026 --json` on all indexed target/related files (PASS, exit `0`):
  - `server.js`: `symbolCount=1542`, `inboundRefCount=2`, `outboundRefCount=7`, `relatedFiles=7`, `risk="high"`.
  - `js/app.js`: `symbolCount=979`, `inboundRefCount=0`, `outboundRefCount=0`, `relatedFiles=0`, `risk="high"`.
  - `services/runtime-data-store.js`: `symbolCount=20`, `inboundRefCount=45`, `relatedFiles=8`, `risk="high"` (inspect-only dependency).
  - `services/security-firewall-middleware.js`: `symbolCount=80`, `inboundRefCount=4`, `relatedFiles=4`, `risk="high"` (preserve-only dependency).
  - `sw.js`: `symbolCount=2`, `relatedFiles=0`, `risk="high"`.
  - `index.html`: `symbolCount=0`, `relatedFiles=0`, `risk="low"`.
  - `dispatcher.html`: `symbolCount=0`, `relatedFiles=0`, `risk="low"`.
  - `css/style.css`: `symbolCount=0`, `relatedFiles=0`, `risk="low"`.
  - Note: `js/dispatcher.js` (`859,282` bytes, `17,436` lines) exceeds Anvien single-file parser size cap (`not found in repo sos-vietnam-2026`); inspected directly via `read_file` and `Select-String`.
- `E0-P0A-GRAPH3`: Ran `anvien impact file <path> --repo sos-vietnam-2026 --direction upstream` (PASS, exit `0`):
  - `server.js`: `RISK=HIGH`, `contained_symbols=1542`, `direct=29`, `files_affected=1`, `flows_affected=1`, `linked_flows=24`, `linked_tests=0`.
  - `js/app.js`: `RISK=CRITICAL`, `contained_symbols=979`, `direct=41`, `files_affected=1`, `flows_affected=1`, `linked_flows=27`, `linked_tests=0`.
  - `sw.js`, `index.html`, `dispatcher.html`, `css/style.css`: `RISK=LOW`, `files_affected=0`, `flows_affected=0`.
  - Blast-radius warning acknowledged per `AGENTS.md` Rule 3: keep edits in `server.js` and `js/app.js` surgical, delegating new business logic into dedicated ESM modules `services/blockchain-ledger-service.js`, `services/evidence-storage-service.js`, and `js/stealth-sos.js`.
- `E0-P0A-SRC1`: Inspected `package.json` (`"type": "module"`, native Node ESM `http.createServer`, zero Express/Multer dependencies) and `server.js` lines 1–60 (`CONTENT_SECURITY_POLICY` `media-src` only allows `'self' data: blob: https://d8j0ntlcm91z4.cloudfront.net https://assets.mixkit.co`), lines 620–735 (`performZaloIncidentAccept`), lines 1951–2280 (`normalizeHardwareIncidentForDisplay` overwrites `incidentTags`/`customNotes`, `maskSingleIncident`, `incidentForClient` preserves custom fields except `citizenAccessTokenHash`, `getIncidentActor`), lines 2848–2904 (WAF `checkAntiBot`, `/api/dispatcher/*` auth gate, rate limiter `general: 600/min`, `sosCreate: 15/min`), lines 4782–5170 (`GET/POST /api/hardware-sos` & `/api/sos/create` currently only parse `press_step` — missing `cardID`, `button`, `type`, `target_unit`, `unit_title`, `user_name`, `user_phone`, `user_cccd`, `cccd`, `hw_mac`, `bc_seal`, `live_evidence_hash`, `chain_id`; also line 5164 `urlPath.startsWith('/api/sos/') && req.method === 'GET'` catches sub-routes unless ordered/guarded), lines 5640–5978 (`/api/dispatcher/accept` & `/api/dispatcher/update-status`, where line 5967 misses `saveIncidentHistory()`), and lines 6597–6879 (`/api/sos/media` & `/api/sos/citizen-safe`, where line 6867 also misses `saveIncidentHistory()`).
- `E0-P0A-SRC2`: Inspected `dispatcher.html` lines 2290–2435 (`#activeIncidentDrawer`) and `js/dispatcher.js` lines 11694–12020 (`selectIncident`, `updateDrawer`). Confirmed `.bc-security-panel` and `runIntegrityCheck()` do not exist yet; `#activeIncidentDrawer` has clear insertion point right above `#drawerChannelInfo` / `#drawerActionButtons`.
- `E0-P0A-SRC3`: Inspected `index.html` lines 70–320, 1418–1443 (`#sosTriggerView`, `#sosTrackingView`, `<audio id="sfxIncomingCall">`, `/js/app.js`), `js/app.js` lines 1958–2065 (`submitSOS`, `startTracking`), and `sw.js` lines 1–53 (`CACHE_NAME = 'sos-vietnam-v2026-10-12-ui-polish-v2'`). Confirmed Citizen Stealth Mode (`Fake Incoming Call` & `Blackout Stealth Mode`) and `js/stealth-sos.js` do not exist yet, while `<audio id="sfxIncomingCall">` is already present in `index.html:1420`!
- `E0-P0A-ENV1`: Started Docker Desktop via detached WMI process creation and verified `docker info --format "{{.ServerVersion}}"` -> `29.6.1` (PASS, exit `0`). Verified `Dockerfile` builds Node 22 + Python3 + `ffmpeg` container with `/healthz` healthcheck and `SOS_RUNTIME_DATA_DIR=/var/lib/sos-data`.

## E1 - P1 Evidence

Matching plan item(s): `P1-A`, `P1-B`

- `E1-P1A-IMPL1`: Created `services/blockchain-ledger-service.js` implementing `resolveSystemBlockchainConfig`, `computeCppHardwareSeal`, `computeEsp32HardwareSeal`, `computeHardwareLiveEvidenceHash`, `verifyHardwareDePINPayload`, `blockchainLedgerService` (`writeToSOSBlockchain`, `verifyCaseChainIntegrity`, `findBlockByTxOrNumber`, `getCaseBlocks`), and offline ISO-18004 SVG QR generator `generateQrCodeSvg`.
- `E1-P1A-VAL1`: Executed isolated Node ESM boundary test (`.tmp/p1a-test/run.mjs`, cleaned immediately after exit `0`) verifying: `sosvie.site` (`chainId: 842026`, `SOS_VIETNAM_OFFICIAL`) vs `sos-vietnam-2026.onrender.com` (`chainId: 84202600`, `SOS_RENDER_SANDBOX`), C++ `CapPhatTheSOS.exe` `bc_seal` + `live_evidence_hash` (`DEPIN_VERIFIED`, `liveHashVerified: true`), ESP32-C3 self-seal (`ESP32_C3_CHIP`), tampered `bc_seal` (`SPOOF_SUSPECTED`), legacy IoT (`UNSEALED_LEGACY_IOT`), sequential blocks `#101 -> #102` persisted in encrypted `blockchain-ledger.json` (`sealMs: 4.17`), `verifyCaseChainIntegrity` (`ok: true`), and `generateQrCodeSvg` (`12,373` bytes valid `<svg>`).
- `E1-P1A-GRAPH1`: Ran `anvien analyze --force` (`scanned=493`, `parsed_code=158`, `failed=0`, `nodes=78864`, `relationships=84140`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` before commit.
- `E1-P1A-COMMIT1`: Committed `services/blockchain-ledger-service.js` in commit `823f021`.
- `E1-P1B-SPEC1`: Read `c:\Users\dienv\Desktop\capphattheSOS\DAC_TA_DONG_BO_WEB_VA_AI.md` (lines 1–261) and `c:\Users\dienv\Desktop\capphattheSOS\CapPhatTheSOS.cpp` (lines 1–1821). Verified both `DAC_TA_SECRET_KEY = "SOS_VIETNAM_TACTICAL_ESC_2026_DEPIN_SECURE_KEY"` (64-char uppercase hex) and `COMMAND_SECRET_KEY = "BTL_CSCD_E10_D1_SOS_VIETNAM_2026"` (`0x` lowercase hex), Chained Identity Block v2 (`PrevSeal|BlockIndex|Mode|ID|Name|Phone|CCCD|Officer|Timestamp|SecretKey`), Dual-Mode `TEST` (wipe allowed) vs `REAL` (`🔒 BẢO VỆ DỮ LIỆU THẬT: CHỈ CẤP 1 LẦN`, `Block #2+` hash chaining), Web Serial UART protocol (`115200 bps, 8N1`, `READ_DATA`, `SET_*`, `SAVE_FLASH`, `WIPE_CARD`/`WIPE_FLASH`), Section 7 Tactical E10 colors, and user requirement to deploy & test ONLY on `https://sos-vietnam-2026.onrender.com/` (`origin/main`) without touching `sosvie.site`.
- `E1-P1B-IMPL1`: Wired `services/blockchain-ledger-service.js` and `server.js` with `resolveEffectiveRequestHost`, `recordIncidentBlockchainEvent`, `renderBlockchainExplorerCertificateHtml`, `GET /api/blockchain/status`, `GET /api/blockchain/explorer/:txOrBlock`, `GET /api/depin/cards`, `GET /api/depin/cards/:id`, `POST /api/depin/verify-seal` (including raw `READ_DATA` UART parser), `POST /api/depin/cards/provision`, `POST /api/depin/cards/wipe`, upgraded `GET/POST /api/hardware-sos` & `POST /api/sos/create` (`1_SOS_TRIGGER`), `3_OFFICER_DISPATCH` (with `responseTimeSeconds` on `/api/dispatcher/accept` and `performZaloIncidentAccept`), and `4_CASE_RESOLVED` + `saveIncidentHistory()` on `/api/dispatcher/update-status` and `/api/sos/citizen-safe`, plus sub-path guard on `GET /api/sos/:id`.
- `E1-P1B-VAL1`: Executed HTTP integration test `verify-p1b.mjs` against isolated `.tmp/p1b-test` (exit `0`, cleaned immediately): `{"ok":true,"hwLatencyMs":64.58,"blocksCreated":8,"responseTimeSeconds":8,"explorerIntegrity":true}` — verifying `sosvie.site` (`842026`, `SOS_VIETNAM_OFFICIAL`) vs `sos-vietnam-2026.onrender.com` (`84202600`, `SOS_RENDER_SANDBOX`), C++ & ESP32 `DePIN VERIFIED`, tampered `SPOOF_SUSPECTED`, legacy `UNSEALED_LEGACY_IOT`, `1_SOS_TRIGGER -> 3_OFFICER_DISPATCH -> 4_CASE_RESOLVED` across both Dispatcher and Citizen Safe routes, and Block Explorer HTML + JSON certificates.
- `E1-P1B-VAL2`: Executed `DAC_TA` DePIN Card Registry & Chaining HTTP test `p1b-depin-test/run.mjs` against isolated `.tmp/p1b-depin-test` (exit `0`, cleaned immediately): `{"ok":true,"dacTaSynced":true,"genesisSeal":"C1AAE74C0073CD1D","block2Seal":"92444704E418243F"}` — verifying `TEST` wipe (`200`), `REAL` Genesis `#1` exact SHA-256 match with `DAC_TA` Section 5.1, `REAL` wipe rejection (`403` `REAL_MODE_WIPE_FORBIDDEN`), `REAL` update chaining `Block #2` (`PrevSeal = Block #1 Seal`), raw UART `READ_DATA` verification (`verified: true`), C++ `.exe` seal interoperability, and Registry-backed `/api/hardware-sos` verification.
- `E1-P1B-GRAPH1`: Ran `anvien analyze --force` (`scanned=493`, `parsed_code=158`, `failed=0`, `nodes=79786`, `relationships=85197`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` (`task-764`, exit `0`).
- `E1-P1B-COMMIT1`: Committed `server.js` and `services/blockchain-ledger-service.js` in commit `542db7b`.

## E2 - P2 Evidence

Matching plan item(s): `P2-A`, `P2-B`

- `E2-P2A-IMPL1`: Created `services/evidence-storage-service.js` implementing `computeSha256Hex`, `normalizeSha256Hex`, binary-safe `parseMultipartFormData`, `storeFieldEvidence` (RAM `SHA-256` before Cloudinary / Supabase / AES-256-GCM `.runtime-data/evidence-media/` vault), `readEvidenceRawBuffer`, and `createEvidenceAccessToken` / `verifyEvidenceAccessToken`.
- `E2-P2A-VAL1`: Executed isolated Node ESM boundary test (`.tmp/p2a-test/run.mjs`, exit `0`, cleaned immediately): `{"ok":true,"persistLatencyMs":3.88,"rehashLatencyMs":1.42,"sha256":"0x6590d945660da35c6158d0ad023bc624b5d479340ba0f44294b408a5f5759e80","sandboxFolder":"SOS_RENDER_SANDBOX","officialFolder":"SOS_VIETNAM_OFFICIAL"}` — verifying 100% `0x00..0xFF` binary multipart fidelity, domain partitioning, round-trip byte equality, signed token verification, AES-GCM tag tamper detection (`AES_GCM_AUTH_TAG_MISMATCH`), and plaintext-swap `SHA-256` mismatch detection.
- `E2-P2A-GRAPH1`: Ran `anvien analyze --force` (`scanned=494`, `parsed_code=159`, `failed=0`, `nodes=80291`, `relationships=85741`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` (`task-818`, exit `0`).
- `E2-P2A-COMMIT1`: Committed `services/evidence-storage-service.js` in commit `a30b08e`.
- `E2-P2B-IMPL1`: Updated `server.js` (`CONTENT_SECURITY_POLICY` adding `https://res.cloudinary.com` and `https://*.supabase.co` to `img-src`, `media-src`, `connect-src`) and wired `POST /api/sos/upload-evidence` (raw binary `multipart/form-data` + JSON base64, cryptographic citizen token or dispatcher session auth, `clientSha256` verification, `2_EVIDENCE_SEAL` block, live GPS update, SSE `sos_update`), `POST /api/sos/stealth-gps`, `GET /api/sos/evidence-file/:incidentId/:evidenceId` (`206 Partial Content` Range + `?download=1` attachment), `POST /api/dispatcher/blockchain/verify` (live `readEvidenceRawBuffer` -> `currentServerFileHash` vs `originalBlockchainHash`, `"✔ XÁC THỰC THÀNH CÔNG (100% NGUYÊN VẸN) - ĐỦ TIÊU CHUẨN TRÍCH XUẤT LÀM CHỨNG CỨ PHÁP LÝ"`, `downloadUrl`, `explorerUrl`, `qrSvg`, `legalDossier`), plus `2_EVIDENCE_SEAL` sealing inside sibling `POST /api/sos/media`.
- `E2-P2B-VAL1`: Executed HTTP integration test (`.tmp/p2b-test`, `task-872`, exit `0`, cleaned immediately): `{"ok":true,"liveAuditHttpMs":9.5,"blockNumber":102,"txHash":"0xeb334ddbdcd8ca6f8e4d4321703c9ce87e90c30d5695f95123cb701623627c36","auditedEvidenceCount":1}` — verifying binary `FormData` upload, negative auth test (`401`/`403` without citizen token), `206 Partial Content` Range playback & `?download=1` byte-exact download, and live `POST /api/dispatcher/blockchain/verify` returning `verified: true` + valid SVG QR.
- `E2-P2B-GRAPH1`: Ran `anvien analyze --force` (`scanned=494`, `parsed_code=159`, `failed=0`, `nodes=80916`, `relationships=86365`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` (`task-877`, exit `0`).
- `E2-P2B-COMMIT1`: Committed `server.js` in commit `a868dec`.

## E3 - P3 Evidence

Matching plan item(s): `P3-A`, `P3-B`

- `E3-P3A-IMPL1`: Embedded `.bc-security-panel` inside `#activeIncidentDrawer` (`dispatcher.html`) right above `#drawerChannelInfo` with all spec IDs (`bcSecurityPanel`, `bcNetworkSwitch`, `uiHwMac`, `uiHwChannel`, `uiCardBlockInfo`, `uiAuthBadge`, `uiEvidenceType`, `uiSealBadge`, `uiStorageBadge`, `uiEvidenceHash`, `uiTxLink`, `uiBlockNum`, `uiStealthEvidenceBox`, `uiStealthEvidenceList`, `uiAuditTimeline`, `btnRunIntegrityCheck`, `verifyResult`), `onclick="runIntegrityCheck()"`, Cổng Thẻ DePIN button (`/cap-phat-the.html`), cache-busters `?v=20261102_web3_depin_v1`, and Tactical E10 Design System CSS (`#041B3B`->`#020D1C`, `#061D3A`, `#1E3F66`, `#00ECF3`, `#DFB077`, `#F1ECCB`, `#22C55E`) in `css/style.css`.
- `E3-P3A-VAL1`: Verified all 20 new DOM IDs appear uniquely (`count=1`) in `dispatcher.html` and CSS braces are 100% balanced across `242,896` bytes (`{"ok":true,"verifiedUniqueIds":20,"cssBalanced":true,"cssLength":242896}`).
- `E3-P3A-GRAPH1`: Ran `anvien analyze --force` (`nodes=80916`, `relationships=86365`, `failed=0`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` (`task-949`, exit `0`).
- `E3-P3A-COMMIT1`: Committed `dispatcher.html` and `css/style.css` in commit `282e3c9`.
- `E3-P3B-IMPL1`: Patched `js/dispatcher.js` (`+422` lines, `863,313` bytes) adding `getBlockchainSystemConfig()`, `initBlockchainSecurityPanel()`, `renderBlockchainPanel(inc)` (rendering Hardware DePIN MAC & Chained Block `#` vs Web Citizen W3C WebCrypto, `DePIN VERIFIED` / `SPOOF_SUSPECTED` / `UNSEALED_LEGACY_IOT` badges, incremental `<audio class="bc-stealth-audio" controls>` cards, `SHA-256` hash, `TxHash` explorer link, immutable lifecycle timeline with `Phản ứng: X giây`, and read-only neighbor guard), `runIntegrityCheckForSelectedIncident()`, `window.runIntegrityCheck`, JSON legal dossier export, printable biên bản window, and `data.incident` merge on `resolved` status updates.
- `E3-P3B-VAL1`: Verified `node --check js/dispatcher.js` (exit `0`) and booted isolated HTTP boundary check serving `/dispatcher.html` (`333,983` bytes) and `/js/dispatcher.js?v=20261102_web3_depin_v1` (`863,313` bytes) with HTTP `200` (`{"ok":true,"htmlBytes":333983,"jsBytes":863313}`).
- `E3-P3B-GRAPH1`: Ran `anvien analyze --force` (`scanned=494`, `parsed_code=159`, `failed=0`, `nodes=80916`, `relationships=86365`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` (`task-980`, exit `0`).
- `E3-P3B-COMMIT1`: Committed `js/dispatcher.js` in commit `1278f38`.

## E4 - P4 Evidence

Matching plan item(s): `P4-A`, `P4-B`, `P4-C`

- `E4-P4A-SPEC1`: Read newly updated `c:\Users\dienv\Desktop\capphattheSOS\DAC_TA_DONG_BO_WEB_VA_AI.md` (`v2.1`, lines 1–531) and ran `anvien file-detail` + `anvien impact` on `services/blockchain-ledger-service.js` and `server.js` (`task-1094`, exit `0`). Verified all 5 invariant rules in Section 10 (single persistent Serial session `115200 8N1` `DTR=true, RTS=true`; mandatory `READ_DATA` read-back verification after `SAVE_OK`; zero hardcoded personal sample names `"Thạch Minh Nhật"` / `"Cụ Nguyễn Văn A"`, using `""` / `"THE_CHUA_CAP_PHAT"` for blank cards; `/^(0x)?[0-9a-fA-F]{64}$/` hex seal validation; parallel 4G JSON keys `time`+`timestamp`+`created_at` and `bc_seal`+`seal`+`hw_mac`+`live_evidence_hash`) and official Section 5.5 Test Vector (`SOS_CSCD10_09`).
- `E4-P4A-IMPL1`: Created `js/stealth-sos.js`, `cap-phat-the.html`, and `js/depin-card-portal.js`, and updated `services/blockchain-ledger-service.js`, `server.js` (including `CUU_NAN_CUU_HO` routing, `sanitizeCardField`, `created_at`/`fullName`/`victim_name`, and replacing hardcoded `'Cụ Nguyễn Văn A'` fallbacks with `'Thẻ SOS chưa cấp phát (THE_CHUA_CAP_PHAT)'`), `index.html`, `css/style.css`, `js/app.js` (`initStealthSOS(app)`), and `sw.js` (`sos-vietnam-v2026-11-02-web3-stealth-v1`).
- `E4-P4A-VAL1`: Verified `node --check` on all 6 JS files (`js/stealth-sos.js`, `js/depin-card-portal.js`, `js/app.js`, `sw.js`, `services/blockchain-ledger-service.js`, `server.js` — all exit `0`), verified 16 unique new DOM IDs in `index.html`, verified Rule 3 (zero hardcoded sample names in `cap-phat-the.html` / `js/depin-card-portal.js` / `server.js`), and verified 100% match on `DAC_TA v2.1` Section 5.5 Test Vector (`bc_seal === "0x3c729fdfa29010da748df56a951a60896155a5fd749497928427bd308684c032"`, `live_evidence_hash === "0x11c59e69ae2e1865d21f82bb59c8785a1f07299be5be8d82e08d3e9d4bfa8585"`, `DEPIN_VERIFIED`, `liveHashVerified: true`).
- `E4-P4A-GRAPH1`: Ran `anvien analyze --force` (`scanned=497`, `parsed_code=161`, `failed=0`, `nodes=82612`, `relationships=88191`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` (`task-1120`, exit `0`).
- `E4-P4A-COMMIT1`: Committed `P4-A` (`9 files changed, 3276 insertions(+), 54 deletions(-)`) in commit `45c003d`.
- `E4-P4B-ENV1`: Built production Docker image `docker build -t sos-vietnam:local .` (`sha256:4a9bc01b8fd213b0c14be8c97d084f59c9386437c74ab3035ebf75f02e19887f`), started container `sos-vietnam-web3-qa` on `127.0.0.1:3106:3000` with persistent `/var/lib/sos-data` mount, verified `/api/blockchain/status` (`chainId: 84202600`, `SOS_RENDER_SANDBOX`), and opened `http://127.0.0.1:3106/`, `/dispatcher.html`, and `/cap-phat-the.html` visibly on the user's PC.
- `E4-P4B-IMPL1`: Created reusable `playwright/verify-web3-depin-and-stealth-sos.mjs` (supporting both local Docker `http://127.0.0.1:3106` and `--staging` `https://sos-vietnam-2026.onrender.com`), fixed ESP32-C3 `"lon"` float variant normalization in `services/blockchain-ledger-service.js` (`data.lng ?? data.lon ?? data.longitude`), and polished `json.block` banner in `js/depin-card-portal.js` + `#bcNetworkSwitch` width/typography in `css/style.css`.
- `E4-P4B-VAL1`: Executed `node playwright/verify-web3-depin-and-stealth-sos.mjs` against running Docker container `sos-vietnam-web3-qa`: **22 / 22 PASS (`failed: 0`)** (`hardwareSosDePinLatencyMs: 70.96 ms`, `liveIntegrityAuditUiMs: 444.16 ms`), including `DAC_TA v2.1` Section 5.5 vector, Rule 3 blank-card verification, `TEST` wipe vs `REAL` 1-time lock (`403`) & `Block #2` chaining, iOS Fake Call 3-tap guard, Blackout `#000000` 4-tap guard, 5s `MediaRecorder` `SHA-256` upload + playable `<audio>` + Live Audit SVG QR + byte-exact download, Block Explorer certificate, and post-`docker restart sos-vietnam-web3-qa` persistence (`qa-report.json` & `qa-report.md`).
- `E4-P4B-VAL2`: Visually inspected all 7 captured screenshots (`01-cap-phat-the-e10-v21.png` .. `07-blockchain-explorer-certificate.png`) via `read_file` confirming crisp Vietnamese typography, Tactical E10 colors, zero clipping/overlap, and scannable SVG QR certificates.
- `E4-P4B-GRAPH1`: Ran `anvien analyze --force` (`scanned=500`, `parsed_code=162`, `failed=0`, `nodes=83620`, `relationships=89203`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` (`task-1289`, exit `0`).
- `E4-P4B-COMMIT1`: Committed `P4-B` in commit `1dc5ff4`.
- `E4-P4C-ENV1`: Pushed `main` to `origin/main` (`https://github.com/Tinhhhh/sos-vietnam-2026.git` -> Render Staging `https://sos-vietnam-2026.onrender.com`, keeping `https://sosvie.site` untouched). Initial live Staging probe discovered `EACCES: permission denied, mkdir '/var/lib/sos-data'` on Render Free (no Persistent Disk mounted at `/var/lib/sos-data`). Ran Anvien `file-detail` + `impact` on `services/runtime-data-store.js` (`task-1348`, `task-1353`), implemented transparent `os.tmpdir()/sos-vietnam-runtime-data` (`0o700`, `AES-256-GCM`) fallback reporting `ledgerStorageMode: "cloud-ephemeral-tmpdir-encrypted-vault"`, verified inside Linux Docker (`{"dir":"/tmp/sos-vietnam-runtime-data","mode":"cloud-ephemeral-tmpdir-encrypted-vault","historyCount":1,"blockNumber":101,"hashMatch":true}`), committed `169dd4b`, pushed to `origin/main`, confirmed `GET https://sos-vietnam-2026.onrender.com/api/blockchain/status` returned HTTP `200` (`chainId: 84202600`, `storageFolder: "SOS_RENDER_SANDBOX"`, `ledgerStorageMode: "cloud-ephemeral-tmpdir-encrypted-vault"`), and opened `https://sos-vietnam-2026.onrender.com/`, `/dispatcher.html`, and `/cap-phat-the.html` visibly on the user's PC.
- `E4-P4C-VAL1`: Executed `node playwright/verify-web3-depin-and-stealth-sos.mjs --staging` (`task-1397`, exit `0`) against live Render Staging `https://sos-vietnam-2026.onrender.com`: **21 / 21 PASS (`failed: 0`)** (`hardwareSosDePinLatencyMs: 501.95 ms`, `liveIntegrityAuditUiMs: 375.07 ms`), producing `Reports/qa/playwright/2026-11-02-web3-depin-stealth-sos/staging-qa-report.{json,md}` and `staging-01..07.png`, and visually inspected all 7 live Staging screenshots via `read_file`.
- `E4-P4C-COMMIT1`: Committed Render Free runtime-store fix in `169dd4b` and staged live Staging QA artifacts for plan closure commit.

## Closure Evidence

Matching plan item(s): `Pn-A`, `Pn-B`, `Pn-C`

- `En-PNA-SUP1`: Authored Supervisor acceptance report `Reports/qa/rp_supervisor_261102_155000_by_antigravity_web3_depin_stealth_sos.md` (`Verdict: PASS`, `0` open blockers) verifying all 5 Web3/DePIN & Stealth SOS specification deliverables, all 5 `DAC_TA_DONG_BO_WEB_VA_AI.md` `v2.1` rules & Section 5.5 Test Vector, local Docker E2E (`22/22 PASS`), live Render Staging E2E (`21/21 PASS`), and untouched `https://sosvie.site`.
- `En-PNB-CLEAN1`: Stopped and removed local QA Docker container `docker rm -f sos-vietnam-web3-qa`, removed `.tmp/docker-web3-qa-data`, verified zero plan-created `.tmp/p*` scratch dirs remain, and confirmed all pre-existing user uncommitted files in the workspace remain untouched.
- `En-PNC-GRAPH1`: Executed final `anvien analyze --force` (`scanned=503`, `parsed_code=162`, `failed=0`, `nodes=83665`, `relationships=89250`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` (`task-1419`, `risk_level: low`, exit `0`).
- `En-PNC-COMMIT1`: Closed all 4 plan ledger files (`Status: complete`) and committed plan ledger + live Render Staging QA artifacts + Supervisor report to `main` and pushed to `origin/main`.
