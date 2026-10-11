# Benchmark Ledger

## Metrics

| Metric | Baseline | Target | Measured After Fix |
|---|---|---|---|
| Unauthenticated shift alert count (3s window) | `1` (bug) | `0` | `0` (`10/10` assertions pass) |
| Non-operational/administrative bureau leaks in JSON & API | `48` units | `0` units | `0` units (`369` operational ANTD Hanoi units: `314` ward police, `38` PCCC&CNCH, `17` CSGT) |
| Unescaped `&amp;` HTML entities in Hanoi dataset | `115` | `0` | `0` across all 5 JSON files |
| Multi-facility wards with simultaneous map pins, distance & `[Cơ sở gần nhất]` | `1` pin on map | `100%` all facilities | `100%` (verified on Phường Ba Đình 2 pins, Phường Bạch Mai 5 pins, Phường Hoàn Kiếm 6 pins) |
| Playwright E2E assertion pass rate | N/A | `100%` | `100%` (`29/29` assertions: `10/10` shift isolation + `19/19` multi-facility, non-emergency purge & escalation) |
