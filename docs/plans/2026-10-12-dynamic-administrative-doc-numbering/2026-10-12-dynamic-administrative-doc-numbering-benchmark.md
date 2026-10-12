# Chuẩn Hóa Số Ký Hiệu Văn Bản Hành Chính Động Theo Từng Cấp Đơn Vị Benchmark Ledger

## Metadata

- Date: `2026-10-12`
- Plan: `docs/plans/2026-10-12-dynamic-administrative-doc-numbering/2026-10-12-dynamic-administrative-doc-numbering-plan.md`
- Evidence: `docs/plans/2026-10-12-dynamic-administrative-doc-numbering/2026-10-12-dynamic-administrative-doc-numbering-evidence.md`
- Benchmark: `docs/plans/2026-10-12-dynamic-administrative-doc-numbering/2026-10-12-dynamic-administrative-doc-numbering-benchmark.md`
- Actual status: `docs/plans/2026-10-12-dynamic-administrative-doc-numbering/2026-10-12-dynamic-administrative-doc-numbering-actual-status.md`

## Benchmark Rules

- Đo lường độ chính xác và tỷ lệ bao phủ của số ký hiệu văn bản tương ứng với từng cấp đơn vị và lực lượng.

## B0 - P0 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P0 | Tỷ lệ cấp đơn vị hỗ trợ ký hiệu động | % | 0% (cố định CATB) | 0% | 0% | 100% | 0% | E0-P0A-SRC1 |
| P0 | Số lượng trường hợp phân loại hỗ trợ | ca | 1 | 1 | 1 | 8 | 0 | E0-P0A-USER1 |

## B1 - P1 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P1 | Tỷ lệ cấp đơn vị hỗ trợ ký hiệu động | % | 0% | 100% | 100% | 100% | +100% | E1-P1A-SRC, E1-P1C-PLAYWRIGHT |
| P1 | Số lượng trường hợp phân loại hỗ trợ | nhóm | 1 | 10 | 10 | 8 | +9 | E1-P1A-SRC, E1-P1C-PLAYWRIGHT |
| P1 | Tỷ lệ đạt Playwright Assertion | % | 0% | 100% | 100% | 100% | +100% | E1-P1C-PLAYWRIGHT (21/21 Pass) |

## Non-Benchmarkable Notes

- Đo lường thông qua tỷ lệ assertions đạt chuẩn trong bộ test Playwright (21/21 assertions đạt 100% PASS).

