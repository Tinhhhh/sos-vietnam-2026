# Báo Cáo Kiểm Thử Tự Động E2E Playwright — Web3 DePIN, Chống Giả Mạo Thẻ SOS v2.1 & Ngụy Trang Khẩn Cấp

- **Chế độ chạy:** `render-staging`
- **Mục tiêu kiểm thử:** `https://sos-vietnam-2026.onrender.com`
- **Container Docker:** `N/A (Render Cloud Staging)`
- **Thời điểm xác thực:** `2026-11-02T08:47:56.438Z`
- **Tổng số kiểm định:** **21 / 21 PASS** (`failed: 0`)
- **Độ trễ xác thực phần cứng DePIN (`/api/hardware-sos`):** `501.95 ms`
- **Độ trễ Live Audit SHA-256 toàn diện trên UI:** `375.07 ms`

## Danh sách Kiểm định Chi tiết

| # | Hạng mục kiểm định | Kết quả |
|---|---|---|
| 1 | A1. /api/blockchain/status returns Sandbox Chain ID 84202600, SOS_RENDER_SANDBOX & Multi-Chain networks (842026, NDA, POLYGON) | ✅ PASS |
| 2 | A2. POST /api/hardware-sos verifies DAC_TA v2.1 Section 5.5 vector (SOS_CSCD10_09, bc_seal & live_evidence_hash) and seals 1_SOS_TRIGGER block | ✅ PASS |
| 3 | A3. POST /api/hardware-sos verifies ESP32-C3 chip formula & routes CUU_NAN_CUU_HO (Button 3) to Fire/Rescue | ✅ PASS |
| 4 | A4. POST /api/hardware-sos flags tampered bc_seal as SPOOF_SUSPECTED (verified: false) | ✅ PASS |
| 5 | A5. Blank unprovisioned card (THE_CHUA_CAP_PHAT) stays backward-compatible (UNSEALED_LEGACY_IOT) with zero hardcoded sample names (Rule 3) | ✅ PASS |
| 6 | B1. /cap-phat-the.html obeys DAC_TA v2.1 Rule 3 (empty initial inputs, cue placeholders only, zero hardcoded personal names) | ✅ PASS |
| 7 | B2. /cap-phat-the.html computes exact DAC_TA v2.1 Section 5.5 Genesis SEAL (0x3c729fdfa29010da...) | ✅ PASS |
| 8 | B3. /cap-phat-the.html TEST Mode allows provisioning and clean WIPE_CARD reset | ✅ PASS |
| 9 | B4. /cap-phat-the.html REAL Mode seals Genesis Block #1 and strictly blocks wiping (UI lock + HTTP 403 REAL_MODE_WIPE_FORBIDDEN) | ✅ PASS |
| 10 | B5. /cap-phat-the.html chains REAL Block #2 (PrevSeal === Block #1 SEAL) and passes READ_DATA SHA-256 verification | ✅ PASS |
| 11 | C1. Citizen Fake Incoming Call triggers 3s countdown -> fullscreen iOS Incoming Call UI ("Ba") | ✅ PASS |
| 12 | C2. Answering Fake Call displays 6-button iOS keypad + live 00:01+ timer and silently creates covert SOS with zero visible SOS modal | ✅ PASS |
| 13 | C3. Tapping "Danh bạ" activates #000000 proximity blackout and double-tapping wakes active iOS call UI | ✅ PASS |
| 14 | C4. Covert 5000ms MediaRecorder hashes audio in browser (WebCrypto SHA-256) and seals 2_EVIDENCE_SEAL block with clientHashMatched === true | ✅ PASS |
| 15 | C5. Red Hangup button strictly enforces 3-consecutive-tap anti-attacker exit guard (1x & 2x stay locked; 3x exits cleanly) | ✅ PASS |
| 16 | C6. Blackout Stealth Mode renders pitch-black #000000 (100vw x 100vh, z-index 999999) and enforces 4-consecutive-tap unlock guard | ✅ PASS |
| 17 | D1. Dispatcher .bc-security-panel displays ESP32-C3 eFuse MAC (A4CF128E3B09), DePIN VERIFIED badge, and switches Multi-Chain networks (842026 / NDA / POLYGON) | ✅ PASS |
| 18 | D2. Officer Dispatch & Case Resolution seal 3_OFFICER_DISPATCH (with responseTimeSeconds) and 4_CASE_RESOLVED in #uiAuditTimeline | ✅ PASS |
| 19 | D3. Dispatcher drawer renders 5-second Citizen Stealth audio evidence with valid playable WebM stream (readyState >= 1, hasError === false) | ✅ PASS |
| 20 | D4. runIntegrityCheck() re-hashes raw server evidence bytes, renders exact legal conclusion, renders SVG QR, and downloads byte-exact original audio matching SHA-256 | ✅ PASS |
| 21 | D5. Block Explorer Certificate (/api/blockchain/explorer/:txHash) renders HTTP 200 immutable block proof | ✅ PASS |

## Ảnh chụp Bằng chứng Trực quan

- `staging-01-cap-phat-the-e10-v21.png`
- `staging-02-citizen-stealth-bar.png`
- `staging-03-ios-fake-incoming-call.png`
- `staging-04-ios-fake-active-call.png`
- `staging-05-dispatcher-hardware-depin-verified.png`
- `staging-06-dispatcher-stealth-live-audit-qr.png`
- `staging-07-blockchain-explorer-certificate.png`
