# Multi-Network Zero-PII Blockchain Evidence Ledger

## Metadata

- Date: `2026-11-02`
- Plan: `docs/plans/2026-11-02-multi-network-zero-pii-blockchain/2026-11-02-multi-network-zero-pii-blockchain-plan.md`
- Evidence: `docs/plans/2026-11-02-multi-network-zero-pii-blockchain/2026-11-02-multi-network-zero-pii-blockchain-evidence.md`
- Benchmark: `docs/plans/2026-11-02-multi-network-zero-pii-blockchain/2026-11-02-multi-network-zero-pii-blockchain-benchmark.md`
- Actual status: `docs/plans/2026-11-02-multi-network-zero-pii-blockchain/2026-11-02-multi-network-zero-pii-blockchain-actual-status.md`

## Evidence Rules

The evidence file explains why the work is known to be correct.

### Evidence ID Naming

Format: `E<phase>-<item>-<kind><n>`

- `GRAPH`: Anvien `analyze` / graph health refresh
- `FD`: Anvien `file-detail` inspection
- `IMP`: Anvien `impact` blast-radius analysis
- `SRC`: Direct source-of-truth inspection
- `OTS`: Live OpenTimestamps protocol verification
- `TEST` / `ROUTE` / `UI` / `DOCKER` / `PW` / `REGR` / `DEPLOY`: Implementation & runtime validation evidence
- `DETECT`: Pre-commit `anvien detect-changes` verification
- `COMMIT`: Git commit trace

## E0 - P0 Evidence

Matching plan item(s): `P0-A`

- **`E0-P0A-GRAPH1`**: Ran `anvien analyze --force` at repo root (`c:\Users\dienv\Desktop\sos_vietnam_2026_web_hosting`), exit `0` (`scanned=514`, `parsed_code=164`, `failed=0`, `nodes=86649`, `relationships=92429`, `repo=sos-vietnam-2026`, `commit=9cd242b`).
- **`E0-P0A-FD1`..`E0-P0A-FD8`**: Ran `anvien file-detail <path> --repo sos-vietnam-2026 --json` into `.tmp/p0-multi-net/fd_*.json`:
  - `E0-P0A-FD1` (`services/blockchain-ledger-service.js`): `symbolCount=456`, `exportedSymbolCount=21`, `inboundRefCount=21`, `outboundRefCount=8`, `localRelationshipCount=156`, `linkedFlowCount=39`, `risk=high`.
  - `E0-P0A-FD2` (`server.js`): `symbolCount=1777`, `outboundRefCount=69`, `localRelationshipCount=158`, `linkedFlowCount=23`, `risk=high`.
  - `E0-P0A-FD3` (`tra-cuu-blockchain.html`): `parseStatus=parsed`, `localRelationshipCount=0`, `risk=low`.
  - `E0-P0A-FD4` (`js/blockchain-verifier-portal.js`): `symbolCount=160`, `localRelationshipCount=34`, `linkedFlowCount=11`, `risk=high` (DOM browser globals).
  - `E0-P0A-FD5` (`dispatcher.html`): `parseStatus=parsed`, `localRelationshipCount=0`, `risk=low`.
  - `E0-P0A-FD6` (`js/dispatcher.js`): Inspected directly (`lines 17428-17999`) because file size exceeds Anvien JS parser threshold (`file not in graph`), confirming self-contained blockchain panel functions (`getBlockchainSystemConfig`, `initBlockchainSecurityPanel`, `renderBlockchainPanel`, `runIntegrityCheckForSelectedIncident`).
  - `E0-P0A-FD7` (`css/style.css`): `parseStatus=parsed`, `localRelationshipCount=0`, `risk=low`.
  - `E0-P0A-FD8` (`sw.js`): `symbolCount=2`, `localRelationshipCount=0`, `CACHE_NAME = 'sos-vietnam-v2026-11-02-bc-process-decoder-v2'`.
