# SOS Vietnam 2026 — Web3 DePIN Blockchain Ledger, Hardware Anti-Spoofing & Stealth SOS Actual Status

Title: SOS Vietnam 2026 — Web3 DePIN Blockchain Ledger, Hardware Anti-Spoofing & Stealth SOS
Date: 2026-11-02
Status: complete
Companion plan: `docs/plans/2026-11-02-web3-depin-and-stealth-sos/2026-11-02-web3-depin-and-stealth-sos-plan.md`
Companion evidence: `docs/plans/2026-11-02-web3-depin-and-stealth-sos/2026-11-02-web3-depin-and-stealth-sos-evidence.md`
Companion benchmark: `docs/plans/2026-11-02-web3-depin-and-stealth-sos/2026-11-02-web3-depin-and-stealth-sos-benchmark.md`

## Purpose

This file records the real current state before implementation and tracks live state transitions after each completed slice.

## Freshness / Refresh Rules

Update this file:
- after each completed implementation slice (`P1-A`, `P1-B`, `P2-A`, `P2-B`, `P3-A`, `P3-B`, `P4-A`, `P4-B`);
- before starting the next phase if repo state changed;
- whenever evidence changes a current-state classification.

## Scope

Target scope:
- Hạng mục 1: Internal Blockchain Ledger (`Chain ID: 842026` Production / `84202600` Staging) + Multi-Chain EVM RPC connector (`NDA_CHAIN_RPC_URL`, `POLYGON_AMOY_RPC_URL`), Hardware ESP32-C3 + `CapPhatTheSOS.exe` `bc_seal` & `live_evidence_hash` anti-spoofing on `/api/hardware-sos`, and 4-step Case Lifecycle sealing (`1_SOS_TRIGGER`, `2_EVIDENCE_SEAL`, `3_OFFICER_DISPATCH`, `4_CASE_RESOLVED`).
- Hạng mục 2: Multi-tier Evidence Storage Adapter (Cloudinary `SOS_VIETNAM_OFFICIAL` / `SOS_RENDER_SANDBOX` -> Supabase Storage -> encrypted local `.runtime-data/evidence-media/` vault), RAM `SHA-256` hashing before upload (`POST /api/sos/upload-evidence` + `POST /api/sos/media`), and byte-exact retrieval (`GET /api/sos/evidence-file/:incidentId/:evidenceId`).
- Hạng mục 3: Dispatcher Command Center `.bc-security-panel` (**BẢO CHỨNG CHUỖI KHỐI (WEB3 / BLOCKCHAIN LEDGER)**) in `dispatcher.html` + `js/dispatcher.js` + `css/style.css`.
- Hạng mục 4: Live Integrity Audit & Legal Evidence Extraction (`POST /api/dispatcher/blockchain/verify`, `GET /api/blockchain/explorer/:txOrBlock`, `runIntegrityCheck()`, `100% NGUYÊN VẸN` legal certificate, original file download, and SVG QR code).
- Hạng mục 5: Citizen Web Emergency Camouflage (`js/stealth-sos.js` + `index.html` + `js/app.js` + `sw.js`): **5.1 Fake Incoming Call (iOS UI)** (3s countdown, fullscreen, ring/vibrate, default `"Ba"`, Green Answer -> 6-button keypad, `00:01` timer, Vietnamese `speechSynthesis`, `WakeLock`, `"Danh bạ"` `#000000` proximity blackout, 5000ms `MediaRecorder` + browser `SHA-256` upload, 3-tap Red Hangup guard) & **5.2 Blackout Stealth Mode** (`#000000` `100vw x 100vh` `z-index: 999999`, `WakeLock`, covert 5s audio + continuous GPS, 4-tap unlock guard).

Out of scope:
- Modifying external C++ desktop app `CapPhatTheSOS.exe` or Arduino ESP32-C3 firmware (already completed per spec Section 2).
- Modifying pre-existing uncommitted presentation/video/doc files in the workspace.
- Weakening WAF, RBAC, or citizen access token protections in `services/security-firewall-middleware.js`.

## Relationship / Impact Evidence

