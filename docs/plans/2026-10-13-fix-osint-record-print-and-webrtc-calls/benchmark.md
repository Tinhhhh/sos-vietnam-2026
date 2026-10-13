# Benchmark: Fix OSINT Administrative Record, Intake Sheet Print/PDF, and 2-Way WebRTC Voice/Video Calls

**Date:** 2026-10-13

## Empirical Runtime & Export Benchmarks (`playwright/verify-osint-print-and-webrtc-calls.mjs`)

| Metric | Measured Value | Target / Threshold | Status |
|--------|----------------|--------------------|--------|
| Voice Call Setup (Dispatcher -> Citizen) | `576 ms` | `< 3000 ms` | PASS |
| Voice Call Setup (Citizen -> Dispatcher) | `341 ms` | `< 3000 ms` | PASS |
| Video Call Setup (Dispatcher -> Citizen) | `191 ms` | `< 3000 ms` | PASS |
| Video Call Setup (Citizen -> Dispatcher) | `445 ms` | `< 3000 ms` | PASS |
| Citizen Remote Audio Frequency Level | `46.26` (non-silent) | `> 0` | PASS |
| Dispatcher Remote Audio Frequency Level | `46.51` (non-silent) | `> 0` | PASS |
| Intake Report Word (`.docx`) Export Latency | `530 ms` (`38,861 bytes`) | `< 5000 ms` (`> 10 KB`) | PASS |
| OSINT Administrative Record (`.docx`) Export Latency | `381 ms` (`38,620 bytes`) | `< 5000 ms` (`> 10 KB`) | PASS |
| Intake Report Print Sheet Bounding Box (`@media print`) | `820 x 1098 px` (1 A4 page) | `> 400 x 400 px`, `0` blank pages | PASS |
