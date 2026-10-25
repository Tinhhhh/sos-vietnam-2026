# Hierarchical Zalo Bot Dispatch and Standalone IoT/Zalo FE-BE Patch Benchmark Ledger

## Metadata

- Date: `2026-10-25`
- Plan: `docs/plans/2026-10-25-zalo-bot-and-iot-patch/2026-10-25-zalo-bot-and-iot-patch-plan.md`
- Evidence: `docs/plans/2026-10-25-zalo-bot-and-iot-patch/2026-10-25-zalo-bot-and-iot-patch-evidence.md`
- Benchmark: `docs/plans/2026-10-25-zalo-bot-and-iot-patch/2026-10-25-zalo-bot-and-iot-patch-benchmark.md`
- Actual status: `docs/plans/2026-10-25-zalo-bot-and-iot-patch/2026-10-25-zalo-bot-and-iot-patch-actual-status.md`

## Benchmark Rules

Benchmark records measured counts, sizes, and timings only.

## B0 - P0 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P0 | Indexed repository files | files | 383 | 383 | - | >= 383 | 0 | `E0-P0A-ANV1` |
| P0 | Indexed semantic graph nodes | nodes | 43697 | 43697 | - | >= 43697 | 0 | `E0-P0A-ANV1` |
| P0 | Active Zalo Bot endpoints | endpoints | 0 | 0 | - | >= 7 | 0 | `E0-P0A-SRC1` |
| P0 | Ready-to-use `/ketnoi` preset unit codes | presets | 0 | 0 | - | >= 5 | 0 | `E0-P0A-SRC1` |

## B1 - P1 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P1 | Active Zalo Bot endpoints | endpoints | 0 | 8 | 8 | >= 7 | +8 | `E1-P1B-SRV1` |
| P1 | Ready-to-use `/ketnoi` preset unit codes | presets | 0 | 9 | 9 | >= 5 | +9 | `E1-P1A-MOD1` |

## B2 - P2 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P2 | E2E Zalo Bot routing & 2-way accept assertions | assertions | 0 | 8 | 8 | >= 8 | +8 | `E2-P2A-PW1` |

## B3 - P3 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P3 | Standalone FE+BE+Firmware patch package files | files | 0 | 16 | 16 | >= 12 | +16 | `E3-P3A-PKG1` |
| P3 | Standalone `.zip` archive size | bytes | 0 | 419187 | 419187 | > 0 | +419187 | `E3-P3A-PKG1` |
