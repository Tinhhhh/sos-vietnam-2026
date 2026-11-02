# Supervisor Report: Multi-Network Tiered Visibility, Strict Zero-PII & Global OpenTimestamps (.OTS) Blockchain

Verdict: PASS

## Metadata
- Report file: `Reports/qa/rp_supervisor_261102_201500_by_antigravity_multi_network_zero_pii_blockchain.md`
- Review time: `261102 201500 +07:00`
- Reviewer: `antigravity`
- Repo/project: `sos-vietnam-2026` (`c:/Users/dienv/Desktop/sos_vietnam_2026_web_hosting`)
- Scope reviewed: Commit window `44b69e0..b617730` (`P1-A`, `P1-B`, `P2-A`, `P2-B`, `P3-A`, `P3-B`) and plan suite `docs/plans/2026-11-02-multi-network-zero-pii-blockchain/`
- Claim reviewed: Multi-Network Tiered Visibility (`842026` · `NDA` · `OTS` · `POLYGON`), Strict Zero-PII Projection (`0` PII leaks on external networks), Prominent 4-Network Switcher across all 3 UI surfaces (`dispatcher.html` `#bcSecurityPanel`, `/tra-cuu-blockchain.html`, `/api/blockchain/explorer/:ref`), and Real Bitcoin `OpenTimestamps` (`.ots`) Detached Global Anchoring are implemented, regression-clean, and verified live on both real Docker (`sos-vietnam:local`) and Render Staging (`https://sos-vietnam-2026.onrender.com/`) without modifying production `https://sosvie.site`.
- Authority used:
  1. Latest user instruction (`"em hãy thực hiện đi làm sao không lộ lọt thông tin là được nhé và cái phần chuyển đổi qua lại giữa các mạng để xem chưa thấy và ở mạng nội bộ chúng ta sẽ coi được full còn ở mạng quốc tế thì coi được nhưng không chi tiết rõ như chúng ta em thấy sao oke không ? nếu được hãy fix giúp anh"`, plus Staging-only deployment constraint `https://sos-vietnam-2026.onrender.com/`).
  2. Repository rules (`AGENTS.md`).
  3. Active plan & acceptance criteria (`docs/plans/2026-11-02-multi-network-zero-pii-blockchain/2026-11-02-multi-network-zero-pii-blockchain-plan.md`).
- Related artifacts:
  - Commits: `44b69e0`, `12204cc`, `ee29298`, `290112b`, `ce4a4b5`, `b617730`
  - Docker E2E reports: `Reports/qa/playwright/multi-network-zero-pii-blockchain-local.json`, `Reports/qa/playwright/multi-network-zero-pii-blockchain-local.md`, `Reports/qa/playwright/blockchain-process-qr-decoder-local.json`
  - Live Render Staging E2E reports: `Reports/qa/playwright/multi-network-zero-pii-blockchain-staging.json`, `Reports/qa/playwright/multi-network-zero-pii-blockchain-staging.md`
  - Visual evidence: `Reports/qa/playwright/screenshots/multinet-local-01..06*.png`, `Reports/qa/playwright/screenshots/multinet-staging-01..06*.png`

## Executive Summary
- Problem: External/global blockchain verification previously had no multi-network switcher on `/tra-cuu-blockchain.html` or `/api/blockchain/explorer/:ref`, an unbound `<select id="bcNetworkSwitch">` on `dispatcher.html`, no strict Zero-PII cryptographic commitment layer separating internal operational PII from external views, and no verifiable global blockchain calendar proof (`.ots`).
- Decision: `PASS`. Direct source inspection across all 9 touched files, fresh Anvien semantic graph analysis (`nodes=88975`, `relationships=94849`, `failed=0`), real built Docker container E2E + regression QA (`10/10 PASS` + `12/12 PASS`), and live Render Staging E2E QA (`10/10 PASS`, `totalZeroPiiLeakCount=0`, `qrDecodePassCount=4/4`, `307B`/`272B` detached `.ots` v1 Merkle proofs verified against `https://alice.btc.calendar.opentimestamps.org`) prove every acceptance criterion and close the Zero-PII invariant across all API, DOM, URL, QR, and downloadable file surfaces.
- Required outcome: `accepted`

