# Hiện Trạng Lỗi In & Xuất PDF Báo Cáo Sự Cố (Actual Status Baseline)

## Metadata
- Date: `2026-10-12`
- Target: `css/style.css`, `dispatcher.html`, `js/dispatcher.js`
- User Bug Report: Người dùng chụp ảnh hộp thoại in Chrome/Brother MFC-L2700DV hiển thị 26 trang giấy, cột "Nội dung sự cố" và "STT" bị bóp nghẹt thành 1 chữ cái mỗi dòng.

---

## 1. Phân Tích Nguyên Nhân Gốc Rễ (Root Cause Analysis)

1. **Khổ giấy ép cố định A4 Portrait**:
   - `css/style.css:3542` quy định `@page { size: A4 portrait; margin: 8mm 12mm 8mm 12mm; }`.
   - Bảng tổng hợp chi tiết gồm 8 cột thông tin nhưng bị ép vào khổ dọc (chiều rộng chỉ có 186mm).
2. **Kích thước cột dạng pixel cố định làm đè bẹp cột Nội Dung Sự Cố**:
   - Trong `dispatcher.html:3360-3367`, các cột khác có inline `width: 170px`, `width: 150px`, `width: 130px`, `width: 115px`, `width: 130px`, `width: 40px` (tổng cộng 850px).
   - Cột "Nội Dung Sự Cố" không được set width, nên khi co lại trên trang in chỉ còn ~15px.
3. **Thuộc tính `word-break: break-word`**:
   - Trong `css/style.css:8517`, áp dụng `word-break: break-word !important;` khiến từ ngữ bị bẻ vụn từng ký tự khi ô quá hẹp: "N\nộ\ni\nd\nu\nn\ng\nS\nự\nc\nố", "C\nầ\nn\nh\nỗ\nt\nr\nợ...".
   - Mỗi ký tự chiếm 1 dòng làm một hàng phình to 20 dòng, kéo dài thành 26 trang giấy.
4. **Chưa inject `@page` landscape khi in bảng thống kê**:
   - `js/dispatcher.js:14686` chỉ gọi `window.print()` mà chưa gán quy tắc định hướng khổ giấy ngang cho trình duyệt.

---

## 2. Kết Quả Khắc Phục (Resolved Status)

- **Định hướng in**: Dynamic style injection `@media print { @page { size: A4 landscape !important; margin: 8mm 10mm !important; } }` tự động đưa trình duyệt về khổ ngang A4 (297mm x 210mm).
- **Phân bổ tỷ lệ cột**: Cột "Nội Dung Sự Cố" mở rộng lên 25% (~360px), cột STT 4.5% (~65px), bảng sử dụng `table-layout: fixed; width: 100%;`.
- **Triệt tiêu bẻ chữ dọc**: Dùng `word-break: normal !important; overflow-wrap: break-word !important;`, các từ ngữ tiếng Việt hiển thị nguyên vẹn theo hàng ngang.
- **Tiết kiệm giấy in**: Từ 26 trang giấy rút gọn xuống còn 1 - 2 trang gọn đẹp (giảm hơn 90% số trang).
- **Kiểm thử tự động Playwright**: `playwright/verify-print-pdf-landscape-layout.cjs` đạt 6/6 assertions PASS; file PDF mẫu lưu tại `Reports/qa/playwright/BaoCao_ThongKe_SuCo_SOS_VietNam_2026.pdf`.
