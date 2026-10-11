# Account Registration & Map Location Search Synchronization Benchmark Ledger

## Metadata

- Date: `2026-10-11`
- Plan: `docs/plans/2026-10-11-account-registration-map-search-sync/2026-10-11-account-registration-map-search-sync-plan.md`
- Evidence: `docs/plans/2026-10-11-account-registration-map-search-sync/2026-10-11-account-registration-map-search-sync-evidence.md`
- Benchmark: `docs/plans/2026-10-11-account-registration-map-search-sync/2026-10-11-account-registration-map-search-sync-benchmark.md`
- Actual status: `docs/plans/2026-10-11-account-registration-map-search-sync/2026-10-11-account-registration-map-search-sync-actual-status.md`

## B0 - P0 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P0 | Accounts with placeholder address (`Chưa công bố...`) | count | 5 | 0 | 0 | 0 | -5 | `E0-P0A-DATA1`, `E1-P1A-SYNC` |
| P0 | Accounts with truncated `officerRank` (`Đại`/`Thượng`/`Trung`/`Thiếu`) | count | 192 | 0 | 0 | 0 | -192 | `E0-P0A-DATA1`, `E1-P1A-SYNC` |
| P0 | Official Cần Thơ stations synced into `agency-accounts` | count | 20 | 105 | 105 | 105 | +85 | `E0-P0A-DATA2`, `E1-P1A-SYNC` |

## B1 - P1 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P1 | Accounts with placeholder address (`Chưa công bố...`) | count | 5 | 0 | 0 | 0 | -5 | `E1-P1A-SYNC` |
| P1 | Accounts with truncated `officerRank` | count | 192 | 0 | 0 | 0 | -192 | `E1-P1A-SYNC` |
| P1 | Official Cần Thơ stations synced into `agency-accounts` | count | 20 | 105 | 105 | 105 | +85 | `E1-P1A-SYNC` |
| P1 | Total synchronized agency accounts across 34 provinces | count | 453 | 548 | 548 | 548 | +95 | `E1-P1A-SYNC` |

