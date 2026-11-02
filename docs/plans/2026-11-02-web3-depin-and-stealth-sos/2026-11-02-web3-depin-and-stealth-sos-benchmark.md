# SOS Vietnam 2026 — Web3 DePIN Blockchain Ledger, Hardware Anti-Spoofing & Stealth SOS Benchmark Ledger

## Metadata

- Date: `2026-11-02`
- Plan: `docs/plans/2026-11-02-web3-depin-and-stealth-sos/2026-11-02-web3-depin-and-stealth-sos-plan.md`
- Evidence: `docs/plans/2026-11-02-web3-depin-and-stealth-sos/2026-11-02-web3-depin-and-stealth-sos-evidence.md`
- Benchmark: `docs/plans/2026-11-02-web3-depin-and-stealth-sos/2026-11-02-web3-depin-and-stealth-sos-benchmark.md`
- Actual status: `docs/plans/2026-11-02-web3-depin-and-stealth-sos/2026-11-02-web3-depin-and-stealth-sos-actual-status.md`

## Benchmark Rules

The benchmark file records measured numbers only (graph inventory counts, cryptographic sealing latency, media chunk SHA-256 + storage latency, and E2E verification coverage counts). Command logs, design decisions, and pass/fail narrative belong in `evidence.md`.

## B0 - P0 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P0 | Anvien scanned files | files | 488 | 503 | 503 | >= 488 | +15 | `E0-P0A-GRAPH1`, `En-PNC-GRAPH1` |
| P0 | Anvien parsed code files | files | 157 | 162 | 162 | >= 157 | +5 | `E0-P0A-GRAPH1`, `En-PNC-GRAPH1` |
| P0 | Anvien graph nodes | nodes | 78102 | 83665 | 83665 | >= 78102 | +5563 | `E0-P0A-GRAPH1`, `En-PNC-GRAPH1` |
| P0 | Anvien graph relationships | edges | 83267 | 89250 | 89250 | >= 83267 | +5983 | `E0-P0A-GRAPH1`, `En-PNC-GRAPH1` |
| P0 | Sealed Case Lifecycle event hooks | events | 0 | 4 | 4 | 4 | +4 | `E0-P0A-SRC1`, `E2-P2B-VAL1` |
| P0 | Citizen Stealth Camouflage modes | modes | 0 | 2 | 2 | 2 | +2 | `E0-P0A-SRC3`, `E4-P4B-VAL1` |

## B1 - P1 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P1 | `writeToSOSBlockchain` local seal latency | ms | - | 4.17 | 4.17 | < 25 | - | `E1-P1A-VAL1` |
| P1 | `POST /api/hardware-sos` DePIN verify + `1_SOS_TRIGGER` seal HTTP latency | ms | - | 64.58 | 64.58 | < 200 | - | `E1-P1B-VAL1` |
| P1 | Sealed Case Lifecycle event hooks | events | 0 | 3 | 4 | 4 | +4 | `E1-P1B-VAL1`, `E2-P2B-VAL1` |
| P1 | Anvien graph nodes | nodes | 78102 | 79786 | 83665 | >= 78102 | +5563 | `E1-P1B-GRAPH1`, `En-PNC-GRAPH1` |
| P1 | Anvien graph relationships | edges | 83267 | 85197 | 89250 | >= 83267 | +5983 | `E1-P1B-GRAPH1`, `En-PNC-GRAPH1` |

## B2 - P2 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P2 | 5s audio chunk RAM SHA-256 + vault persist latency | ms | - | 3.88 | 3.88 | < 100 | - | `E2-P2A-VAL1` |
| P2 | Live `SHA-256` integrity audit re-hash latency | ms | - | 1.42 | 1.42 | < 150 | - | `E2-P2A-VAL1` |
| P2 | Live `POST /api/dispatcher/blockchain/verify` HTTP audit latency | ms | - | 9.50 | 9.50 | < 200 | - | `E2-P2B-VAL1` |
| P2 | Sealed Case Lifecycle event hooks | events | 3 | 4 | 4 | 4 | +1 | `E2-P2B-VAL1` |
| P2 | Anvien graph nodes | nodes | 79786 | 80916 | 83665 | >= 78102 | +3879 | `E2-P2B-GRAPH1`, `En-PNC-GRAPH1` |
| P2 | Anvien graph relationships | edges | 85197 | 86365 | 89250 | >= 83267 | +4053 | `E2-P2B-GRAPH1`, `En-PNC-GRAPH1` |

## B4 - P4 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P4 | Stealth `MediaRecorder` chunk interval | ms | 0 | 5000 | 5000 | 5000 | +5000 | `E4-P4A-IMPL1` |
| P4 | Fake Call anti-attacker hangup tap threshold | taps | 0 | 3 | 3 | 3 | +3 | `E4-P4A-IMPL1` |
| P4 | Blackout Stealth unlock tap threshold | taps | 0 | 4 | 4 | 4 | +4 | `E4-P4A-IMPL1` |
| P4 | Anvien graph nodes | nodes | 80916 | 83665 | 83665 | >= 78102 | +2749 | `E4-P4B-GRAPH1`, `En-PNC-GRAPH1` |
| P4 | Anvien graph relationships | edges | 86365 | 89250 | 89250 | >= 83267 | +2885 | `E4-P4B-GRAPH1`, `En-PNC-GRAPH1` |
| P4 | Local Docker Playwright E2E verified assertions | checks | 0 | 22 | 22 | >= 12 | +22 | `E4-P4B-VAL1` |
| P4 | Live Render Staging (`sos-vietnam-2026.onrender.com`) Playwright E2E assertions | checks | 0 | 21 | 21 | >= 12 | +21 | `E4-P4C-VAL1` |
| P4 | Live Render Staging `/api/hardware-sos` DePIN round-trip latency | ms | - | 501.95 | 501.95 | < 1500 | - | `E4-P4C-VAL1` |
| P4 | Live Render Staging UI Live Integrity Audit (`runIntegrityCheck`) latency | ms | - | 375.07 | 375.07 | < 2000 | - | `E4-P4C-VAL1` |

## Non-Benchmarkable Notes

`P3` (`P3-A`, `P3-B`) adds Dispatcher `.bc-security-panel` DOM rendering and interactive event bindings; UI correctness and live audit rendering are validated functionally in `E3` and `E4` (`P4-B` Docker Playwright E2E) rather than synthetic micro-benchmarks.
