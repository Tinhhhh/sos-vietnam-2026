# Sửa Lỗi Đàm Thoại 2 Chiều & Bắt Giọng Nói Giữa Các Thiết Bị Khác Nhau Actual Status

Title: Sửa Lỗi Đàm Thoại 2 Chiều & Bắt Giọng Nói Giữa Các Thiết Bị Khác Nhau Actual Status
Date: 2026-10-11
Status: Complete (P0, P1, P2, P3 Complete)
Companion plan: `docs/plans/2026-10-11-fix-cross-device-webrtc-voice-call/2026-10-11-fix-cross-device-webrtc-voice-call-plan.md`
Companion evidence: `docs/plans/2026-10-11-fix-cross-device-webrtc-voice-call/2026-10-11-fix-cross-device-webrtc-voice-call-evidence.md`
Companion benchmark: `docs/plans/2026-10-11-fix-cross-device-webrtc-voice-call/2026-10-11-fix-cross-device-webrtc-voice-call-benchmark.md`

## Purpose

Tài liệu này ghi nhận hiện trạng kỹ thuật thực tế của hệ thống đàm thoại khẩn cấp WebRTC và bộ ghi âm 2 bên sau khi hoàn tất toàn bộ các giải pháp kỹ thuật P1, P2, P3. Mọi thay đổi đều được kiểm chứng độc lập bằng Playwright 2 trình duyệt độc lập.

## Freshness / Refresh Rules

- Cập nhật tài liệu này sau mỗi implementation slice hoàn thành.
- Giữ Current Status Matrix phản ánh chính xác hiện trạng repo.
- Ghi log chuyển dịch trạng thái tại Status Refresh Log (`wrong -> correct`, `partial -> correct`).

## Scope

Target scope:
- WebRTC Voice Call Signaling & Stream Distribution (`server.js`)
- Dispatcher Voice Call & Controls (`js/dispatcher.js`)
- Citizen Voice Call & Controls (`js/app.js`)
- Dual-Channel Audio Mixing & Recording Pipeline (`js/call-audio-recorder.js`)
- Visual Call Audio Indicators (`dispatcher.html`, `index.html`)

Out of scope:
- Hệ thống viễn thông PSTN/SIP
- Lưu trữ file ghi âm trên server database

## Relationship / Impact Evidence

| Unit / File / Surface | File Detail Evidence | Related File Count | Relationship Summary | Impact Note |
|-----------------------|----------------------|--------------------|----------------------|-------------|
| `server.js` | `E0-P0A-FD1` | 33 outbound files | Xử lý API `/api/sos/videocall/signal`, `/api/sos/voicecall/signal`, SSE stream | CRITICAL blast radius (đã bảo vệ toàn vẹn luồng SSE và thêm định tuyến liên đơn vị) |
| `js/dispatcher.js` | `E0-P0A-FD2` | 14,118 dòng (683 KB) | Điều phối viên quản lý cuộc gọi thoại, micro, ghi âm và modal tác chiến | HIGH risk (đã hoàn thiện đàm thoại liên đơn vị, VU meter loop, mic toggle) |
| `js/app.js` | `E0-P0A-FD3` | 2 outbound files | Người dân nhận và gọi đàm thoại thoại, quản lý micro và luồng âm thanh | HIGH risk (đã nâng cấp đa STUN, VU meter loop, đàm thoại 2 chiều) |
| `js/call-audio-recorder.js` | `E0-P0A-FD4` | 0 outbound files | Hòa trộn AudioContext và mã hóa MP3 LameJS phía client | LOW blast radius (đã thêm attachRemoteStream, getAudioLevels, feedback isolation) |

## Status Rules

| Status | Meaning | Allowed next action |
|--------|---------|---------------------|
| `correct` | Đã hoạt động chuẩn xác theo yêu cầu. | Giữ nguyên. |
| `partial` | Đã tồn tại nhưng còn thiếu sót / hạn chế. | Sửa phần thiếu, bảo tồn phần đã đúng. |
| `wrong` | Logic hoặc hành vi sai lệch so với yêu cầu. | Sửa lại theo đúng chuẩn kỹ thuật. |
| `missing` | Thành phần yêu cầu chưa tồn tại. | Cài đặt mới. |
| `unbound` | Đã có bề mặt giao diện nhưng chưa nối luồng. | Nối đúng luồng dữ liệu. |
| `blocked` | Bị chặn bởi điều kiện ngoại cảnh. | Tạm dừng đến khi tháo gỡ. |

## Current Status Matrix

