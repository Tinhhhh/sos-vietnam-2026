# Trạng Thái Thực Tế: Sửa Lỗi Thông Báo Ca Trực & Cô Lập Theo Đơn Vị/Địa Bàn

## Baseline Analysis

1. **Vấn đề rò rỉ thông báo khi chưa đăng nhập**:
   - `checkAuth()` trong `js/dispatcher.js` tải profile cũ từ `localStorage.getItem('sos_dispatcher_officer')`. Khi một phiên cũ còn lưu lại (ví dụ sau khi khởi động lại hoặc mở tab mới), hệ thống tự gán `this.currentOfficer` và nạp ca trực cũ.
   - Hàm `updateClock()` trong `js/dispatcher.js` chạy mỗi 1000ms. Khi ca trực cũ hết giờ (`diffMin <= 0`), nó kích hoạt alert `alert("⏰ THÔNG BÁO HẾT GIỜ KÍP TRỰC BAN...")` và gọi `this.openDutyShiftModal()`.
   - Kết quả: Người dùng chưa đăng nhập hoặc đang ở màn hình đăng nhập bị văng ra cảnh báo hết ca của đơn vị trước đó.

2. **Vấn đề cô lập đơn vị và địa bàn**:
   - Các đơn vị trực ban (Công an xã/phường, CSGT, PCCC...) có địa bàn và ca trực độc lập.
   - Khi phát tán sự kiện SSE `duty_shift_update` tại `server.js` dòng 5564, máy chủ dùng `broadcastToDispatchers` mà không kiểm tra đơn vị người nhận, gửi đến toàn bộ client kết nối.
   - Modal phân công ca trực `dutyShiftModal` trong `dispatcher.html` không có phần hiển thị tên đơn vị, cấp hành chính và xã/phường/tỉnh/thành quản lý, khiến cán bộ không thấy rõ ranh giới đơn vị của mình.

3. **Yêu cầu sau khi xử lý**:
   - Màn hình chưa đăng nhập: 0 alert, 0 modal, 0 reminder.
   - Đăng nhập đúng đơn vị: hiển thị chính xác tên đơn vị, cấp, xã/phường, tỉnh/thành; thông báo nhắc ca (còn 15 phút) và hết ca trực có đầy đủ ngữ cảnh địa bàn; không chồng chéo giữa các đơn vị.

## Kết Quả Thực Tế Đã Đạt Được (100% PASS)

1. `js/dispatcher.js`:
   - Hàm `isUnauthenticatedScreenActive()` thiết lập chốt chặn 3 lớp: không có `currentOfficer`, không có class `officer-authenticated`, hoặc đang mở các màn hình Gatekeeper 2002/Cosmic Portal/Modal login.
   - Hàm `updateClock()` kiểm tra `isUnauthenticatedScreenActive()`, chặn 100% các alert/modal và dọn sạch hiển thị khi chưa đăng nhập.
   - Hàm `showShiftReminder(diffMin, unitName, territory, officerDesc)` tạo thanh thông báo nhắc ca (còn 15 phút) gắn liền với định danh Đơn vị và Địa bàn hành chính (xã/phường, quận/huyện, tỉnh/thành phố).
   - `openDutyShiftModal()` và `openSubstituteModal()` hiển thị đầy đủ thẻ định danh đơn vị `#dutyShiftUnitBadge` và `#substituteUnitBadge`.
   - `btnBackGate` và `playLogoutOutroVideo` dọn sạch phiên trực ban, loại bỏ các cờ nhắc ca và xóa toast thông báo.
2. `dispatcher.html`:
   - CSS rule `body:not(.officer-authenticated)` ẩn tuyệt đối `#dutyShiftModal`, `#substituteOfficerModal`, và `#shiftReminderToast`.
   - Thêm thẻ định danh đơn vị & địa bàn cho `#dutyShiftModal` và `#substituteOfficerModal`.
3. `server.js`:
   - Phân quyền luồng SSE `duty_shift_update` chỉ gửi đến client có đúng username đơn vị hoặc tài khoản quốc gia / admin, tuyệt đối không gửi đến client nặc danh hoặc đơn vị khác.
4. Kiểm thử tự động E2E:
   - 10/10 assertions đạt (100% pass) trong `playwright/test-shift-isolation-gatekeeping.cjs`.

