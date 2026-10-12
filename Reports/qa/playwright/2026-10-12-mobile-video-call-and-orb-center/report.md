# Mobile Video Call & SOS Orb Wave Centering QA Verification Report

- **Timestamp**: `2026-10-12T09:52:54.083Z`
- **Total Tests**: `10`
- **Passed**: **10 / 10**
- **Failed**: **0**

## Test Details

| Test Case | Status | Details |
|---|---|---|
| [iphone-13-390x844] Nút SOS căn đồng tâm với sóng video nền (|Delta Y| <= 5px) | **PASS** | `{"deltaY":0.24,"orbCenterY":433.93603515625,"videoCenterY":434.1752548828125}` |
| [iphone-13-390x844] Nút SOS căn giữa theo trục ngang (X Ratio ≈ 50%) | **PASS** | `{"centerXRatio":0.5}` |
| [galaxy-s20-412x915] Nút SOS căn đồng tâm với sóng video nền (|Delta Y| <= 5px) | **PASS** | `{"deltaY":0.87,"orbCenterY":470.22593688964844,"videoCenterY":471.09523779296876}` |
| [galaxy-s20-412x915] Nút SOS căn giữa theo trục ngang (X Ratio ≈ 50%) | **PASS** | `{"centerXRatio":0.5}` |
| [iphone-se-375x667] Nút SOS căn đồng tâm với sóng video nền (|Delta Y| <= 5px) | **PASS** | `{"deltaY":0.75,"orbCenterY":341.3858337402344,"videoCenterY":342.13523145446777}` |
| [iphone-se-375x667] Nút SOS căn giữa theo trục ngang (X Ratio ≈ 50%) | **PASS** | `{"centerXRatio":0.5}` |
| [Dispatcher Mobile Drawer] Hiển thị đầy đủ nút Gọi Thoại và [📹 Gọi Video] trong ngăn sự cố di động | **PASS** | `{"drawerVisible":true,"hasVoiceBtn":true,"voiceBtnText":"📞 Gọi & Ghi âm 2 bên","hasVideoBtn":true,"videoBtnText":"📹 Gọi Video"}` |
| [Dispatcher Mobile Video Call] Nhấn [📹 Gọi Video] mở ngay modal đàm thoại hình ảnh hiện trường WebRTC | **PASS** | `{"modalOpened":true}` |
| [Citizen Mobile Tracking] Thẻ đơn vị tiếp nhận hiển thị song song nút Gọi Trực Ban và [📹 Gọi Video] | **PASS** | `{"btnCallVisible":true,"btnCallHref":"tel:024 3825 3448","btnVideoVisible":true,"btnVideoText":"Gọi Video"}` |
| [VieNeu-TTS 48kHz] Các file âm thanh giọng nữ (Thùy Dung, Mai Anh, Trúc Ly, Ngọc Huyền) đạt chuẩn studio 48kHz và dung lượng hợp lệ | **PASS** | `{"thuy_dung":{"mp3Exists":true,"wavExists":true,"mp3Size":79680},"mai_anh":{"mp3Exists":true,"wavExists":true,"mp3Size":96144},"truc_ly":{"mp3Exists":true,"wavExists":true,"mp3Size":84768},"ngoc_huyen":{"mp3Exists":true,"wavExists":true,"mp3Size":88152}}` |

## Artifacts Generated
- `orb-centered-iphone-13-390x844.png`
- `orb-centered-galaxy-s20-412x915.png`
- `orb-centered-iphone-se-375x667.png`
- `dispatcher-mobile-drawer-call-buttons.png`
- `dispatcher-video-call-modal-opened.png`
- `citizen-mobile-tracking-video-call-button.png`
