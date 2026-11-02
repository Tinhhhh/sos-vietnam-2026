# Multi-Network Zero-PII Blockchain Actual Status

Title: Multi-Network Zero-PII Blockchain
Date: 2026-11-02
Status: P1 Complete (In Progress: P2-A)
Companion plan: `docs/plans/2026-11-02-multi-network-zero-pii-blockchain/2026-11-02-multi-network-zero-pii-blockchain-plan.md`
Companion evidence: `docs/plans/2026-11-02-multi-network-zero-pii-blockchain/2026-11-02-multi-network-zero-pii-blockchain-evidence.md`
Companion benchmark: `docs/plans/2026-11-02-multi-network-zero-pii-blockchain/2026-11-02-multi-network-zero-pii-blockchain-benchmark.md`

## Purpose

This file records the real current state before implementation.

Implementation must not start until the target scope has a completed status row, evidence IDs, and a downstream plan decision.

This file does not replace `evidence.md`. It classifies current state from evidence.

Use exact evidence IDs from `evidence.md`, such as `E0-P0A-SRC1`, not broad section IDs such as `E0` or `E1`.

## Freshness / Refresh Rules

This actual-status file is a living current-state record, not a one-time P0 snapshot.

P0 records the baseline before implementation. After implementation begins, keep the Current Status Matrix updated so the next agent can trust it as the latest repo reality.

## Scope

Target scope:

- `services/blockchain-ledger-service.js` (Multi-network profiles `842026` / `NDA` / `OTS` / `POLYGON`, strict Zero-PII projection, OpenTimestamps `.ots` calendar stamper & binary Merkle verifier, network-aware `lookupLedger` & `getRecentBlocks`)
- `server.js` (Non-blocking background `.ots` stamping in `recordIncidentBlockchainEvent`, `/api/blockchain/ots/:ref`, `/api/blockchain/anchor-doc/:ref`, `/api/blockchain/anchor/:ref`, network-aware ledger routes, and 4-network switcher in `renderBlockchainExplorerCertificateHtml`)
- `tra-cuu-blockchain.html` + `js/blockchain-verifier-portal.js` + `css/style.css` (Prominent 4-Network Switcher Bar `#bcvNetworkSwitchBar` and Internal Full vs International Zero-PII Verification View)
- `dispatcher.html` + `js/dispatcher.js` + `sw.js` (Prominent 4-Network Pill Switcher `#bcNetPillBar` inside `#bcSecurityPanel` with live Full-vs-Zero-PII toggling + PWA cache version bump)
- `playwright/verify-multi-network-zero-pii-blockchain.mjs` + Staging deployment on `https://sos-vietnam-2026.onrender.com/`

Out of scope:

- Production domain `https://sosvie.site` (strictly untouched)
- Heavy raw audio/video storage on blockchain
- Unrelated pre-existing modified/untracked files in workspace

## Relationship / Impact Evidence

