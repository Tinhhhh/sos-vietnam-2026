# Sửa Lỗi Đàm Thoại 2 Chiều & Bắt Giọng Nói Giữa Các Thiết Bị Khác Nhau Plan

## Metadata

- Date: `2026-10-11`
- Status: `draft`
- Plan: `docs/plans/2026-10-11-fix-cross-device-webrtc-voice-call/2026-10-11-fix-cross-device-webrtc-voice-call-plan.md`
- Evidence: `docs/plans/2026-10-11-fix-cross-device-webrtc-voice-call/2026-10-11-fix-cross-device-webrtc-voice-call-evidence.md`
- Benchmark: `docs/plans/2026-10-11-fix-cross-device-webrtc-voice-call/2026-10-11-fix-cross-device-webrtc-voice-call-benchmark.md`
- Actual status: `docs/plans/2026-10-11-fix-cross-device-webrtc-voice-call/2026-10-11-fix-cross-device-webrtc-voice-call-actual-status.md`

## Goal

Khắc phục hoàn toàn lỗi tính năng đàm thoại thoại khẩn cấp (WebRTC Voice Call) và ghi âm 2 bên không bắt được giọng nói của hai thiết bị khác nhau (mobile phone / desktop PC / máy tính bảng hoặc 2 máy tính trên mạng LAN/Internet). Đảm bảo kết nối thông suốt giữa Người dân <-> Cán bộ trực ban và Cán bộ trực ban <-> Trụ sở/Đơn vị công an tác chiến, truyền tải âm thanh 2 chiều trong trẻo, có thước đo sóng âm trực quan thời gian thực (dual audio level indicators) và ghi âm chuẩn MP3 đủ cả 2 luồng tiếng.

## Rules

- Complete P0 actual status before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence as work completes.
- Record benchmarkable counts or measurements when they are taken.
- Update later phase status assumptions, next actions, and work steps when actual-status evidence changes the repo state.
- After completing a phase or implementation slice and refreshing `actual-status.md`, update the next affected phase's work steps as needed to match the latest repo reality, while preserving that phase's original goal, scope, acceptance criteria, and major phase order.
- Run Anvien detect-changes before every implementation-slice commit when implementation work was performed.
- For public runtime or UI-facing changes, validate the real user-visible runtime with browser or Playwright evidence.
- Every implementation phase must be decomposed into multiple implementation slices that are as small as practical.
- Hidden fallback is forbidden. Prefer a visible failure over a fallback that hides a broken primary path.
- Tuân thủ nghiêm ngặt Nghị định 13/2023/NĐ-CP: âm thanh đàm thoại và file ghi âm lưu trữ cục bộ phía client, tự giải phóng RAM sau khi tải, không gửi luồng âm thanh lưu trữ trên máy chủ.

## Problem

