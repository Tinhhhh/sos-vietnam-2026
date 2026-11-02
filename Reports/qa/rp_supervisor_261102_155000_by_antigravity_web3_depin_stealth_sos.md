# Supervisor Report: Hybrid Web3 Blockchain Ledger, Hardware DePIN v2.1 Portal & Citizen Emergency Camouflage (Stealth SOS)

Verdict: PASS

## Metadata
- Report file: `Reports/qa/rp_supervisor_261102_155000_by_antigravity_web3_depin_stealth_sos.md`
- Review time: `261102 155000 +07:00`
- Reviewer: `antigravity`
- Repo/project: `sos-vietnam-2026` (`c:\Users\dienv\Desktop\sos_vietnam_2026_web_hosting`)
- Scope reviewed:
  - Backend: `services/blockchain-ledger-service.js`, `services/evidence-storage-service.js`, `services/runtime-data-store.js`, `server.js`
  - Dispatcher UI: `dispatcher.html`, `js/dispatcher.js`, `css/style.css`
  - DePIN 3-Tier Card Portal: `cap-phat-the.html`, `js/depin-card-portal.js`
  - Citizen Stealth UI & PWA: `js/stealth-sos.js`, `index.html`, `js/app.js`, `sw.js`
  - Automated E2E QA: `playwright/verify-web3-depin-and-stealth-sos.mjs`, `Reports/qa/playwright/2026-11-02-web3-depin-stealth-sos/`
- Claim reviewed: Complete implementation and live deployment to Render Staging (`https://sos-vietnam-2026.onrender.com/`, leaving production `https://sosvie.site` untouched) of all 5 Hạng mục in the Web3/DePIN & Stealth SOS specification plus 100% 3-tier synchronization with `DAC_TA_DONG_BO_WEB_VA_AI.md` (`v2.1`).
- Authority used:
  - `d:\DOWNLOAD\t_i_li_u_c_t_k_thu_t_t_ch_h_p_web3_ng_y_trang_kh_n_c_p_sos_vi_t_nam.md`
  - `c:\Users\dienv\Desktop\capphattheSOS\DAC_TA_DONG_BO_WEB_VA_AI.md` (`v2.1`)
  - `AGENTS.md`
  - `docs/plans/2026-11-02-web3-depin-and-stealth-sos/2026-11-02-web3-depin-and-stealth-sos-plan.md`
- Related artifacts:
  - Local Docker QA: `Reports/qa/playwright/2026-11-02-web3-depin-stealth-sos/qa-report.json`, `qa-report.md`, `01..07.png`
  - Live Render Staging QA: `Reports/qa/playwright/2026-11-02-web3-depin-stealth-sos/staging-qa-report.json`, `staging-qa-report.md`, `staging-01..07.png`

## Executive Summary
- Problem: Verify that SOS Vietnam 2026 cryptographically verifies ESP32-C3 + `CapPhatTheSOS.exe` DePIN cards (`v2.1` rules & test vectors), seals all 4 SOS lifecycle stages (`1_SOS_TRIGGER`, `2_EVIDENCE_SEAL`, `3_OFFICER_DISPATCH` with `responseTimeSeconds`, `4_CASE_RESOLVED`) onto a persistent Blockchain Ledger (`84202600` Sandbox / `842026` Production + `NDA` / `POLYGON` readiness), hashes raw 5-second field audio in RAM (`SHA-256`) before storage, performs live byte-level server re-hash integrity audits with SVG QR & legal dossier extraction in `dispatcher.html`, provides Citizen iOS Fake Call (3-tap guard) & Blackout Stealth Mode (4-tap guard) on `index.html`, and runs cleanly on both built Docker (`sos-vietnam:local`) and live Render Staging (`https://sos-vietnam-2026.onrender.com/`).
- Decision: `PASS` — Verified by `22/22 PASS` on local built Docker container (`sos-vietnam-web3-qa`, including `docker restart` persistence) and `21/21 PASS` (`failed: 0`) on live Render Cloud Staging (`https://sos-vietnam-2026.onrender.com/`), backed by 14 inspected screenshots, `node scripts/test-runtime-data-store.cjs`, and fresh Anvien graph & change-detection checks.
- Required outcome: accepted

