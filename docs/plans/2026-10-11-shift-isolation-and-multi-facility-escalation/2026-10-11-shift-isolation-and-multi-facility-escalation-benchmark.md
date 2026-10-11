# Benchmark Ledger

## Metrics

| Metric | Baseline | Target | Measured After Fix |
|---|---|---|---|
| Unauthenticated shift alert count (3s window) | `1` (bug) | `0` | `0` (`10/10` assertions pass) |
| Non-operational station leaks in JSON & API | `13` units | `0` units | `0` units (`404` operational Hanoi units retained) |
| Unescaped `&amp;` HTML entities in Hanoi dataset | `115` | `0` | `0` across all 5 JSON files |
| Multi-facility wards with distance & `[Cơ sở gần nhất]` | `0%` in drawer/popup | `100%` | `100%` (verified on Phường Ba Đình 2-facility & Phường Bạch Mai 5-facility wards) |
| Playwright E2E assertion pass rate | N/A | `100%` | `100%` (`27/27` assertions: `10/10` shift isolation + `17/17` multi-facility & escalation) |
