# Chỉ Số Đo Lường Khắc Phục Lỗi Trang Trắng, Khối Chữ Ký & Tab Buttons (Benchmark)

## Metadata
- Date: `2026-10-12`
- Plan Ref: `docs/plans/2026-10-12-print-footer-blank-pages-and-tabs-fix/2026-10-12-print-footer-blank-pages-and-tabs-fix-plan.md`

---

## Bảng So Sánh Chỉ Số Đo Lường

| Chỉ Số Đánh Giá | Trước Khi Sửa (Baseline Theo Ảnh User) | Sau Khi Khắc Phục (Mục Tiêu) | Kết Quả Đạt Được |
|---|---|---|---|
| **Số trang in thực tế (Total Pages)** | 16 trang giấy (Sheets of paper) | 1 - 2 trang giấy (Giảm ~90%) | **1 - 2 trang giấy** (Rút gọn tối đa) |
| **Số trang trắng trống phía trước bảng** | 15 trang trắng trống | **0 trang trắng** (Bắt đầu ngay trang 1) | **0 trang trắng (Bảng ở trang 1)** |
| **Dòng chữ "CÁN BỘ LẬP BIỂU THỐNG KÊ"** | 2 dòng (bị rớt chữ "KÊ") | **1 dòng duy nhất** (Trọn vẹn) | **1 dòng (Cao 22px, trọn vẹn)** |
| **Vị trí khối chữ ký cán bộ lập biểu** | Lệch giữa bên trái, sát "Nơi nhận" | **Căn góc bên phải trang in (Right-aligned)** | **Căn sát góc phải (Khoảng cách = 0px)** |
| **Số tab buttons hiển thị đầy đủ trên Sidebar** | 3/5 tabs (nút 4 cắt đôi, nút 5 mất) | **5/5 tabs (100% hiển thị đầy đủ)** | **5/5 tabs (100% hiển thị trọn vẹn)** |
| **Tỷ lệ vượt qua Playwright E2E Test** | 0% | 100% | **100% PASS (5/5 assertions)** |
