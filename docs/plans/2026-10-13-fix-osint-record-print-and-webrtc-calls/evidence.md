# Evidence: Fix OSINT Administrative Record, Intake Sheet Print/PDF, and 2-Way WebRTC Voice/Video Calls

**Date:** 2026-10-13

## 1. Syntax & Build Verification
- **Command**:
  ```powershell
  node --check server.js; node --check services/security-firewall-middleware.js; node --check js/dispatcher.js; node --check js/app.js
  ```
- **Result**: Exit code `0` (`SYNTAX_OK`) across all modified backend and frontend modules.

## 2. End-to-End Playwright Verification (`playwright/verify-osint-print-and-webrtc-calls.mjs`)
- **Command**:
  ```powershell
  node playwright/verify-osint-print-and-webrtc-calls.mjs
  ```
- **Reports**:
  - `Reports/qa/playwright/2026-10-13-osint-print-webrtc.json`
  - `Reports/qa/playwright/2026-10-13-osint-print-webrtc.md`
- **Results (8 / 8 PASS)**:
  1. `[PASS] [Gọi Thường: Trực ban -> Công dân]`: `citizen.iceState = "connected"`, `dispatcher.iceState = "connected"`, `hasRemoteStream = true` on both sides (`576 ms`).
  2. `[PASS] [Gọi Thường: Công dân -> Trực ban]`: `citizen.iceState = "connected"`, `dispatcher.iceState = "connected"`, `hasRemoteStream = true` on both sides (`341 ms`).
  3. `[PASS] [Gọi Video: Trực ban -> Công dân]`: `citizen.iceState = "connected"` (`remoteTracks: 2`, `localVideoTracks: 1`), `dispatcher.iceState = "connected"` (`remoteVideoTracks: 1`) (`191 ms`).
  4. `[PASS] [Gọi Video: Công dân -> Trực ban]`: `citizen.iceState = "connected"` (`remoteTracks: 2`), `dispatcher.iceState = "connected"` (`remoteVideoTracks: 1`) (`445 ms`).
  5. `[PASS] [Phiếu Tiếp Nhận Tin: In / Xuất PDF]`: `@media print` renders `#reportSheetContainer` visibly (`820x1098 px`), hides `#territoryStatsModal` (`display: "none"`), and hides all UI buttons and empty signature `<img>` elements.
  6. `[PASS] [Phiếu Tiếp Nhận Tin: Xuất Word (.docx)]`: `/api/export/docx` downloads `Phieu_TiepNhan_UPSC_SOS-MV660M35-947.docx` (`38,861 bytes`, `530 ms`).
  7. `[PASS] [Báo khống & OSINT Forensic Modal]`: `#osintForensicModal` opens without top clipping (`boxTop: 20`, `boxBottom: 888`, `viewportHeight: 900`) and displays the real dossier ID (`SOS-MV660M35-947`).
  8. `[PASS] [Lập biên bản vi phạm hành chính (Word)]`: `#btnDraftAdministrativeRecord` downloads `DuThao_BienBan_XacMinh_SOS-MV660M35-947.docx` (`38,620 bytes`, `381 ms`) via `/api/export/verification-record-docx`.

## 3. Two-Way WebRTC Real Audio Frequency Level Verification (`playwright/verify-webrtc-voice-call-two-way-audio.cjs`)
- **Command**:
  ```powershell
  node playwright/verify-webrtc-voice-call-two-way-audio.cjs
  ```
- **Result**:
  - `citizen ICE state: connected | dispatcher ICE state: connected`
  - `citizen remote-audio measurement: {"hasStream":true,"level":46.255859375}`
  - `dispatcher remote-audio measurement: {"hasStream":true,"level":46.5068359375}`
  - `PASS: real two-way WebRTC audio confirmed - both sides connected and received non-silent remote audio.`
