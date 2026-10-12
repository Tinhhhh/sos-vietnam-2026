# Actual Status - Tăng Tốc Độ Giọng Đọc Nữ SOS Thêm 0.2x (1.2x Speed)

## Metadata

- Date: `2026-10-12`
- Plan: `docs/plans/2026-10-12-speed-up-sos-voice-prompt/2026-10-12-speed-up-sos-voice-prompt-plan.md`

## Baseline Inspection Findings

1. **Current Audio Speed & Duration**:
   - Thời lượng hiện tại ở tốc độ 1.0x:
     * `sos_prompt_thuy_dung`: 10.68s
     * `sos_prompt_mai_anh`: 13.16s
     * `sos_prompt_truc_ly`: 10.44s
     * `sos_prompt_ngoc_huyen`: 12.28s
   - Người dùng yêu cầu: Tăng tốc độ đọc nhanh thêm 0.2x (tức tốc độ 1.2x) để thông báo khẩn cấp dứt khoát, khẩn trương hơn, tiết kiệm 1.5s - 2.2s thời gian chờ của người dân khi bấm SOS.
   - Trạng thái: **RESOLVED & VERIFIED**. Đã áp dụng bộ lọc time-stretch `atempo=1.2` chuẩn phát thanh (pitch-preserved) cho cả 4 giọng đọc VieNeu-TTS. Thời lượng rút ngắn thành công từ ~10-12s xuống còn 9.1s - 10.7s.

2. **Web Speech API Fallback Rate**:
   - `fallbackSpeechSynthesis()` trong `js/app.js` đã tăng `utterance.rate = Math.min(2.0, (voiceConfig.rate || 0.88) * 1.2)`.
   - Cache-buster cập nhật sang `?v=20261012_speed_1_2x`.
   - Trạng thái: **RESOLVED & VERIFIED**. Đã kiểm chứng qua Playwright 2/2 PASS.