## Source-Level Clearance Notes
- `services/blockchain-ledger-service.js`: `clear` — Implements `842026` vs `84202600` host resolution, dual-secret (`COMMAND_SECRET_KEY = "BTL_CSCD_E10_D1_SOS_VIETNAM_2026"` & `DAC_TA_SECRET_KEY`) + Chained Block v2 (`TEST` wipeable vs `REAL` 1-time Genesis lock & `Block #2+` hash chaining), `live_evidence_hash` verification across `lng`/`lon`/`longitude` float formats, Section 5.5 Test Vector (`SOS_CSCD10_09` -> `0x3c729fdfa29010da748df56a951a60896155a5fd749497928427bd308684c032` & `0x11c59e69ae2e1865d21f82bb59c8785a1f07299be5be8d82e08d3e9d4bfa8585`), persistent AES-256-GCM block chain (`#101+`), optional EVM JSON-RPC relay (`NDA_CHAIN_RPC_URL` / `POLYGON_AMOY_RPC_URL`), and offline ISO/IEC 18004 SVG QR code generator.
- `services/evidence-storage-service.js`: `clear` — Hashes raw binary `Buffer` in RAM (`0x...` `SHA-256`) prior to storage, parses binary `multipart/form-data` without UTF-8 corruption, partitions cloud folders (`SOS_VIETNAM_OFFICIAL` vs `SOS_RENDER_SANDBOX`), falls back transparently to `local-encrypted-vault` (`AES-256-GCM`), and reads raw stored bytes back for live integrity audits.
- `services/runtime-data-store.js`: `clear` — Preserves all exports and strict production `SOS_RUNTIME_DATA_DIR` check while explicitly detecting unwritable cloud-sandbox paths (`EACCES`/`EPERM`/`EROFS` on Render Free without Persistent Disk) and routing to `os.tmpdir()/sos-vietnam-runtime-data` (`mode: 0o700`, `AES-256-GCM`, reported transparently via `ledgerStorageMode: "cloud-ephemeral-tmpdir-encrypted-vault"`).
- `server.js`: `clear` — Wires `/api/hardware-sos` (including `CUU_NAN_CUU_HO` routing, `THE_CHUA_CAP_PHAT` blank-card fallback with zero hardcoded sample names), `/api/depin/*`, `/api/blockchain/status`, `/api/blockchain/explorer/:txOrBlock`, `/api/sos/upload-evidence`, `/api/sos/stealth-gps`, `/api/sos/evidence-file/:incidentId/:evidenceId` (`206 Partial Content` Range + `?download=1`), `/api/dispatcher/blockchain/verify`, all sibling lifecycle hooks (`performZaloIncidentAccept`, `/api/sos/media`, `/api/sos/citizen-safe`, `saveIncidentHistory()`), and CSP media origins.
- `dispatcher.html`, `js/dispatcher.js`, `css/style.css`: `clear` — Embeds `.bc-security-panel` inside `#activeIncidentDrawer` with all 20 unique spec DOM IDs, Multi-Chain switcher (`842026`/`NDA`/`POLYGON`), incremental `<audio class="bc-stealth-audio" controls>` playback without SSE stutter, `runIntegrityCheck()` live re-hash comparison, byte-exact file download, JSON/print legal dossier export, and SVG QR certificate.
- `cap-phat-the.html`, `js/depin-card-portal.js`: `clear` — Implements `DAC_TA_DONG_BO_WEB_VA_AI.md` `v2.1` Rules 1–5 (single persistent Web Serial `115200 8N1` `DTR=true, RTS=true` session, mandatory `READ_DATA` read-back verification after `SAVE_OK`, empty initial inputs with cue placeholders only and zero hardcoded personal names, `/^(0x)?[0-9a-fA-F]{64}$/` seal regex, `TEST` wipe vs `REAL` 1-time lock & `Block #2+` chaining, and Tactical E10 UI).
- `js/stealth-sos.js`, `index.html`, `js/app.js`, `sw.js`: `clear` — Implements iOS Fake Incoming/Active Call (3s countdown, `"Ba"`, 6-button keypad, `00:01+` timer, Vietnamese `speechSynthesis`, `WakeLock`, `"Danh bạ"` `#000000` proximity blackout, standalone 5000ms `MediaRecorder` WebCrypto `SHA-256` upload, 3-tap Red Hangup guard) and Blackout Stealth Mode (`#000000` `100vw x 100vh` `z-index: 999999`, 4-tap unlock guard).

