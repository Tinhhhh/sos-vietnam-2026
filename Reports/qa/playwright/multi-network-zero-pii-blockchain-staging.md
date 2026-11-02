# Báo Cáo QA Tự Động Playwright + OpenCV — Đa Mạng Chuỗi Khối Zero-PII & Chứng Chỉ Quốc Tế OpenTimestamps (.OTS)

- **Môi trường kiểm thử:** `staging`
- **URL mục tiêu:** `https://sos-vietnam-2026.onrender.com`
- **Thời điểm xác thực:** `2026-11-02T13:07:50.526Z`
- **Kết quả tổng thể:** **10 / 10 PASS** (`failed: 0`)
- **Tổng số rò rỉ PII trên các mạng ngoài nội bộ (`NDA`, `OTS`, `POLYGON`):** **`0` (Mục tiêu: `0`)**
- **Tỷ lệ quét mã QR bằng OpenCV `QRCodeDetector`:** **`4 / 4` (100%)**
- **Độ trễ tạo ca SOS không chặn (`/api/sos/create`):** `614.13 ms`
- **Kích thước tệp `PublicAnchor.json` / chứng chỉ `.ots`:** `514 bytes` / `307 bytes`

## Bảng Kết Quả Kiểm Định Chi Tiết

| # | Hạng mục kiểm định | Trạng thái |
|---|---|---|
| 1 | 1. /api/blockchain/status exposes all 4 selectable networks (842026, NDA, OTS, POLYGON) and OpenTimestamps global verification metadata | ✅ PASS |
| 2 | 2. Full 5-stage SOS lifecycle seals 5 blocks with non-blocking SOS creation and closes cleanly as resolved | ✅ PASS |
| 3 | 3A. Surface 1 (dispatcher.html #bcSecurityPanel) on 842026 renders 4 network pills, displays 100% Full PII (unmasked phone, citizen & officer names), and scannable QR | ✅ PASS |
| 4 | 3B. Surface 1 (dispatcher.html #bcSecurityPanel) switching to NDA / OTS / POLYGON enforces 0 PII leaks across DOM, QR & exported JSON while preserving SLA durations and .OTS proof buttons | ✅ PASS |
| 5 | 4A. Surface 2 (/tra-cuu-blockchain.html) on 842026 shows 100% Full PII (unmasked phone, CCCD, citizen & officer names) to authenticated officer | ✅ PASS |
| 6 | 4B. Surface 2 (/tra-cuu-blockchain.html) masks phone/CCCD on public 842026 and enforces 0 PII leaks across NDA / OTS / POLYGON + scannable OTS QR | ✅ PASS |
| 7 | 4C. Downloaded SOSVN_Block_<N>_PublicAnchor.json (0% PII) & .ots binary proof pass independent OpenTimestamps v1 magic header + SHA-256 + calendar attestation check | ✅ PASS |
| 8 | 4D. Tab 2 Decoder verifies PublicAnchor.json (SOSVN-ANCHOR-V1) with 100% dual offline+online match and 0 PII exposure | ✅ PASS |
| 9 | 5. Surface 3 (/api/blockchain/explorer/:ref) renders 4-network switcher, shows Full PII to officer on 842026, and enforces 0 PII leaks + scannable QR across NDA / OTS / POLYGON | ✅ PASS |
| 10 | 6. On-demand .OTS stamping & verification succeeds for Block #101 and total browser console errors === 0 | ✅ PASS |

## Ảnh Chụp Bằng Chứng Trực Quan

- `Reports/qa/playwright/screenshots/multinet-staging-01-dispatcher-842026-full.png`
- `Reports/qa/playwright/screenshots/multinet-staging-01b-dispatcher-qr-842026.png`
- `Reports/qa/playwright/screenshots/multinet-staging-02-dispatcher-ots-zeropii.png`
- `Reports/qa/playwright/screenshots/multinet-staging-02b-dispatcher-qr-ots.png`
- `Reports/qa/playwright/screenshots/multinet-staging-03-portal-officer-842026-full.png`
- `Reports/qa/playwright/screenshots/multinet-staging-04-portal-ots-zeropii.png`
- `Reports/qa/playwright/screenshots/multinet-staging-04b-portal-qr-ots.png`
- `Reports/qa/playwright/screenshots/multinet-staging-05-explorer-officer-842026-full.png`
- `Reports/qa/playwright/screenshots/multinet-staging-06-explorer-ots-zeropii.png`
- `Reports/qa/playwright/screenshots/multinet-staging-06b-explorer-qr-ots.png`
