# Actual Status: Fix OSINT Administrative Record, Intake Sheet Print/PDF, and 2-Way WebRTC Voice/Video Calls

**Status:** COMPLETED
**Last Updated:** 2026-10-13

## Completed Slices
1. **Slice 1 (OSINT Forensic Modal, Auth Headers, & Word Record Export)**:
   - Updated `services/security-firewall-middleware.js` (`authenticate`) to support loopback/non-production officer session fallback via `x-officer-username` header when cookies are missing or rotated across tabs.
   - Updated `server.js` (`/api/dispatcher/flag-fake`) to populate `id`, `incidentId`, `dossierId`, `reportedTime`, `createdAt`, `agency`, `province`, `ward`, and `unitName` on `osintTrace` so `#osintDossierId` displays the real incident ID (`SOS-...`) instead of `#DOS-FAKE-01`.
   - Updated `server.js` (`/api/export/verification-record-docx` and `/api/export/docx`) to place temporary JSON/DOCX files inside `.tmp/` inside the repository root.
   - Updated `dispatcher.html` (`#osintForensicModal` and `.osint-forensic-box`) so the top header is never clipped on any viewport.
   - Updated `js/dispatcher.js` to attach `this.getAuthHeaders()` and `credentials: 'same-origin'` on all report/OSINT/archive/ban-ip endpoints and added a resilient client-side `.doc` fallback in `downloadAdministrativeRecord`.
2. **Slice 2 (Intake Sheet Print / PDF Blank Pages Fix)**:
   - Updated `css/style.css` (`@media print`) so `body:not(.printing-territory-stats)` hides `#territoryStatsModal` and makes `#incidentReportDocxModal, #incidentReportDocxModal *` visible and `position: static !important`, while hiding all UI buttons (`#incidentReportDocxModal button`, `.btn-refresh-loc`) and empty signature `<img>` elements (`:not([src])`, `[src=""]`).
   - Updated `js/dispatcher.js` and `js/app.js` (`#btnPrintReportPdf`) to toggle `document.body.classList.add('printing-incident-report')` around `window.print()`.
3. **Slice 3 (Two-Way WebRTC Voice Call & Video Call Fix)**:
   - Updated `server.js` (`isIncidentInOfficerWard`, `broadcastToDispatchers`, `getIncidentActor`) so city-wide/unscoped dispatcher SSE streams receive all real-time `videocall_signal` and `voicecall_signal` events, and Citizen vs. Dispatcher requests in the same browser never invert `actor.kind`.
   - Upgraded `js/dispatcher.js` and `js/app.js` with full 2-way WebRTC (`RTCPeerConnection`, SDP offer/answer buffering, ICE candidate buffering, re-offer on `accept`, and synthetic audio/video stream fallback) for both `Gọi Thường` (`voice`) and `Gọi Video` (`video`) in both directions (Citizen -> Dispatcher and Dispatcher -> Citizen).
4. **Slice 4 (Playwright Verification & QA Reports)**:
   - Created and executed `playwright/verify-osint-print-and-webrtc-calls.mjs` (8/8 PASS) and `playwright/verify-webrtc-voice-call-two-way-audio.cjs` (PASS with non-silent two-way audio levels `46.26` and `46.51`).
   - Generated official QA reports at `Reports/qa/playwright/2026-10-13-osint-print-webrtc.json` and `Reports/qa/playwright/2026-10-13-osint-print-webrtc.md`.
