# Evidence - Tích Hợp Gọi Video Trực Ban & Người Dân Di Động & Căn Giữa Nút SOS

## Metadata

- Date: `2026-10-12`
- Plan: `docs/plans/2026-10-12-mobile-video-call-and-sos-orb-center/2026-10-12-mobile-video-call-and-sos-orb-center-plan.md`

## Verification Evidence Log
- **Date**: `2026-10-12`
- **Playwright Test Suite**: `playwright/verify-mobile-video-call-and-orb-center.mjs`
- **Result**: `10 / 10 PASS` (100%)
- **Report**: `Reports/qa/playwright/2026-10-12-mobile-video-call-and-orb-center/report.md`
- **JSON**: `Reports/qa/playwright/2026-10-12-mobile-video-call-and-orb-center/report.json`

### Test Summary
1. `[iphone-13-390x844]` SOS Orb Concentric Y-Center Delta: **0.24px** (Threshold: <= 5px) -> **PASS**
2. `[iphone-13-390x844]` SOS Orb Horizontal Center Ratio: **50.0%** -> **PASS**
3. `[galaxy-s20-412x915]` SOS Orb Concentric Y-Center Delta: **0.87px** (Threshold: <= 5px) -> **PASS**
4. `[galaxy-s20-412x915]` SOS Orb Horizontal Center Ratio: **50.0%** -> **PASS**
5. `[iphone-se-375x667]` SOS Orb Concentric Y-Center Delta: **0.75px** (Threshold: <= 5px) -> **PASS**
6. `[iphone-se-375x667]` SOS Orb Horizontal Center Ratio: **50.0%** -> **PASS**
7. `[Dispatcher Mobile Drawer]` Nút Gọi Thoại & `[📹 Gọi Video]` hiển thị đầy đủ trong Drawer -> **PASS**
8. `[Dispatcher Mobile Video Call]` Bấm `[📹 Gọi Video]` mở modal đàm thoại hình ảnh hiện trường WebRTC -> **PASS**
9. `[Citizen Mobile Tracking]` Thẻ đơn vị tiếp nhận hiển thị song song Gọi Trực Ban & `[📹 Gọi Video]` -> **PASS**
10. `[VieNeu-TTS 48kHz]` 4 giọng đọc studio nữ (Thùy Dung, Mai Anh, Trúc Ly, Ngọc Huyền) đạt chuẩn 48kHz -> **PASS**

### Screenshots Generated
- `Reports/qa/playwright/2026-10-12-mobile-video-call-and-orb-center/orb-centered-iphone-13-390x844.png`
- `Reports/qa/playwright/2026-10-12-mobile-video-call-and-orb-center/orb-centered-galaxy-s20-412x915.png`
- `Reports/qa/playwright/2026-10-12-mobile-video-call-and-orb-center/orb-centered-iphone-se-375x667.png`
- `Reports/qa/playwright/2026-10-12-mobile-video-call-and-orb-center/dispatcher-mobile-drawer-call-buttons.png`
- `Reports/qa/playwright/2026-10-12-mobile-video-call-and-orb-center/dispatcher-video-call-modal-opened.png`
- `Reports/qa/playwright/2026-10-12-mobile-video-call-and-orb-center/citizen-mobile-tracking-video-call-button.png`