## Source-Level Clearance Notes
- `services/blockchain-ledger-service.js`: `clear` - `services/blockchain-ledger-service.js:119-219` defines `OTS_HEADER_MAGIC`, `OTS_CALENDAR_ENDPOINTS`, `normalizeNetworkView`, `isZeroPiiNetworkView`, `computeCaseCommitmentHash`, and `buildZeroPiiPublicAnchorDocument` (`protocol: 'SOSVN-ANCHOR-V1'` containing zero PII keys); `services/blockchain-ledger-service.js:1575-1634` (`sanitizeBlockForView`), `1636-1709` (`describeBlockStepVi`), `1994-2061` (`buildCaseProcessSummary`), `2143-2272` (`lookupLedger`), `2274-2324` (`getRecentBlocks`), and `2326-2608` (`verifyExportedDossier`) enforce strict Zero-PII projection whenever `networkView !== '842026'` while preserving 100% full operational PII for authenticated officers on `842026` and preserving internal `computeDeterministicTxHash` compatibility.
- `server.js`: `clear` - `server.js:2212-2218` triggers non-blocking `setImmediate(() => blockchainLedgerService.anchorBlockToOpenTimestamps(receipt.blockNumber).catch(...))` with `0ms` synchronous SOS overhead; `server.js:2240-2274` (`buildBlockchainNetworkUrls`) strips `case=` from external URLs/QR payloads when `zeroPii` is `true`; `server.js:2276-2511` (`renderBlockchainExplorerCertificateHtml`) renders `#explorerNetworkSwitcher` (4 tabs) + `#explorerGlobalProofBox` with zero PII on `NDA`/`OTS`/`POLYGON` and `processSummary.reporter` fallback for full officer detail on `842026`; `server.js:3499-3828` and `6685-6974` wire `network` across `/recent`, `/lookup`, `/verify-dossier`, `/anchor-doc/:ref`, `/ots/:ref`, `/anchor/:ref`, `/explorer/:ref`, and `POST /api/dispatcher/blockchain/verify` (including `2.2-ZERO-PII-EXTERNAL-DOSSIER` projection at `6835-6874` and top-level nullification of `incidentId`/`hardwareSecurity`/`downloadUrl`/`primaryFileName` at `6936-6966`).
- `tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, `css/style.css`: `clear` - `tra-cuu-blockchain.html:37-79` and `177` mount `#bcvNetworkSwitchCard` (`#bcvNetworkSwitchBar` with 4 buttons `842026`, `NDA`, `OTS`, `POLYGON`) and `#bcvGlobalAnchorBox`; `js/blockchain-verifier-portal.js:30-230` and `235-265` synchronize URL `?network=`, rewrite raw `SOS-...` input values to `txHash`/`caseCommitmentHash` when entering external networks (`196-202`), render Zero-PII 6-card process summaries + `.anchor.json`/`.ots` downloads + `https://opentimestamps.org` instructions, and verify detached `SOSVN-ANCHOR-V1` `PublicAnchor.json` files in Tab 2; `css/style.css:10600-10875` styles responsive desktop/mobile layouts with zero horizontal overflow.
- `dispatcher.html`, `js/dispatcher.js`, `sw.js`: `clear` - `dispatcher.html:2353-2378` adds `<option value="OTS">` and prominent 4-pill `#bcNetPillBar` inside `#bcSecurityPanel`; `js/dispatcher.js:17462-18135` synchronizes `#bcNetPillBar` and `#bcNetworkSwitch` two-way, toggles `#uiProcessSummaryBox`, `#uiHwMac`/`#uiCardBlockInfo`, `#uiStealthEvidenceList` (hiding media players and deleting `dataset.incidentId` at `17859-17863`), `#uiAuditTimeline`, and `#verifyResult` (`#btnDownloadOtsProof` + `#btnDownloadAnchorJson` + Zero-PII JSON export) without overwriting cached internal `processSummary` (`18035-18038`); `sw.js:2` bumps `CACHE_NAME` to `'sos-vietnam-v2026-11-02-multinet-zeropii-v4'`.
- `playwright/verify-multi-network-zero-pii-blockchain.mjs`: `clear` - Reusable E2E harness supporting both `--base-url http://127.0.0.1:3412 --report-prefix local` and `--base-url https://sos-vietnam-2026.onrender.com --report-prefix staging`, auditing 19 distinct seeded PII tokens across APIs, `innerText`, `innerHTML`, URLs, QR payloads, and exported JSON files, verifying `.ots` binary proofs + SHA-256 digests, decoding QRs via OpenCV `QRCodeDetector`, and closing test SOS incidents cleanly as `resolved`.