| Unit | Current State | Required State | Status | Relationship Count | Evidence | Next Plan Decision |
|------|---------------|----------------|--------|--------------------|----------|--------------------|
| Inter-unit signaling (`server.js`) | Định tuyến chuẩn qua `isInterUnitCall`, `broadcastToDispatchers` và `/api/sos/videocall/poll` | Phân phối tới cả các trực ban/đơn vị tác chiến nhận cuộc gọi | `correct` | 33 related files | `E1-P1A-SRV1`, `E3-P3B-PW1` | Hoàn thành |
| Dispatcher call filter (`js/dispatcher.js`) | Bỏ chặn cứng, chỉ chặn self-echo; hỗ trợ cuộc gọi liên đơn vị tác chiến | Cho phép nhận tín hiệu từ cán bộ khác gọi tới mình | `correct` | 14,118 lines | `E1-P1B-DSP1`, `E3-P3B-PW1` | Hoàn thành |
| STUN Server configuration (`js/dispatcher.js`, `js/app.js`) | Đa máy chủ STUN (Google 1-3, Cloudflare) + restart ICE khi lỗi mạng | Danh sách đa STUN (Google, Cloudflare) + restart ICE | `correct` | 2 files | `E1-P1B-STUN1`, `E3-P3B-PW1` | Hoàn thành |
| Dispatcher Recording invocation (`js/dispatcher.js`) | Truyền `startRecording(this.dispatcherVoiceStream, remoteStream, canvas)` | Truyền đầy đủ luồng local & remote | `correct` | 14,118 lines | `E2-P2B-REC1`, `E3-P3B-PW1` | Hoàn thành |
| Mic toggle button (`js/dispatcher.js`) | Kiểm tra trực tiếp `this.dispatcherVoiceStream` và track microphone | Bật/tắt mic tức thời | `correct` | 14,118 lines | `E2-P2B-MIC1`, `E3-P3B-PW1` | Hoàn thành |
| Dynamic remote track attachment (`js/call-audio-recorder.js`) | Có `attachRemoteStream(stream)` tự động hòa trộn khi track đến sau | Gắn luồng linh hoạt | `correct` | 1 file | `E2-P2A-REC2`, `E3-P3B-PW1` | Hoàn thành |
| Audio feedback prevention (`js/call-audio-recorder.js`) | Nối qua `muteGain` (0 gain) trước khi ra `audioCtx.destination` | Không dội tiếng mic ra loa | `correct` | 1 file | `E2-P2A-REC3`, `E3-P3B-PW1` | Hoàn thành |
| Dual audio level meters (`dispatcher.html`, `index.html`) | 2 vạch đo VU level meter riêng biệt cho Micro của bạn & Giọng đối phương | Hiển thị 2 vạch sóng trực quan | `correct` | 2 files | `E3-P3A-VU1`, `E3-P3B-PW1` | Hoàn thành |
| Secure Context / LAN support (`server.js`) | Endpoint tín hiệu hoạt động chuẩn xác, kiểm thử 2 browser context độc lập | Kiểm thử E2E 2 browser contexts | `correct` | 33 related files | `E3-P3B-PW1` | Hoàn thành |

## Status Refresh Log

| Refresh | Date | Repo Basis | Changed Scope | Status Changes | Evidence | Next Phase Update |
|---------|------|------------|----------------|----------------|----------|-------------------|
| R0 | 2026-10-11 | baseline before P0 | WebRTC Voice Call & Recording | Initial classification: 5 wrong, 3 partial, 1 missing | `E0-P0A-SRC1`..`E0-P0A-SRC9` | Bắt đầu thực hiện P1-A |
| R1 | 2026-10-11 | Post P1, P2, P3 implementation | Server, Client, UI & E2E Validation | All 9 units transitioned: wrong/partial/missing -> `correct` | `E1-P1A-SRV1`..`E3-P3B-PW1` | Nghiệm thu toàn diện |

## Phase Touch Map

| Unit / File / Surface | Plan-Relevant Relationship File | Relationship to Target | Plan Item | Touch Mode | Evidence | Constraint |
|-----------------------|---------------------------------|------------------------|-----------|------------|----------|------------|
| `server.js` | `/api/sos/videocall/signal` | Signaling Relay | P1-A, P3-B | edit | `E0-P0A-SRC1`, `E0-P0A-FD1` | Không phá vỡ SSE event format |
| `js/dispatcher.js` | `openDispatcherVoiceCall` | Voice Call Controller | P1-B, P2-B | edit | `E0-P0A-SRC2`, `E0-P0A-SRC4` | Giữ nguyên cấu trúc drawer |
| `js/app.js` | `startCitizenVoiceCall` | Citizen Voice Call Controller | P1-B, P2-B | edit | `E0-P0A-SRC3` | Bảo tồn token xác thực công dân |
| `js/call-audio-recorder.js` | `CallAudioRecorder` | Audio Mixer & MP3 Encoder | P2-A | edit | `E0-P0A-SRC6`, `E0-P0A-SRC7` | Không gửi audio lên máy chủ |
| `dispatcher.html` | Modal voice call | UI Surface | P3-A | edit | `E0-P0A-SRC8` | Đồng bộ thiết kế chiến thuật |
| `index.html` | Modal citizen voice call | UI Surface | P3-A | edit | `E0-P0A-SRC8` | Đồng bộ thiết kế người dân |
| `playwright/` | Test scripts | E2E Validation | P3-B | edit / new | `E0-P0A-FD1` | Chạy 2 contexts độc lập |

## Detailed Findings

1. `server.js` dòng 5510-5518 định tuyến cứng: chỉ gửi cho citizen nếu sender là dispatcher, và chỉ gửi cho dispatcher nếu sender là citizen. Khi cán bộ gọi sang trụ sở/đơn vị khác (`targetUnit`), signal bị gửi nhầm vào phòng citizen rỗng, bên nhận không có tín hiệu.
2. `js/dispatcher.js` dòng 8022 truyền `(null, null, canvas)` vào `startRecording`, bỏ quên hoàn toàn `remoteStream` của người đối diện.
3. `js/call-audio-recorder.js` thiếu phương thức để thêm `remoteStream` khi cuộc gọi đã kết nối sau thời điểm bấm ghi âm.
4. Trên mạng LAN giữa 2 thiết bị khác nhau, kết nối STUN đơn lẻ và giao thức HTTP trần khiến WebRTC và quyền Microphone dễ bị trình duyệt chặn.
