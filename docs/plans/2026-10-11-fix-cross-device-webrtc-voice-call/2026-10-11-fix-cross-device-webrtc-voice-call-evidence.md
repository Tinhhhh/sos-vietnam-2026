# Sửa Lỗi Đàm Thoại 2 Chiều & Bắt Giọng Nói Giữa Các Thiết Bị Khác Nhau Evidence Ledger

## Metadata

- Date: `2026-10-11`
- Plan: `docs/plans/2026-10-11-fix-cross-device-webrtc-voice-call/2026-10-11-fix-cross-device-webrtc-voice-call-plan.md`
- Evidence: `docs/plans/2026-10-11-fix-cross-device-webrtc-voice-call/2026-10-11-fix-cross-device-webrtc-voice-call-evidence.md`
- Benchmark: `docs/plans/2026-10-11-fix-cross-device-webrtc-voice-call/2026-10-11-fix-cross-device-webrtc-voice-call-benchmark.md`
- Actual status: `docs/plans/2026-10-11-fix-cross-device-webrtc-voice-call/2026-10-11-fix-cross-device-webrtc-voice-call-actual-status.md`

## Evidence Rules

- Ghi lại bằng chứng xác thực cho từng pha và checklist item.
- Mã định danh bằng chứng theo chuẩn: `E<phase>-<item>-<kind><n>`.
- Khảo sát mã nguồn thực tế và kiểm chứng bằng công cụ Anvien và Playwright.

## E0 - P0 Evidence

Matching plan item(s): `P0-A`

### `E0-P0A-SRC1`: Phân tích định tuyến tín hiệu gọi trong `server.js`
- Dòng 5510-5518 trong `server.js`:
  ```javascript
  if (signalPayload.sender === 'citizen') {
    broadcastToDispatchers('videocall_signal', signalPayload);
    broadcastToDispatchers('voicecall_signal', signalPayload);
  } else {
    notifyCitizen(targetId, 'videocall_signal', signalPayload);
    notifyCitizen(targetId, 'voicecall_signal', signalPayload);
  }
  ```
- Kết luận: Khi một cán bộ (`sender === 'dispatcher'`) gọi cho một đơn vị tác chiến (`targetUnit`), tín hiệu bị gửi sang `notifyCitizen`, bỏ qua hoàn toàn các máy trạm trực ban khác.

### `E0-P0A-SRC2`: Bộ lọc tín hiệu cuộc gọi trong `js/dispatcher.js`
- Dòng 5360 trong `js/dispatcher.js`:
  ```javascript
  const handleCallSignal = async (signal) => {
    if (!signal) return;
    if (signal.sender === 'dispatcher') return;
  ```
- Kết luận: Bất kỳ tín hiệu nào do dispatcher phát ra đều bị máy trực ban khác hủy bỏ ngay lập tức, triệt tiêu khả năng kết nối thoại giữa hai máy tính/thiết bị trực ban.

### `E0-P0A-SRC3`: Hạn chế máy chủ STUN trong `js/dispatcher.js` và `js/app.js`
- Cả hai file đều chỉ khai báo:
  ```javascript
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  ```
- Không có fallback STUN (`stun1.l.google.com`, `stun.cloudflare.com:3478`), khiến kết nối P2P giữa các thiết bị trên mạng khác nhau (ví dụ: máy tính bàn dùng mạng LAN và điện thoại dùng 4G) dễ bị rớt gói tin ICE.

### `E0-P0A-SRC4`: Truyền tham số rỗng vào hàm ghi âm trong `js/dispatcher.js`
- Dòng 8022 trong `js/dispatcher.js`:
  ```javascript
  await this.voiceCallRecorder.startRecording(null, null, canvas);
  ```
- Kết luận: `remoteSource` truyền vào là `null`. Do đó, bộ trộn AudioContext hoàn toàn không kết nối tới luồng âm thanh của người đối diện, file MP3 thu về chỉ có tiếng của máy phát hoặc im lặng.

### `E0-P0A-SRC5`: Nút Bật/Tắt Mic của trực ban bị kiểm tra sai nguồn
- Dòng 8045 trong `js/dispatcher.js`:
  ```javascript
  toggleVoiceCallMic() {
    if (this.voiceCallRecorder && this.voiceCallRecorder.localStream) { ... }
  ```
- Kết luận: Nút kiểm tra stream trong recorder thay vì `this.dispatcherVoiceStream`. Khi người trực ban chưa bấm nút ghi âm, việc bấm Bật/Tắt Mic không có bất kỳ tác dụng nào.

### `E0-P0A-SRC6`: Thiếu cơ chế gắn luồng động trong `CallAudioRecorder`
- `js/call-audio-recorder.js`: `startRecording(localStream, remoteSource, canvasEl)` chỉ nhận `remoteSource` tại thời điểm khởi tạo ban đầu. Nếu `pc.ontrack` nhận được audio sau khi bấm ghi âm, không có cách nào đưa luồng mới vào mixer.

### `E0-P0A-SRC7`: Dội âm mic ra loa trong `js/call-audio-recorder.js`
- Dòng 155 trong `js/call-audio-recorder.js`:
  ```javascript
  mixedAudioSource.connect(this.scriptProcessor);
  this.scriptProcessor.connect(this.audioCtx.destination);
  ```