## Evidence Checked
Passed:
- Fresh Anvien graph & change detection (`E3-P3B-DETECT1`): `anvien analyze --force` exited `0` (`scanned=523`, `parsed_code=165`, `failed=0`, `nodes=88975`, `relationships=94849`); `anvien detect-changes --repo sos-vietnam-2026 --scope all` exited `0` (`risk_level: "low"`).
- Real Docker build & container runtime E2E (`E3-P3A-DOCKER1`, `E3-P3A-PW1`, `E3-P3A-REGR1`): Built `sos-vietnam:local` (`sha256:cb0bb259876b530ded604e6ea2bbe6c33ff2c32f9fd4f72da61328009cf09b68`), ran `sos-vietnam-multinet-qa` on `http://127.0.0.1:3412` -> `verify-multi-network-zero-pii-blockchain.mjs` passed `10/10` (`failed: 0`, `totalZeroPiiLeakCount: 0`, `qrDecodePassCount: 4/4`, `.ots` `307B`/`272B` verified) and regression `verify-blockchain-process-qr-decoder.mjs` passed `12/12` (`failed: 0`).
- Live Render Staging deployment & E2E (`E3-P3B-DEPLOY1`, `E3-P3B-PW1`): Deployed `ce4a4b5` to `https://sos-vietnam-2026.onrender.com/`, opened user-visible browser, and ran `node playwright/verify-multi-network-zero-pii-blockchain.mjs --base-url https://sos-vietnam-2026.onrender.com --report-prefix staging` -> `10/10 PASS` (`failed: 0`, `totalZeroPiiLeakCount: 0`, `qrDecodePassCount: 4/4`, `SOS-MVZ9XS1R-501` closed as `resolved`, `SOSVN_Block_105_PublicAnchor.json` `514B` + `.ots` `307B` stamped on `https://alice.btc.calendar.opentimestamps.org`, legacy Block `#101` on-demand `.ots` `272B` verified, `consoleErrorsCount: 0`).
- Visual screenshot inspection: All 6 local screenshots (`multinet-local-01..06*.png`) and all 6 live Staging screenshots (`multinet-staging-01..06*.png`) inspected directly via `read_file` — crisp rendering, active 4-network switchers, full officer details on `842026`, and `🔒` Zero-PII redaction + `.ots` proof actions on `OTS`.
- Verification freshness: `fresh` - Re-anchored directly against current HEAD `b617730`, current source files, fresh `anvien analyze --force` (`2026-11-02T20:11:40+07:00`), and live Render Staging E2E output (`2026-11-02T13:07:50.526Z`).

Failed:
- None (`0` failed checks).
- Verification freshness: `fresh` - Confirmed `failed: 0` across both `multi-network-zero-pii-blockchain-local.json` and `multi-network-zero-pii-blockchain-staging.json`.

Not run:
- Production `https://sosvie.site` deployment/testing: Intentionally not run per explicit user instruction and plan non-goal (`Deploy and test ONLY on https://sos-vietnam-2026.onrender.com/; NEVER touch production https://sosvie.site`).

## Invariant Closure
- affected invariant: Strict Zero-PII External Boundary & Tiered Multi-Network Visibility (`network === '842026'` shows Full PII to authenticated officers and masked phone/CCCD to public viewers; `network` in `['NDA', 'OTS', 'POLYGON']` exposes `0` citizen/officer/GPS/IP/card/caseId PII tokens across JSON APIs, HTML/DOM attributes, URL query strings, QR payloads, and downloadable `.anchor.json`/`.ots`/`.json` artifacts, while preserving cryptographic hashes and SLA stage durations).
- sibling surfaces checked:
  - `GET /api/blockchain/status` (`server.js:3494-3497`)
  - `GET /api/blockchain/recent` (`server.js:3499-3530`, `services/blockchain-ledger-service.js:2274-2324`)
  - `GET /api/blockchain/lookup` (`server.js:3532-3599`, `services/blockchain-ledger-service.js:2143-2272`)
  - `POST /api/blockchain/verify-dossier` (`server.js:3601-3661`, `services/blockchain-ledger-service.js:2326-2608`)
  - `GET /api/blockchain/anchor-doc/:ref`, `GET /api/blockchain/ots/:ref`, `POST /api/blockchain/anchor/:ref` (`server.js:3663-3743`)
  - `GET /api/blockchain/explorer/:ref` HTML & JSON modes (`server.js:2276-2511`, `3745-3828`)
  - `POST /api/dispatcher/blockchain/verify` (`server.js:6685-6974`)
  - `dispatcher.html` `#bcSecurityPanel` + `js/dispatcher.js` (`17462-18135`)
  - `tra-cuu-blockchain.html` + `js/blockchain-verifier-portal.js` (`1-1493`)
  - Preserve-only consumer `services/evidence-storage-service.js` (`resolveSystemBlockchainConfig` backward-compatible)
- residual unverified same-invariant surfaces: `none`

## Overall Evaluation
The implementation cleanly separates the internal encrypted operational ledger (`842026`) from the external Zero-PII cryptographic commitment layer (`SOSVN-ANCHOR-V1`) across `NDA`, `OTS`, and `POLYGON`. Detached SHA-256 stamping onto public Bitcoin `OpenTimestamps` calendars provides genuine, third-party-verifiable global proof on `https://opentimestamps.org` with `0ms` synchronous SOS latency impact and `0%` PII exposure. Source quality, runtime evidence on both Docker and live Render Staging, and regression coverage meet all acceptance requirements for `PASS`.
