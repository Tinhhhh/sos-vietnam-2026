# Unified Live Zalo Chat Board, Compact Sticky Bot Lifecycle & 34-Province Group Directory Benchmark Ledger

## Metadata

- Date: `2026-10-28`
- Plan: `docs/plans/2026-10-28-zalo-bot-live-chat-unified/2026-10-28-zalo-bot-live-chat-unified-plan.md`
- Evidence: `docs/plans/2026-10-28-zalo-bot-live-chat-unified/2026-10-28-zalo-bot-live-chat-unified-evidence.md`
- Benchmark: `docs/plans/2026-10-28-zalo-bot-live-chat-unified/2026-10-28-zalo-bot-live-chat-unified-benchmark.md`
- Actual status: `docs/plans/2026-10-28-zalo-bot-live-chat-unified/2026-10-28-zalo-bot-live-chat-unified-actual-status.md`

## Benchmark Rules

Benchmark records measured counts, sizes, latencies, and test coverage metrics only.

## B0 - P0 Baseline Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P0 | Indexed repository files | files | 451 | 451 | - | >= 451 | 0 | `E0-P0A-ANV1` |
| P0 | Indexed semantic graph nodes | nodes | 73144 | 73144 | - | >= 73144 | 0 | `E0-P0A-ANV1` |
| P0 | Provinces/cities in collapsible Zalo directory | provinces | 1 | 1 | - | 34 | 0 | `E0-P0A-GEO1` |
| P0 | Ward/commune + command units addressable via short `/kn` syntax | units | 9 | 9 | - | >= 3500 | 0 | `E0-P0A-GEO1` |
| P0 | Persisted two-way live Zalo chat ring-buffer capacity | messages | 0 | 0 | - | 300 | 0 | `E0-P0A-SRC1` |
| P0 | Automated Playwright E2E Zalo assertions | assertions | 21 | 21 | - | >= 26 | 0 | `E0-P0A-FD5` |
| P1 | Indexed repository files | files | 451 | 455 | - | >= 451 | +4 | `E1-P1A-ANV1` |
| P1 | Indexed semantic graph nodes | nodes | 73144 | 74281 | - | >= 73144 | +1137 | `E1-P1A-ANV1` |
| P1 | Provinces/cities in collapsible Zalo directory | provinces | 1 | 34 | - | 34 | +33 | `E1-P1A-API1` |
| P1 | Ward/commune + command units addressable via short `/kn` syntax | units | 9 | 3588 | - | >= 3500 | +3579 | `E1-P1A-API1` |
| P1 | Persisted two-way live Zalo chat ring-buffer capacity | messages | 0 | 300 | - | 300 | +300 | `E1-P1A-API1` |
| P1 | 34-Province directory cold / warm response latency | ms | - | 4.86 | - | <= 50 | 4.86ms warm (25.42ms cold) | `E1-P1A-API1` |
| P2-A | Indexed semantic graph nodes (after FE + patch sync) | nodes | 73144 | 75493 | - | >= 73144 | +2349 | `E2-P2A-ANV1` |
