# Tái Cấu Trúc File Scripts và Phân Rã Module Monolith Actual Status

Title: Tái Cấu Trúc File Scripts và Phân Rã Module Monolith
Date: 2026-10-07
Status: Completed
Companion plan: `docs/plans/2026-10-07-refactor-scripts-and-monolith-modules/2026-10-07-refactor-scripts-and-monolith-modules-plan.md`
Companion evidence: `docs/plans/2026-10-07-refactor-scripts-and-monolith-modules/2026-10-07-refactor-scripts-and-monolith-modules-evidence.md`
Companion benchmark: `docs/plans/2026-10-07-refactor-scripts-and-monolith-modules/2026-10-07-refactor-scripts-and-monolith-modules-benchmark.md`

## Purpose

Tài liệu ghi nhận hiện trạng thực tế của codebase trước và trong quá trình thực hiện tái cấu trúc, đảm bảo không bỏ sót bất kỳ liên kết phụ thuộc nào.

## Scope

Target scope:
- Thư mục `scripts/` (43 files)
- File `server.js` (6.274 lines, phần xuất file tài liệu DOCX/XLSX)
- File `js/app.js` (4.525 lines, phần từ điển sự cố `INCIDENT_SUGGESTIONS`)
- Cấu trúc thư mục frontend tĩnh: `public/`

Out of scope:
- Các tệp tin GeoJSON ranh giới hành chính
- Các template HTML cốt lõi

## Current Status Matrix

| Unit / File / Surface | Current State | Evidence ID | Target State | Plan Consequence |
|---|---|---|---|---|
| `scripts/` | Đã phân tách thành 3 nhóm con: `research/`, `generators/`, `maintenance/` | E1-P1A-CLEAN1, E6-P6A-GEN1, E6-P6A-MAINT1 | Phân loại sạch sẽ toàn bộ 43 scripts | Hoàn thành, có README.md phân loại |
| `server.js` | Đã ủy thác xuất DOCX/XLSX sang `services/document-export-service.js`, hỗ trợ `PUBLIC_DIR` và `ASSETS_DIR` | E3-P3A-EXPORT1, E5-P5A-SRV1 | Ủy thác sang `services/document-export-service.js` | Hoàn thành, sạch sẽ và an toàn |
| `js/app.js` | Đã tách `INCIDENT_SUGGESTIONS` sang `public/js/incident-dictionary.js` | E2-P2A-DICT1 | Export từ `js/incident-dictionary.js` | Hoàn thành, kiểm tra syntax pass |
| `public/` | Toàn bộ tài nguyên frontend (HTML, CSS, JS, Assets, Vendor, PWA) nằm trong `public/` | E5-P5A-PUBLIC1 | Chuẩn hóa Frontend tĩnh vào `public/` | Hoàn thành, tất cả route HTTP 200 |

## Status Refresh Log

- 2026-10-07: Khởi tạo bảng hiện trạng P0 baseline.
- 2026-10-07: Hoàn thành P1, P2, P3, P4 và xác minh kiểm thử logic thành công.
- 2026-10-07: Hoàn thành P5, P6: Di chuyển toàn bộ Frontend vào `public/`, phân chia `scripts/generators` và `scripts/maintenance`, xác minh toàn bộ hệ thống. Toàn bộ kế hoạch hoàn tất.