- **`E0-P0A-IMP1`..`E0-P0A-IMP3`**: Ran upstream blast-radius analysis:
  - `E0-P0A-IMP1`: `anvien impact file services/blockchain-ledger-service.js --repo sos-vietnam-2026 --direction upstream` -> `affectedFiles`: `server.js` (`6` symbols), `services/blockchain-ledger-service.js` (`37` symbols), `services/evidence-storage-service.js` (`2` symbols — preserve-only).
  - `E0-P0A-IMP2`: `anvien impact symbol renderBlockchainExplorerCertificateHtml --repo sos-vietnam-2026 --direction upstream` -> `impactedCount=1` (`server.js:3423`), `processes_affected=4`.
  - `E0-P0A-IMP3`: `anvien impact file js/blockchain-verifier-portal.js --repo sos-vietnam-2026 --direction upstream` -> `affectedFiles`: `js/blockchain-verifier-portal.js` (`10` internal symbols, `0` external dependents).
- **`E0-P0A-SRC1`..`E0-P0A-SRC5`**: Direct source inspection:
  - `E0-P0A-SRC1`: `services/blockchain-ledger-service.js` (`135-175`, `574-1820`) — confirmed internal SHA-256 chain and partial public masking, no external Zero-PII projection or `.ots` anchoring yet.
  - `E0-P0A-SRC2`: `server.js` (`2017-2275`, `3258-3426`, `6282-6481`) — confirmed `renderBlockchainExplorerCertificateHtml` has no network switcher and `/api/blockchain/*` lacks `network` view routing and `.ots` endpoints.
  - `E0-P0A-SRC3`: `tra-cuu-blockchain.html` (`1-182`) & `js/blockchain-verifier-portal.js` (`1-886`) — confirmed `0` network switcher controls exist on the portal.
  - `E0-P0A-SRC4`: `dispatcher.html` (`2340-2465`) & `js/dispatcher.js` (`17450-17525`) — confirmed `#bcNetworkSwitch` only mutates `#uiBcEnvBanner` text without changing `#uiProcessSummaryBox`, `#uiAuditTimeline`, or `#verifyResult`.
  - `E0-P0A-SRC5`: `playwright/verify-blockchain-process-qr-decoder.mjs` (`1-80`) — confirmed OpenCV `QRCodeDetector` + Docker/Staging `--base-url` harness pattern.
- **`E0-P0A-OTS1`**: Executed `.tmp/p0-multi-net/test-ots-live.mjs` against `https://a.pool.opentimestamps.org/digest` with a 32-byte `SHA-256` digest of a sample Zero-PII `SOSVN-ANCHOR-V1` JSON document -> HTTP `200`, `172` calendar proof bytes (`237` total `.ots` detached file bytes with `HEADER_MAGIC` + `0x01` + `0x08` `OpSHA256`), containing valid `PendingAttestation` tag `83dfe30d2ef90c8e` pointing to `https://alice.btc.calendar.opentimestamps.org`.

## E1 - P1 Evidence

Matching plan item(s): `P1-A`, `P1-B`

