# Kế Hoạch Sửa Lỗi Thông Báo Ca Trực & Cô Lập Theo Đơn Vị/Địa Bàn

## Metadata

- Date: `2026-10-12`
- Status: `in_progress`
- Plan: `docs/plans/2026-10-12-duty-shift-notification-and-territorial-isolation/2026-10-12-duty-shift-notification-and-territorial-isolation-plan.md`
- Evidence: `docs/plans/2026-10-12-duty-shift-notification-and-territorial-isolation/2026-10-12-duty-shift-notification-and-territorial-isolation-evidence.md`
- Benchmark: `docs/plans/2026-10-12-duty-shift-notification-and-territorial-isolation/2026-10-12-duty-shift-notification-and-territorial-isolation-benchmark.md`
- Actual status: `docs/plans/2026-10-12-duty-shift-notification-and-territorial-isolation/2026-10-12-duty-shift-notification-and-territorial-isolation-actual-status.md`

## Goal

Khắc phục triệt để lỗi thông báo hết ca trực và nhắc ca trực bị đẩy ra màn hình khi người dùng chưa đăng nhập:
1. **Chặn rò rỉ khi chưa đăng nhập**: Khi người dùng chưa đăng nhập (đang ở Gatekeeper mã 2002, Cosmic Portal 4 lực lượng, hoặc Modal Đăng nhập), tuyệt đối KHÔNG hiển thị bất kỳ thông báo, alert, toast hay modal ca trực nào.
2. **Cô lập ca trực theo đúng đơn vị & địa bàn**: Mỗi đơn vị trực ban (Công an xã/phường, CSGT tỉnh/thành, PCCC, Y tế 115...) chỉ nhận và quản lý ca trực của chính mình. Máy chủ và luồng SSE stream chỉ gửi sự kiện ca trực đến đúng tài khoản đơn vị đó.
3. **Hiển thị đầy đủ thông tin đơn vị, xã phường, tỉnh thành khi đăng nhập**:
   - Khi cán bộ đăng nhập vào tài khoản đơn vị, thông báo hết ca hoặc nhắc ca trực (còn 15 phút) phải hiển thị rõ ràng: Tên đơn vị, Địa bàn (Xã/Phường, Quận/Huyện, Tỉnh/Thành phố), Cấp quản lý, Họ tên & cấp bậc cán bộ trực ban phụ trách.
   - Modal giao ca & phân công kíp trực (`dutyShiftModal`) và modal trực thay (`substituteOfficerModal`) hiển thị thẻ thông tin địa bàn và đơn vị trực ban chuẩn hóa.

## Rules

- Complete P0 actual status baseline before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence as work completes.
- Record benchmarkable counts or measurements when they are taken.
- Run Anvien detect-changes before every implementation-slice commit.
- For UI behavior changes, open the real user-visible runtime first and capture Playwright mobile/desktop viewport evidence.
- Playwright scripts must be reusable under `playwright/`, official QA evidence in `Reports/qa/playwright/...` as both `.json` and `.md`.

## Problem

1. `checkAuth()` trong `js/dispatcher.js` tự động đọc dữ liệu cán bộ cũ từ `localStorage.getItem('sos_dispatcher_officer')`, dẫn đến việc một phiên làm việc cũ từ ngày hôm trước hoặc ca trước tự động gán vào đối tượng `this.currentOfficer`.
2. Đồng hồ `updateClock()` chạy định kỳ mỗi giây, khi thấy `this.currentDutyShift` đã qua giờ kết thúc (`diffMin <= 0`), lập tức kích hoạt `alert("⏰ THÔNG BÁO HẾT GIỜ KÍP TRỰC BAN...")` và gọi `this.openDutyShiftModal()`.
3. Hậu quả là ngay tại màn hình chưa đăng nhập (Gatekeeper, Cosmic Portal, hoặc form đăng nhập), một thông báo hết ca của đơn vị trước đó bị bật lên, gây nhầm lẫn và ảnh hưởng nghiêm trọng đến cán bộ trực ban của các đơn vị khác nhau.
4. Máy chủ SSE `broadcastToDispatchers` phát tán `duty_shift_update` đại trà tới mọi client kết nối mà không lọc theo đơn vị đăng nhập.
5. Giao diện modal ca trực thiếu thông tin định danh địa bàn hành chính (xã/phường, tỉnh/thành) của đơn vị.

