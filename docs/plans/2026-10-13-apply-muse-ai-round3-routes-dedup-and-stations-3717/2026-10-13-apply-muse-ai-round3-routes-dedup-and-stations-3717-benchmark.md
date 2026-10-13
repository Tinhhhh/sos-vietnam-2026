# Apply Muse AI Round 3 Routes Dedup, Stations Directory 3,717, and Responsive Fixes Benchmark Ledger

Title: Apply Muse AI Round 3 Routes Dedup, Stations Directory 3,717, and Responsive Fixes
Date: 2026-10-13
Companion plan: `docs/plans/2026-10-13-apply-muse-ai-round3-routes-dedup-and-stations-3717/2026-10-13-apply-muse-ai-round3-routes-dedup-and-stations-3717-plan.md`
Companion actual-status: `docs/plans/2026-10-13-apply-muse-ai-round3-routes-dedup-and-stations-3717/2026-10-13-apply-muse-ai-round3-routes-dedup-and-stations-3717-actual-status.md`
Companion evidence: `docs/plans/2026-10-13-apply-muse-ai-round3-routes-dedup-and-stations-3717/2026-10-13-apply-muse-ai-round3-routes-dedup-and-stations-3717-evidence.md`

---

## Metric Inventory

| Metric | Baseline | Target | Final | Status |
|---|---|---|---|---|
| Duplicate Route Blocks in `server.js` | 6 duplicate blocks | 0 duplicate blocks | 0 duplicate blocks | ✅ PASSED |
| Stations Directory Item Count | 874 stations | 3,717 stations | 3,717 stations | ✅ PASSED |
| Commune/Ward Coverage | ~26% (874/3321) | 100% (3321/3321) | 100% (3321/3321) | ✅ PASSED |
| Stations Payload (Gzip) | ~2.95 MB uncompressed | ~300 KB compressed | 166.6 KB (94.4% reduction) | ✅ PASSED |
| Small Phone Agency Cards (<=480px) | 3 cramped cols | 2 comfortable cols | 2 columns (`repeat(2, 1fr)`) | ✅ PASSED |
| Bottom Nav Pill Tap Target (<=375px) | 30 px | >= 36 px | 36.0 px | ✅ PASSED |
| Legal Toggle Tap Target (<=375px) | 26 px | >= 32 px | 32.0 px | ✅ PASSED |
| Playwright Test Success Rate | N/A | 100% | 5/5 (100%) | ✅ PASSED |
| React FE Build Time | N/A | < 2,000 ms | 1,230 ms | ✅ PASSED |