| Unit / File / Surface | File Detail Evidence | Related File Count | Relationship Summary | Impact Note |
|-----------------------|----------------------|--------------------|----------------------|-------------|
| `services/blockchain-ledger-service.js` | `E0-P0A-GRAPH1` | 0 (new file) | New ESM service importing `crypto` + `runtime-data-store.js` | low scope warning |
| `services/evidence-storage-service.js` | `E0-P0A-GRAPH1` | 0 (new file) | New ESM service importing `crypto`, `fs`, `https`, `security-crypto-service.js`, `runtime-data-store.js` | low scope warning |
| `server.js` | `E0-P0A-GRAPH2`, `E0-P0A-GRAPH3` | 7 related files | `symbolCount=1542`, `inbound=2`, `outbound=7`, `linked_flows=24` | HIGH scope warning — keep edits surgical via service modules |
| `dispatcher.html` | `E0-P0A-GRAPH2`, `E0-P0A-GRAPH3` | 0 related files | HTML template hosting `#activeIncidentDrawer` | low scope warning |
| `js/dispatcher.js` | `E0-P0A-GRAPH2`, `E0-P0A-SRC2` | unindexed (`859 KB`) | Main Dispatcher UI controller (`selectIncident`, `updateDrawer`, `handleAcceptSOS`, `handleUpdateStatus`) | medium/high manual care — isolate Web3 drawer helper methods cleanly |
| `index.html` | `E0-P0A-GRAPH2`, `E0-P0A-GRAPH3` | 0 related files | Citizen SOS & Live Tracking HTML entrypoint | low scope warning |
| `js/app.js` | `E0-P0A-GRAPH2`, `E0-P0A-GRAPH3` | 0 related files (`linked_flows=27`) | `symbolCount=979`, `direct=41` | CRITICAL scope warning — delegate Stealth logic to `js/stealth-sos.js` and add minimal clean bridge hooks |
| `js/stealth-sos.js` | `E0-P0A-GRAPH1` | 0 (new file) | New modular Citizen Stealth SOS & Fake Call controller | low scope warning |
| `css/style.css` | `E0-P0A-GRAPH2`, `E0-P0A-GRAPH3` | 0 related files | Shared stylesheet for `index.html` and `dispatcher.html` | low scope warning |
| `sw.js` | `E0-P0A-GRAPH2`, `E0-P0A-GRAPH3` | 0 related files | PWA Service Worker static asset cache | low scope warning |
| `services/runtime-data-store.js` | `E0-P0A-GRAPH2`, `E4-P4C-ENV1` | 10 related files | Encrypted AES-256-GCM runtime store (`inboundRefCount=54`, `risk=CRITICAL`) | CRITICAL scope warning — preserve all 4 exports; add explicit `EACCES`/`EROFS` cloud-sandbox fallback to `os.tmpdir()/sos-vietnam-runtime-data` (`0o700`) for Render Free where `/var/lib/sos-data` has no mounted Persistent Disk |
| `services/security-firewall-middleware.js` | `E0-P0A-GRAPH2` | 4 related files | Layer 7 WAF, rate-limiter & RBAC session auth | high — preserve-only |

## Status Rules

| Status | Meaning | Allowed next action |
|--------|---------|---------------------|
| `correct` | Already behaves as required. | Preserve. Add evidence or tests only if needed. |
| `partial` | Some required behavior exists, but gaps remain. | Change only the missing parts. Preserve correct parts. |
| `wrong` | Current behavior, source, or contract is incorrect. | Replace with required behavior. Record the exact reason. |
| `missing` | Required behavior, source, or contract does not exist. | Implement the missing piece only. |
| `unbound` | Surface exists but is not wired to the real source, flow, or contract. | Bind to the real source only. Preserve approved surface. |
| `fake-or-stub` | Prototype, demo, mock, fallback, or placeholder data is being used as real behavior. | Remove fake behavior or replace it with an approved truthful state. |
| `blocked` | Source, authority, contract, or required evidence is unclear. | Stop. Do not implement until resolved. |

## Current Status Matrix

