# Plan: Apply Muse AI Round 3 Routes Dedup, Stations Directory 3,717, and Responsive Fixes

Title: Apply Muse AI Round 3 Routes Dedup, Stations Directory 3,717, and Responsive Fixes
Date: 2026-10-13
Status: Completed
Companion actual-status: `docs/plans/2026-10-13-apply-muse-ai-round3-routes-dedup-and-stations-3717/2026-10-13-apply-muse-ai-round3-routes-dedup-and-stations-3717-actual-status.md`
Companion evidence: `docs/plans/2026-10-13-apply-muse-ai-round3-routes-dedup-and-stations-3717/2026-10-13-apply-muse-ai-round3-routes-dedup-and-stations-3717-evidence.md`
Companion benchmark: `docs/plans/2026-10-13-apply-muse-ai-round3-routes-dedup-and-stations-3717/2026-10-13-apply-muse-ai-round3-routes-dedup-and-stations-3717-benchmark.md`

---

## 1. Goal

Integrate Round 3 audit findings and patches prepared by Muse AI from `C:\Users\dienv\Desktop\Data4Life\muse ai`:
1. Clean up 6 duplicate routes (167 lines of dead code) in `server.js` while keeping the fully validated implementations:
   - `POST /api/stations/create`
   - `POST /api/stations/update`
   - `POST /api/stations/delete`
   - `POST /api/admin/accounts/delete`
   - `GET /api/geo/ward-list`
   - `GET /api/geo/all-wards`
2. Implement HTTP Gzip compression for `GET /api/stations/all` to reduce transmission size from ~2.9 MB to ~300 KB.
3. Apply mobile responsive fixes in `css/tactical-responsive.css`:
   - Set `.agency-cards-grid` to 2 columns on small phones ($\le 480\text{px}$) with last odd card spanning full width.
   - Enlarge tap targets for bottom nav pills ($\ge 36\text{px}$) and legal toggle ($\ge 32\text{px}$) on screens $\le 375\text{px}$.
4. Upgrade nationwide police stations directory from 874 to 3,717 stations using `vn-stations-directory-3717.json`, achieving 100% commune/ward coverage (3,321 / 3,321 wards) across both web hosting and React frontend repositories.
5. Verify changes with automated Playwright testing, Anvien change detection, and push commits to remote repositories.

---

## 2. Rules & Constraints

1. Keep temporary files strictly inside `.tmp/` within the working repository. Never create temp files directly on `C:\`.
2. Backup `assets/vn-stations-directory.json` to `assets/vn-stations-directory.json.bak-20261013` before replacing.
3. Validate syntax before restarting servers.
4. Maintain documentation integrity.

---

## 3. Scope & Boundaries

- **In Scope**:
  - `sos_vietnam_2026_web_hosting`:
    - `server.js`: route deduplication and gzip support for stations.
    - `css/tactical-responsive.css`: responsive CSS improvements.
    - `assets/vn-stations-directory.json`: replace with 3,717 stations dataset.
  - `sos-vietnam-2026-FE`:
    - `public/assets/vn-stations-directory.json`: synchronize 3,717 stations dataset.
- **Out of Scope**:
  - Modifying Spring Boot BE (stations and web routing are decoupled).

---

## 4. Phase Checklist

### P0: Actual Status Baseline Classification
- [x] **P0-A**: Inspect round 3 patch files, verify Anvien freshness, compare station counts (874 vs 3,717), and populate `actual-status.md`.
  - *Goal*: Establish baseline for route duplicates, file sizes, and station counts.
  - *Work Steps*: Run `git apply --check`, `anvien analyze --force`, and station count validation script.
  - *Implementation Gate*: `git apply --check` exits with 0 and Anvien graph is up-to-date.
  - *Acceptance*: `actual-status.md` matrix populated.

### P1: Apply Round 3 Patch to Web Hosting (`sos_vietnam_2026_web_hosting`)
- [x] **P1-A**: Apply git patch `sos-vietnam-2026-fix-routes-dedup-20261013.patch`.
  - *Goal*: Eliminate 6 duplicate routes in `server.js`, enable gzip on `/api/stations/all`, and add responsive CSS media queries.
  - *Work Steps*: Execute `git apply "C:\Users\dienv\Desktop\Data4Life\muse ai\sos-vietnam-2026-fix-routes-dedup-20261013.patch"`. Validate syntax with `node -c server.js`.
  - *Implementation Gate*: Patch applies cleanly without conflict.
  - *Acceptance*: `node -c server.js` exits 0 and CSS rules are added.

### P2: Deploy Nationwide 3,717 Stations Dataset
- [x] **P2-A**: Backup current stations file and deploy `vn-stations-directory-3717.json` to `assets/vn-stations-directory.json` in web hosting and `public/assets/vn-stations-directory.json` in React FE.
  - *Goal*: Provide complete 100% commune/ward police coverage across Vietnam.
  - *Work Steps*: Copy file to `assets/vn-stations-directory.json.bak-20261013`, copy new dataset to both repos, and verify station counts equal 3,717.
  - *Implementation Gate*: Parsed JSON station array length is exactly 3,717.
  - *Acceptance*: Station count is 3,717 on both repos.

### P3: Verification, Evidence Recording, & Git Commit
- [x] **P3-A**: Restart server process, execute Playwright automated tests on port 3000 and port 5173, run Anvien change detection, and commit/push both repositories.
  - *Goal*: Prove gzip compression works, stations API returns 3,717 items, and all responsive styles render correctly.
  - *Work Steps*:
    1. Restart `node server.js` and test `GET /api/stations/all` with and without `Accept-Encoding: gzip`.
    2. Run Playwright script to verify station count, responsive layout, and mobile rendering.
    3. Run `anvien detect-changes --repo sos-vietnam-2026 --scope all`.
    4. Commit and push both repos to remote.
  - *Implementation Gate*: 100% Playwright tests pass.
  - *Acceptance*: QA report and evidence ledger recorded, commits pushed.
