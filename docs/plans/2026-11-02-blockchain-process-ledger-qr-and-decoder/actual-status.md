# Blockchain Transaction Process Ledger, Scannable QR & Block Decoder Portal Actual Status

Title: Blockchain Transaction Process Ledger, Scannable QR & Block Decoder Portal
Date: 2026-11-02
Status: P0 Complete
Companion plan: `docs/plans/2026-11-02-blockchain-process-ledger-qr-and-decoder/plan.md`
Companion evidence: `docs/plans/2026-11-02-blockchain-process-ledger-qr-and-decoder/evidence.md`
Companion benchmark: `docs/plans/2026-11-02-blockchain-process-ledger-qr-and-decoder/benchmark.md`

## Purpose

Records verified current repository reality prior to implementing transaction-grade process blocks, ISO-18004 QR code repair, and the Blockchain Cross-Verification & Block/JSON Decoder Portal.

## Scope

Target scope:

- `services/blockchain-ledger-service.js` (QR generator format bits, extended lifecycle actions, case/block lookup, exported dossier cross-verifier, recent blocks feed)
- `server.js` (transaction-grade lifecycle block payloads & duration metrics across trigger/escalate/accept/approaching/arrived/resolved/fake-alarm, 0-media-safe `/api/dispatcher/blockchain/verify`, public/officer `/api/blockchain/lookup`, `/api/blockchain/verify-dossier`, `/api/blockchain/recent`, updated `/api/blockchain/explorer/:ref`)
- `tra-cuu-blockchain.html` & `js/blockchain-verifier-portal.js` & `css/style.css` (new Blockchain Verification & Block/JSON Dossier Decoder web application)
- `js/stealth-sos.js` (lightweight transaction-only default without heavy 5s audio file spam, opt-in `enableAudioRecording` preserved)
- `dispatcher.html`, `js/dispatcher.js`, `index.html`, `cap-phat-the.html`, `sw.js` (transaction process timeline & duration metrics UI, scannable QR pointing to `/tra-cuu-blockchain.html`, cross-portal links, PWA cache bump)
- `playwright/verify-blockchain-process-qr-decoder.mjs` (Docker & Render Staging E2E + OpenCV QR decode + JSON tamper-detection verification)

Out of scope:

- Production deployment on `https://sosvie.site` (strictly untouched; staging target is `https://sos-vietnam-2026.onrender.com/` only)
- Hardware C++ firmware source files outside web gateway compatibility

## Relationship / Impact Evidence

| Unit / File / Surface | File Detail Evidence | Related File Count | Relationship Summary | Impact Note |
|-----------------------|----------------------|--------------------|----------------------|-------------|
| `services/blockchain-ledger-service.js` | `E0-P0A-FD1` | 25 (`inbound=17`, `outbound=8`, `local=111`) | Imported by `server.js` for sealing, QR generation, DePIN card verification, and chain integrity checks | `high` scope warning — preserve all existing exported symbol signatures |
| `server.js` | `E0-P0A-FD2` | 65 (`outbound=65`, `local=155`, `flows=21`) | Central HTTP/SSE gateway serving citizen, dispatcher, DePIN, and blockchain endpoints | `high` scope warning — keep edits strictly scoped to SOS lifecycle sealing & `/api/blockchain/*` |
| `js/stealth-sos.js` | `E0-P0A-FD3` | 3 (`flows=3`, `local=31`) | Imported by `js/app.js` for iOS Fake Call & Blackout Stealth SOS | `high` scope warning — preserve `initStealthSOS` contract and `window.__sosStealthController` |
| `js/dispatcher.js` | `E0-P0A-FD4` | 1 (`dispatcher.html`) | Renders `.bc-security-panel` and `runIntegrityCheckForSelectedIncident` | `medium` scope warning — edit only lines `17479-17845` |
| `dispatcher.html` | `E0-P0A-FD4` | 2 (`js/dispatcher.js`, `css/style.css`) | Command center UI hosting `#bcSecurityPanel` | `low` scope warning |
| `index.html` | `E0-P0A-FD4` | 3 (`js/app.js`, `js/stealth-sos.js`, `css/style.css`) | Citizen SOS portal & navigation dock | `low` scope warning |
| `cap-phat-the.html` | `E0-P0A-FD4` | 1 (`js/depin-card-portal.js`) | E10 DePIN card portal top header | `low` scope warning |
| `sw.js` | `E0-P0A-FD4` | 1 (`index.html`) | PWA Service Worker static asset cache | `high` scope warning — bump `CACHE_NAME` cleanly |
| `css/style.css` | `E0-P0A-FD4` | 2 (`index.html`, `dispatcher.html`) | Shared stylesheet for `.bc-security-panel` & citizen portal | `low` scope warning |