| Unit | Current State | Required State | Status | Relationship Count | Evidence | Next Plan Decision |
|------|---------------|----------------|--------|--------------------|----------|--------------------|
| `services/blockchain-ledger-service.js` | Implemented persistent AES-256-GCM ledger (`#101+`), dual `bc_seal` + `live_evidence_hash` verifier, Multi-Chain EVM relay, and ISO-18004 SVG QR generator | Persistent AES-256-GCM internal ledger (`842026` / `84202600`, sequential blocks `#101+`, `prevHash`, `txHash`), dual-formula `bc_seal` + `live_evidence_hash` verifier, optional EVM RPC relay (`NDA_CHAIN_RPC_URL` / `POLYGON_AMOY_RPC_URL`), `writeToSOSBlockchain()`, and SVG QR generator | `correct` | 1 related file | `E1-P1A-IMPL1`, `E1-P1A-VAL1`, `E1-P1A-COMMIT1` | preserve — consume in `P1-B` |
| `server.js` (`/api/hardware-sos`, `DAC_TA` DePIN Card Registry & 3 Non-Media Lifecycle Hooks) | Implemented 100% backward-compatible `/api/hardware-sos` + new ESP32-C3 & `DAC_TA` Chained Block v2 fields + dual-secret (`DAC_TA_SECRET_KEY` + `COMMAND_SECRET_KEY`) verification + `/api/depin/cards`, `/api/depin/verify-seal`, `/api/depin/cards/provision`, `/api/depin/cards/wipe` (`TEST` wipe vs `REAL` 1-time Genesis lock `403` & `Block #2+` chaining) + `1_SOS_TRIGGER`, `3_OFFICER_DISPATCH` (`responseTimeSeconds` on Web & Zalo), `4_CASE_RESOLVED` (`saveIncidentHistory()`) + `/api/blockchain/status` & `/api/blockchain/explorer/:txOrBlock` | 100% backward-compatible `/api/hardware-sos` + new DePIN fields + `bc_seal`/`live_evidence_hash` verification + return `{ blockNumber, txHash }` + seal `1_SOS_TRIGGER`, `3_OFFICER_DISPATCH` (with `responseTimeSeconds` on Web & Zalo accept), `4_CASE_RESOLVED` (Web & `citizen-safe` + `saveIncidentHistory()`) + `/api/blockchain/status` & `/api/blockchain/explorer/:txOrBlock` + `DAC_TA` Card Registry APIs | `correct` | 12 related files | `E1-P1B-SPEC1`, `E1-P1B-IMPL1`, `E1-P1B-VAL1`, `E1-P1B-VAL2`, `E1-P1B-COMMIT1` | preserve — extend media/verify routes in `P2-B` |
| `services/evidence-storage-service.js` | Implemented RAM `SHA-256` (`0x...`), binary-safe `parseMultipartFormData`, Cloudinary/Supabase domain-partitioned connectors (`SOS_VIETNAM_OFFICIAL` / `SOS_RENDER_SANDBOX`), AES-256-GCM `.runtime-data/evidence-media/` vault, signed evidence tokens, and `readEvidenceRawBuffer` | Multi-tier adapter: RAM `SHA-256` (`0x...`) before storage, domain-partitioned Cloudinary / Supabase upload (`SOS_VIETNAM_OFFICIAL` / `SOS_RENDER_SANDBOX`), encrypted `.runtime-data/evidence-media/` vault fallback, and byte-exact buffer reader for live audit | `correct` | 3 related files | `E2-P2A-IMPL1`, `E2-P2A-VAL1`, `E2-P2A-COMMIT1` | preserve — consume in `P2-B` |
| `server.js` (`/api/sos/upload-evidence`, `/api/sos/evidence-file`, `/api/dispatcher/blockchain/verify`, CSP) | Implemented `POST /api/sos/upload-evidence` (raw binary multipart + JSON base64, strict citizen token / dispatcher session auth, RAM `SHA-256`, `2_EVIDENCE_SEAL` block, live GPS + SSE `sos_update`), `POST /api/sos/stealth-gps`, `GET /api/sos/evidence-file/:incidentId/:evidenceId` (`206 Partial Content` Range + `?download=1` attachment), `POST /api/dispatcher/blockchain/verify` (live `readEvidenceRawBuffer` -> `currentServerFileHash` vs `originalBlockchainHash`, `100% NGUYÊN VẸN` legal dossier + SVG QR), `2_EVIDENCE_SEAL` on `/api/sos/media`, and CSP update for Cloudinary/Supabase | Add `POST /api/sos/upload-evidence` (multipart + JSON), `POST /api/sos/stealth-gps`, `GET /api/sos/evidence-file/:incidentId/:evidenceId`, `POST /api/dispatcher/blockchain/verify` (live `SHA-256` re-hash + QR), seal `/api/sos/media` (`2_EVIDENCE_SEAL`), guard line 5164, update CSP | `correct` | 8 related files | `E2-P2B-IMPL1`, `E2-P2B-VAL1`, `E2-P2B-COMMIT1` | preserve — consume in `P3-B` & `P4-A` |
| `dispatcher.html` + `css/style.css` (`.bc-security-panel`) | Embedded `.bc-security-panel` inside `#activeIncidentDrawer` with all 20 unique spec DOM IDs, Cổng Thẻ DePIN button, `#bcNetworkSwitch` (`842026`/`NDA`/`POLYGON`), playable Stealth audio list container, `runIntegrityCheck()`, `#verifyResult`, cache-busters (`?v=20261102_web3_depin_v1`), and Tactical E10 CSS | Embed `.bc-security-panel` with `#bcNetworkSwitch`, `#uiHwMac`, `#uiAuthBadge`, `#uiEvidenceHash`, `#uiTxLink`, `#uiBlockNum`, `#uiAuditTimeline`, playable Stealth audio list, `runIntegrityCheck()`, `#verifyResult` | `correct` | 0 related files | `E3-P3A-IMPL1`, `E3-P3A-VAL1`, `E3-P3A-COMMIT1` | preserve — bind JS in `P3-B` |
| `js/dispatcher.js` (`updateDrawer` & `runIntegrityCheck`) | Bound `getBlockchainSystemConfig()`, `initBlockchainSecurityPanel()`, `renderBlockchainPanel(inc)` (incremental `<audio class="bc-stealth-audio" controls>` updates without playback stutter during SSE `sos_update`), `#bcNetworkSwitch` (`842026`/`NDA`/`POLYGON`), `runIntegrityCheckForSelectedIncident()`, `window.runIntegrityCheck`, legal dossier JSON export, printable biên bản, and `data.incident` merge on `resolved` | Populate `.bc-security-panel` on `updateDrawer` & SSE updates, switch network metadata (`842026`/`NDA`/`POLYGON`), play 5s Stealth audio clips, run live server `SHA-256` verification + legal download + QR modal/card | `correct` | unindexed (`863 KB`) | `E3-P3B-IMPL1`, `E3-P3B-VAL1`, `E3-P3B-COMMIT1` | preserve — verify E2E in `P4-B` & `P4-C` |
| `js/stealth-sos.js` + `cap-phat-the.html` + `js/depin-card-portal.js` + `index.html` + `js/app.js` + `sw.js` | Implemented Citizen Emergency Camouflage (`js/stealth-sos.js`: 3s Fake Call countdown, iOS Incoming/Active UI, Vietnamese `speechSynthesis`, `WakeLock`, `"Danh bạ"` `#000000` proximity cover, standalone 5000ms `MediaRecorder` WebCrypto `SHA-256` upload, continuous GPS, 3-tap Red Hangup & 4-tap Blackout unlock guards) AND `cap-phat-the.html` + `js/depin-card-portal.js` 100% synced with `DAC_TA_DONG_BO_WEB_VA_AI.md` v2.1 (Rules 1–5: single persistent Web Serial `115200 8N1` `DTR=true, RTS=true` session, mandatory `READ_DATA` read-back verify, empty initial inputs / `THE_CHUA_CAP_PHAT` with zero hardcoded sample names, `/^(0x)?[0-9a-fA-F]{64}$/` seal validator, Section 5.5 Test Vector `SOS_CSCD10_09`, and parallel 4G JSON simulator), plus `index.html`, `css/style.css`, `js/app.js`, and `sw.js` (`sos-vietnam-v2026-11-02-web3-stealth-v1`) | Add `js/stealth-sos.js` (iOS Fake Call + Blackout Stealth + 5s `MediaRecorder` `SHA-256` upload + 3-tap/4-tap guards), `cap-phat-the.html` + `js/depin-card-portal.js` (`DAC_TA_DONG_BO_WEB_VA_AI.md` v2.1 Web Serial `115200 bps` `READ_DATA`/`SET_*`/`SAVE_FLASH`/`WIPE_CARD`, `TEST` vs `REAL` 1-time lock & `Block #2+` chaining, SHA-256 verifier, Tactical E10 UI), wire `index.html` + `js/app.js`, bump `sw.js` cache | `correct` | 2 related files | `E4-P4A-SPEC1`, `E4-P4A-IMPL1`, `E4-P4A-VAL1`, `E4-P4A-COMMIT1` | preserve — verify E2E in `P4-B` & `P4-C` |
| `Dockerfile` + Docker Engine + Playwright E2E (`playwright/verify-web3-depin-and-stealth-sos.mjs`) + Render Staging (`https://sos-vietnam-2026.onrender.com/`) | Built `sos-vietnam:local`, passed **22/22** assertions on local Docker (`sos-vietnam-web3-qa`, including `docker restart`), pushed `169dd4b` to `origin/main`, opened visible browser tabs on `https://sos-vietnam-2026.onrender.com/`, and passed **21/21** assertions (`failed: 0`) live on Render Staging while keeping `https://sosvie.site` untouched | Build `sos-vietnam:local`, run local Docker Playwright E2E (`P4-B`), then push to `origin/main` and run live browser + Playwright verification on `https://sos-vietnam-2026.onrender.com/` (`P4-C`, leaving `sosvie.site` untouched) | `correct` | 0 related files | `E0-P0A-ENV1`, `E4-P4B-ENV1`, `E4-P4B-VAL1`, `E4-P4C-ENV1`, `E4-P4C-VAL1`, `E4-P4C-COMMIT1` | complete (`PASS`) |

