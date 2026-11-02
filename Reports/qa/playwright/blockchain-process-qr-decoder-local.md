# Báo Cáo QA Tự Động Playwright + OpenCV — Chuỗi Khối Quy Trình Giao Dịch, Quét QR & Phần Mềm Giải Mã (.JSON)

- **Môi trường kiểm thử:** `local`
- **URL mục tiêu:** `http://127.0.0.1:3410`
- **Thời điểm xác thực:** `2026-11-02T10:34:37.055Z`
- **Kết quả tổng thể:** **12 / 12 PASS** (`failed: 0`)
- **Độ trễ Live Audit SHA-256 trên Bàn Điều Phối:** `609.89 ms`
- **Dung lượng tệp Hồ sơ Pháp lý 5 Block (0 media nặng):** `33313 bytes`
- **Kết quả OpenCV `QRCodeDetector` trên Bàn Điều Phối:** `http://127.0.0.1:3410/tra-cuu-blockchain.html?tx=0x1d4fea03c1790784af9acddcd6e24c594e2203867367e53307a116827d39ce00&case=SOS-MVZ4H0JG-528`
- **Kết quả OpenCV `QRCodeDetector` trên Cổng Đối Chứng:** `http://127.0.0.1:3410/tra-cuu-blockchain.html?tx=0x1d4fea03c1790784af9acddcd6e24c594e2203867367e53307a116827d39ce00&case=SOS-MVZ4H0JG-528`

## Bảng Kết Quả Kiểm Định Chi Tiết

| # | Hạng mục kiểm định | Trạng thái |
|---|---|---|
| 1 | 1A. Citizen Portal (/) exposes Blockchain Verifier links (#btnNavBlockchainVerifier & #btnStealthBlockchainVerifier) and lightweight Stealth copy | ✅ PASS |
| 2 | 1B. Stealth Fake Incoming Call creates covert SOS transaction silently while keeping audioRecordingEnabled === false and chunksUploaded === 0 | ✅ PASS |
| 3 | 2A. Citizen SOS creation seals Block #1 (1_SOS_TRIGGER) with valid 66-char TxHash and 0 media files | ✅ PASS |
| 4 | 2B. Full 5-stage SOS lifecycle seals 5 sequential blocks with positive responseTimeSeconds, travelTimeSeconds, onSceneHandlingSeconds & totalCaseDurationSeconds | ✅ PASS |
| 5 | 3A. Dispatcher #bcSecurityPanel displays complete Transaction Process Summary (Reporter, Officer, Timestamps, 4 Duration Metrics & 5 Timeline Steps) | ✅ PASS |
| 6 | 3B. 0-media Live Audit populates matching 66-char 0x... TxHashes and renders 100% OpenCV-scannable QR resolving to /tra-cuu-blockchain.html | ✅ PASS |
| 7 | 3C. Clicking #btnExportLegalDossierJson downloads complete HoSo_PhapLy_ChuoiKhoi_<id>.json (schemaVersion 2.1-PROCESS-DOSSIER, 5 lifecycleBlocks with payload) | ✅ PASS |
| 8 | 4A. Opening scanned QR URL on /tra-cuu-blockchain.html (public context) confirms 100% genuine ledger chain, masks citizen phone (***), displays 6 process cards + 5 decoded blocks, and renders scannable QR | ✅ PASS |
| 9 | 4B. Authenticated Officer session opening /tra-cuu-blockchain.html automatically sees unmasked citizen phone (👮 Chế độ Cán bộ Trực ban) | ✅ PASS |
| 10 | 5. Uploading intact HoSo_PhapLy_ChuoiKhoi_<id>.json in Tab 2 decodes all 5 Vietnamese blocks and passes BOTH Offline WebCrypto SHA-256 & Online Server Ledger checks | ✅ PASS |
| 11 | 6. Uploading 1-field edited .JSON dossier triggers red tamper alert (is-tampered), fails both Offline WebCrypto & Online Server badges, and names exact tampered Block # | ✅ PASS |
| 12 | 7. /cap-phat-the.html links to /tra-cuu-blockchain.html (#btnDePinOpenVerifier) and /api/blockchain/explorer/:txHash renders HTTP 200 certificate | ✅ PASS |

## Ảnh Chụp Bằng Chứng Trực Quan

- `Reports/qa/playwright/screenshots/bc-decoder-local-01-dispatcher-qr-box.png`
- `Reports/qa/playwright/screenshots/bc-decoder-local-02-dispatcher-bc-security-panel.png`
- `Reports/qa/playwright/screenshots/bc-decoder-local-03-verifier-portal-qr-box.png`
- `Reports/qa/playwright/screenshots/bc-decoder-local-04-verifier-portal-public-lookup.png`
- `Reports/qa/playwright/screenshots/bc-decoder-local-05-decoder-intact-json-verified.png`
- `Reports/qa/playwright/screenshots/bc-decoder-local-06-decoder-tampered-json-caught.png`
