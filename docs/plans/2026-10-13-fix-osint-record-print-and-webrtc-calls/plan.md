# Plan: Fix OSINT Administrative Record, Intake Sheet Print/PDF, and 2-Way WebRTC Voice/Video Calls

**Status:** COMPLETED
**Created:** 2026-10-13
**Last Updated:** 2026-10-13
**Scope:** Multi-file fix across `css/style.css`, `dispatcher.html`, `js/dispatcher.js`, `js/app.js`, `services/security-firewall-middleware.js`, and `server.js` addressing OSINT Forensic Modal & Word record generation, Intake Sheet Print/PDF blank pages, and 2-way WebRTC voice & video calls between Citizen and Dispatcher.

---

## 1. Objective & Scope

Resolve three operational failures reported by the user:
1. **OSINT Forensic Modal (`#osintForensicModal`), `Lập biên bản Word` (`#btnDraftAdministrativeRecord`), & Intake Sheet (`#incidentReportDocxModal`)**:
   - Fix top-header clipping on `#osintForensicModal` (`HỒ SƠ RÀ SOÁT MANH MỐI OSINT & THIẾT BỊ`).
   - Fix missing `this.getAuthHeaders()` on `/api/dispatcher/flag-fake`, `/api/dispatcher/save-report`, `/api/dispatcher/fake-archive`, `/api/security/ban-ip`, `/api/export/verification-record-docx`, and `/api/export/docx`, and allow authenticated operational officers (not only `admin`) to ban suspicious fake-alarm IPs from `#osintForensicModal`.
   - Ensure `/api/export/verification-record-docx` (`📝 Lập biên bản Word`) and `/api/export/docx` (`📥 Tải File Word (.docx)`) work reliably with server-side Python DOCX generation using `.tmp/` and a resilient client-side `.doc` fallback so Word generation never fails.
2. **Print / PDF Blank Pages on Intake Sheet (`#incidentReportDocxModal` -> `#btnPrintReportPdf`)**:
   - Fix the `@media print` CSS conflict at `css/style.css:8509–8534` (`body:not(.printing-territory-stats) * { visibility: hidden !important; }`) and `.report-docx-modal-backdrop { position: fixed !important; height: 100vh !important; }` which caused `🖨️ In / PDF` to output 3 blank white pages, and hide UI buttons and empty signature `<img>` elements during print.
3. **Two-Way Video Call (`Gọi Video`) & Voice Call (`Gọi Thường`) Between Citizen & Dispatcher**:
   - Fix SSE delivery in `server.js` (`isIncidentInOfficerWard`, `broadcastToDispatchers`, `getIncidentActor`) so `videocall_signal` and `voicecall_signal` are never dropped when `officerWard` is empty or `Toàn Thành Phố`, and Citizen/Dispatcher tabs in the same browser never invert `actor.kind`.
   - Fix self-echo bug in `js/dispatcher.js` where Dispatcher's own outgoing `webrtc-offer` was echoed back via SSE without `senderUsername` and answered by Dispatcher itself.
   - Implement full 2-way WebRTC (`RTCPeerConnection`, audio/video tracks, SDP offer/answer, ICE candidate exchange) for `callType: 'video'` (`Gọi Video`) as well as `callType: 'voice'` (`Gọi Thường`) in both `js/dispatcher.js` and `js/app.js`.
   - Buffer incoming `webrtc-offer` and early `webrtc-ice` candidates while incoming calls are ringing, and trigger/complete WebRTC negotiation upon `accept`.
   - Provide graceful media fallback (synthetic WebAudio/Canvas stream) when hardware camera/microphone is busy or unavailable so 2-way calls always connect.

---

## 2. Implementation Checklist

- [x] **Slice 1: Fix OSINT Forensic Modal UI, Auth Headers, & Word Record Generation (`dispatcher.html`, `css/style.css`, `js/dispatcher.js`, `js/app.js`, `services/security-firewall-middleware.js`, `server.js`)**
  - [x] Fix `#osintForensicModal` and `.osint-forensic-box` layout/sticky header so top title & close button are never clipped.
  - [x] Include `this.getAuthHeaders()` in `js/dispatcher.js` for `/api/dispatcher/flag-fake`, `/api/dispatcher/save-report`, `/api/dispatcher/fake-archive`, `/api/export/verification-record-docx`, `/api/export/docx`, and `/api/security/ban-ip`.
  - [x] Allow authenticated officers to call `/api/security/ban-ip` in `server.js` and populate `id`, `incidentId`, `dossierId`, `reportedTime`, `agency`, `province`, `ward`, and `unitName` on `osintTrace`.
  - [x] Add resilient Word `.docx`/`.doc` fallback for `downloadAdministrativeRecord` and `downloadReportDocx`, and store temp export files in `.tmp/`.
- [x] **Slice 2: Fix Intake Sheet Print / PDF Blank Pages (`css/style.css`, `js/dispatcher.js`, `js/app.js`)**
  - [x] Add `printing-incident-report` body class lifecycle around `window.print()` in `js/dispatcher.js` and `js/app.js`.
  - [x] Fix `@media print` rules in `css/style.css` so `#territoryStatsModal` print rules only apply when `body.printing-territory-stats` is active, and `#incidentReportDocxModal` renders cleanly on A4 pages with zero blank pages and no UI buttons/empty signature images.
- [x] **Slice 3: Fix 2-Way Voice Call (`Gọi Thường`) & Video Call (`Gọi Video`) Between Citizen & Dispatcher (`server.js`, `js/dispatcher.js`, `js/app.js`)**
  - [x] Fix `isIncidentInOfficerWard`, `broadcastToDispatchers`, and `getIncidentActor` in `server.js` plus `isSelfEcho` in `js/dispatcher.js`.
  - [x] Implement full 2-way WebRTC (`RTCPeerConnection`, `ontrack`, SDP/ICE signaling) for `callType: 'video'` and `callType: 'voice'` in both `js/dispatcher.js` and `js/app.js`.
  - [x] Buffer `_pendingWebRtcOffer` and `_pendingIceCandidates` during ringing state and negotiate cleanly upon `accept`.
  - [x] Add graceful media stream fallback when camera/mic hardware is busy or absent.
- [x] **Slice 4: End-to-End Playwright Verification, Evidence Recording, & Git Commit**
  - [x] Restart `node server.js` and run `playwright/verify-osint-print-and-webrtc-calls.mjs` and `playwright/verify-webrtc-voice-call-two-way-audio.cjs`.
  - [x] Save QA reports to `Reports/qa/playwright/2026-10-13-osint-print-webrtc.json` and `Reports/qa/playwright/2026-10-13-osint-print-webrtc.md`.
  - [x] Update `actual-status.md`, `evidence.md`, `benchmark.md`, run `anvien detect-changes`, and commit.