## Status Refresh Log

| Refresh | Date | Repo Basis | Changed Scope | Status Changes | Evidence | Next Phase Update |
|---------|------|------------|----------------|----------------|----------|-------------------|
| R0 | 2026-11-02 | `692aa10` baseline before `P1-A` | Full 5-Hạng-mục Web3 DePIN & Stealth SOS scope | Initial classification (`missing` / `partial` / `correct` preserve-only dependencies) | `E0-P0A-SPEC1`, `E0-P0A-SPEC2`, `E0-P0A-GRAPH1..E0-P0A-GRAPH3`, `E0-P0A-SRC1..E0-P0A-SRC3`, `E0-P0A-ENV1` | Proceed to `P1-A` unchanged |
| R1 | 2026-11-02 | `823f021` after `P1-A` | `services/blockchain-ledger-service.js` | `missing -> correct` | `E1-P1A-IMPL1`, `E1-P1A-VAL1`, `E1-P1A-GRAPH1`, `E1-P1A-COMMIT1` | Proceed to `P1-B` unchanged |
| R2 | 2026-11-02 | `542db7b` after `P1-B` | `server.js` + `services/blockchain-ledger-service.js` (`DAC_TA` sync) | `/api/hardware-sos`, `DAC_TA` Card Registry & 3 Lifecycle Hooks `partial -> correct`; expanded `P4-A`/`P4-C` for `cap-phat-the.html` + `https://sos-vietnam-2026.onrender.com/` live Staging verification | `E1-P1B-SPEC1`, `E1-P1B-IMPL1`, `E1-P1B-VAL1`, `E1-P1B-VAL2`, `E1-P1B-GRAPH1`, `E1-P1B-COMMIT1` | Proceed to `P2-A` |
| R3 | 2026-11-02 | `a30b08e` after `P2-A` | `services/evidence-storage-service.js` | `missing -> correct` | `E2-P2A-IMPL1`, `E2-P2A-VAL1`, `E2-P2A-GRAPH1`, `E2-P2A-COMMIT1` | Proceed to `P2-B` unchanged |
| R4 | 2026-11-02 | `a868dec` after `P2-B` | `server.js` (evidence upload, Range playback/download, `/api/sos/media` seal, live `SHA-256` verify & CSP) | `partial -> correct` | `E2-P2B-IMPL1`, `E2-P2B-VAL1`, `E2-P2B-GRAPH1`, `E2-P2B-COMMIT1` | Proceed to `P3-A` unchanged |
| R5 | 2026-11-02 | `282e3c9` after `P3-A` | `dispatcher.html` + `css/style.css` (`.bc-security-panel` Tactical E10 UI) | `missing -> correct` | `E3-P3A-IMPL1`, `E3-P3A-VAL1`, `E3-P3A-GRAPH1`, `E3-P3A-COMMIT1` | Proceed to `P3-B` unchanged |
| R6 | 2026-11-02 | `1278f38` after `P3-B` | `js/dispatcher.js` (live DePIN identity, 5s Stealth audio & `runIntegrityCheck()` legal dossier/QR) | `partial -> correct` | `E3-P3B-IMPL1`, `E3-P3B-VAL1`, `E3-P3B-GRAPH1`, `E3-P3B-COMMIT1` | Proceed to `P4-A` unchanged |
| R7 | 2026-11-02 | `45c003d` after `P4-A` | `js/stealth-sos.js`, `cap-phat-the.html`, `js/depin-card-portal.js`, `services/blockchain-ledger-service.js`, `server.js`, `index.html`, `css/style.css`, `js/app.js`, `sw.js` (`DAC_TA v2.1` sync) | Citizen Stealth & DePIN Portal `missing -> correct` | `E4-P4A-SPEC1`, `E4-P4A-IMPL1`, `E4-P4A-VAL1`, `E4-P4A-GRAPH1`, `E4-P4A-COMMIT1` | Proceed to `P4-B` (Docker build + Playwright E2E) |
| R8 | 2026-11-02 | `1dc5ff4` after `P4-B` | `sos-vietnam:local` Docker container + `playwright/verify-web3-depin-and-stealth-sos.mjs` + `services/blockchain-ledger-service.js` (`lon` fix) + UI polish | Local Docker + Playwright E2E `22/22 PASS` (`correct`); Render Staging `P4-C` next | `E4-P4B-ENV1`, `E4-P4B-IMPL1`, `E4-P4B-VAL1`, `E4-P4B-VAL2`, `E4-P4B-GRAPH1`, `E4-P4B-COMMIT1` | Push `origin/main` & execute `P4-C` on `https://sos-vietnam-2026.onrender.com/` |
| R9 | 2026-11-02 | `169dd4b` after `P4-C` & `Pn` | `services/runtime-data-store.js` (Render Free `EACCES` cloud-sandbox fallback) + live Render Staging (`https://sos-vietnam-2026.onrender.com/`) + Supervisor audit & cleanup | Render Staging `partial -> correct` (`21/21 PASS`); all plan rows `correct` | `E4-P4C-ENV1`, `E4-P4C-VAL1`, `E4-P4C-COMMIT1`, `En-PNA-SUP1`, `En-PNB-CLEAN1` | Plan closed (`complete`) |

