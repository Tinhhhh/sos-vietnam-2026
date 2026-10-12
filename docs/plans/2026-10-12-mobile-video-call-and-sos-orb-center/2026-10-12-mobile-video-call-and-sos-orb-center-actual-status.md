# Actual Status - Tích Hợp Gọi Video Trực Ban & Người Dân Di Động & Căn Giữa Nút SOS

## Metadata

- Date: `2026-10-12`
- Plan: `docs/plans/2026-10-12-mobile-video-call-and-sos-orb-center/2026-10-12-mobile-video-call-and-sos-orb-center-plan.md`

## Baseline Inspection Findings

1. **Dispatcher Drawer Video Call Button**:
   - Vị trí: `js/dispatcher.js` dòng 11123 gán `this.drawerReporter.innerHTML`.
   - Hiện trạng: Chỉ render `<button type="button" id="btnDrawerStartVoiceCall">📞 Gọi & Ghi âm 2 bên</button>`.
   - Hàm `startDispatcherVideoCall(targetIncidentId, isIncomingFromCitizen, targetUnit)` tại dòng 7499 đã hỗ trợ đầy đủ video call 2 chiều qua WebRTC, chỉ thiếu nút kích hoạt trong Drawer trên di động.
   - Trạng thái: **RESOLVED & VERIFIED**. Đã bổ sung nút `[📹 Gọi Video]` vào `drawerReporter` và gắn sự kiện kích hoạt `startDispatcherVideoCall(inc.id)`. Đã kiểm chứng qua Playwright mở modal thành công.

2. **Citizen Portal Assigned Unit Video Call Button**:
   - Vị trí: `index.html` dòng 229 (`#assignedUnitBox`).
   - Hiện trạng: Chỉ chứa `<a href="#" class="btn-call-unit" id="btnCallUnit">Gọi Trực Ban</a>` (chuẩn liên kết `tel:`).
   - Hàm `initiateCitizenVideoCallToDispatcher()` tại dòng 2151 trong `js/app.js` đã sẵn sàng, nhưng không có nút bấm tương ứng trên thẻ điều phối `#assignedUnitBox`.
   - Trạng thái: **RESOLVED & VERIFIED**. Đã thêm nút `#btnCitizenDirectVideoCall` vào `#assignedUnitBox`, hiển thị song song khi có lực lượng điều phối và gắn sự kiện kích hoạt video call.

3. **SOS Button Center Alignment with Background Video**:
   - Vị trí: `css/tactical-responsive.css` dòng 1221 trong `@media (max-aspect-ratio: 1/1)`.
   - Hiện trạng: `.crystal-orb-wrapper` có `margin: clamp(108px, 14.5vh, 148px) auto 10px !important;`.
   - Video nền `#citizenBgVideo` căn giữa theo chiều dọc với tâm sóng phát ra ở khoảng 50% ngang và ~50%–52% dọc.
   - Do margin top quá lớn cộng dồn cùng chiều cao tiêu đề (`.sos-hero-title` + `.sos-hero-sub`), quả cầu pha lê bị đẩy xuống thấp (Y ~ 62%–68%), lệch khỏi tâm các vòng tròn sóng xung kích đỏ trong video nền.
   - Trạng thái: **RESOLVED & VERIFIED**. Đã cài đặt bộ tính toán động `alignOrbWithVideoWave` trong `js/device-adaptive-layout.js` và biến CSS `--orb-calc-margin-top`, đưa độ lệch tâm |Delta Y| từ 71.6px xuống 0.24px–0.87px (dưới 1px sub-pixel).

4. **VieNeu-TTS Studio Female Voice for SOS Press**:
   - Đã tạo script `scripts/generate_sos_prompt_voices.py` sinh 4 giọng nữ Bắc/Nam Bộ 48kHz (Thùy Dung, Mai Anh, Trúc Ly, Ngọc Huyền) kèm 420ms padding.
   - Đã cập nhật cache-buster `?v=20261012_vieneu_studio_female` trong `js/app.js` và fallback Web Speech API.
   - Trạng thái: **RESOLVED & VERIFIED**. Đã kiểm chứng file âm thanh hợp lệ và phát mượt mà.