## Scope

- In scope:
  - `js/dispatcher.js`:
    - Loại bỏ việc auto-login âm thầm từ `localStorage` khi chưa xác thực trong phiên (`sessionStorage`).
    - Thêm hàm kiểm tra trạng thái màn hình chưa đăng nhập `isUnauthenticatedScreenActive()`.
    - Chặn hoàn toàn `updateClock()`, `openDutyShiftModal()`, `openSubstituteModal()` khi chưa đăng nhập.
    - Bổ sung thông báo nhắc ca trực (còn 15 phút) và thông báo hết ca có định danh chính xác Đơn vị + Địa bàn (Xã/Phường, Tỉnh/Thành) + Cán bộ trực ban.
    - Cập nhật hiển thị thẻ đơn vị địa bàn trong `openDutyShiftModal()`.
  - `dispatcher.html`:
    - Thêm thẻ định danh đơn vị & địa bàn hành chính trong `#dutyShiftModal`.
    - Đảm bảo CSS gatekeeping chặn đứng 100% modal ca trực khi chưa đăng nhập.
  - `server.js`:
    - Phân quyền luồng SSE `duty_shift_update`: Chỉ gửi đến client thuộc đúng đơn vị (`authenticatedUser === shift.username`) hoặc admin trung tâm chỉ huy quốc gia.
  - `playwright/verify-duty-shift-isolation-and-notifications.cjs`:
    - Bộ kiểm thử tự động kiểm tra cả màn hình chưa đăng nhập và sau khi đăng nhập của các đơn vị khác nhau.
  - `Reports/qa/playwright/2026-10-12-duty-shift-notification-and-territorial-isolation/`: Báo cáo QA kèm screenshot.
- Out of scope:
  - Thay đổi hệ thống xác thực mật khẩu hay mã bảo vệ Level-0 2002.

## Acceptance Criteria

1. Khi chưa đăng nhập (tại Level-0 Gatekeeper, Cosmic Portal 4 lực lượng, hoặc Modal Đăng nhập), 0 thông báo hết ca, 0 thông báo nhắc ca, 0 modal giao ca xuất hiện.
2. Dữ liệu rác hoặc ca trực cũ trong `localStorage` không thể tự động mở modal ca trực khi chưa đăng nhập.
3. Khi cán bộ đăng nhập vào đơn vị cụ thể (ví dụ: `conganphuongbennghe` - Phường Bến Nghé, TP.HCM):
   - Chỉ hiển thị thông tin ca trực của đúng đơn vị Công an Phường Bến Nghé.
   - Thông báo nhắc ca (còn 15 phút) và thông báo hết ca ghi rõ: "Đơn vị: Công An Phường Bến Nghé - Địa bàn: Phường Bến Nghé, TP Hồ Chí Minh".
4. Đơn vị khác (ví dụ: `catphanoi` - Hà Nội) đăng nhập không bị ảnh hưởng, không nhận ca trực của đơn vị khác qua SSE stream.
5. 100% Playwright tests pass và ghi nhận báo cáo QA đầy đủ.

## Checklist

- [x] P0: Complete actual status baseline.
- [x] P1: Secure Client-side Gatekeeping & Session Isolation in `js/dispatcher.js` (`isUnauthenticatedScreenActive`, suppress all unauthenticated alerts & modals).
- [x] P2: Server-side SSE Stream Scoping in `server.js` (`duty_shift_update` only to matching unit or national admin).
- [x] P3: Territorial & Unit Info Enhancement in `dutyShiftModal` & Notifications in `dispatcher.html` and `js/dispatcher.js`.
- [x] P4: Playwright Automated Verification Suite (`playwright/` & `Reports/qa/playwright/`).
- [ ] P5: Anvien detect-changes & Commit.