## Phase Touch Map

| Unit / File / Surface | Plan-Relevant Relationship File | Relationship to Target | Plan Item | Touch Mode | Evidence | Constraint |
|-----------------------|---------------------------------|------------------------|-----------|------------|----------|------------|
| `services/blockchain-ledger-service.js` | `services/runtime-data-store.js` | dependency | `P1-A` | preserve-only (`runtime-data-store.js`), edit/create (`blockchain-ledger-service.js`) | `E0-P0A-GRAPH2` | Persist ledger via `readRuntimeData`/`writeRuntimeData` |
| `server.js` | `services/security-firewall-middleware.js`, `services/zalo-bot-service.js` | dependency | `P1-B`, `P2-B` | preserve-only (dependencies), edit (`server.js`) | `E0-P0A-GRAPH2`, `E0-P0A-SRC1` | Do not weaken WAF/RBAC; place new `/api/sos/*` GET routes before line 5164 catch-all |
| `services/evidence-storage-service.js` | `services/security-crypto-service.js`, `services/runtime-data-store.js` | dependency | `P2-A` | preserve-only (dependencies), edit/create (`evidence-storage-service.js`) | `E0-P0A-SPEC2` | Hash raw `Buffer` in RAM before cloud/vault write |
| `dispatcher.html`, `css/style.css` | `js/dispatcher.js` | consumer | `P3-A` | edit | `E0-P0A-SRC2` | Preserve exact spec element IDs (`#bcNetworkSwitch`, `#uiHwMac`, `#uiAuthBadge`, `#uiEvidenceHash`, `#uiTxLink`, `#uiBlockNum`, `#uiAuditTimeline`, `#verifyResult`) |
| `js/dispatcher.js` | `dispatcher.html` | DOM target | `P3-B` | edit | `E0-P0A-SRC2` | Expose `window.runIntegrityCheck` for inline `onclick="runIntegrityCheck()"` compatibility |
| `js/stealth-sos.js`, `index.html`, `js/app.js`, `sw.js` | `index.html` (`#sfxIncomingCall`) | DOM/audio dependency | `P4-A` | edit/create | `E0-P0A-SRC3` | Keep `js/app.js` changes minimal (`RISK=CRITICAL`); put Stealth state machine in `js/stealth-sos.js` |
| `playwright/verify-web3-depin-and-stealth-sos.mjs` | `Dockerfile` | runtime target | `P4-B` | preserve-only (`Dockerfile`), create/edit (`playwright/...`) | `E0-P0A-ENV1` | Must target built `sos-vietnam:local` Docker container |