| Unit / File / Surface | File Detail Evidence | Related File Count | Relationship Summary | Impact Note |
|-----------------------|----------------------|--------------------|----------------------|-------------|
| `services/blockchain-ledger-service.js` | `E0-P0A-FD1`, `E0-P0A-IMP1` | 3 affected files (`server.js`, `services/blockchain-ledger-service.js`, `services/evidence-storage-service.js`); `inboundRefCount=21`, `outboundRefCount=8`, `linkedFlowCount=39` | Core blockchain ledger engine imported by `server.js` and `services/evidence-storage-service.js` | high scope warning — preserve all existing exports and internal `txHash` formula |
| `server.js` | `E0-P0A-FD2`, `E0-P0A-IMP2` | `outboundRefCount=69`, `localRelationshipCount=158`, `linkedFlowCount=23`; `renderBlockchainExplorerCertificateHtml` `impactedCount=1` | Main HTTP/API server hosting `/api/blockchain/*`, `/api/dispatcher/blockchain/verify`, and `recordIncidentBlockchainEvent` | high scope warning — scope edits strictly to blockchain helper & route handlers |
| `tra-cuu-blockchain.html` | `E0-P0A-FD3` | `localRelationshipCount=0` (HTML shell loading `css/style.css` and `js/blockchain-verifier-portal.js`) | Public & officer blockchain verification + `.JSON` decoder portal HTML | low scope warning |
| `js/blockchain-verifier-portal.js` | `E0-P0A-FD4`, `E0-P0A-IMP3` | 1 affected file (`js/blockchain-verifier-portal.js`), `localRelationshipCount=34`, `linkedFlowCount=11` | Client controller for `/tra-cuu-blockchain.html` | high file risk rating due to DOM unresolved globals, self-contained IIFE |
| `dispatcher.html` | `E0-P0A-FD5` | `localRelationshipCount=0` (HTML markup for `#bcSecurityPanel` at lines `2340-2465`) | Tactical Dispatcher Command Center HTML | low scope warning — edit only inside `#bcSecurityPanel` |
| `js/dispatcher.js` | `E0-P0A-FD6` | Large client script (`getBlockchainSystemConfig`, `initBlockchainSecurityPanel`, `renderBlockchainPanel`, `runIntegrityCheckForSelectedIncident` at lines `17428-17999`) | Dispatcher client controller | medium/high care — edit only the self-contained blockchain panel section (`17428-17999`) |
| `css/style.css` | `E0-P0A-FD7` | `localRelationshipCount=0` (`.bc-security-panel` at lines `9000-9388`, `.bcv-*` at lines `9827-10611`) | Shared stylesheet for Dispatcher blockchain panel and Verification Portal | low scope warning — append scoped `.bcv-net-*` and `.bc-net-pill-*` rules |
| `sw.js` | `E0-P0A-FD8` | `localRelationshipCount=0`, `symbolCount=2` | PWA Service Worker cache manifest | low/medium — bump `CACHE_NAME` only |

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
| `services/blockchain-ledger-service.js` | Exports `BLOCKCHAIN_NETWORK_PROFILES` (`842026`, `NDA`, `OTS`, `POLYGON`), `normalizeNetworkView`, `buildZeroPiiPublicAnchorDocument`, pure-Node binary `.ots` Merkle tree verifier `inspectOtsProofBuffer`, live OpenTimestamps stamper `anchorBlockToOpenTimestamps`, and `networkView` Zero-PII projection across `lookupLedger`, `getRecentBlocks`, and `verifyExportedDossier` | Preserve internal chain & QR/decoder logic; add 4-network profiles, strict Zero-PII public anchor document & network projection (`0` PII), real OpenTimestamps `.ots` stamper + binary Merkle parser, and `networkView` support in `lookupLedger` / `getRecentBlocks` | `correct` | 3 affected files (`inboundRef=21`, `outboundRef=8`) | `E0-P0A-SRC1`, `E0-P0A-FD1`, `E0-P0A-IMP1`, `E0-P0A-OTS1`, `E1-P1A-SRC1`, `E1-P1A-TEST1`, `E1-P1A-TEST2`, `E1-P1A-DETECT1` | completed in `P1-A`; preserve in `P1-B`+ |
| `server.js` (`/api/blockchain/*` & `recordIncidentBlockchainEvent`) | Wires non-blocking `setImmediate` `.ots` stamping on block seal, exposes `GET /api/blockchain/anchor-doc/:ref`, `GET /api/blockchain/ots/:ref`, `POST /api/blockchain/anchor/:ref`, supports `?network=842026|NDA|OTS|POLYGON` across `/recent`, `/lookup`, `/verify-dossier`, `/explorer/:ref`, and `/api/dispatcher/blockchain/verify`, and omits `case=` from external URLs/QRs | Wire non-blocking `.ots` stamping on block seal, add `.ots` & `.anchor.json` download + manual stamp routes, and pass `network` across lookup/recent/explorer/verify | `correct` | `outboundRef=87`, `linkedFlows=23` | `E0-P0A-SRC2`, `E0-P0A-FD2`, `E0-P0A-IMP2`, `E1-P1B-ROUTE1`, `E1-P1B-ROUTE2`, `E1-P1B-DETECT1` | completed in `P1-B`; preserve in `P2`+ |
| `/api/blockchain/explorer/:ref` (`renderBlockchainExplorerCertificateHtml` in `server.js`) | Renders prominent 4-Network Switcher Bar (`#explorerNetworkSwitcher`: `842026` · `NDA` · `OTS` · `POLYGON`) and switches cleanly between Internal Operational Certificate vs International Zero-PII Commitment Certificate (`#explorerGlobalProofBox`) with `.anchor.json` + `.ots` downloads (`0` PII leaks) | Render prominent 4-Network Switcher Bar (`842026` · `NDA` · `OTS` · `POLYGON`) and switch between Internal Certificate vs International Zero-PII Commitment Certificate with `.anchor.json` + `.ots` downloads | `correct` | 1 caller in `server.js` | `E0-P0A-SRC2`, `E0-P0A-IMP2`, `E1-P1B-ROUTE2`, `E1-P1B-DETECT1` | completed in `P1-B`; validate in Docker/Staging E2E (`P3`) |
| `tra-cuu-blockchain.html` + `js/blockchain-verifier-portal.js` + `css/style.css` | Provides Tab 1 Lookup & Tab 2 `.JSON` Decoder + QR verification, but has zero network switcher UI (`#bcvNetworkSwitchBar` missing) and cannot preview/verify International Zero-PII or `.ots` proofs | Add prominent 4-Network Switcher Card `#bcvNetworkSwitchCard` switching both Case Report and Recent Blocks between Internal Operational View and International Zero-PII View (with `.anchor.json` + `.ots` downloads and `opentimestamps.org` link) | `missing` (switcher) / `partial` (portal) | 1 file (`localRel=34`) | `E0-P0A-SRC3`, `E0-P0A-FD3`, `E0-P0A-FD4`, `E0-P0A-FD7`, `E0-P0A-IMP3` | edit `P2-A` |
| `dispatcher.html` (`#bcSecurityPanel`) + `js/dispatcher.js` | Has tiny `<select id="bcNetworkSwitch">` (`842026`, `NDA`, `POLYGON` — missing `OTS`) that is `unbound` to data visibility: changing it only alters `#uiBcEnvBanner` text while `#uiProcessSummaryBox`, `#uiAuditTimeline`, and `#verifyResult` keep showing internal PII | Add prominent 4-network pill bar `#bcNetPillBar` synced with `#bcNetworkSwitch` (`842026`, `NDA`, `OTS`, `POLYGON`) that dynamically switches `#bcSecurityPanel` between `842026` Full 100% Operational Detail and `NDA`/`OTS`/`POLYGON` Zero-PII Commitment + `.ots` proof download | `unbound` / `partial` | Self-contained panel (`dispatcher.html:2340-2465`, `js/dispatcher.js:17428-17999`) | `E0-P0A-SRC4`, `E0-P0A-FD5`, `E0-P0A-FD6` | edit `P2-B` |
| `sw.js` | Precaches `/tra-cuu-blockchain.html`, `/css/style.css`, `/js/blockchain-verifier-portal.js` under `sos-vietnam-v2026-11-02-bc-process-decoder-v2` | Bump `CACHE_NAME` after `P2` UI updates so browsers load updated assets immediately | `correct` (baseline) | 0 related files | `E0-P0A-FD8` | edit `P2-B` |
| `services/evidence-storage-service.js` | Consumes `resolveSystemBlockchainConfig` from `services/blockchain-ledger-service.js` for media hash storage routing | Keep untouched and 100% compatible | `correct` | 2 imported symbols | `E0-P0A-IMP1` | preserve-only |
| `playwright/verify-multi-network-zero-pii-blockchain.mjs` & Render Staging (`https://sos-vietnam-2026.onrender.com/`) | Previous process/QR decoder suite (`verify-blockchain-process-qr-decoder.mjs`) passes, but no automated Zero-PII multi-network & `.ots` proof E2E suite exists yet, and Staging is still on `9cd242b` | Build & pass full Docker E2E suite (`P3-A`) and live Render Staging E2E suite (`P3-B`) | `missing` (new suite) / `partial` (Staging) | Reusable QA runner | `E0-P0A-SRC5` | edit `P3-A`, `P3-B` |

