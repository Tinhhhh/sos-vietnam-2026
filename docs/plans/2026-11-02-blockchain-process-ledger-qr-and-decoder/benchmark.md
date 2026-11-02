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
| P0 | Anvien indexed graph nodes | nodes | 83665 | 86644 | 86644 | >= 83665 | +2979 | `E0-P0A-GRAPH1`, `E3-P3B-DEPLOY1` |
| P0 | Anvien indexed graph relationships | edges | 89250 | 92424 | 92424 | >= 89250 | +3174 | `E0-P0A-GRAPH1`, `E3-P3B-DEPLOY1` |
| P0 | OpenCV `QRCodeDetector` decode success rate on generated QR SVG | % | 0 | 100 | 100 | 100 | +100% | `E0-P0A-QR1`, `E3-P3B-STAGING1` |
| P0 | Sealed SOS case lifecycle action types | count | 4 | 9 | 9 | >= 8 | +5 | `E0-P0A-SRC1`, `E1-P1A-ACT1` |
| P0 | Default Stealth SOS 5-second audio upload rate per minute | files/min | 12 | 0 | 0 | 0 (transaction-only default) | -12 | `E0-P0A-SRC2`, `E3-P3B-STAGING1` |

## B1 - P1 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P1 | OpenCV `QRCodeDetector` decode success across URL lengths (49..161 bytes, Versions 3..8) | % | 0 | 100 | 100 | 100 | +100% | `E1-P1A-QR1` |
| P1 | QR Matrix + SVG generation latency (3 QR codes across V3, V6, V8) | ms | - | 4.418 | 4.418 | < 25 | - | `E1-P1A-QR1` |
| P1 | `verifyExportedDossier` SHA-256 + ledger cross-check latency (5-block dossier) | ms | - | 0.983 | 0.983 | < 20 | - | `E1-P1A-VERIFY1` |
| P1 | Sealed SOS case lifecycle action types | count | 4 | 8 (case) / 9 (total w/ DePIN) | 8 (case) / 9 (total w/ DePIN) | >= 8 | +4 | `E1-P1B-LIFE1` |
| P1 | Lightweight SOS case ledger JSON footprint (0 media blobs: 4-step ~5.5 KB, 6-step w/ escalation 8,309 B; full exported `.JSON` w/ QR SVG 33,383 B) | bytes | - | 5540..8309 (ledger) / 33383 (exported `.JSON`) | 5540..8309 (ledger) | < 10240 (ledger) | - | `E1-P1B-AUDIT1`, `E3-P3B-STAGING1` |

## B2 - P2 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P2 | Default Stealth SOS 5-second audio upload rate per minute | files/min | 12 | 0 | 0 | 0 | -12 | `E2-P2B-STEALTH1`, `E3-P3B-STAGING1` |
| P2 | Offline WebCrypto SHA-256 dossier verification latency (5-block live dossier) | ms | - | 0.5 | 0.5 | < 50 | - | `E2-P2A-JS1`, `E3-P3B-STAGING1` |

## B3 - P3 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P3 | Local Docker E2E + QR decode + tamper-detection checks passed | pass_count | 0 | 12/12 (100%) | 12/12 (100%) | 100% | +12/12 | `E3-P3A-DOCKER1` |
| P3 | Live Render Staging (`sos-vietnam-2026.onrender.com`) E2E + QR decode checks passed | pass_count | 0 | 12/12 (100%) | 12/12 (100%) | 100% | +12/12 | `E3-P3B-STAGING1` |
