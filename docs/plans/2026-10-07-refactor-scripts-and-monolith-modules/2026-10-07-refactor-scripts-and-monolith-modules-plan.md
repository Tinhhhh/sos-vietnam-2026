# Tái Cấu Trúc File Scripts và Phân Rã Module Monolith Plan

## Metadata

- Date: `2026-10-07`
- Status: `completed`
- Plan: `docs/plans/2026-10-07-refactor-scripts-and-monolith-modules/2026-10-07-refactor-scripts-and-monolith-modules-plan.md`
- Evidence: `docs/plans/2026-10-07-refactor-scripts-and-monolith-modules/2026-10-07-refactor-scripts-and-monolith-modules-evidence.md`
- Benchmark: `docs/plans/2026-10-07-refactor-scripts-and-monolith-modules/2026-10-07-refactor-scripts-and-monolith-modules-benchmark.md`
- Actual status: `docs/plans/2026-10-07-refactor-scripts-and-monolith-modules/2026-10-07-refactor-scripts-and-monolith-modules-actual-status.md`

## Goal

Thực hiện Bước 1 trong lộ trình Tái cấu trúc kiến trúc file theo yêu cầu của người dùng:
1. Phân loại và dọn dẹp thư mục `scripts/` (hiện có 43 file hỗn độn) thành các nhóm nghiệp vụ rõ ràng (Research/Scraping, Maintenance/Migrations, Generators, Tests).
2. Phân rã các file/module bị gom quá nhiều chức năng (monolith) thành các module chuyên biệt:
   - Tách từ điển sự cố `INCIDENT_SUGGESTIONS` từ `js/app.js` ra module `js/incident-dictionary.js` và kết nối lại.
   - Tách hệ thống sinh tài liệu Word/Excel (Nghị định 30) khỏi `server.js` thành `services/document-export-service.js` và kết nối lại.
3. Đảm bảo toàn bộ import, đường dẫn thực thi và logic nghiệp vụ không bị lỗi hay gián đoạn.

## Rules

- Hoàn thành P0 actual status trước khi thực hiện code.
- Cập nhật checklist ngay khi hoàn thành từng phần việc.
- Ghi nhận evidence vào evidence ledger tương ứng.
- Đảm bảo tính toàn vẹn (backward compatibility) của các API endpoints và đường dẫn tĩnh.
- Chạy kiểm thử xác minh tính đúng đắn sau mỗi bước tái cấu trúc.

## Problem

1. Thư mục `scripts/` hiện chứa 43 file lẫn lộn: các công cụ nghiên cứu crawl bản đồ cũ (`18_sapnhap_tree.js`, `cosodulieu.html`, `sapnhap.html`,...), các script kiểm thử nội bộ (`test-*.js`), và các generator chính thức của hệ thống.
2. `js/app.js` dài 4.525 dòng và đang nhồi nhét từ điển danh mục sự cố `INCIDENT_SUGGESTIONS` tĩnh ngay đầu file.
3. `server.js` dài 6.274 dòng đang gánh toàn bộ logic khởi tạo child process python, sinh file tạm và stream file DOCX/XLSX.

## Scope

- Phân loại và di chuyển các file nghiên cứu thám hiểm GIS/bản đồ cũ trong `scripts/` sang `scripts/research/`.
- Tạo `js/incident-dictionary.js` và refactor `js/app.js` import từ điển này.
- Tạo `services/document-export-service.js` và refactor các endpoint xuất báo cáo trong `server.js`.
- Cập nhật tài liệu hướng dẫn và xác minh kiểm thử.

Non-Goals:
- Không thay đổi hành vi giao diện người dùng (UI behavior).
- Không sửa đổi cấu trúc dữ liệu GeoJSON hay API payload format.

## Acceptance Criteria

1. Các script crawl/nghiên cứu cũ được thu gọn vào `scripts/research/`.
2. `js/app.js` hoạt động bình thường, import sạch sẽ `INCIDENT_SUGGESTIONS` từ `js/incident-dictionary.js`.
3. `server.js` ủy thác việc xuất file báo cáo cho `services/document-export-service.js`, các API `/api/generate-verification-record-docx`, `/api/generate-incident-report-docx`, `/api/export-incident-history-excel` giữ nguyên kết quả trả về.
4. Server khởi động thành công, các bài kiểm thử xác minh an ninh và truy cập chạy qua (Pass).

## Phase Checklist

- [x] `P0`: Lập báo cáo Actual Status, phân tích ma trận phụ thuộc giữa các script và server.
- [x] `P1`: Phân loại và dọn dẹp thư mục `scripts/research/` cho các script crawl/nghiên cứu cũ.
- [x] `P2`: Tách `INCIDENT_SUGGESTIONS` khỏi `js/app.js` thành module ES6 độc lập `js/incident-dictionary.js`.
- [x] `P3`: Tách logic xuất báo cáo DOCX/Excel từ `server.js` sang `services/document-export-service.js`.
- [x] `P4`: Chạy toàn bộ test suites và kiểm tra xác minh logic vận hành không lỗi.
- [x] `P5`: Tạo thư mục `public/` và di chuyển toàn bộ Frontend (HTML, CSS, JS, Assets, Vendor, PWA manifest, sw.js) vào `public/`, cập nhật static resolution và fallback trong `server.js`.
- [x] `P6`: Phân nhóm các script còn lại trong `scripts/` thành `scripts/generators/` và `scripts/maintenance/`, cập nhật `document-export-service.js` và relative imports sang `services/`.