- Kết luận: Mixer chứa cả tiếng micro của chính mình (`localSource`). Việc kết nối trực tiếp vào `destination` khiến người dùng nghe thấy tiếng vọng của chính mình từ loa, gây hiện tượng hú mic (acoustic feedback loop).

### `E0-P0A-SRC8`: Thiếu thước đo âm lượng 2 chiều trực quan
- Cả `dispatcher.html` và `index.html` chỉ có một canvas nhỏ, không có chỉ số đo âm lượng riêng cho từng kênh (Local vs Remote), người dùng không thể biết bên kia có đang phát ra tiếng hay không.

### `E0-P0A-SRC9`: Không an toàn (Insecure Context) qua IP LAN trên HTTP
- `server.js` chỉ chạy HTTP trên port 3000. Trình duyệt trên thiết bị di động kết nối vào `http://192.168.x.x:3000` sẽ khóa hoàn toàn API `navigator.mediaDevices.getUserMedia`.

### `E0-P0A-FD1` .. `E0-P0A-FD4`: Anvien File Detail & Blast Radius
- `server.js`: 1,240 symbols, 33 outbound files, Blast Radius: CRITICAL.
- `js/dispatcher.js`: 14,118 lines, Risk: HIGH.
- `js/app.js`: 804 symbols, 2 outbound files, Risk: HIGH.
- `js/call-audio-recorder.js`: 50 symbols, Blast Radius: LOW.

## E1 - P1 Evidence

Matching plan item(s): `P1-A`, `P1-B`

- `E1-P1A-SRV1`: Đã cập nhật `server.js` hỗ trợ gọi liên đơn vị tác chiến (`isInterUnitCall`, `callScope: 'inter_unit'`, `targetUnit`). Tín hiệu được broadcast tới dispatchers mục tiêu và hỗ trợ fallback polling `/api/sos/videocall/poll`.
- `E1-P1B-DSP1`: `js/dispatcher.js` sửa `handleCallSignal` bỏ chặn `sender === 'dispatcher'`, bổ sung kiểm tra self-echo, mở rộng timeout polling offer lên 50 lần (5 giây), hỗ trợ tiếp nhận cuộc gọi liên đơn vị tác chiến.
- `E1-P1B-STUN1`: Bổ sung cấu hình đa STUN (`stun:stun.l.google.com:19302`, `stun:stun1.l.google.com:19302`, `stun:stun2.l.google.com:19302`, `stun:stun.cloudflare.com:3478`) và hàm tự động phục hồi kết nối `pc.restartIce()` trên cả `js/dispatcher.js` và `js/app.js`.

## E2 - P2 Evidence

Matching plan item(s): `P2-A`, `P2-B`

- `E2-P2A-REC2`: Thêm phương thức `attachRemoteStream(remoteSource)` trong `js/call-audio-recorder.js`, cho phép gắn luồng tiếng đối phương vào mixer động ngay cả khi remote audio track đến sau khi bấm nút ghi âm.
- `E2-P2A-REC3`: Kết nối `scriptProcessor` qua `muteGain` (gain = 0.0) trước khi ra `audioCtx.destination`, triệt tiêu hoàn toàn hiện tượng dội âm/hú micro ra loa ngoài.
- `E2-P2B-REC1`: Trong `js/dispatcher.js` và `js/app.js`, truyền đầy đủ `(localStream, remoteStream, canvas)` vào `startRecording(...)`.
- `E2-P2B-MIC1`: Sửa nút toggle mic kiểm tra trực tiếp audio track của `dispatcherVoiceStream` hoặc `citizenVoiceStream`, hiển thị trạng thái bật/tắt chính xác.

## E3 - P3 Evidence

Matching plan item(s): `P3-A`, `P3-B`

- `E3-P3A-VU1`: Thêm thanh đo âm lượng 2 chiều trực quan (VU level meters) cho cả Micro của bạn và Giọng đối phương trên `dispatcher.html` (`#voiceCallLocalLevelBar`, `#voiceCallRemoteLevelBar`) và `index.html` (`#citizenVoiceLocalLevelBar`, `#citizenVoiceRemoteLevelBar`).
- `E3-P3B-PW1`: Kịch bản kiểm thử tự động `playwright/verify-cross-device-webrtc-voice-call.cjs` chạy qua 10/10 bước thành công trên 2 trình duyệt độc lập mô phỏng 2 thiết bị khác nhau:
  - ICE connection state: `connected` trên cả Citizen và Dispatcher.
  - Đo mức âm lượng hai chiều nhận được: Citizen = 49.22 RMS, Dispatcher = 44.95 RMS (không câm tiếng).
  - Ghi âm 2 bên xuất file MP3: `GhiAm_CuocGoi_SOS_SOS-MV3RC17F-466_20261011_184628.mp3` dung lượng 48,065 bytes.
  - Báo cáo chính thức lưu tại: `Reports/qa/playwright/verify-cross-device-webrtc-voice-call.json` và `Reports/qa/playwright/verify-cross-device-webrtc-voice-call.md`.

## Closure Evidence

- Đã hoàn tất 100% các hạng mục từ P0 đến P3.
- Dữ liệu âm thanh hoàn toàn tuân thủ Nghị định 13/2023/NĐ-CP: mã hóa và lưu tại RAM trình duyệt client, tải thẳng về máy cục bộ, zero retention trên máy chủ.
- Chạy Anvien change detection xác nhận toàn bộ thay đổi an toàn và nhất quán.
