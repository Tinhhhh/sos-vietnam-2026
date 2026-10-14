# Plan: Apply Muse AI OSINT Real Patch (2026-10-14)

Title: Apply Muse AI OSINT Real Patch
Date: 2026-10-14
Status: Completed
Companion actual-status: `docs/plans/2026-10-14-apply-muse-ai-osint-patch/actual-status.md`
Companion evidence: `docs/plans/2026-10-14-apply-muse-ai-osint-patch/evidence.md`
Companion benchmark: `docs/plans/2026-10-14-apply-muse-ai-osint-patch/benchmark.md`

---

## 1. Goal & Context

Apply the latest patch from Muse AI: `C:\Users\dienv\Desktop\Data4Life\muse ai\sos-vietnam-2026-fix-osint-real-20261014.patch`.
The patch equips the emergency dispatcher OSINT investigation toolkit with real-time GeoIP lookup:
1. **Backend (`server.js`)**: In `/api/dispatcher/flag-fake`, perform an asynchronous real-time IP geolocation query via `ip-api.com` with a 4s AbortController timeout (soft fail if offline/private IP). Store the resulting `ipGeolocation` in the incident's OSINT dossier (`osintTrace`).
2. **Frontend UI (`dispatcher.html`)**: Add a dedicated real-time GeoIP display block in the OSINT investigation modal showing `📍 ĐỊNH VỊ IP THỜI GIAN THỰC (GeoIP trực tiếp):` with element `#osintGeoIpDisplay`.
3. **Frontend Controller (`js/dispatcher.js`)**: Render `trace.ipGeolocation` details (City, Region, Country, ISP/Org, ASN, Coordinates) into `#osintGeoIpDisplay` when displaying an incident's OSINT dossier.

---

## 2. Rules & Constraints

1. Keep temporary files strictly inside `.tmp/` within the repo. Never create temp files directly on `C:\`.
2. Do not clobber existing clean code (the patch also contained already-applied chunks for vehicle tracking and route deduplication from 2026-10-13; only apply the authentic new OSINT changes).
3. Code first; tests should only be updated after behavior has been implemented in code.
4. Run full build/syntax check before validation.
5. Validate UI and API behavior using reusable Playwright test under `playwright/` and store official QA report under `Reports/qa/playwright/`.
6. Run change detection (`anvien detect-changes`) before git commit.
7. Commit and push to remote upon completion.

---

## 3. Phase Checklist

### P0: Patch Audit & Baseline Analysis
- [x] **P0-A**: Audit patch chunks against current codebase; isolate authentic new OSINT changes from already-merged vehicle tracking / route dedup code.
  - *Goal*: Clarify exact lines to edit across `dispatcher.html`, `js/dispatcher.js`, and `server.js`.
  - *Acceptance*: Verified patch delta documented in `actual-status.md`.

### P1: Implementation (Code First)
- [x] **P1-A**: Update `dispatcher.html` to add `#osintGeoIpDisplay` block in the OSINT dossier modal.
- [x] **P1-B**: Update `js/dispatcher.js` to populate `#osintGeoIpDisplay` from `trace.ipGeolocation`.
- [x] **P1-C**: Update `server.js` `/api/dispatcher/flag-fake` to perform real-time `ip-api.com` lookup and inject `ipGeolocation` into `osintTrace`.
  - *Goal*: Real-time GeoIP OSINT capability fully functional in backend and frontend.
  - *Acceptance*: Node syntax check passes (`node -c server.js`, `node -c js/dispatcher.js`).

### P2: Verification & QA Testing
- [x] **P2-A**: Create/run Playwright automated test `playwright/verify-muse-ai-osint-real.mjs` verifying:
  - Incident creation and flag-fake API endpoint with `ipGeolocation` payload.
  - OSINT modal rendering with `#osintGeoIpDisplay` populated correctly.
  - Offline/private IP fallback graceful handling.
- [x] **P2-B**: Generate official QA report in `Reports/qa/playwright/` (both `.json` and `.md`).

### P3: Ledger Update, Change Detection & Git Commit
- [x] **P3-A**: Update plan ledgers (`actual-status.md`, `evidence.md`, `benchmark.md`, `plan.md`).
- [x] **P3-B**: Run Anvien `detect_changes`.
- [x] **P3-C**: Commit and push to git remote.
