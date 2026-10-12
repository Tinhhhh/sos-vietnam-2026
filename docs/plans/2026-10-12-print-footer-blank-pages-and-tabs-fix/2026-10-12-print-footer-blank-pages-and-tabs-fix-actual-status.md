# Hiện Trạng Lỗi Trang Trắng Khi In, Khối Chữ Ký Nhảy Dòng & Tab Buttons Bị Khuất

## Metadata
- Date: `2026-10-12`
- Files: `css/style.css`, `dispatcher.html`, `js/dispatcher.js`
- User Evidence:
  1. Ảnh `media_1791813004782_fe303a6c.png`: Hàng tab sidebar chỉ hiện "Sự Cố", "Lịch Sử", "Công An", nút "Cứu Hộ" bị cắt xén thành "C...", nút "Bệnh Viện" bị mất hút.
  2. Ảnh `media_1791813318355_b92186d4.png`: Hộp thoại in hiển thị 16 trang giấy, các trang 1-15 trắng tinh hoàn toàn.
  3. Ảnh `media_1791813333372_18a4a28f.png`: Trang số 16 hiển thị khối "CÁN BỘ LẬP BIỂU THỐNG\nKÊ" bị nhảy dòng chữ "KÊ", nằm lệch về phía bên trái thay vì căn góc bên phải theo thể thức chuẩn.

---

## 1. Nguyên Nhân Gốc Rễ

### Vấn đề 1: Trang trắng trống 1 - 15 khi in
- Trong `css/style.css:8399`, luật in dùng:
  ```css
  body * { visibility: hidden !important; }
  #territoryStatsModal, #territoryStatsModal * { visibility: visible !important; }
  ```
- Thuộc tính `visibility: hidden` ẩn hiển thị đồ họa nhưng **GIỮ NGUYÊN LAYOUT BOX VÀ CHIỀU CAO VẬT LÝ** của tất cả các phần tử trên trang (bản đồ 3D, sidebar, các section khác).
- Toàn bộ các phần tử đứng trước `#territoryStatsModal` trong DOM tạo ra một khoảng trống khổng lồ chiếm 15 trang in trắng tinh! Đến trang 16 mới bắt đầu render `#territoryStatsModal`.

### Vấn đề 2: Khối "CÁN BỘ LẬP BIỂU THỐNG KÊ" bị nhảy dòng và lệch sang trái
- Trong `dispatcher.html:3379-3393` và `css/style.css:8481`:
  - Khối `.print-official-footer` không có `width: 100% !important;`.
  - Khối chữ ký chỉ có `width: 50%` của một container co rút, không có `white-space: nowrap;` nên chữ "KÊ" bị rớt dòng ("CÁN BỘ LẬP BIỂU THỐNG\nKÊ").
  - `justify-content: space-between` không thể dãn rộng hết trang ngang A4 (297mm) do container cha bị co cụm, khiến khối chữ ký bị dồn lệch sang bên trái, sát phần "Nơi nhận:".

### Vấn đề 3: 5 Tab buttons trên Sidebar bị cắt xén và biến mất
- Container `.sidebar-tabs-nav` có chiều rộng theo sidebar (~360px - 440px), trong khi 5 button dùng `white-space: nowrap`, `min-width: fit-content`, `padding: 5px 8px`.
- Tổng chiều rộng của 5 button là ~450px, vượt quá chiều rộng sidebar.
- CSS lại đặt `scrollbar-width: none !important;` và `::-webkit-scrollbar { display: none !important; }`, giấu hoàn toàn thanh cuộn, làm nút "Cứu Hộ" bị cắt xén và nút "Bệnh Viện" bị che khuất hoàn toàn.

---

## 2. Kết Quả Khắc Phục (Resolved Status)

1. **Triệt tiêu 100% trang trắng thừa khi In & PDF**:
   - Sử dụng `body.printing-territory-stats > *:not(#territoryStatsModal) { display: none !important; height: 0 !important; }` để loại bỏ toàn bộ chiều cao của các phần tử DOM anh em.
   - Bảng thống kê hiển thị ngay từ trang đầu tiên (Trang 1), tổng số trang in giảm từ 16 trang xuống còn 1 - 2 trang giấy gọn đẹp.

2. **Căn góc bên phải cho khối chữ ký cán bộ lập biểu & hết rớt dòng chữ "KÊ"**:
   - Khối `.print-official-footer` và `.print-official-footer-row` sử dụng `width: 100% !important; box-sizing: border-box !important;`.
   - Khối chữ ký `.print-official-footer-sign` có `width: 48% !important; margin-left: auto !important; text-align: center !important;`.
   - Tiêu đề `.print-official-footer-sign-title` có `white-space: nowrap !important;` giữ nguyên vẹn cụm từ "CÁN BỘ LẬP BIỂU THỐNG KÊ" trên 1 dòng duy nhất (cao 22px).
   - Tự động điền ngày tháng địa danh (`Cần Thơ, ngày ... tháng ... năm 2026`) đúng chuẩn thể thức hành chính Nghị định 30/2020/NĐ-CP.

3. **100% cả 5 Tab Buttons trên Sidebar hiển thị trọn vẹn**:
   - Các button `.sidebar-tab-btn` sử dụng `flex: 1 1 0 !important; min-width: 0 !important; padding: 5px 3px !important; gap: 3px !important;`.
   - Cả 5 button: `Sự Cố (0)`, `Lịch Sử (0)`, `Công An`, `Cứu Hộ`, `Bệnh Viện` hiển thị đều đặn, không bị cắt cụt icon hay chữ, không bị tràn ra ngoài viền sidebar.
   - Thanh cuộn thanh mảnh 3px với màu cyber cyan hỗ trợ cuộn mượt mà khi co nhỏ màn hình.

4. **Kiểm thử Playwright E2E**:
   - Kịch bản `playwright/verify-print-footer-and-tabs-visibility.cjs` đạt **100% PASS (5/5 assertions)**.
   - Minh chứng lưu tại `Reports/qa/playwright/2026-10-12-print-footer-and-tabs-fix.json`, `.md` và ảnh chụp tại `Reports/qa/playwright/screenshots/`.