## Detailed Findings

### 1. Hardware SOS & Case Lifecycle Blockchain Sealing (`server.js` + `services/blockchain-ledger-service.js`)

Current state:
`server.js:4821-5158` handles `POST /api/hardware-sos`, `GET /api/hardware-sos/push`, and `POST /api/sos/create`. Currently line 4867 only parses `press_step`/`pressStep`/`press_count`, ignoring the new ESP32-C3 fields `button` (`1`/`2`/`3`), `cardID`, `type` (`CONG_AN_DIA_PHUONG`), `target_unit`, `unit_title`, `user_name`, `user_phone`, `user_cccd`, `cccd`, `hw_mac`, `bc_seal`, `live_evidence_hash`, and `chain_id`. Also `normalizeHardwareIncidentForDisplay` (`server.js:1951-1987`) unconditionally overwrites `incidentTags` and `customNotes` unless aware of `unit_title`/`cardID`. Furthermore, `/api/dispatcher/update-status` (`server.js:5967`) and `/api/sos/citizen-safe` (`server.js:6867`) do not call `saveIncidentHistory()`, and zero lifecycle events are sealed to a blockchain ledger.

Required state:
```text
Verify bc_seal (both C++ CapPhatTheSOS.exe and ESP32-C3 formulas) + live_evidence_hash using COMMAND_SECRET_KEY = "BTL_CSCD_E10_D1_SOS_VIETNAM_2026", map all new hardware fields while preserving 100% backward compatibility for legacy firmware, persist sequential blocks (#101, #102...) across all 4 lifecycle stages (1_SOS_TRIGGER, 2_EVIDENCE_SEAL, 3_OFFICER_DISPATCH with responseTimeSeconds, 4_CASE_RESOLVED), and expose blockNumber + txHash + explorer certificate.
```

