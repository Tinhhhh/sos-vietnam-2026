# Multi-Network Zero-PII Blockchain Benchmark Ledger

## Metadata

- Date: `2026-11-02`
- Plan: `docs/plans/2026-11-02-multi-network-zero-pii-blockchain/2026-11-02-multi-network-zero-pii-blockchain-plan.md`
- Evidence: `docs/plans/2026-11-02-multi-network-zero-pii-blockchain/2026-11-02-multi-network-zero-pii-blockchain-evidence.md`
- Benchmark: `docs/plans/2026-11-02-multi-network-zero-pii-blockchain/2026-11-02-multi-network-zero-pii-blockchain-benchmark.md`
- Actual status: `docs/plans/2026-11-02-multi-network-zero-pii-blockchain/2026-11-02-multi-network-zero-pii-blockchain-actual-status.md`

## Benchmark Rules

Benchmark records measured numbers only (inventory counts, payload/proof byte sizes, PII leak count, QR decode success rate, graph counts, and non-blocking latency overhead).

## B0 - P0 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P0 | Anvien semantic graph nodes | nodes | 86649 | 86649 | - | >= 86649 | 0 | `E0-P0A-GRAPH1` |
| P0 | Anvien semantic graph relationships | edges | 92429 | 92429 | - | >= 92429 | 0 | `E0-P0A-GRAPH1` |
| P0 | Surfaces with working multi-network view switcher (`dispatcher.html`, `/tra-cuu-blockchain.html`, `/api/blockchain/explorer/:ref`) | surfaces | 0 | 0 | - | 3 | 0 | `E0-P0A-SRC2`, `E0-P0A-SRC3`, `E0-P0A-SRC4` |
| P0 | Supported selectable blockchain network views | networks | 1 (effective internal view) | 1 | - | 4 (`842026`, `NDA`, `OTS`, `POLYGON`) | 0 | `E0-P0A-SRC1`, `E0-P0A-SRC4` |
| P0 | Live OpenTimestamps `.ots` binary proof size per block | bytes | 237 (prototype probe) | 237 | - | <= 1024 | 0 | `E0-P0A-OTS1` |

## B1 - P1 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P1-A | PII substring leaks in `NDA` / `OTS` / `POLYGON` projected JSON (`19` sensitive tokens tested) | count | - | 0 | 0 | 0 | 0 | `E1-P1A-TEST1` |
| P1-A | Live OpenTimestamps `.ots` detached binary proof size (`anchorBlockToOpenTimestamps`) | bytes | 237 | 307 | - | <= 1024 | +70 | `E1-P1A-TEST2` |
| P1-B | Synchronous `/api/sos` block-seal blocking overhead from global `.ots` anchoring | ms | 0 | 0 (`27ms` total `/api/sos/create`) | 0 | <= 5 (async non-blocking) | 0 | `E1-P1B-ROUTE1` |

## B2 - P2 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P2-B | UI surfaces with interactive 4-network switcher & tiered visibility | surfaces | 0 | 3 | 3 | 3 | +3 | `E1-P1B-ROUTE2`, `E2-P2A-UI2`, `E2-P2B-UI2` |

## B3 - P3 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P3-A | Docker E2E assertions passed (`verify-multi-network-zero-pii-blockchain.mjs`) | pct | - | 100% (`10/10`, `0` PII leaks) | 100% | 100% | 0 | `E3-P3A-PW1` |
| P3-A | OpenCV `QRCodeDetector` decode rate across all 3 surfaces | pct | 100% | 100% (`4/4` multinet + regression `12/12`) | 100% | 100% | 0 | `E3-P3A-PW1`, `E3-P3A-REGR1` |
| P3-B | Live Render Staging (`sos-vietnam-2026.onrender.com`) E2E assertions passed | pct | - | 100% (`10/10`, `0` PII leaks, `4/4` QR decode, `307B` `.ots`) | 100% | 100% | 0 | `E3-P3B-PW1` |

## Non-Benchmarkable Notes

`Pn-A`, `Pn-B`, and `Pn-C` are governance/cleanup/closure phases without separate runtime metrics beyond the final graph and QA counts above.
