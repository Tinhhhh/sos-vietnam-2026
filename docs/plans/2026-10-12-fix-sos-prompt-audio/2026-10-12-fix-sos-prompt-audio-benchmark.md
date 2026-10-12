# Benchmark - Chuẩn Hóa Khẩu Lệnh Giọng Đọc Nữ SOS Theo Quy Trình Điều Phối

## Metadata

- Date: `2026-10-12`
- Plan: `docs/plans/2026-10-12-fix-sos-prompt-audio/2026-10-12-fix-sos-prompt-audio-plan.md`

## Benchmark Results

- **VieNeu-TTS Audio Format**: 48kHz Stereo / 16-bit PCM WAV & MP3.
- **Pre & Post Padding**: 420ms digital silence.
- **Audio Output Metrics by Voice**:
  * `sos_prompt_thuy_dung`: 10.68s, 1,025,324 bytes WAV / 92,376 bytes MP3.
  * `sos_prompt_mai_anh`: 13.16s, 1,263,404 bytes WAV / 117,312 bytes MP3.
  * `sos_prompt_truc_ly`: 10.44s, 1,002,284 bytes WAV / 96,432 bytes MP3.
  * `sos_prompt_ngoc_huyen`: 12.28s, 1,178,924 bytes WAV / 105,408 bytes MP3.
- **Playwright Test Execution Time**: 3.67s (5/5 PASS).
