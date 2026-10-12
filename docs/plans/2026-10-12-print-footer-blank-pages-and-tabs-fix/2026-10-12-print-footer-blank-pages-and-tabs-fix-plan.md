# Khắc Phục Lỗi Trang Trắng Thừa Khi In & Căn Chỉnh Khối Chữ Ký Cán Bộ Lập Biểu & Hiển Thị Đầy Đủ 5 Tab Buttons

## Metadata
- Date: `2026-10-12`
- Status: `completed`
- Plan: `docs/plans/2026-10-12-print-footer-blank-pages-and-tabs-fix/2026-10-12-print-footer-blank-pages-and-tabs-fix-plan.md`
- Evidence: `docs/plans/2026-10-12-print-footer-blank-pages-and-tabs-fix/2026-10-12-print-footer-blank-pages-and-tabs-fix-evidence.md`
- Benchmark: `docs/plans/2026-10-12-print-footer-blank-pages-and-tabs-fix/2026-10-12-print-footer-blank-pages-and-tabs-fix-benchmark.md`
- Actual status: `docs/plans/2026-10-12-print-footer-blank-pages-and-tabs-fix/2026-10-12-print-footer-blank-pages-and-tabs-fix-actual-status.md`

## Goals

1. **Triệt tiêu 100% các trang trắng trống thừa khi In & Xuất PDF**:
   - Khi in `body.printing-territory-stats`, ẩn hoàn toàn (`display: none !important;`) tất cả các phần tử anh em con của `body` thay vì dùng `visibility: hidden !important;`.
   - Ngăn chặn triệt để hiện tượng trình duyệt phải in 15 trang trắng trống của toàn bộ DOM phía trên trước khi in đến bảng thống kê.
   - Bảng thống kê `#territoryStatsModal` xuất hiện ngay từ Trang 1, tổng số trang chỉ còn 1 - 2 trang giấy.

2. **Căn chỉnh khối chữ ký "CÁN BỘ LẬP BIỂU THỐNG KÊ" chuẩn thể thức hành chính**:
   - Khắc phục lỗi rớt dòng chữ "KÊ" ("CÁN BỘ LẬP BIỂU THỐNG\nKÊ") bằng `white-space: nowrap;` và độ rộng cột tối thiểu phù hợp.
   - Căn khối chữ ký sang góc bên phải trang in (`width: 100%`, flexbox `justify-content: space-between` hoặc `margin-left: auto;`), bên trái là "Nơi nhận:" đúng thể thức chuẩn Nghị định 30/2020/NĐ-CP.

3. **Hiển thị đầy đủ 5 Buttons trên thanh Sidebar Tabs**:
   - Cả 5 button: `Sự Cố`, `Lịch Sử`, `Công An` (hoặc CSGT/PCCC/115), `Cứu Hộ`, `Bệnh Viện` hiển thị đầy đủ, không bị cắt xén chữ ("C..."), không bị mất nút.
   - Sử dụng layout phân bổ co giãn linh hoạt (`flex: 1 1 0`), padding gọn gàng, hỗ trợ thanh cuộn ngang mượt mà khi màn hình cực nhỏ.

## Checklist

- [x] P0: Baseline Actual Status & Problem Identification.
- [x] P1: Sửa CSS `@media print` trong `css/style.css` (Triệt tiêu trang trắng thừa bằng `display: none` cho DOM con của body & fix khối chữ ký cán bộ lập biểu sang lề phải).
- [x] P2: Cập nhật cấu trúc HTML khối in `print-official-footer` trong `dispatcher.html` và hoàn thiện hàm in trong `js/dispatcher.js`.
- [x] P3: Sửa CSS thanh tabs `.sidebar-tabs-nav` và `.sidebar-tab-btn` trong `css/style.css` để hiển thị đầy đủ 5 tabs không bị che khuất.
- [x] P4: Kiểm thử Playwright E2E: Xác nhận không còn trang trắng, bảng bắt đầu từ trang 1, chữ ký căn phải không gãy dòng, 5 tab buttons hiển thị 100%.
- [x] P5: Anvien detect-changes & Commit.