- **`E1-P1A-SRC1`**: Implemented `BLOCKCHAIN_NETWORK_PROFILES`, `normalizeNetworkView`, `isZeroPiiNetworkView`, `computeCaseCommitmentHash`, `buildZeroPiiPublicAnchorDocument`, `inspectOtsProofBuffer`, `anchorBlockToOpenTimestamps`, `buildExternalAnchorSummary`, and `networkView` Zero-PII projection across `sanitizeBlockForView`, `describeBlockStepVi`, `buildCaseProcessSummary`, `lookupLedger`, `getRecentBlocks`, and `verifyExportedDossier` in `services/blockchain-ledger-service.js`; `node --check services/blockchain-ledger-service.js` exited `0`.
- **`E1-P1A-TEST1`**: Executed isolated Zero-PII audit `.tmp/p1a-ledger-test/verify-p1a.mjs` (`SOS_RUNTIME_DATA_DIR=.tmp/p1a-ledger-test/runtime-data`) sealing a 4-block rescue case containing `19` distinct sensitive PII tokens (citizen name, raw/masked phone, raw/masked CCCD, card UID, exact `lat`/`lng`, street/ward address, officer rank/name/account/phone, station name/address, IP, notes). Verified `842026` (`includeRawPii: true`) returns 100% full PII, while `NDA`, `OTS`, and `POLYGON` return `0` occurrences (`piiLeaksCount: 0`) across `lookupLedger`, `getRecentBlocks`, `PublicAnchor.json`, and `verifyExportedDossier`, while preserving exact SLA stage durations (`42s`, `210s`, `720s`).
- **`E1-P1A-TEST2`**: Live OpenTimestamps stamping test inside `verify-p1a.mjs` (`anchorBlockToOpenTimestamps`) returned `ok: true` in `2389ms`, producing a valid `307`-byte detached `.ots` v1 proof (`calendarServerUri: "https://alice.btc.calendar.opentimestamps.org"`, `anchorDigestHex: "0x026d3c775aac75e662945ba561778044c7505333e757c31db3476d8da47f5bb4"`) and reloading `cached: true` from encrypted `blockchain-ledger.json`; `.tmp/p1a-ledger-test/` cleaned up immediately after verification.
- **`E1-P1A-DETECT1`**: Ran `anvien analyze --force` (`nodes=87268`, `relationships=93086`, `failed=0`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` (`risk_level: "critical"` scope warning reviewed; all existing exports and internal `txHash` formulas preserved 100%).
- **`E1-P1A-COMMIT1`**: Committed `P1-A` (`services/blockchain-ledger-service.js` + plan ledgers) on `main` (`44b69e0`).
- **`E1-P1B-ROUTE1`**: Wired non-blocking `setImmediate(() => blockchainLedgerService.anchorBlockToOpenTimestamps(receipt.blockNumber).catch(...))` inside `recordIncidentBlockchainEvent` (`server.js`) and validated via isolated HTTP runtime `.tmp/p1b-server-test/verify-p1b.mjs` on port `3489`: `POST /api/sos/create` completed in `27ms` total (`0ms` synchronous calendar wait) and `autoOtsStampedInBackground: true` persisted a `272`-byte `.ots` proof to the ledger.
- **`E1-P1B-ROUTE2`**: Implemented `GET /api/blockchain/anchor-doc/:ref`, `GET /api/blockchain/ots/:ref`, `POST /api/blockchain/anchor/:ref`, upgraded `/api/blockchain/recent`, `/api/blockchain/lookup`, `/api/blockchain/verify-dossier`, `POST /api/dispatcher/blockchain/verify`, and upgraded `renderBlockchainExplorerCertificateHtml` (`/api/blockchain/explorer/:ref`) with 4-network `#explorerNetworkSwitcher` + `#explorerGlobalProofBox`. Verified `node --check server.js` (exit `0`) and ran HTTP audit across `12` sensitive PII tokens -> `piiLeaksAcrossAllExternalEndpoints: 0` across JSON, HTML, URLs, and QR codes on `NDA`, `OTS`, and `POLYGON`, with `SHA256(anchor-doc)` (`512` bytes) matching `.ots` (`272` bytes) 100%; cleaned `.tmp/p1b-server-test/` immediately after test.
- **`E1-P1B-DETECT1`**: Ran `anvien analyze --force` (`scanned=518`, `parsed_code=164`, `failed=0`, `nodes=87643`, `relationships=93491`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` (`risk_level: "high"` scope warning reviewed; edits strictly scoped to blockchain helper and route handlers in `server.js`).
- **`E1-P1B-COMMIT1`**: Committed `P1-B` (`server.js` + plan ledgers) on `main`.

## E2 - P2 Evidence

Matching plan item(s): `P2-A`, `P2-B`

*(To be recorded upon completion of `P2-A` and `P2-B`.)*

## E3 - P3 Evidence

Matching plan item(s): `P3-A`, `P3-B`

*(To be recorded upon completion of `P3-A` and `P3-B`.)*

## Closure Evidence

*(To be recorded upon completion of `Pn-A`, `Pn-B`, and `Pn-C`.)*