Evidence: `E0-P0A-SPEC1`, `E0-P0A-SRC1`, `E0-P0A-GRAPH2`, `E0-P0A-GRAPH3`.
Classification: `missing` (`services/blockchain-ledger-service.js`) / `partial` (`server.js`).
Allowed next action: Create `services/blockchain-ledger-service.js` in `P1-A` and wire `/api/hardware-sos` + lifecycle hooks in `P1-B`.
Forbidden next action: Breaking legacy `/api/hardware-sos` payloads without `bc_seal` or modifying `services/security-firewall-middleware.js`.

### 2. Field Evidence Storage & Live SHA-256 Integrity Audit (`services/evidence-storage-service.js` + `server.js`)

Current state:
Only `POST /api/sos/media` (`server.js:6597`) exists for chat Base64 images/videos; there is no `POST /api/sos/upload-evidence`, no RAM `SHA-256` pre-upload sealing, no Cloudinary/Supabase/encrypted-vault multi-tier storage service, and no live server re-hash audit endpoint. Line 5164 (`urlPath.startsWith('/api/sos/') && req.method === 'GET'`) will intercept any new `GET /api/sos/...` sub-route unless placed earlier or guarded.

Required state:
```text
Compute sha256Hash = "0x" + sha256(fileBuffer) in RAM before storing to Cloudinary / Supabase (SOS_VIETNAM_OFFICIAL vs SOS_RENDER_SANDBOX) or encrypted .runtime-data/evidence-media/ vault, seal 2_EVIDENCE_SEAL block, store { mediaUrl, sha256Hash, blockNumber, txHash }, and re-hash raw stored bytes live during runIntegrityCheck().
```

Evidence: `E0-P0A-SPEC1`, `E0-P0A-SPEC2`, `E0-P0A-SRC1`.
Classification: `missing` (`services/evidence-storage-service.js`) / `partial` (`server.js`).
Allowed next action: Implement `services/evidence-storage-service.js` in `P2-A` and wire upload/playback/verify routes + CSP update in `P2-B`.
Forbidden next action: Returning fake/cached hashes during live audit without reading and hashing the stored raw bytes.

### 3. Dispatcher Command Center `.bc-security-panel` (`dispatcher.html` + `js/dispatcher.js` + `css/style.css`)

Current state:
`#activeIncidentDrawer` (`dispatcher.html:2291-2432`) renders incident header, Google Maps links, citizen photos/videos, ward facilities, dispatch channels, and action buttons, with zero Web3/DePIN UI.

Required state:
```text
Render .bc-security-panel inside #activeIncidentDrawer with #bcNetworkSwitch (842026 / NDA / POLYGON), #uiHwMac, #uiAuthBadge, #uiEvidenceHash, #uiTxLink, #uiBlockNum, #uiAuditTimeline, playable Stealth 5s audio clips, runIntegrityCheck() button, and #verifyResult with legal conclusion, original file download, and Block QR code.
```

