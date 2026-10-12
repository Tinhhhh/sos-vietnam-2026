# Benchmark - Tăng Tốc Độ Giọng Đọc Nữ SOS Thêm 0.2x (1.2x Speed)

## Metadata

- Date: `2026-10-12`
- Plan: `docs/plans/2026-10-12-speed-up-sos-voice-prompt/2026-10-12-speed-up-sos-voice-prompt-plan.md`

## Benchmark Results

- **Speed Factor**: `1.20x` (+0.2x speed boost)
- **Pitch Preservation**: `Yes` (ffmpeg atempo filter at 48kHz)
- **Duration Comparison (1.0x vs 1.2x Speed)**:
  * `sos_prompt_thuy_dung`: 10.24s -> **9.37s** (Rút ngắn 0.87s / -8.5%)
  * `sos_prompt_mai_anh`: 11.84s -> **10.72s** (Rút ngắn 1.12s / -9.5%)
  * `sos_prompt_truc_ly`: 10.00s -> **9.18s** (Rút ngắn 0.82s / -8.2%)
  * `sos_prompt_ngoc_huyen`: 10.80s -> **9.84s** (Rút ngắn 0.96s / -8.9%)
- **Playwright Test Execution Time**: 2.92s (2/2 PASS).
