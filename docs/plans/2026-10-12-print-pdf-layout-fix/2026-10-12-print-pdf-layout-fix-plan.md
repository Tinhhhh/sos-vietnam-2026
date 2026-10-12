# Sửa Lỗi Hiển Thị Chức Năng In & Xuất PDF Báo Cáo Sự Cố Plan

## Metadata

- Date: `2026-10-12`
- Status: `completed`
- Plan: `docs/plans/2026-10-12-print-pdf-layout-fix/2026-10-12-print-pdf-layout-fix-plan.md`
- Evidence: `docs/plans/2026-10-12-print-pdf-layout-fix/2026-10-12-print-pdf-layout-fix-evidence.md`
- Benchmark: `docs/plans/2026-10-12-print-pdf-layout-fix/2026-10-12-print-pdf-layout-fix-benchmark.md`
- Actual status: `docs/plans/2026-10-12-print-pdf-layout-fix/2026-10-12-print-pdf-layout-fix-actual-status.md`

## Goal

Khắc phục triệt để lỗi định dạng in và xuất PDF của Bảng tổng hợp & thống kê chi tiết các ca sự cố (`territoryStatsModal`):
1. **Khắc phục lỗi cột bị bóp méo chữ theo chiều dọc (Vertical letter-by-letter breaking)**:
   - Cột "Nội Dung Sự Cố" và "STT" bị co hẹp còn ~15px do các cột khác chiếm hết chiều rộng cố định, dẫn đến từng chữ cái bị ngắt dòng đơn lẻ ("N\nộ\ni\nd\nu\nn\ng\nS\nự\nc\nố", "C\nầ\nn\nh\nỗ\nt\nr\nợ..."), làm đội số trang in lên đến 26 trang giấy.
2. **Chuẩn hóa tỷ lệ phân bổ 8 cột bảng thống kê (Proportional Column Widths)**:
   - Dùng `table-layout: fixed !important;` với phân bổ tỷ lệ phần trăm tối ưu (STT 4.5%, Mã SOS 12%, Tiếp nhận 10.5%, Lực lượng 11%, Nội dung 25%, Người báo 13.5%, Địa bàn 15%, Trạng thái 8.5%).
   - Cấm ngắt từ theo ký tự (`word-break: normal !important; overflow-wrap: break-word !important;`).
3. **Mặc định in Khổ Ngang (A4 Landscape)**:
   - Bảng biểu thống kê nhiều cột chuẩn hành chính Việt Nam được cấu hình tự động chuyển sang khổ ngang (`@page { size: A4 landscape; margin: 8mm 10mm; }`), giúp báo cáo trải rộng từ 210mm lên 297mm, giảm số trang in từ 26 trang xuống còn 2-3 trang giấy gọn đẹp.

## Checklist

- [x] P0: Baseline Actual Status & Problem Identification.
- [x] P1: Cập nhật CSS Print `@media print` trong `css/style.css` (Landscape `@page`, fixed column widths, zero letter-breaking).
- [x] P2: Cập nhật `dispatcher.html` và `js/dispatcher.js` (Tỷ lệ cột bảng biểu & Dynamic landscape print style injection).
- [x] P3: Kiểm thử tự động Playwright (Chụp ảnh và xuất PDF thử nghiệm, xác minh zero letter-breaking và giảm số trang).
- [x] P4: Anvien detect-changes & Commit.