## Current Status Matrix

| Unit | Current State | Required State | Status | Relationship Count | Evidence | Next Plan Decision |
|------|---------------|----------------|--------|--------------------|----------|--------------------|
| `generateQrCodeMatrix` (`services/blockchain-ledger-service.js:2096-2110`) | ISO/IEC 18004 compliant format-bit placement + quiet-zone `margin = 4` + QR Versions 1..10 (`271` bytes); verified `3/3` (`100%`) OpenCV `QRCodeDetector` decode across `49B`, `128B`, and `161B` URLs | ISO/IEC 18004 compliant format-bit placement + QR capacity up to Version 10 (`271` bytes) with 100% camera & OpenCV decode | `correct` | 25 related refs | `E0-P0A-FD1`, `E1-P1A-QR1` | Preserve in `P1-B`..`P3-B` |
| `LIFECYCLE_ACTIONS` & Ledger Query/Dossier Verifier (`services/blockchain-ledger-service.js`) | Exports 9 lifecycle actions (`0_CARD_PROVISION_SEAL`, `1_SOS_TRIGGER`, `2_EVIDENCE_SEAL`, `2B_CASE_ESCALATED`, `3_OFFICER_DISPATCH`, `3A_OFFICER_APPROACHING`, `3B_OFFICER_ARRIVED`, `4_CASE_RESOLVED`, `4B_FAKE_ALARM`), `describeBlockchainActionVi`, `formatDurationSecondsVi`, `buildCaseProcessSummary`, `lookupLedger` (PII-masked public / unmasked officer), `getRecentBlocks`, and `verifyExportedDossier` | 8+ lifecycle actions + `lookupLedger`, `verifyExportedDossier`, `getRecentBlocks`, `buildCaseProcessSummary` | `correct` | 25 related refs | `E0-P0A-FD1`, `E1-P1A-ACT1`, `E1-P1A-VERIFY1` | Consume in `P1-B` |
| SOS Case Lifecycle Block Sealing (`server.js`) | Seals basic trigger/accept/resolved; misses `approaching`, `arrived`, `escalated`, `flag-fake`; lacks `travelTimeSeconds`, `onSceneHandlingSeconds`, `totalCaseDurationSeconds`, `officerRank`, `officerAccount`, `reporterName` | Every state transition seals a complete transaction-grade block with full actor identities, coordinates, and step-by-step elapsed durations | `partial` | 65 related refs | `E0-P0A-FD2`, `E0-P0A-SRC1` | Edit in `P1-B` |
| `POST /api/dispatcher/blockchain/verify` (`server.js:6025-6165`) | Reads wrong properties (`b.payload.actionType`, `latestBlock.hash`, `b.isoTime`); 0-media cases return empty hashes; QR points to raw API instead of decoder portal; `lifecycleBlocks` lacks `payload` for offline re-hashing | Works 100% cleanly with 0 media files (verifies hash-chained transaction blocks), encodes scannable QR to `/tra-cuu-blockchain.html?tx=...`, and exports complete `lifecycleBlocks` + `processSummary` | `wrong` | 65 related refs | `E0-P0A-SRC1` | Edit in `P1-B` |
| Public/Officer Blockchain Lookup & Decoder APIs (`server.js`) | Only `/api/blockchain/status` & `/api/blockchain/explorer/:ref` exist; no `/api/blockchain/lookup`, `/api/blockchain/verify-dossier`, or `/api/blockchain/recent` | Provide `GET /api/blockchain/lookup`, `POST /api/blockchain/verify-dossier`, `GET /api/blockchain/recent` with PII masking for public callers and full fields for authenticated officers | `missing` | 65 related refs | `E0-P0A-SRC3` | Implement in `P1-B` |
| Official Verification & Block Decoder Portal (`tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`) | Does not exist | Dedicated Vietnamese web software for (1) Live Ledger Cross-Check by TxHash/Block/CaseID, (2) Drag-and-drop `.JSON` / Raw Block Decoder + WebCrypto SHA-256 offline re-hash + online server cross-check, (3) Live Recent Blocks Explorer | `missing` | 0 existing | `E0-P0A-SRC3` | Implement in `P2-A` |
| Stealth SOS Media Recording (`js/stealth-sos.js`) | Automatically records & uploads heavy 5s WebM audio chunks every 5s in both Stealth modes | Default to lightweight covert SOS transaction + live GPS telemetry (`enableAudioRecording = false` by default; optional opt-in preserved) | `partial` | 3 related refs | `E0-P0A-FD3`, `E0-P0A-SRC2` | Edit in `P2-B` |
| Dispatcher `.bc-security-panel` & Portal Links (`dispatcher.html`, `js/dispatcher.js`, `index.html`, `cap-phat-the.html`, `sw.js`) | Displays audio-centric wording, lacks process duration breakdown (Response / Travel / Scene Handling / Total), lacks links to `/tra-cuu-blockchain.html` | Displays full Transaction Process Summary (Ai báo, Ai nhận, Giờ báo, Phản ứng, Di chuyển, Xử lý, Tổng thời gian), scannable QR, direct link to `/tra-cuu-blockchain.html`, and updated PWA cache | `partial` | 6 related files | `E0-P0A-FD4`, `E0-P0A-SRC1` | Edit in `P2-B` |