Evidence: `E0-P0A-SPEC1`, `E0-P0A-SRC2`.
Classification: `missing` (`dispatcher.html`) / `partial` (`js/dispatcher.js`).
Allowed next action: Add HTML/CSS in `P3-A` and bind live drawer/SSE/audit logic in `P3-B`.
Forbidden next action: Removing or breaking existing dispatcher controls (`#btnAcceptSOS`, `#btnMarkArrived`, `#btnMarkResolved`, `#btnFlagFakeAlarm`).

### 4. Citizen Emergency Camouflage (`js/stealth-sos.js` + `index.html` + `js/app.js` + `sw.js`)

Current state:
`index.html` has `#sosTriggerView`, `#sosTrackingView`, and `<audio id="sfxIncomingCall">` (`index.html:1420`), with no Fake Incoming Call or Blackout Stealth Mode.

Required state:
```text
Provide 2 Emergency Camouflage modes on Citizen Web:
1) Fake Incoming Call (iOS UI): 3s countdown -> fullscreen + ringtone + vibration ("Ba" default, editable) -> Green Answer -> 6-button keypad + 00:01 timer + Vietnamese speechSynthesis + WakeLock + "Danh bạ" #000000 proximity blackout + covert silent SOS + 5000ms MediaRecorder + crypto.subtle.digest('SHA-256') upload to /api/sos/upload-evidence + 3-tap Red Hangup protection.
2) Blackout Stealth Mode: #000000 (100vw x 100vh, z-index: 999999) + WakeLock + covert silent SOS + 5s audio + continuous GPS + 4-tap unlock protection.
```

Evidence: `E0-P0A-SPEC1`, `E0-P0A-SRC3`, `E0-P0A-GRAPH3`.
Classification: `missing`.
Allowed next action: Implement `js/stealth-sos.js` and wire `index.html`, `css/style.css`, `js/app.js`, and `sw.js` in `P4-A`, then validate in Docker + Playwright in `P4-B`.
Forbidden next action: Allowing 1 single accidental tap to exit Fake Call or Blackout Stealth Mode.

## Next Phase Status Decisions

| Plan Item | Actual Status Finding | Required Status / Next-Action Update |
|-----------|-----------------------|--------------------------------------|
| `P1-A` | `services/blockchain-ledger-service.js` is `missing` | keep — implement clean ESM ledger + DePIN verifier + QR SVG module |
| `P1-B` | `server.js` `/api/hardware-sos` & lifecycle hooks are `partial` | keep — wire all 4 lifecycle actions, new ESP32-C3 fields, and explorer routes |
| `P2-A` | `services/evidence-storage-service.js` is `missing` | keep — implement multi-tier Cloudinary/Supabase/encrypted-vault adapter |
| `P2-B` | `server.js` evidence upload & live verify routes are `missing`/`partial`; line 5164 has `GET /api/sos/*` catch-all | keep — place new `/api/sos/*` routes above line 5164 and update CSP |
| `P3-A` | `.bc-security-panel` is `missing` in `dispatcher.html` | keep — embed panel in `#activeIncidentDrawer` |
| `P3-B` | `js/dispatcher.js` Web3 bindings & `runIntegrityCheck()` are `missing` | keep — bind real-time data, audio list, live audit, download, and QR |
| `P4-A` | Citizen Stealth modes are `missing`; `js/app.js` has `CRITICAL` blast radius | keep — isolate Stealth logic in `js/stealth-sos.js` with minimal `js/app.js` hooks |
| `P4-B` | Docker Engine `29.6.1` is live (`correct`); E2E test script is `missing` | keep — build `sos-vietnam:local` container and run Playwright E2E against it |

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
- [x] If implementation has started, affected Current Status Matrix rows have been refreshed from latest evidence.
- [x] If refreshed statuses changed next work, only the stale next-phase status assumptions, next action, or work steps have been updated before the next phase.

## Final P0 Decision

Choose one:

- [ ] P0 actual-status incomplete. Implementation is blocked.
- [x] P0 complete. Next phase can proceed unchanged.
- [ ] P0 complete. Next phase status, next action, or work steps must be updated before implementation.
- [ ] P0 complete. Target scope is preserve-only.
- [ ] P0 complete. Implementation is blocked by missing authority or evidence.

Decision note:

All target files, sibling lifecycle surfaces, Anvien `file-detail`/`impact` metrics, CSP/WAF rules, route ordering constraints (`server.js:5164`), and Docker Engine (`v29.6.1`) have been verified against the technical specification and user clarifications. Implementation can proceed directly starting at `P1-A`.
