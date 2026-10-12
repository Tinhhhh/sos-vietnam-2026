# Mở Rộng Thanh Tabs Sidebar & Sửa Phông Chữ In Times New Roman, Xóa Nút PDF Thừa Benchmark Ledger

## Metadata

- Date: `2026-10-12`
- Plan: `docs/plans/2026-10-12-sidebar-tabs-expansion-and-print-font-fix/2026-10-12-sidebar-tabs-expansion-and-print-font-fix-plan.md`
- Evidence: `docs/plans/2026-10-12-sidebar-tabs-expansion-and-print-font-fix/2026-10-12-sidebar-tabs-expansion-and-print-font-fix-evidence.md`
- Benchmark: `docs/plans/2026-10-12-sidebar-tabs-expansion-and-print-font-fix/2026-10-12-sidebar-tabs-expansion-and-print-font-fix-benchmark.md`
- Actual status: `docs/plans/2026-10-12-sidebar-tabs-expansion-and-print-font-fix/2026-10-12-sidebar-tabs-expansion-and-print-font-fix-actual-status.md`

## Benchmark Rules

- Ghi lại các thông số đo lường về layout (kích thước pixel sidebar, số lượng tabs hiển thị), kích cỡ phông in ấn.

## B0 - P0 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P0 | Sidebar Queue Column Width | px | 280px | 280px | 280px | 410px - 420px | 0px | E0-P0A-SRC1 |
| P0 | Number of Visible Tabs without scroll | tabs | 3 | 3 | 3 | 5 | 0 | E0-P0A-USER1 |
| P0 | Redundant PDF Button Count | button | 1 | 1 | 1 | 0 | 0 | E0-P0A-SRC2 |
| P0 | Print Dialog Computed Font | font-name | Hubot Sans (cached) | Hubot Sans | Hubot Sans | Times New Roman | 0 | E0-P0A-USER3 |
| P0 | Upper Agency Title Redundancy | text | 'BỘ CÔNG AN / TTCH QUỐC GIA' | 'BỘ CÔNG AN / TTCH QUỐC GIA' | 'BỘ CÔNG AN / TTCH QUỐC GIA' | 'BỘ CÔNG AN' | 0 | E0-P0A-USER4 |

## B1 - P1 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P1 | Sidebar Queue Column Width | px | 280px | 420px | 420px | >= 410px | +140px | E1-P1B-QA1 |
| P1 | Number of Visible Tabs without scroll | tabs | 3 | 5 | 5 | 5 | +2 tabs (100%) | E1-P1B-QA1 |
| P1 | Redundant PDF Button Count | button | 1 | 0 | 0 | 0 | -1 (Removed) | E1-P1A-QA1 |
| P1 | Print Dialog Computed Font | font-name | Hubot Sans | Times New Roman | Times New Roman | Times New Roman | 100% Times | E1-P1C-QA1 |
| P1 | Upper Agency Title Standardized | text | 'BỘ CÔNG AN / TTCH QUỐC GIA' | 'BỘ CÔNG AN' | 'BỘ CÔNG AN' | 'BỘ CÔNG AN' | Chuẩn hóa NĐ 30 | E1-P1C-QA2 |

## Non-Benchmarkable Notes

- Toàn bộ các tiêu chí đều đo lường được bằng Playwright và các công cụ DOM metrics. Đã xác nhận 8/8 assertions PASS.