## Status Refresh Log

| Refresh | Date | Repo Basis | Changed Scope | Status Changes | Evidence | Next Phase Update |
|---------|------|------------|---------------|----------------|----------|-------------------|
| R0 | 2026-11-02 | `86b1848` baseline | All P1–P3 surfaces | Initial classification (`wrong`/`partial`/`missing`) | `E0-P0A-USER1`..`E0-P0A-SRC3` | Proceed to `P1-A` unchanged |
| R1 | 2026-11-02 | `P1-A` (`services/blockchain-ledger-service.js`) | `generateQrCodeMatrix`, `LIFECYCLE_ACTIONS`, `BlockchainLedgerService` query/verifier helpers | `wrong`/`partial` -> `correct` | `E1-P1A-ACT1`, `E1-P1A-QR1`, `E1-P1A-VERIFY1`, `E1-P1A-DETECT1` | Proceed to `P1-B` (`server.js`) unchanged |

## Phase Touch Map

| Unit / File / Surface | Plan-Relevant Relationship File | Relationship to Target | Plan Item | Touch Mode | Evidence | Constraint |
|-----------------------|---------------------------------|------------------------|-----------|------------|----------|------------|
| `services/blockchain-ledger-service.js` | `server.js` | consumer | `P1-A` | edit | `E0-P0A-FD1`, `E0-P0A-QR1` | Preserve all existing exports |
| `server.js` | `services/blockchain-ledger-service.js`, `services/security-firewall-middleware.js` | dependency | `P1-B` | edit | `E0-P0A-FD2`, `E0-P0A-SRC1` | Mask PII for unauthenticated public queries |
| `tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js` | `server.js`, `css/style.css` | API consumer / static asset | `P2-A` | edit (create) | `E0-P0A-SRC3` | Zero external CDN script dependencies (CSP `'self'`) |
| `js/stealth-sos.js` | `js/app.js`, `index.html` | consumer | `P2-B` | edit | `E0-P0A-FD3`, `E0-P0A-SRC2` | Keep Fake Call iOS & Blackout Stealth UX intact |
| `dispatcher.html`, `js/dispatcher.js`, `index.html`, `cap-phat-the.html`, `sw.js`, `css/style.css` | `tra-cuu-blockchain.html` | navigation & UI consumer | `P2-B` | edit | `E0-P0A-FD4` | Preserve existing layout and responsive controls |
| `services/runtime-data-store.js`, `services/evidence-storage-service.js` | `services/blockchain-ledger-service.js` | persistence dependency | `P1-A`..`P3-B` | preserve-only | `E0-P0A-FD1` | Already verified on Render Free in `169dd4b` |

