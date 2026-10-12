# Benchmark - Tích Hợp Gọi Video Trực Ban & Người Dân Di Động & Căn Giữa Nút SOS

## Metadata

- Date: `2026-10-12`
- Plan: `docs/plans/2026-10-12-mobile-video-call-and-sos-orb-center/2026-10-12-mobile-video-call-and-sos-orb-center-plan.md`

## Benchmark Results

- **Orb Vertical Center Offset (Delta Y) Before vs After**:
  - Baseline (Before): ~71.6px – 90.0px deviation from background video wave epicenter.
  - Target: <= 5.0px.
  - Measured (After):
    * iPhone 13 (390x844): **0.24px** (Cải thiện 99.7%)
    * Galaxy S20 (412x915): **0.87px** (Cải thiện 98.8%)
    * iPhone SE (375x667): **0.75px** (Cải thiện 99.0%)
- **Orb Horizontal Center Ratio**:
  * Measured across all devices: **50.0%** (Sai số 0.0%)
- **VieNeu-TTS 48kHz Audio Output Specs**:
  * `sos_prompt_thuy_dung.mp3`: 79.68 KB, 48kHz stereo, duration 9.00s.
  * `sos_prompt_mai_anh.mp3`: 96.14 KB, 48kHz stereo, duration 10.92s.
  * `sos_prompt_truc_ly.mp3`: 84.77 KB, 48kHz stereo, duration 9.48s.
  * `sos_prompt_ngoc_huyen.mp3`: 88.15 KB, 48kHz stereo, duration 10.52s.
  * Pre-pad digital silence: 420ms (zero clipping).
- **Playwright Test Execution Time**:
  * Total suite execution: 8.9s (10/10 assertions PASS).
