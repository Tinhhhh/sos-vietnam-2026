# Minh Chứng Khắc Phục Lỗi In & Xuất PDF Báo Cáo Sự Cố (Evidence Log)

## Metadata
- Date: `2026-10-12`
- Plan Ref: `docs/plans/2026-10-12-print-pdf-layout-fix/2026-10-12-print-pdf-layout-fix-plan.md`

---

## Danh Mục Minh Chứng (Evidence Registry)

| Mã Minh Chứng | Hạng Mục Kiểm Tra | Phương Thức Đo Kiểm | Kết Quả Kỹ Thuật | Trạng Thái |
|---|---|---|---|---|
| **EV-PRINT-01** | Khổ giấy A4 Landscape cho Bảng Thống Kê | Kiểm tra `@page` size khi in `territoryStatsModal` | Khổ ngang A4 297mm x 210mm tự động áp dụng qua dynamic style injection | **ĐẠT (PASS)** |
| **EV-PRINT-02** | Phân bổ tỷ lệ cột chuẩn (8 cột sum = 100%) | Rà soát CSS `nth-child` widths cho `.territory-stats-table` | Cột Nội dung sự cố chiếm 25% (360px), STT 4.5% (65px), không bị đè bẹp | **ĐẠT (PASS)** |
| **EV-PRINT-03** | Khắc phục 100% ngắt chữ theo ký tự đơn lẻ | Kiểm tra từ ngữ tiếng Việt trong cell nội dung sự cố | Hiển thị nguyên cụm từ ("Cần hỗ trợ khẩn cấp"), không bẻ dọc chữ | **ĐẠT (PASS)** |
| **EV-PRINT-04** | Tối ưu số trang in (Page Count Reduction) | Playwright đo số trang in PDF thực tế | File PDF xuất chuẩn A4 landscape 43KB, rút gọn từ 26 trang xuống 1-2 trang | **ĐẠT (PASS)** |
| **EV-PRINT-05** | Anvien detect-changes verification | Chạy `anvien detect-changes --repo sos-vietnam-2026 --scope all` | 3 files changed (`css/style.css`, `dispatcher.html`, `js/dispatcher.js`), 0 affected files, risk level: `low` | **ĐẠT (PASS)** |