## Evidence Checked
Passed:
- Local Built Docker E2E (`node playwright/verify-web3-depin-and-stealth-sos.mjs` against `sos-vietnam-web3-qa` `http://127.0.0.1:3106`): **22 / 22 PASS (`failed: 0`)**, including `docker restart sos-vietnam-web3-qa` ledger & encrypted vault persistence (`qa-report.json`, `qa-report.md`, `01..07.png`).
- Live Render Cloud Staging E2E (`node playwright/verify-web3-depin-and-stealth-sos.mjs --staging` against `https://sos-vietnam-2026.onrender.com`): **21 / 21 PASS (`failed: 0`)** (`hardwareSosDePinLatencyMs: 501.95 ms`, `liveIntegrityAuditUiMs: 375.07 ms`, `staging-qa-report.json`, `staging-qa-report.md`, `staging-01..07.png`).
- Production `https://sosvie.site` boundary check: verified untouched (`origin` pushes strictly to `Tinhhhh/sos-vietnam-2026.git` -> `sos-vietnam-2026.onrender.com`).
- Runtime store & Linux `EACCES` regression tests: `node scripts/test-runtime-data-store.cjs` (`passed`) + Docker Linux `SOS_RUNTIME_DATA_DIR=/root/unwritable-render-disk` probe (`hashMatch: true`).
- Cleanup (`Pn-B`): `docker rm -f sos-vietnam-web3-qa` executed, `.tmp/docker-web3-qa-data` deleted, zero plan-created `.tmp/p*` scratch dirs remaining, and all pre-existing user uncommitted files preserved intact.
- Verification freshness: `fresh` — executed directly on `2026-11-02T15:48:35+07:00`.

Failed:
- None (`0` open defects; Render Free `EACCES` on `/var/lib/sos-data` caught during initial `P4-C` live probe, fixed at root cause in commit `169dd4b`, and verified `21/21 PASS` live on Render Staging).

Not run:
- Production deployment to `https://sosvie.site` (intentionally excluded per explicit user instruction to test and run ONLY on `https://sos-vietnam-2026.onrender.com/`).

## Invariant Closure
- affected invariant: End-to-end cryptographic provenance (`SHA-256` + DePIN `bc_seal`/`live_evidence_hash` + sequential Blockchain Ledger `#101+`) across Hardware SOS cards (`v2.1`), Citizen Web Stealth 5s audio chunks, and Dispatcher Live Integrity Audits, isolated safely between Staging Sandbox (`84202600` / `SOS_RENDER_SANDBOX`) and Production (`842026` / `SOS_VIETNAM_OFFICIAL`).
- sibling surfaces checked: `/api/sos/create`, `/api/hardware-sos` (`POST` & `GET /push`), `/api/sos/media`, `/api/sos/upload-evidence`, `/api/dispatcher/accept`, `performZaloIncidentAccept`, `/api/dispatcher/update-status`, `/api/sos/citizen-safe`, `/api/depin/cards/*`, and `/api/blockchain/explorer/:txOrBlock`.
- residual unverified same-invariant surfaces: none

## Overall Evaluation
All 5 Web3/DePIN & Stealth SOS specification deliverables, all 5 `DAC_TA_DONG_BO_WEB_VA_AI.md` `v2.1` 3-tier synchronization rules, local Docker container E2E (`22/22 PASS`), live Render Staging E2E (`21/21 PASS` on `https://sos-vietnam-2026.onrender.com/`), and temporary resource cleanup are complete and verified. Accepted (`PASS`).
