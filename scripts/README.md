# Thư Mục Scripts — SOS Việt Nam 2026

Thư mục chứa các kịch bản tiện ích, công cụ sinh báo cáo hành chính, bảo trì dữ liệu và kiểm thử hệ thống.

## Cấu Trúc Phân Loại

### 1. `scripts/research/` (Công cụ nghiên cứu & thám hiểm GIS)
Chứa các script và trang HTML thử nghiệm cấu trúc cây dữ liệu hành chính WMS và sáp nhập địa giới:
- `18_sapnhap_tree.js`, `2_config.js`, `7_wms_info.js`, `cosodulieu.html`, `sapnhap.html`, `stieuchuan.js`
- `fetch-bando-scripts.cjs`, `inspect-bando.cjs`, `parse-endpoints.cjs`, `find-*.cjs`

### 2. `scripts/generators/` (Công cụ sinh tài liệu & xuất báo cáo)
- `generate_report_docx.py`: Sinh Biên bản báo cáo sự cố chuẩn Nghị định 30/2020/NĐ-CP (.docx).
- `generate_verification_record_docx.py`: Sinh Biên bản xác minh vụ việc khẩn cấp (.docx).
- `generate_history_excel.py`: Xuất toàn bộ lịch sử cuộc gọi/sự cố ra định dạng Excel (.xlsx).
- `generate_accounts_excel.py`: Xuất danh bạ tài khoản cán bộ trực ban ra bảng tính 3 Sheet.
- `generate_project_dossier_docx.py`: Tạo hồ sơ tổng quan dự án.
- `generate_nckh_docx.py`: Tạo tài liệu đề tài khoa học.
- `generate_role_hierarchy_flow_map.py`: Tạo sơ đồ SVG phân cấp thẩm quyền.
- `render_flow_svg.py`, `reformat_excel.py`, `import_accounts_excel.py`, `verify_excel_pw.py`.

### 3. `scripts/maintenance/` (Công cụ bảo trì & quản trị dữ liệu)
- `migrate-passwords.js`, `migrate-runtime-data.cjs`: Chuyển đổi dữ liệu và đồng bộ mật khẩu mã hóa.
- `reset-agency-default-passwords.mjs`, `fix-admin-password.mjs`: Đặt lại mật khẩu mặc định an toàn.
- `supplement_dongnai_agencies.py`, `enrich-accounts-data.cjs`: Bổ sung dữ liệu trạm các tỉnh thành.
- `secret-crypto.js`: Tiện ích mã hóa AES-256-GCM.
- `create_hosting_package.py`, `sync_to_target_hosting.py`: Đóng gói và đồng bộ lên hosting.

### 4. Bộ kiểm thử chức năng & an ninh (Test Suite)
- `test-security-boundary.js`, `test-security-suite.js`: Kiểm thử tường lửa WAF và ranh giới an ninh.
- `test-citizen-access.js`: Kiểm thử quyền truy cập cổng người dân.
- `test-auth-lockout.cjs`: Kiểm thử cơ chế khóa brute-force IP.
- `test-graceful-shutdown.js`, `test-production-runtime.js`: Kiểm tra độ ổn định runtime.
