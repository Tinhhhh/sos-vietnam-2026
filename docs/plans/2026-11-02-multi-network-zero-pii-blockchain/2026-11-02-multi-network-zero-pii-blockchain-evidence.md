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
- **`E1-P1B-COMMIT1`**: Committed `P1-B` (`server.js` + plan ledgers) on `main` (`12204cc`).

## E2 - P2 Evidence

Matching plan item(s): `P2-A`, `P2-B`

- **`E2-P2A-UI1`**: Added `#bcvNetworkSwitchCard` (`#bcvNetworkSwitchBar` 4-network switcher buttons `842026`, `NDA`, `OTS`, `POLYGON` + `#bcvActiveNetVisibilityBadge` + `#bcvNetworkPrivacyNotice`) and `#bcvGlobalAnchorBox` to `tra-cuu-blockchain.html` with responsive CSS in `css/style.css`; verified via Chromium Playwright (`verify-p2a.mjs`) at both `1440x900` (`overflowDesktop: false`) and `390x844` (`overflowMobile: false`).
- **`E2-P2A-UI2`**: Upgraded `js/blockchain-verifier-portal.js` (`node --check` exit `0`) and verified live toggling across `842026` -> `NDA` -> `OTS` -> `POLYGON` -> `842026` plus Tab 2 `PublicAnchor.json` (`SOSVN-ANCHOR-V1`) verification (`piiLeakCount: 0` across URL, input value, body text, report HTML, and recent blocks table; `consoleErrorsCount: 0`; cleaned `.tmp/p2a-portal-test/`).
- **`E2-P2A-DETECT1`**: Ran `anvien analyze --force` (`scanned=518`, `parsed_code=164`, `failed=0`, `nodes=88020`, `relationships=93896`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` (`risk_level: "critical"` scope warning reviewed; self-contained portal HTML/JS/CSS changes only).
- **`E2-P2A-COMMIT1`**: Committed `P2-A` (`tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, `css/style.css`, and plan ledgers) on `main` (`ee29298`).
- **`E2-P2B-UI1`**: Added `<option value="OTS">` to `#bcNetworkSwitch` and prominent 4-button `#bcNetPillBar` (`#bcPill842026`, `#bcPillNDA`, `#bcPillOTS`, `#bcPillPOLYGON`) inside `#bcSecurityPanel` in `dispatcher.html`, plus cache version bump `?v=20261102_multinet_v3` and `CACHE_NAME = 'sos-vietnam-v2026-11-02-multinet-zeropii-v3'` in `sw.js` (`node --check sw.js` exit `0`).
- **`E2-P2B-UI2`**: Upgraded `js/dispatcher.js` (`node --check js/dispatcher.js` exit `0`) with `normalizeBcNetwork`, `isZeroPiiBcNetwork`, `syncBlockchainNetworkControls`, `setSelectedBlockchainNetwork`, and Zero-PII rendering in `renderBlockchainPanel` + `runIntegrityCheckForSelectedIncident` (eliminating hidden `data-incident-id` leak and adding `#btnDownloadOtsProof` + `#btnDownloadAnchorJson`). Verified via Playwright `.tmp/p2b-dispatcher-test/verify-p2b.mjs`: `ok: true`, `internalHasFullReporter: true`, `internalHasFullOfficer: true`, `piiLeakCount: 0` across `NDA`, `OTS`, and `POLYGON` (`17` forbidden tokens checked against both `innerText` and `innerHTML`), `consoleErrorsCount: 0`, `runtimeExceptionsCount: 0`; cleaned `.tmp/p2b-dispatcher-test/`.
- **`E2-P2B-DETECT1`**: Ran `anvien analyze --force` (`scanned=518`, `parsed_code=164`, `failed=0`, `nodes=88020`, `relationships=93896`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` (`risk_level: "low"`).
- **`E2-P2B-COMMIT1`**: Committed `P2-B` (`dispatcher.html`, `js/dispatcher.js`, `sw.js`, and plan ledgers) on `main`.

## E3 - P3 Evidence

Matching plan item(s): `P3-A`, `P3-B`

- **`E3-P3A-DOCKER1`**: Fixed two internal `842026` officer-view edge cases uncovered during real Docker QA (`server.js`: camelCase `userCCCD` forwarding in `/api/sos/create` + `processSummary.reporter` fallback for `phone`/`userCCCD`/`lat`/`lng` on closing blocks in `renderBlockchainExplorerCertificateHtml`; `js/dispatcher.js`: `_explicitHistorySelectedId` drawer retention when `activeList.length === 0`, cache bumped to `v4` in `dispatcher.html` and `sw.js`). Built real production Docker image `docker build -t sos-vietnam:local .` (`sha256:cb0bb259876b530ded604e6ea2bbe6c33ff2c32f9fd4f72da61328009cf09b68`) and started container `sos-vietnam-multinet-qa` (`ef80b066cd69...`) exposed at `http://127.0.0.1:3412`.
- **`E3-P3A-PW1`**: Executed `node playwright/verify-multi-network-zero-pii-blockchain.mjs --base-url http://127.0.0.1:3412 --report-prefix local` -> **`10/10` assertions `PASS`, `0` failed, `totalZeroPiiLeakCount: 0`** across 19 distinct sensitive tokens on `NDA`, `OTS`, and `POLYGON` across all 3 surfaces (`dispatcher.html` `#bcSecurityPanel`, `/tra-cuu-blockchain.html`, `/api/blockchain/explorer/:ref`), `qrDecodePassCount: 4/4` via OpenCV `QRCodeDetector`, live detached `.ots` v1 proof verified (`SOSVN_Block_105_PublicAnchor.json` `514B` + `.ots` `307B` -> `https://alice.btc.calendar.opentimestamps.org`, plus on-demand Block `#101` `.ots` `272B`), and `consoleErrorsCount: 0`. Reports saved at `Reports/qa/playwright/multi-network-zero-pii-blockchain-local.{json,md}`; visually inspected all screenshots `Reports/qa/playwright/screenshots/multinet-local-01..06*.png` via `read_file`.
- **`E3-P3A-REGR1`**: Executed regression suite `node playwright/verify-blockchain-process-qr-decoder.mjs --base-url http://127.0.0.1:3412 --report-prefix local` against the same `sos-vietnam-multinet-qa` container -> **`12/12` assertions `PASS`, `0` failed** (`Reports/qa/playwright/blockchain-process-qr-decoder-local.{json,md}`). Removed container via `docker rm -f sos-vietnam-multinet-qa` (`0` remaining QA containers).
- **`E3-P3A-DETECT1`**: Refreshed Anvien graph (`anvien analyze --force`) and ran `anvien detect-changes --repo sos-vietnam-2026 --scope all` prior to committing `P3-A`.
- **`E3-P3A-COMMIT1`**: Committed implementation refinements + `P3-A` E2E suite, QA reports, screenshots, and plan ledgers cleanly on `main` (`ce4a4b5`).
- **`E3-P3B-DEPLOY1`**: Pushed `ce4a4b5` to `origin/main` and verified live rollout on `https://sos-vietnam-2026.onrender.com/api/blockchain/status` (`HTTP 200`, `supportedNetworks: ["842026", "NDA", "OTS", "POLYGON"]`, `otsVerificationSiteUrl: "https://opentimestamps.org"`), then opened `https://sos-vietnam-2026.onrender.com/tra-cuu-blockchain.html` in the user's visible browser (`AGENTS.md` Rule 8).
- **`E3-P3B-PW1`**: Executed `node playwright/verify-multi-network-zero-pii-blockchain.mjs --base-url https://sos-vietnam-2026.onrender.com --report-prefix staging` -> **`10/10` assertions `PASS`, `0` failed, `totalZeroPiiLeakCount: 0`** across all 3 surfaces on live Render Staging (`SOS-MVZ9XS1R-501` sealed Blocks `#101`..`#105` and closed cleanly as `resolved`; `txHash = 0xa05620537c53f2bd6ddb3bb2a277c4b36ba4e0a1a5fba70922265aad81c2c5dd`; `SOSVN_Block_105_PublicAnchor.json` `514B` + `.ots` `307B` -> `https://alice.btc.calendar.opentimestamps.org`; legacy Block `#101` on-demand `.ots` `272B`; OpenCV `qrDecodePassCount: 4/4`; `consoleErrorsCount: 0`). Reports saved at `Reports/qa/playwright/multi-network-zero-pii-blockchain-staging.{json,md}` and screenshots `Reports/qa/playwright/screenshots/multinet-staging-01..06*.png` visually inspected via `read_file`.
- **`E3-P3B-DETECT1`**: Ran `anvien analyze --force` (`scanned=523`, `parsed_code=165`, `failed=0`, `nodes=88975`, `relationships=94849`) and `anvien detect-changes --repo sos-vietnam-2026 --scope all` (`risk_level: "low"`).
- **`E3-P3B-COMMIT1`**: Committed `P3-B` Staging QA reports, Staging screenshots, and updated plan ledgers on `main`.

## Closure Evidence

*(To be recorded upon completion of `Pn-A`, `Pn-B`, and `Pn-C`.)*