1. **Định tuyến tín hiệu Signaling bị tắc nghẽn khi gọi liên đơn vị / cán bộ tác chiến**: Trong `server.js`, khi cán bộ trực ban gọi sang đơn vị công an địa bàn (`targetUnit`) như trong ảnh thực tế (#SOS-MV3JOLZ2-132), tín hiệu `sender === 'dispatcher'` chỉ được đẩy tới `notifyCitizen`. Thiết bị cán bộ/trực ban thứ 2 không nhận được tín hiệu đổ chuông thoại, khiến màn hình bị treo vô tận ở trạng thái `📞 Đang kết nối kênh thoại tác chiến tới Trung Tâm Thông Tin Chỉ Huy...`. Đồng thời trong `js/dispatcher.js`, `if (signal.sender === 'dispatcher') return;` đã vội vàng loại bỏ mọi tín hiệu từ cán bộ khác.
2. **Ghi âm 2 bên trong `js/dispatcher.js` truyền tham số `(null, null, canvas)`**: Tại dòng 8022 của `js/dispatcher.js`, hàm `startRecording` được gọi với `null, null`, dẫn tới luồng âm thanh đối phương (`remoteSource`) hoàn toàn bị bỏ qua (bằng 0), không bao giờ được đưa vào bộ trộn AudioContext, đồng thời ép trình duyệt xin quyền micro lần 2 gây xung đột.
3. **Phím Bật/Tắt Mic của trực ban bị tê liệt khi chưa bấm ghi âm**: Hàm `toggleVoiceCallMic()` chỉ kiểm tra `this.voiceCallRecorder.localStream`, nếu chưa kích hoạt ghi âm thì không thể tắt/bật mic của WebRTC stream.
4. **Hạn chế STUN server đơn lẻ qua mạng khác nhau (Cross-Network NAT/Firewall)**: Cả 2 phía chỉ cấu hình 1 STUN server Google (`stun:stun.l.google.com:19302`), thiếu các server dự phòng (`stun.cloudflare.com`, `stun1/stun2.l.google.com`) khiến ICE connection bị ngắt kết nối hoặc failed khi gọi giữa 4G/5G và Wi-Fi hoặc 2 mạng NAT khác nhau.
5. **Chặn Microphone trên HTTP không an toàn khi truy cập IP LAN giữa 2 thiết bị**: Khi thiết bị thứ 2 truy cập qua IP LAN (`http://192.168.x.x:3000`), trình duyệt coi đây là Insecure Context và vô hiệu hóa `navigator.mediaDevices`. Hệ thống cần hỗ trợ HTTPS tự sinh chứng chỉ bảo mật hoặc cổng HTTPS kèm thông báo/hướng dẫn trực quan.
6. **Bộ trộn âm thanh (AudioContext Mixer) trong `js/call-audio-recorder.js` thiếu cơ chế gắn luồng động (dynamic remote track attach) và bị dội âm phản hồi (feedback loop)**: `mixedAudioSource` nối trực tiếp vào `destination` khiến tiếng nói của chính mình bị dội ngược ra loa gây hú/feedback mic.

## Scope

- In scope:
  - `server.js`: Định tuyến tín hiệu WebRTC voice call linh hoạt (hỗ trợ cả Citizen <-> Dispatcher và Dispatcher <-> Target Unit / Inter-agency Dispatcher), hỗ trợ kết nối an toàn HTTPS song song với HTTP để mở khóa `getUserMedia` trên thiết bị khác qua LAN.
  - `js/dispatcher.js`: Khắc phục `openDispatcherVoiceCall`, truyền đúng `localStream` và `remoteStream` vào `CallAudioRecorder`, sửa `toggleVoiceCallMic`, cập nhật cấu hình đa STUN server, bổ sung thước đo âm lượng 2 chiều (Voice Activity Meters).
  - `js/app.js`: Tối ưu hóa `startCitizenVoiceCall`, `handleVideoCallSignal`, đa STUN server, tự động kích hoạt AudioContext & unblock autoplay, hiển thị trực quan sóng âm 2 chiều.
  - `js/call-audio-recorder.js`: Thêm phương thức `attachRemoteStream(stream)` gắn luồng đối phương linh hoạt, ngắt kết nối dội âm (mute feedback to destination), đảm bảo âm thanh MP3 đầu ra hòa trộn rõ cả 2 giọng nói.
  - `dispatcher.html` & `index.html`: Cập nhật UI modal đàm thoại để có visualizer âm lượng 2 bên (Mic của bạn vs Giọng đối phương).
  - `playwright/`: Kịch bản kiểm thử tự động 2 ngữ cảnh trình duyệt độc lập (2-device simulated contexts) chứng minh 2 luồng âm thanh được bắt và truyền tải đầy đủ.
- Out of scope:
  - Máy chủ SIP/PSTN truyền thống của nhà mạng viễn thông.
  - Lưu trữ vĩnh viễn file ghi âm lên cơ sở dữ liệu server (tuân thủ bảo mật NĐ 13/2023).

## Non-Goals

- Không thay thế kiến trúc WebRTC P2P hiện có bằng SFU/MCU bên thứ ba (để giữ hệ thống hoàn toàn tự chủ, gọn nhẹ và miễn phí).
- Không can thiệp vào các logic nghiệp vụ điều xe, bản đồ ranh giới đã ổn định.

## Requirements

1. **Signaling Routing**: Khi một bên khởi tạo cuộc gọi thoại khẩn cấp (dù là người dân hay cán bộ trực ban gọi đơn vị tác chiến), thiết bị nhận phải lập tức nhận được tín hiệu qua SSE / Signal API và hiển thị modal đổ chuông kèm âm thanh thực tế.
2. **Audio Track Transmission**: Cả hai thiết bị phải truyền thành công AudioTrack qua RTCPeerConnection, ICE state chuyển sang `connected`/`completed`.
3. **Dual-Channel Recording**: Nút `BẮT ĐẦU GHI ÂM (2 BÊN)` trên cả Trực ban và Người dân phải thu được cả giọng nói của chính mình (Local Audio) và giọng nói của người đối thoại (Remote Audio) vào cùng 1 tệp MP3 tải về.
4. **Mic Control & Feedback Prevention**: Nút `Bật/Tắt Mic` hoạt động tức thì ở mọi thời điểm của cuộc gọi; tiếng nói micro cục bộ không bị dội ngược ra loa của chính mình gây hú mic.
5. **Multi-STUN & Robust ICE**: Tích hợp danh sách đa máy chủ STUN quốc tế và khu vực; hỗ trợ ICE restart khi mất mạng.
6. **Cross-Device Usability & HTTPS/LAN**: Cung cấp cổng HTTPS hoặc hướng dẫn bảo mật khi truy cập giữa các thiết bị trên mạng nội bộ để trình duyệt cấp quyền Microphone 100%.

## Acceptance Criteria

1. Khi cán bộ trực ban bấm gọi đàm thoại tới trụ sở đơn vị công an (hoặc tới người dân), thiết bị thứ 2 lập tức đổ chuông và mở modal nhận cuộc gọi.
2. Khi 2 thiết bị kết nối, trạng thái chuyển thành `🟢 ĐÃ KẾT NỐI ĐÀM THOẠI 2 CHIỀU`.
3. Cả hai thiết bị đều bắt được âm thanh: Thước đo âm lượng hiển thị sóng âm khi bên này hoặc bên kia phát tiếng.
4. Bấm `BẬT GHI ÂM (2 BÊN)` và trò chuyện từ cả 2 thiết bị -> bấm kết thúc -> tệp MP3 tải về có đầy đủ âm thanh từ cả 2 người.
5. Nút `Bật/Tắt Mic` chuyển đổi trạng thái mượt mà, tắt mic thì bên kia im lặng, bật mic thì nghe rõ.
6. Kịch bản Playwright kiểm thử 2 thiết bị độc lập (2 Browser Contexts) chạy đạt 100% không có lỗi.

## Checklist

- [x] P0-A: Complete actual status before implementation work.
  - Goal: inspect and classify reality of WebRTC voice call and recording across files.
  - Work Steps: inspect `server.js`, `js/dispatcher.js`, `js/app.js`, `js/call-audio-recorder.js`, record evidence and blast radius.
  - Implementation Gate: no editing starts until `actual-status.md` has final P0 decision.
  - Acceptance: actual status classifies all components with exact evidence IDs.

### P1: Signaling & Inter-Unit Voice Routing Repair

- Phase Goal: Sửa định tuyến WebRTC call signal trong `server.js` và xử lý tín hiệu trong `js/dispatcher.js` & `js/app.js` để mọi cuộc gọi giữa 2 thiết bị (dân <-> cán bộ, cán bộ <-> đơn vị) đều kết nối thông suốt.
- Phase Boundary:
  - In scope: `server.js`, `js/dispatcher.js`, `js/app.js`.
  - Out of scope: UI visualizer styling.
- [x] P1-A: Sửa định tuyến tín hiệu Call Signal trong `server.js`.
  - Goal: Hỗ trợ gọi giữa các đơn vị/cán bộ và giữa người dân với cán bộ, không làm rơi rớt sdp/ice.
  - Work Steps: Điều chỉnh `broadcastToDispatchers` và `notifyCitizen` dựa trên `targetUnit` và `targetIncidentId`, cho phép chuyển tiếp sdp/ice tới đúng thiết bị đối phương.
  - Implementation Gate: P0 complete.
  - Acceptance: API `/api/sos/videocall/signal` và `/api/sos/voicecall/signal` phân phối đúng đối tượng.
- [x] P1-B: Khắc phục tiếp nhận tín hiệu và kết nối RTCPeerConnection đa STUN trong `js/dispatcher.js` & `js/app.js`.
  - Goal: Đón nhận tín hiệu cuộc gọi, cấu hình đa máy chủ STUN (`stun:stun.l.google.com:19302`, `stun:stun1.l.google.com:19302`, `stun:stun.cloudflare.com:3478`), chống timeout offer.
  - Work Steps: Bỏ điều kiện cứng chặn tín hiệu dispatcher, mở rộng polling timeout lên 10s, thiết lập đa STUN, xử lý ICE restart.
  - Implementation Gate: P1-A complete.
  - Acceptance: Hai thiết bị hoàn tất bắt tay SDP offer/answer và ICE candidates.

### P2: Audio Pipeline, Dual-Stream Recording & Mic Control Repair

- Phase Goal: Khắc phục thu âm 2 chiều, chống hú mic và sửa các nút điều khiển Mic/Ghi âm trong `js/call-audio-recorder.js`, `js/dispatcher.js`, `js/app.js`.
- Phase Boundary:
  - In scope: `js/call-audio-recorder.js`, `js/dispatcher.js`, `js/app.js`.
  - Out of scope: Bản đồ sự cố.
- [x] P2-A: Nâng cấp `CallAudioRecorder` hỗ trợ gắn luồng đối phương linh hoạt và chống dội âm.
  - Goal: Gắn `attachRemoteStream` khi nhận track mới, cô lập tiếng local khỏi audio destination để chống hú phản hồi.
  - Work Steps: Thêm `attachRemoteStream(stream)`, kết nối `scriptProcessor` qua `muteGain` (0 gain) trước khi ra `audioCtx.destination`.
  - Implementation Gate: P1 complete.
  - Acceptance: `CallAudioRecorder` trộn chuẩn 2 luồng âm thanh mà không gây tiếng vọng micro.
- [x] P2-B: Sửa truyền tham số ghi âm và điều khiển Micro trong `js/dispatcher.js` và `js/app.js`.
  - Goal: Truyền đúng luồng local & remote vào `startRecording`, sửa `toggleVoiceCallMic` kiểm tra `dispatcherVoiceStream`.
  - Work Steps: Chỉnh sửa hàm `toggleVoiceCallRecording()` và `toggleVoiceCallMic()`.
  - Implementation Gate: P2-A complete.
  - Acceptance: Nút Mic và Ghi âm hoạt động chuẩn xác trên giao diện trực ban và người dân.

### P3: Visual Indicators, HTTPS/LAN Support & Dual-Device Verification

- Phase Goal: Bổ sung thước đo âm lượng 2 chiều, hỗ trợ kết nối an toàn HTTPS cho thiết bị mạng LAN và tự động hóa kiểm thử Playwright.
- Phase Boundary:
  - In scope: `server.js`, `dispatcher.html`, `index.html`, `playwright/`.
- [x] P3-A: Bổ sung thước đo âm lượng 2 chiều trực quan và cảnh báo Secure Context.
  - Goal: Người dùng ở cả 2 đầu nhìn thấy cột sóng âm thanh nhảy khi đối phương nói chuyện.
  - Work Steps: Tạo audio meter / visualizer hiển thị âm lượng Mic của bạn và Mic đối phương trên cả hai modal.
  - Implementation Gate: P2 complete.
  - Acceptance: Giao diện trực quan xác nhận âm thanh đang truyền tải 2 chiều.
- [x] P3-B: Khởi chạy hỗ trợ HTTPS tự động trên server và viết kịch bản Playwright kiểm thử 2 thiết bị.
  - Goal: Hỗ trợ truy cập HTTPS an toàn để mở khóa Mic trên điện thoại di động qua LAN; kiểm thử E2E 2 browser contexts.
  - Work Steps: Tạo script Playwright `playwright/verify-cross-device-webrtc-voice-call.cjs` mô phỏng 2 thiết bị gọi điện cho nhau và ghi âm 2 bên.
  - Implementation Gate: P3-A complete.
  - Acceptance: Playwright test chạy qua 100%, xuất báo cáo bằng chứng tại `Reports/qa/playwright/`.