## Status Refresh Log

| Refresh | Date | Repo Basis | Changed Scope | Status Changes | Evidence | Next Phase Update |
|---------|------|------------|----------------|----------------|----------|-------------------|
| R0 | 2026-11-02 | baseline at `9cd242b` before P1 | Full target scope (`services/blockchain-ledger-service.js`, `server.js`, `tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, `dispatcher.html`, `js/dispatcher.js`, `css/style.css`, `sw.js`, `playwright/`) | Initial classification (`partial` / `missing` / `unbound` / `correct`) + verified live OpenTimestamps `POST /digest` protocol (`237` bytes `.ots`) | `E0-P0A-GRAPH1`, `E0-P0A-FD1`..`E0-P0A-FD8`, `E0-P0A-IMP1`..`E0-P0A-IMP3`, `E0-P0A-SRC1`..`E0-P0A-SRC5`, `E0-P0A-OTS1` | Proceed to `P1-A` with Zero-PII `PublicAnchor.json` + `.ots` detached timestamp design so `opentimestamps.org` verification never requires internal PII preimage |
| R1 | 2026-11-02 | post-`P1-A` (`services/blockchain-ledger-service.js`) | `services/blockchain-ledger-service.js` | `partial` -> `correct` (`0` PII leaks across 19 sensitive tokens on `NDA`/`OTS`/`POLYGON`, `307`-byte live `.ots` proof verified & persisted) | `E1-P1A-SRC1`, `E1-P1A-TEST1`, `E1-P1A-TEST2`, `E1-P1A-DETECT1` | Proceed to `P1-B` (`server.js`): wire async `setImmediate` `.ots` anchoring, add `/api/blockchain/anchor-doc/:ref`, `/api/blockchain/ots/:ref`, `/api/blockchain/anchor/:ref`, pass `network` to ledger routes, and add 4-network switcher bar to `/api/blockchain/explorer/:ref` |
| R2 | 2026-11-02 | post-`P1-B` (`server.js`) | `server.js` (`/api/blockchain/*`, `/api/dispatcher/blockchain/verify`, `renderBlockchainExplorerCertificateHtml`) | `partial` -> `correct` (`sosCreateNonBlockingMs: 27`, `autoOtsStampedInBackground: true`, `otsBinaryBytes: 272`, `piiLeaksAcrossAllExternalEndpoints: 0`) | `E1-P1B-ROUTE1`, `E1-P1B-ROUTE2`, `E1-P1B-DETECT1` | Proceed to `P2-A` (`tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, `css/style.css`): build `#bcvNetworkSwitchCard` 4-network switcher and Zero-PII / `.ots` global proof box |

## Phase Touch Map

| Unit / File / Surface | Plan-Relevant Relationship File | Relationship to Target | Plan Item | Touch Mode | Evidence | Constraint |
|-----------------------|---------------------------------|------------------------|-----------|------------|----------|------------|
| `services/blockchain-ledger-service.js` | `services/evidence-storage-service.js` | consumer of `resolveSystemBlockchainConfig` | `P1-A` | preserve-only (consumer) / edit (service) | `E0-P0A-FD1`, `E0-P0A-IMP1` | Preserve all existing exported function names and return fields |
| `services/blockchain-ledger-service.js` | `server.js` | primary API consumer | `P1-A`, `P1-B` | inspect-only in `P1-A`, edit in `P1-B` | `E0-P0A-IMP1`, `E0-P0A-FD2` | Keep `lookupLedger`/`getRecentBlocks` default `networkView = '842026'` backward-compatible |
| `server.js` | `js/blockchain-verifier-portal.js`, `js/dispatcher.js` | frontend HTTP callers | `P1-B` | edit (`server.js` only) | `E0-P0A-SRC2`, `E0-P0A-IMP2` | Scope edits strictly to blockchain routes & explorer HTML helper |
| `tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, `css/style.css` | `server.js` (`/api/blockchain/*`) | API backend | `P2-A` | edit (portal HTML/JS/CSS) | `E0-P0A-FD3`, `E0-P0A-FD4`, `E0-P0A-FD7` | Preserve Tab 2 offline WebCrypto `.JSON` decoder & tamper detector |
| `dispatcher.html`, `js/dispatcher.js`, `sw.js` | `server.js` (`/api/dispatcher/blockchain/verify`) | API backend | `P2-B` | edit (dispatcher blockchain panel & `sw.js`) | `E0-P0A-FD5`, `E0-P0A-FD6`, `E0-P0A-FD8` | Only edit `#bcSecurityPanel` markup/JS (`17428-17999`); do not touch map/WebRTC/dispatch flows |
| `playwright/verify-multi-network-zero-pii-blockchain.mjs` | `playwright/verify-blockchain-process-qr-decoder.mjs` | existing regression test | `P3-A`, `P3-B` | edit (new script) / validate-only (existing script) | `E0-P0A-SRC5` | Run against real built Docker container (`P3-A`) and Render Staging (`P3-B`) |

## Detailed Findings

### 1. Multi-Network Ledger Engine & OpenTimestamps Protocol (`services/blockchain-ledger-service.js`)

Current state:

`services/blockchain-ledger-service.js` computes deterministic SHA-256 `txHash` over internal `payload` (which includes operational fields like `reporterName`, `reporterPhone`, `lat`, `lng`, `officerFullTitle`) and masks phone/CCCD partially for unauthenticated public queries. It has no external/international Zero-PII commitment projection and no global calendar anchoring.

Required state:

```text
1. Define 4 canonical network views:
   - '842026' (SOS Vietnam Internal Operational Chain — Full PII for officers, masked phone/CCCD for public)
   - 'NDA' (NDAChain National Inter-Agency — Zero-PII Commitment View)
   - 'OTS' (Bitcoin Global via OpenTimestamps — Zero-PII Commitment + downloadable .anchor.json & .ots proof)
   - 'POLYGON' (Polygon / Ethereum Global EVM — Zero-PII Commitment + EVM hex calldata)
2. Stamp SHA256(PublicAnchor.json) via HTTPS POST to OpenTimestamps pool calendars and store valid v1 .ots binary proof (31B magic + 0x01 + 0x08 OpSHA256 + 32B digest + calendar ops).
```

Evidence:

- `E0-P0A-SRC1`: Inspected `services/blockchain-ledger-service.js` lines `135-175`, `574-1820`.
- `E0-P0A-OTS1`: Live probe `.tmp/p0-multi-net/test-ots-live.mjs` against `https://a.pool.opentimestamps.org/digest` returned HTTP `200` (`172` calendar operation bytes, `237` total `.ots` bytes) with valid `PendingAttestation` (`https://alice.btc.calendar.opentimestamps.org`).

Relationship and impact:

- Related file count: 3 affected files (`server.js`, `services/blockchain-ledger-service.js`, `services/evidence-storage-service.js`).
- Relationship summary: `inboundRefCount=21`, `outboundRefCount=8`, `linkedFlowCount=39`.
- Impact note: `HIGH` blast-radius warning — keep all existing method signatures backward-compatible.

Classification:

`partial`

Allowed next action:

Add multi-network Zero-PII projection, `.ots` stamper/parser, and `networkView` support in `P1-A`.

Forbidden next action:

Do not alter `computeDeterministicTxHash` or leak internal `payload` preimage into public `.ots` anchor files.

### 2. Server APIs & Block Explorer Certificate (`server.js`)

Current state:

`server.js` seals blocks synchronously in `recordIncidentBlockchainEvent` (`2017-2192`), serves `/api/blockchain/*` (`3258-3426`) and `POST /api/dispatcher/blockchain/verify` (`6282-6481`), and renders `/api/blockchain/explorer/:ref` (`2194-2275`) without any network switcher or `.ots` certificate endpoints.

Required state:

```text
Trigger non-blocking background OpenTimestamps anchoring on block creation; expose GET /api/blockchain/anchor-doc/:ref, GET /api/blockchain/ots/:ref, POST /api/blockchain/anchor/:ref; support ?network=842026|NDA|OTS|POLYGON across ledger endpoints and render a 4-network switcher bar on /api/blockchain/explorer/:ref.
```

Evidence:

- `E0-P0A-SRC2`: Inspected `server.js` lines `2017-2275`, `3258-3426`, `6282-6481`.
- `E0-P0A-FD2`, `E0-P0A-IMP2`: Anvien `file-detail` on `server.js` and `impact` on `renderBlockchainExplorerCertificateHtml` (`impactedCount=1`).

Relationship and impact:

- Related file count: `outboundRefCount=69`, `linkedFlowCount=23`.
- Relationship summary: Central HTTP router; `renderBlockchainExplorerCertificateHtml` is only called at `server.js:3423`.
- Impact note: `HIGH` file risk — keep edits strictly confined to blockchain functions/routes.

Classification:

`partial`

Allowed next action:

Implement non-blocking `.ots` hook, `.ots`/`.anchor.json` endpoints, and 4-network explorer certificate UI in `P1-B`.

Forbidden next action:

Never `await` external calendar HTTP calls synchronously inside `/api/sos` incident creation.

### 3. Blockchain Verification & Decoder Portal (`tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, `css/style.css`)

Current state:

Has Tab 1 Lookup and Tab 2 `.JSON` Decoder, but no network switcher bar (`#bcvNetworkSwitchBar` is completely missing) and no UI for viewing Zero-PII commitments or downloading `.ots` proofs for `https://opentimestamps.org`.

Required state:

```text
Prominent 4-Network Switcher Card at top of portal allowing instant toggle between SOS Internal (842026), National NDAChain (NDA), Global Bitcoin OpenTimestamps (OTS), and Global Polygon EVM (POLYGON), dynamically updating both Case Report and Recent Blocks table.
```

Evidence:

- `E0-P0A-SRC3`: Read `tra-cuu-blockchain.html` (`1-182`) and `js/blockchain-verifier-portal.js` (`1-886`).
- `E0-P0A-FD3`, `E0-P0A-FD4`, `E0-P0A-FD7`, `E0-P0A-IMP3`: Anvien `file-detail` and `impact` outputs.

Relationship and impact:

- Related file count: 1 self-contained JS controller (`localRelationshipCount=34`).
- Relationship summary: Standalone portal page.
- Impact note: Preserve Tab 2 WebCrypto SHA-256 `.JSON` verification & tamper detection.

Classification:

`missing` (network switcher) / `partial` (portal)

Allowed next action:

Implement `#bcvNetworkSwitchCard` and Zero-PII / `.ots` verification panel in `P2-A`.

Forbidden next action:

Do not display any citizen/officer/GPS PII when `NDA`, `OTS`, or `POLYGON` network mode is active.

### 4. Dispatcher Blockchain Security Panel (`dispatcher.html`, `js/dispatcher.js`, `sw.js`)

Current state:

`dispatcher.html:2353` has `<select id="bcNetworkSwitch">` with 3 options (`842026`, `NDA`, `POLYGON`), and `js/dispatcher.js:17464-17470` only changes the `#uiBcEnvBanner` text when switched — `#uiProcessSummaryBox`, `#uiAuditTimeline`, and `#verifyResult` still show full internal data regardless of selected network.

Required state:

```text
Add prominent 4-Network Pill Switcher (#bcNetPillBar) synced with #bcNetworkSwitch (including OTS) so switching networks inside #bcSecurityPanel immediately toggles between Full 100% Internal Operational View (842026) and Zero-PII External Commitment View (NDA / OTS / POLYGON) with .ots proof download.
```

Evidence:

- `E0-P0A-SRC4`: Read `dispatcher.html` (`2340-2465`) and `js/dispatcher.js` (`17428-17999`).
- `E0-P0A-FD5`, `E0-P0A-FD6`, `E0-P0A-FD8`: Anvien `file-detail` checks.

Relationship and impact:

- Related file count: Confined to `#bcSecurityPanel` DOM and `js/dispatcher.js:17428-17999`.
- Relationship summary: Self-contained drawer section in Dispatcher UI.
- Impact note: Keep `#bcNetworkSwitch` `<select>` synchronized so any existing DOM queries continue working.

Classification:

`unbound` / `partial`

Allowed next action:

Bind network selection to live Full-vs-Zero-PII panel rendering and bump `sw.js` cache in `P2-B`.

Forbidden next action:

Do not alter incident acceptance, map markers, or WebRTC logic outside `#bcSecurityPanel`.

## Next Phase Status Decisions

| Plan Item | Actual Status Finding | Required Status / Next-Action Update |
|-----------|-----------------------|--------------------------------------|
| `P1-A` | Stamp `SHA256(PublicAnchor.json)` rather than raw `txHash` bytes so external verifiers on `opentimestamps.org` can verify `.anchor.json` + `.ots` with zero internal PII exposure | keep & enforce `PublicAnchor.json` detached `.ots` design |
| `P1-B` | Older blocks (such as `#101`) predate `.ots` stamping | keep on-demand `.ots` stamping in `GET /api/blockchain/ots/:ref` & `?network=OTS` lookup |
| `P2-A` | `/tra-cuu-blockchain.html` lacks any network switcher | implement `#bcvNetworkSwitchCard` above tabs/report |
| `P2-B` | `#bcNetworkSwitch` in `dispatcher.html` is tiny and unbound to data view | add prominent `#bcNetPillBar` synced with `#bcNetworkSwitch` and bind to Full-vs-Zero-PII render |
| `P3-A` / `P3-B` | Need strict automated Zero-PII substring audit + OpenCV QR + `.ots` verification on Docker & Render Staging | execute `P3-A` on Docker local first, then `P3-B` on `https://sos-vietnam-2026.onrender.com/` |

## Implementation Gate

- [x] Target scope is listed in Current Status Matrix.
- [x] Each target unit has a status.
- [x] Each status has evidence IDs.
- [x] Each target file has relationship count evidence from `file-detail` when applicable.
- [x] Phase Touch Map lists plan-relevant relationship files that can affect the current phase/slice.
- [x] Phase Touch Map defines touch mode for every plan-relevant relationship unit that may be affected.
- [x] Correct parts are marked preserve-only.
- [x] Partial, missing, wrong, unbound, and fake-or-stub parts have exact next actions.
- [x] Blockers are recorded, if any (`0` blockers).
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

`P0` đã hoàn tất đầy đủ bằng chứng mã nguồn, đồ thị phụ thuộc Anvien, và thử nghiệm trực tiếp giao thức nhị phân `OpenTimestamps` (`237` bytes `.ots`). Sẵn sàng thực thi tuần tự từ `P1-A`.
