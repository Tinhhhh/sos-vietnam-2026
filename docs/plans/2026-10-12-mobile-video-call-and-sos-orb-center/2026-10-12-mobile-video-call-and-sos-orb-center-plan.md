# Tích Hợp Gọi Video Trực Ban & Người Dân Trên Di Động & Căn Giữa Quả Cầu SOS Đồng Tâm Sóng Nền Plan

## Metadata

- Date: `2026-10-12`
- Status: `completed`
- Plan: `docs/plans/2026-10-12-mobile-video-call-and-sos-orb-center/2026-10-12-mobile-video-call-and-sos-orb-center-plan.md`
- Evidence: `docs/plans/2026-10-12-mobile-video-call-and-sos-orb-center/2026-10-12-mobile-video-call-and-sos-orb-center-evidence.md`
- Benchmark: `docs/plans/2026-10-12-mobile-video-call-and-sos-orb-center/2026-10-12-mobile-video-call-and-sos-orb-center-benchmark.md`
- Actual status: `docs/plans/2026-10-12-mobile-video-call-and-sos-orb-center/2026-10-12-mobile-video-call-and-sos-orb-center-actual-status.md`

## Goal

Hoàn thiện 3 điểm người dùng yêu cầu trên giao diện di động (Mobile Web / Smart Mobile Devices):
1. **Giao diện trực ban trên điện thoại (`dispatcher.html` & `js/dispatcher.js`)**: Bổ sung nút `[📹 Gọi Video]` nổi bật ngay trong ngăn thông tin sự cố cơ động (`#activeIncidentDrawer`) cạnh nút Gọi Thoại, cho phép cán bộ trực ban kích hoạt cuộc gọi truyền hình video tác chiến WebRTC 2 chiều tới người dân ngay trên điện thoại.
2. **Giao diện người dân trên điện thoại (`index.html` & `js/app.js`)**: Bổ sung nút `[📹 Gọi Video Trực Ban]` trực quan trên thẻ đơn vị tiếp nhận điều phối (`#assignedUnitBox`), kết nối trực tiếp với luồng `initiateCitizenVideoCallToDispatcher()` để người dân có thể bấm gọi video hiện trường tới trung tâm chỉ huy tức thì.
3. **Căn chỉnh quả cầu SOS (`.crystal-orb-wrapper`) đồng tâm tuyệt đối với tâm sóng video nền (`#citizenBgVideo`)**: Chuẩn hóa căn chỉnh responsive đa tỉ lệ màn hình di động (iPhone, Samsung Galaxy, màn hình tỉ lệ 9:16, 9:19.5, 9:20), loại bỏ các khoảng đệm margin cứng làm lệch nút SOS, đảm bảo quả cầu pha lê nằm chính xác giữa lòng bàn tay và tâm các vòng tròn sóng xung kích đỏ lan tỏa trong video nền.

## Rules

- Complete P0 actual status before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence as work completes.
- Record benchmarkable counts or measurements when they are taken.
- Run Anvien detect-changes before every implementation-slice commit.
- For UI behavior changes, open the real user-visible runtime first and capture Playwright mobile viewport evidence.
- Playwright scripts must be reusable under `playwright/`, official QA evidence in `Reports/qa/playwright/...` as both `.json` and `.md`.

## Problem

1. **Giao diện điện thoại Trực ban thiếu nút Gọi Video trong Drawer**:
   - Khi cán bộ trực ban mở chi tiết sự cố trên mobile (`#activeIncidentDrawer`), mục thông tin người báo (`this.drawerReporter.innerHTML`) chỉ có nút `[📞 Gọi & Ghi âm 2 bên]`.
   - Nút `#btnStartVideoCall` trong `dispatcher.html` bị ẩn cứng `display: none !important;`. Trên thiết bị di động không có cách nào bấm gọi video trực tiếp cho người dân từ drawer sự cố đang xử lý.
2. **Giao diện Người dân thiếu nút Gọi Video ở thẻ đơn vị tiếp nhận**:
   - Thẻ `#assignedUnitBox` chỉ có liên kết điện thoại chuẩn `tel:` (`#btnCallUnit`).
   - Mặc dù hệ thống đã có sẵn WebRTC video signaling và hàm `initiateCitizenVideoCallToDispatcher()`, người dân nhìn vào thẻ công an phường tiếp nhận không thấy nút Gọi Video, gây khó khăn cho việc truyền hình ảnh hiện trường cứu nạn khẩn cấp.
