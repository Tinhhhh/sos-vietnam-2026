# Station Dedup And Post-Merger Audit Benchmark Ledger

## Metadata

- Date: `2026-10-11`
- Plan: `docs/plans/2026-10-11-station-dedup-and-post-merger-audit/2026-10-11-station-dedup-and-post-merger-audit-plan.md`
- Evidence: `docs/plans/2026-10-11-station-dedup-and-post-merger-audit/2026-10-11-station-dedup-and-post-merger-audit-evidence.md`
- Benchmark: `docs/plans/2026-10-11-station-dedup-and-post-merger-audit/2026-10-11-station-dedup-and-post-merger-audit-benchmark.md`
- Actual status: `docs/plans/2026-10-11-station-dedup-and-post-merger-audit/2026-10-11-station-dedup-and-post-merger-audit-actual-status.md`

## Benchmark Rules

Benchmark records measured numbers only.

## B0 - P0 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P0 | Total entries in `vn-stations-directory.json` | stations | 845 | 845 | - | 547 | - | `E0-P0A-AUDIT1` |
| P0 | Abolished / fake ward stations in Cần Thơ | stations | 10 | 10 | - | 0 | - | `E0-P0A-AUDIT1` |
| P0 | Duplicate `(province, ward, agency)` ward stations nationwide | stations | 286 | 286 | - | 0 | - | `E0-P0A-AUDIT1` |
| P0 | Police pins rendered inside Phường Ninh Kiều polygon on ward selection | pins | 6 | 6 | - | 1 | - | `E0-P0A-AUDIT1` |

## B1 - P1 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P1 | Total entries in `vn-stations-directory.json` | stations | 845 | 547 | 547 | 547 | -298 | `E1-P1A-CLEAN1` |
| P1 | Abolished / fake ward stations in Cần Thơ | stations | 10 | 0 | 0 | 0 | -10 | `E1-P1A-CLEAN1` |
| P1 | Duplicate `(province, ward, agency)` ward stations nationwide | stations | 286 | 0 | 0 | 0 | -286 | `E1-P1A-CLEAN1` |
| P1 | Total agency accounts in `agency-accounts.seed.json` | accounts | 548 | 538 | 538 | 538 | -10 | `E1-P1A-CLEAN1` |

## B2 - P2 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P2 | Police pins rendered inside Phường Ninh Kiều polygon on ward selection | pins | 6 | 1 | 1 | 1 | -5 | `E2-P2A-PW1` |
| P2 | Playwright assertions passed for station dedup verification | assertions | 0/10 | 10/10 | 10/10 | 10/10 | +10 | `E2-P2A-PW1` |
| P2 | Playwright assertions passed for Tan An regression check | assertions | 8/8 | 8/8 | 8/8 | 8/8 | 0 | `E2-P2A-PW1` |
