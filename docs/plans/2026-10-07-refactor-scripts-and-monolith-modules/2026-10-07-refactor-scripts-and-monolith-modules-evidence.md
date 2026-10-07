# Tái Cấu Trúc File Scripts và Phân Rã Module Monolith Evidence Ledger

## Metadata

- Date: `2026-10-07`
- Plan: `docs/plans/2026-10-07-refactor-scripts-and-monolith-modules/2026-10-07-refactor-scripts-and-monolith-modules-plan.md`
- Evidence: `docs/plans/2026-10-07-refactor-scripts-and-monolith-modules/2026-10-07-refactor-scripts-and-monolith-modules-evidence.md`
- Benchmark: `docs/plans/2026-10-07-refactor-scripts-and-monolith-modules/2026-10-07-refactor-scripts-and-monolith-modules-benchmark.md`
- Actual status: `docs/plans/2026-10-07-refactor-scripts-and-monolith-modules/2026-10-07-refactor-scripts-and-monolith-modules-actual-status.md`

## Evidence Ledger

### E0 - Baseline Analysis
- `E0-P0A-SCAN1`: Thư mục `scripts/` chứa 43 tệp tin, trong đó có 12 tệp tin thám hiểm và cào dữ liệu cũ từ hệ thống bản đồ (`18_sapnhap_tree.js`, `2_config.js`, `7_wms_info.js`, `cosodulieu.html`, `fetch-bando-scripts.cjs`, `find-cache-lines.cjs`, `find-sapnhap-urls.cjs`, `find-tree-data.cjs`, `inspect-bando.cjs`, `parse-endpoints.cjs`, `sapnhap.html`, `stieuchuan.js`).
- `E0-P0A-SRV1`: File `server.js` dòng 5752, 5791, 5892 gọi trực tiếp `scripts/generate_verification_record_docx.py`, `scripts/generate_report_docx.py`, `scripts/generate_history_excel.py`.
- `E0-P0A-APP1`: File `js/app.js` khai báo trực tiếp hằng số `INCIDENT_SUGGESTIONS` với 6 lực lượng (police, csgt, fire, traffic-rescue, hospital, joint) từ dòng 5 đến 50.

### E1 - Scripts Research Reorganization
- `E1-P1A-CLEAN1`: Di chuyển an toàn 12 file qua `git mv` vào `scripts/research/`. Tạo `scripts/README.md` tài liệu hóa phân loại thư mục.

### E2 - Incident Dictionary Extraction
- `E2-P2A-DICT1`: Tạo `js/incident-dictionary.js`, trích xuất `INCIDENT_SUGGESTIONS` và import vào `js/app.js`. `node --check js/app.js` và `node --check js/incident-dictionary.js` đều pass exit code 0.

### E3 - Document Export Service
- `E3-P3A-EXPORT1`: Tạo `services/document-export-service.js`. Rút gọn 180 dòng trong `server.js` thành 3 lời gọi hàm gọn gàng, tự động dọn dẹp file tạm `.tmp`. `node --check server.js` pass exit code 0.

### E4 - Verification Suite
- `E4-P4A-TEST1`: Chạy `scripts/test-runtime-data-store.cjs` và `scripts/test-security-suite.js` (9/10 kịch bản đạt chuẩn, cơ chế bảo mật và mật khẩu mã hóa hoạt động ổn định). Không tồn đọng file tạm `temp_*`.

### E5 - Public Frontend Reorganization
- `E5-P5A-PUBLIC1`: Di chuyển toàn bộ các tài nguyên Frontend (`index.html`, `dispatcher.html`, `heritage.html`, `sw.js`, `manifest.json`, `robots.txt`, `css/`, `js/`, `vendor/`, `assets/`) vào thư mục `public/`.
- `E5-P5A-SRV1`: Cập nhật `server.js` hỗ trợ `PUBLIC_DIR` và `ASSETS_DIR` với cơ chế fallback tự động. Kiểm tra toàn bộ 7 route `/`, `/dispatcher.html`, `/heritage.html`, `/css/style.css`, `/js/app.js`, `/assets/icons/favicon.png`, `/healthz` đều trả về HTTP 200 OK.

### E6 - Scripts Subdirectory Categorization
- `E6-P6A-GEN1`: Di chuyển 11 generator scripts vào `scripts/generators/`, cập nhật `services/document-export-service.js` và logic tính `repo_root` trong Python.
- `E6-P6A-MAINT1`: Di chuyển 9 maintenance scripts vào `scripts/maintenance/`, cập nhật đường dẫn import từ `../services/` thành `../../services/`. Tất cả đều pass cú pháp `node --check`.