3. **Quả cầu SOS lệch tâm so với vòng tròn sóng xung kích của video nền**:
   - Video nền `#citizenBgVideo` (`sos-citizen-bg-*.mp4`) có tâm các vòng sóng lan tỏa và đôi bàn tay nâng quả cầu ở tọa độ xấp xỉ 50% ngang và 48%–52% dọc.
   - Trong `css/tactical-responsive.css` (dòng 1221), `.crystal-orb-wrapper` bị đặt `margin: clamp(108px, 14.5vh, 148px) auto 10px !important;` kết hợp với tiêu đề `.sos-hero` bên trên làm cho quả cầu bị đẩy tụt xuống dưới đáy, đè lên phần dưới bàn tay và lệch xa khỏi tâm các vòng sóng đồng tâm.

## Scope

- In scope:
  - `dispatcher.html` & `js/dispatcher.js`: Thêm nút Gọi Video vào `#activeIncidentDrawer` (`drawerReporter`), gán sự kiện kích hoạt `startDispatcherVideoCall(inc.id)`.
  - `index.html` & `js/app.js`: Thêm nút `#btnCitizenDirectVideoCall` vào thẻ `#assignedUnitBox`, gán sự kiện gọi `initiateCitizenVideoCallToDispatcher()`, hiển thị khi ca cứu hộ có đơn vị tiếp nhận.
  - `css/tactical-responsive.css` & `css/style.css`: Hiệu chỉnh căn giữa theo trục thẳng đứng của `.sos-hero` và `.crystal-orb-wrapper`, đồng bộ vị trí tâm với video nền `#citizenBgVideo`.
  - `playwright/verify-mobile-video-call-and-orb-center.mjs`: Bộ kiểm thử Playwright đo tọa độ tâm quả cầu vs tâm sóng video, kiểm tra sự hiện diện và hoạt động của 2 nút Gọi Video trên mobile viewport (`390x844` và `412x915`).
  - `Reports/qa/playwright/`: Báo cáo QA kèm ảnh chụp màn hình minh chứng.
- Out of scope:
  - Sửa đổi giao thức WebRTC backend hay SIP/PSTN.

## Acceptance Criteria

1. Trên màn hình Trực ban di động (mobile viewport), mở ngăn sự cố `#activeIncidentDrawer` hiển thị đầy đủ 2 nút: `[📞 Gọi & Ghi âm 2 bên]` và `[📹 Gọi Video]`. Bấm `[📹 Gọi Video]` mở ngay modal cuộc gọi video WebRTC tới người dân.
2. Trên màn hình Người dân di động đang theo dõi ca cứu hộ, thẻ đơn vị phụ trách `#assignedUnitBox` hiển thị đồng thời cả `[📞 Gọi Trực Ban]` và `[📹 Gọi Video]`. Bấm `[📹 Gọi Video]` kích hoạt ngay luồng WebRTC video call tới trực ban.
3. Trên màn hình trang chủ Người dân ở các kích thước di động (iPhone 390px, Galaxy 412px, iPad portrait), quả cầu SOS (`.crystal-orb-wrapper`) được căn chỉnh đồng tâm hoàn hảo với tâm các vòng sóng xung kích của video nền, nằm trọn vẹn trong đôi bàn tay nâng đỡ.
4. Kịch bản Playwright kiểm thử tự động xác nhận thành công 100%, ghi lại ảnh chụp màn hình đối chiếu với ảnh lỗi người dùng gửi.

## Checklist

- [x] P0: Complete actual status baseline.
- [x] P1: Add Mobile Video Call Button to Dispatcher Drawer (`dispatcher.html` & `js/dispatcher.js`).
- [x] P2: Add Mobile Video Call Button to Citizen Tracking Screen (`index.html` & `js/app.js`).
- [x] P3: Align SOS Orb Center with Background Video Concentric Wave Rings (`css/tactical-responsive.css` & `css/style.css`).
- [x] P4: Playwright Automated Verification & Mobile Evidence Capture (`playwright/` & `Reports/qa/playwright/`).
- [x] P5: Anvien detect-changes & Commit.
