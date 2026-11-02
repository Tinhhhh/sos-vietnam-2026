# Blockchain Transaction Process Ledger, Scannable QR & Block Decoder Portal Benchmark Ledger

## Metadata

- Date: `2026-11-02`
- Plan: `docs/plans/2026-11-02-blockchain-process-ledger-qr-and-decoder/plan.md`
- Evidence: `docs/plans/2026-11-02-blockchain-process-ledger-qr-and-decoder/evidence.md`
- Benchmark: `docs/plans/2026-11-02-blockchain-process-ledger-qr-and-decoder/benchmark.md`
- Actual status: `docs/plans/2026-11-02-blockchain-process-ledger-qr-and-decoder/actual-status.md`

## Benchmark Rules

- Record measured counts, payload sizes, QR decode rates, and graph metrics only.

## B0 - P0 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P0 | Anvien indexed graph nodes | nodes | 83665 | 83665 | - | >= 83665 | 0 | `E0-P0A-GRAPH1` |
| P0 | Anvien indexed graph relationships | edges | 89250 | 89250 | - | >= 89250 | 0 | `E0-P0A-GRAPH1` |
| P0 | OpenCV `QRCodeDetector` decode success rate on generated QR SVG | % | 0 | 0 | - | 100 | 0 | `E0-P0A-QR1` |
| P0 | Sealed SOS case lifecycle action types | count | 4 | 4 | - | 8 | 0 | `E0-P0A-SRC1` |
| P0 | Default Stealth SOS 5-second audio upload rate per minute | files/min | 12 | 12 | - | 0 (transaction-only default) | 0 | `E0-P0A-SRC2` |

## B1 - P1 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P1 | OpenCV `QRCodeDetector` decode success across URL lengths (49..161 bytes, Versions 3..8) | % | 0 | 100 | - | 100 | +100% | `E1-P1A-QR1` |
| P1 | QR Matrix + SVG generation latency (3 QR codes across V3, V6, V8) | ms | - | 4.418 | - | < 25 | - | `E1-P1A-QR1` |
| P1 | `verifyExportedDossier` SHA-256 + ledger cross-check latency (5-block dossier) | ms | - | 0.983 | - | < 20 | - | `E1-P1A-VERIFY1` |
| P1 | Sealed SOS case lifecycle action types | count | 4 | 8 | - | 8 | +4 | `E1-P1B-LIFE1` |
| P1 | Lightweight SOS case ledger JSON footprint (0 media blobs: 4-step ~5.5 KB, 6-step w/ escalation 8,309 B) | bytes | - | 5540 (4-step) / 8309 (6-step) | - | < 10240 | - | `E1-P1B-AUDIT1` |

## B2 - P2 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P2 | Default Stealth SOS 5-second audio upload rate per minute | files/min | 12 | - | - | 0 | - | Pending `P2-B` |
| P2 | Offline WebCrypto SHA-256 dossier verification latency (4-block dossier) | ms | - | - | - | < 50 | - | Pending `P2-A` |

## B3 - P3 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P3 | Local Docker E2E + QR decode + tamper-detection checks passed | pass_count | 0 | - | - | 100% | - | Pending `P3-A` |
| P3 | Live Render Staging (`sos-vietnam-2026.onrender.com`) E2E + QR decode checks passed | pass_count | 0 | - | - | 100% | - | Pending `P3-B` |
