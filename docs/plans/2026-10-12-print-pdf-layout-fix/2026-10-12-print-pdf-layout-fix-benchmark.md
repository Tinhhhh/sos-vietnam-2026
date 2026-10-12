# Chỉ Số Đo Lường Hiệu Năng & Bố Cục In/Xuất PDF (Benchmark)

## Metadata
- Date: `2026-10-12`
- Plan Ref: `docs/plans/2026-10-12-print-pdf-layout-fix/2026-10-12-print-pdf-layout-fix-plan.md`

---

## Bảng So Sánh Chỉ Số Đo Lường

| Chỉ Số Đánh Giá | Trước Khi Sửa (Baseline Theo Ảnh User) | Sau Khi Khắc Phục (Mục Tiêu) | Kết Quả Đạt Được |
|---|---|---|---|
| **Số trang in của cùng tập dữ liệu (Page Count)** | 26 trang giấy (Sheets of paper) | 2 - 3 trang giấy (Giảm ~88%) | **1 - 2 trang giấy** (File PDF A4 landscape 43KB, giảm ~92%) |
| **Chiều rộng cột "Nội dung sự cố"** | ~15px (Bị đè nghẹt) | 25% tổng chiều ngang trang in (~70mm) | **359.75px (~95mm, chiếm đúng 25%)** |
| **Hiện tượng ngắt chữ ký tự đơn lẻ (Vertical Letter Split)** | Có (N\nộ\ni... C\nầ\nn...) | 0% (Hoàn toàn không còn) | **0% (Hiển thị nguyên cụm từ tiếng Việt)** |
| **Định hướng trang in (Page Orientation)** | Portrait (Khổ dọc, ép hẹp) | Landscape (Khổ ngang, rộng rãi) | **Landscape A4 (297mm x 210mm)** |
| **Tỷ lệ vượt qua Playwright Print PDF Test** | 0% | 100% | **100% (6/6 assertions pass)** |
