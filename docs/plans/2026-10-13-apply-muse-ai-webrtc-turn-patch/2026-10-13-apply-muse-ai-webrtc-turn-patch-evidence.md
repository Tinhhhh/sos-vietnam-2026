# Apply Muse AI WebRTC TURN & SSE Resilience Patch Evidence Ledger

Title: Apply Muse AI WebRTC TURN & SSE Resilience Patch
Date: 2026-10-13
Companion plan: `docs/plans/2026-10-13-apply-muse-ai-webrtc-turn-patch/2026-10-13-apply-muse-ai-webrtc-turn-patch-plan.md`
Companion actual-status: `docs/plans/2026-10-13-apply-muse-ai-webrtc-turn-patch/2026-10-13-apply-muse-ai-webrtc-turn-patch-actual-status.md`
Companion benchmark: `docs/plans/2026-10-13-apply-muse-ai-webrtc-turn-patch/2026-10-13-apply-muse-ai-webrtc-turn-patch-benchmark.md`

---

## E0: Baseline Facts & Pre-Patch Inspection

- **E0-P0A-ANVIEN1**: Ran `anvien analyze --force` on `sos-vietnam-2026` repository (commit `90bbddd`).
  - Total scanned files: 305; parsed code: 124; graph nodes: 40,942; relationships: 43,253.
  - Anvien status: up-to-date.
- **E0-P0A-SRC1**: Inspected `C:\Users\dienv\Desktop\Data4Life\muse ai`:
  - `BAO_CAO_RA_SOAT_SOS_VIETNAM_2026.md`: Identified root cause of media connection drop on 4G/CGNAT (missing TURN relay) and SSE silent drops behind Cloudflare (missing keepalive).
  - `HUONG_DAN_DUNG_TURN_SERVER.md`: Instructions for coturn and OpenRelay configuration.
  - `sos-vietnam-2026-fix-20261013.patch`: Pre-computed unified diff covering 5 files (18,044 bytes).
- **E0-P0A-SRC2**: Tested `git apply --check "C:\Users\dienv\Desktop\Data4Life\muse ai\sos-vietnam-2026-fix-20261013.patch"` in `sos_vietnam_2026_web_hosting`:
  - Result: 0 errors, 0 conflicts.
- **E0-P0A-SRC3**: Checked `sos-vietnam-2026-FE` WebRTC configuration in `src/features/incident-tracking/components/call-modal.jsx`:
  - Lines 4-9 use static STUN servers (`stun.l.google.com`, `stun.cloudflare.com`) without TURN fallback.

---

## E1: Web Hosting Patch Application Evidence

- **E1-P1A-PATCH1**: Ran `git apply "C:\Users\dienv\Desktop\Data4Life\muse ai\sos-vietnam-2026-fix-20261013.patch"`.
  - Touched: `dispatcher.html`, `index.html`, `js/app.js`, `js/dispatcher.js`, `server.js`.
  - Added SSE 25s ping heartbeats on `/api/sos/stream/:id` and `/api/dispatcher/stream`.
  - Added `GET /api/turn/credentials` endpoint with HMAC-SHA1 signature generator.
  - Added `buildIceServers()` in `js/app.js` and `js/dispatcher.js` with 10-minute cache and fallback.
  - Added remote video `<video id="citizenRemoteVideoElement">` PiP in `index.html` and bound stream in `pc.ontrack`.
  - Removed duplicate `webrtc-offer` dispatch upon receiving `accept` in `js/dispatcher.js`.
  - Cleaned up `(PASS: 2002)` comments and labels in `dispatcher.html`.
- **E1-P1A-SYNTAX1**: Ran `node -c server.js` -> 0 errors.
- **E1-P1A-SYNTAX2**: Validated `js/app.js` and `js/dispatcher.js` ES module syntax using Node VM `SourceTextModule` -> both valid with 0 errors.

---

## E2: React Frontend Integration Evidence

- **E2-P2A-FE1**: Updated `C:\Users\dienv\Desktop\Data4Life\Dự án\sos-vietnam-2026-FE\src\features\incident-tracking\components\call-modal.jsx`:
  - Replaced static `ICE_SERVERS` with dynamic `buildIceServers()`.
  - Replaced `new RTCPeerConnection({ iceServers: ICE_SERVERS })` with `new RTCPeerConnection({ iceServers: await buildIceServers() })`.
- **E2-P2A-BUILD1**: Ran `npm run build` in `sos-vietnam-2026-FE`:
  - Vite transformed 222 modules in 854ms; generated clean production bundle without errors.

---

## E3: Verification & Closure Evidence

- **E3-P3A-QA1**: Reusable Playwright script created at `playwright/verify-muse-ai-turn-and-pip-patch.mjs`.
  - Ran against `http://localhost:3000` (web hosting) and `http://localhost:5173` (React frontend).
  - Test 1: `GET /api/turn/credentials` -> Status 200, `{ ok: false, reason: 'TURN not configured' }` (STUN fallback verified).
  - Test 2: Citizen PiP Remote Video Element `#citizenRemoteVideoElement` exists with count 1.
  - Test 3: Citizen PiP Label `#citizenRemoteVideoLabel` exists with text "TRỰC BAN".
  - Test 4: Copy typo fixed ("Đang đàm thoại 2 bên & truyền âm thanh chất lượng cao").
  - Test 5: Dispatcher Gatekeeper Label hides passcode (no `(Pass: 2002)` in UI).
  - Test 6: Vite React Frontend loads successfully on port 5173 with root container present.
- **E3-P3A-REPORTS**:
  - `Reports/qa/playwright/2026-10-13-muse-ai-turn-pip-patch.json`
  - `Reports/qa/playwright/2026-10-13-muse-ai-turn-pip-patch.md`
- **E3-P3A-VISUAL**:
  - `verify_3000_pip_patched.png`: Web hosting landing page with centered crystal orb and hands cradle.
  - `verify_3000_dispatcher_patched.png`: Web hosting gatekeeper authentication screen.
  - `verify_5173_fe_patched.png`: React frontend landing page fully matching visual theme.
