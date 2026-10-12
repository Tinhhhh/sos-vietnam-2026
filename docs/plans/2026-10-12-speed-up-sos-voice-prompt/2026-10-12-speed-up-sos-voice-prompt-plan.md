# Tăng Tốc Độ Giọng Đọc Nữ SOS Thêm 0.2x (1.2x Speed) Plan

## Metadata

- Date: `2026-10-12`
- Status: `completed`
- Plan: `docs/plans/2026-10-12-speed-up-sos-voice-prompt/2026-10-12-speed-up-sos-voice-prompt-plan.md`
- Evidence: `docs/plans/2026-10-12-speed-up-sos-voice-prompt/2026-10-12-speed-up-sos-voice-prompt-evidence.md`
- Benchmark: `docs/plans/2026-10-12-speed-up-sos-voice-prompt/2026-10-12-speed-up-sos-voice-prompt-benchmark.md`
- Actual status: `docs/plans/2026-10-12-speed-up-sos-voice-prompt/2026-10-12-speed-up-sos-voice-prompt-actual-status.md`

## Goal

Tăng tốc độ đọc của bộ khẩu lệnh giọng nữ SOS thêm 0.2x (đạt tốc độ 1.2x) nhằm giúp thông điệp khẩn cấp truyền đạt nhanh chóng, dứt khoát, khẩn trương hơn, không gây cảm giác kéo dài, đồng thời bảo toàn độ trong trẻo, tự nhiên và cao độ chuẩn của giọng nói tiếng Việt.

## Rules

- Complete P0 actual status before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence as work completes.
- Record benchmarkable counts or measurements when they are taken.
- Run Anvien detect-changes before every implementation-slice commit.
- For UI behavior changes, open the real user-visible runtime first and capture Playwright evidence.
- Playwright scripts must be reusable under `playwright/`, official QA evidence in `Reports/qa/playwright/...` as both `.json` and `.md`.

## Problem

Bộ âm thanh hiện tại đọc ở tốc độ 1.0x mất từ 10.44s đến 13.16s. Trong tình huống cứu hộ khẩn cấp, người dân cần nghe thông tin hướng dẫn nhanh, gãy gọn hơn để kịp thời thao tác chọn lực lượng cứu nạn. Tăng tốc độ lên 1.2x (+0.2x) sẽ rút ngắn thời lượng xuống khoảng 8.5s - 10.5s, tạo nhịp điệu khẩn trương, dứt khoát nhưng vẫn giữ trọn vẹn sự êm ái, rõ ràng.

## Scope

- In scope:
  - `scripts/generate_sos_prompt_voices.py`: Thêm bộ lọc time-stretching tốc độ 1.2x (atempo=1.2) giữ nguyên cao độ 48kHz, xuất lại cả 4 giọng nữ MP3/WAV.
  - `assets/sounds/`: Cập nhật các file `sos_prompt_*.{mp3,wav}` với tốc độ 1.2x.
  - `js/app.js`: Cập nhật cache-buster mới `?v=20261012_speed_1_2x` và tăng `utterance.rate` trong `fallbackSpeechSynthesis()`.
  - `playwright/verify-sos-audio-speed-1-2x.mjs`: Bộ kiểm thử Playwright đo đạc thời lượng rút ngắn và sự kiện kích hoạt audio trên mobile.
  - `Reports/qa/playwright/2026-10-12-speed-up-sos-voice-prompt/`: Báo cáo QA kèm bằng chứng.
- Out of scope:
  - Sửa đổi nội dung văn bản (đã hoàn thiện ở bước trước).

## Acceptance Criteria

1. Cả 4 file âm thanh VieNeu-TTS (Thùy Dung, Mai Anh, Trúc Ly, Ngọc Huyền) được tăng tốc đúng 1.2x (+0.2x), thời lượng rút ngắn tỉ lệ nghịch chính xác 1/1.2 (~17% thời gian), không bị méo tiếng, không bị thay đổi cao độ (pitch-preserved).
2. Định dạng xuất giữ nguyên 48kHz chất lượng phòng thu, có đủ 420ms padding đầu và đuôi.
3. Cache-buster trong `js/app.js` được cập nhật sang `?v=20261012_speed_1_2x`.
4. Bộ kiểm thử Playwright xác nhận 100% test cases PASS và xuất báo cáo QA chuẩn.

## Checklist

- [x] P0: Complete actual status baseline.
- [x] P1: Update generator script with 1.2x pitch-preserved time-stretch & synthesize audio files (`scripts/generate_sos_prompt_voices.py` & `assets/sounds/`).
- [x] P2: Update audio player cache-buster & fallback speech rate in `js/app.js`.
- [x] P3: Playwright Automated Verification & Evidence Capture (`playwright/` & `Reports/qa/playwright/`).
- [x] P4: Anvien detect-changes & Commit.