## Detailed Findings

### QR Code Matrix Generator (`services/blockchain-ledger-service.js`)
- Current state: `generateQrCodeMatrix` places the 15 BCH format bits with transposed `[row][col]` indices at lines `1318-1326`, causing every QR reader to fail format-mask decoding.
- Required state: Exact ISO/IEC 18004 top-left vertical/horizontal + top-right horizontal + bottom-left vertical format-bit coordinates, verified by `cv2.QRCodeDetector().detectAndDecode()`.
- Classification: `wrong` -> fix in `P1-A`.

### Transaction-Grade Case Process Blocks & Live Audit (`server.js`)
- Current state: Missing intermediate blocks (`approaching`, `arrived`, `escalated`, `flag-fake`), missing process timing metrics, and `POST /api/dispatcher/blockchain/verify` reads mismatched keys (`b.payload.actionType`, `latestBlock.hash`, `b.isoTime`).
- Required state: Every case lifecycle event seals a complete transaction block with actor + timing metadata; `verify` works with 0 media files and exports full verifiable `lifecycleBlocks` + `processSummary`.
- Classification: `partial` / `wrong` -> fix in `P1-B`.

### Blockchain Cross-Verification & Decoder Software (`tra-cuu-blockchain.html`)
- Current state: Missing dedicated user-facing verification & `.json` dossier decoder portal.
- Required state: Full-featured Vietnamese portal supporting live lookup (`TxHash` / `Block #` / `Case ID`), offline + online `.json` dossier decoding & SHA-256 tamper detection, printable Vietnamese case report, and live recent blocks feed.
- Classification: `missing` -> build in `P2-A`.

## Next Phase Status Decisions

| Plan Item | Actual Status Finding | Required Status / Next-Action Update |
|-----------|-----------------------|--------------------------------------|
| `P1-A` | QR format bits transposed + missing ledger lookup/dossier-verify helpers | keep — implement in `services/blockchain-ledger-service.js` |
| `P1-B` | Missing process timing blocks + property bug in `/api/dispatcher/blockchain/verify` + missing lookup/verify-dossier/recent routes | keep — implement in `server.js` |
| `P2-A` | Missing `/tra-cuu-blockchain.html` & `js/blockchain-verifier-portal.js` | keep — implement CSP-clean portal & decoder |
| `P2-B` | Stealth SOS records 5s audio by default + Dispatcher panel lacks process summary & portal links | keep — update `js/stealth-sos.js`, `dispatcher.html`, `js/dispatcher.js`, `index.html`, `cap-phat-the.html`, `sw.js` |

## Implementation Gate

- [x] Target scope is listed in Current Status Matrix.
- [x] Each target unit has a status.
- [x] Each status has evidence IDs.
- [x] Each target file has relationship count evidence from `file-detail` when applicable.
- [x] Phase Touch Map lists plan-relevant relationship files that can affect the current phase/slice.
- [x] Phase Touch Map defines touch mode for every plan-relevant relationship unit that may be affected.
- [x] Correct parts are marked preserve-only.
- [x] Partial, missing, wrong, unbound, and fake-or-stub parts have exact next actions.
- [x] Blockers are recorded, if any (`none`).
- [x] Next phase status assumptions, next action, and work steps have been updated from this status file when needed.
- [x] Status Refresh Log has an R0 baseline row.

## Final P0 Decision

- [x] P0 complete. Next phase can proceed unchanged.

Decision note:

All root causes and sibling surfaces are verified from source and Anvien graph evidence (`E0-P0A-GRAPH1`, `E0-P0A-FD1..FD4`, `E0-P0A-QR1`, `E0-P0A-SRC1..SRC3`). Implementation proceeds starting at `P1-A`.
