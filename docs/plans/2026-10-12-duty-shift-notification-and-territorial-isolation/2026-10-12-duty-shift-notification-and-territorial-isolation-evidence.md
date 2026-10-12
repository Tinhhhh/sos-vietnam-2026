# Bằng Chứng: Sửa Lỗi Thông Báo Ca Trực & Cô Lập Theo Đơn Vị/Địa Bàn

## Evidence Ledger

- **EV-01**: Kiểm thử tự động `test-shift-isolation-gatekeeping.cjs`: Khách truy cập chưa đăng nhập tại `dispatcher.html` có đúng 0 alert dialog, body không có class `officer-authenticated`, `currentOfficer` là null, các modal `dutyShiftModal` và `substituteOfficerModal` bị ẩn hoàn toàn (PASS).
- **EV-02**: Kiểm thử kho lưu trữ bị ô nhiễm `localStorage`/`sessionStorage` với ca trực đã quá giờ (`diffMin <= 0`): Khi chưa xác thực, hệ thống miễn nhiễm 100%, không kích hoạt bất kỳ alert dialog hay modal ca trực nào (PASS).
- **EV-03**: Kiểm thử cô lập đa đơn vị: Đơn vị A (`cahanioi`) lưu ca trực dưới khóa riêng biệt `sos_duty_shift_cahanioi` và không ghi đè khóa dùng chung cũ (`sos_duty_shift`, `SOS_ACTIVE_DUTY_SHIFT`) (PASS).
- **EV-04**: Đơn vị B (`csgthanoi`) lưu ca trực dưới khóa riêng `sos_duty_shift_csgthanoi`, dữ liệu ca của Đơn vị A hoàn toàn độc lập và không bị ảnh hưởng bởi Đơn vị B (PASS).
- **EV-05**: Khi cán bộ đăng xuất, hệ thống dọn sạch `currentOfficer`, `currentDutyShift`, gỡ bỏ class `officer-authenticated`, đóng các modal và gỡ bỏ thanh nhắc nhở `shiftReminderToast` (PASS).
- **EV-06**: Kết quả bộ kiểm thử: 10/10 assertions đạt (100% pass rate). Báo cáo và ảnh chụp màn hình được lưu trữ tại `Reports/qa/playwright/screenshots/shift-gatekeeping-unauthenticated.png`.
