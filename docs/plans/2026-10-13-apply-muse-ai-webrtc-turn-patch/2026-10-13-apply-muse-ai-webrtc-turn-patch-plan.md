# Plan: Apply Muse AI WebRTC TURN & SSE Resilience Patch

Title: Apply Muse AI WebRTC TURN & SSE Resilience Patch
Date: 2026-10-13
Status: Completed
Companion actual-status: `docs/plans/2026-10-13-apply-muse-ai-webrtc-turn-patch/2026-10-13-apply-muse-ai-webrtc-turn-patch-actual-status.md`
Companion evidence: `docs/plans/2026-10-13-apply-muse-ai-webrtc-turn-patch/2026-10-13-apply-muse-ai-webrtc-turn-patch-evidence.md`
Companion benchmark: `docs/plans/2026-10-13-apply-muse-ai-webrtc-turn-patch/2026-10-13-apply-muse-ai-webrtc-turn-patch-benchmark.md`

---

## 1. Goal

Integrate the official patch and recommendations prepared by Muse AI located in `C:\Users\dienv\Desktop\Data4Life\muse ai`:
1. Implement dynamic TURN relay support via `/api/turn/credentials` (coturn REST API HMAC-SHA1) with STUN fallback across both `sos_vietnam_2026_web_hosting` and `sos-vietnam-2026-FE`.
2. Add 25-second periodic SSE keep-alive heartbeat (`: ping\n\n`) on both citizen (`/api/sos/stream/:id`) and dispatcher (`/api/dispatcher/stream`) SSE endpoints to prevent silent timeouts on Cloudflare/Render.
3. Enable true 2-way visual video call on the Citizen UI by embedding a Picture-in-Picture remote video feed (`#citizenRemoteVideoElement`) displaying the Dispatcher camera stream.
4. Eliminate duplicate `webrtc-offer` re-transmissions on call accept in `js/dispatcher.js` to avoid WebRTC negotiation glare.
5. Remove exposed gatekeeper passcode in `dispatcher.html` comments and labels, and fix copy typo ("đàm thoại thoại") in `index.html`.

---

## 2. Rules & Constraints

1. Keep temporary files strictly inside `.tmp/` within the working repository. Never write temporary files directly to `C:\`.
2. Maintain documentation integrity and preserve all existing docstrings and comments.
3. Use Anvien code intelligence for graph awareness, impact reporting, and detect-changes verification.
4. Execute full verification and build testing before committing.

---

## 3. Scope & Boundaries

- **In Scope**:
  - `sos_vietnam_2026_web_hosting`:
    - `server.js`: SSE heartbeat (25s) and `/api/turn/credentials` endpoint.
    - `js/app.js`: Dynamic `buildIceServers()`, remote video PiP attachment in `pc.ontrack`, and cleanup in `endCitizenLiveStream()`.
    - `js/dispatcher.js`: Dynamic `buildIceServers()`, removal of duplicate offer re-sending on `accept`.
    - `index.html`: PiP `<video id="citizenRemoteVideoElement">` and typo fix.
    - `dispatcher.html`: Removal of `(PASS: 2002)` leaks.
  - `sos-vietnam-2026-FE`:
    - `src/features/incident-tracking/components/call-modal.jsx`: Dynamic `buildIceServers()` integration with TURN relay fallback.
- **Out of Scope**:
  - Deploying an external VPS coturn daemon (instructions provided in `HUONG_DAN_DUNG_TURN_SERVER.md` for production deployment).
  - Modifying Spring Boot BE (signaling and SSE are handled via Node.js backend).

---

## 4. Phase Checklist

### P0: Actual Status Baseline Classification
- [x] **P0-A**: Inspect repository baseline state, verify Anvien freshness, run file-detail and blast-radius analysis, and populate `actual-status.md`.
  - *Goal*: Establish verified baseline for all 6 target files and confirm patch applicability.
  - *Work Steps*: Run `anvien analyze --force`, `anvien file-detail`, and `git apply --check` for `sos-vietnam-2026-fix-20261013.patch`.
  - *Implementation Gate*: `git apply --check` exits with 0 and Anvien graph is up-to-date.
  - *Acceptance*: `actual-status.md` matrix filled with evidence IDs.

### P1: Apply Muse AI Patch to Web Hosting (`sos_vietnam_2026_web_hosting`)
- [x] **P1-A**: Apply git patch to `sos_vietnam_2026_web_hosting` (`server.js`, `js/app.js`, `js/dispatcher.js`, `index.html`, `dispatcher.html`).
  - *Goal*: Integrate TURN credential generation, SSE heartbeats, remote video PiP, offer de-duplication, and security cleanups.
  - *Work Steps*: Execute `git apply "C:\Users\dienv\Desktop\Data4Life\muse ai\sos-vietnam-2026-fix-20261013.patch"`. Validate syntax using `node -c server.js`.
  - *Implementation Gate*: Patch applies cleanly without reject chunks.
  - *Acceptance*: All 5 files modified and verified.

### P2: Integrate Dynamic TURN Support into React Frontend (`sos-vietnam-2026-FE`)
- [x] **P2-A**: Update `call-modal.jsx` in `sos-vietnam-2026-FE` to query `/api/turn/credentials`.
  - *Goal*: Ensure React frontend also uses dynamic TURN relay credentials for calls over cellular/NAT networks.
  - *Work Steps*: Add `buildIceServers()` in `call-modal.jsx` with 10-minute caching and STUN fallback.
  - *Implementation Gate*: `npm run build` in `sos-vietnam-2026-FE` compiles with 0 errors.
  - *Acceptance*: React bundle builds cleanly.

### P3: Verification, Evidence Recording, & Git Commit
- [x] **P3-A**: Test `/api/turn/credentials` endpoint, test SSE connection keep-alive, run Playwright verification, and commit both repos.
  - *Goal*: Prove TURN endpoint responds correctly, servers run without error, and commits are clean.
  - *Work Steps*:
    1. Start `node server.js` and verify `GET /api/turn/credentials`.
    2. Check browser rendering of PiP video and dispatcher console.
    3. Run `anvien detect-changes --repo sos-vietnam-2026 --scope all`.
    4. Commit and push changes on both repos.
  - *Implementation Gate*: All checks pass.
  - *Acceptance*: Evidence ledger recorded and git trees clean.
