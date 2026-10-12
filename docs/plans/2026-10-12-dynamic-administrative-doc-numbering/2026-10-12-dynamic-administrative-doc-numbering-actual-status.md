# Chuẩn Hóa Số Ký Hiệu Văn Bản Hành Chính Động Theo Từng Cấp Đơn Vị Actual Status

Title: Chuẩn Hóa Số Ký Hiệu Văn Bản Hành Chính Động Theo Từng Cấp Đơn Vị
Date: 2026-10-12
Status: Complete
Companion plan: `docs/plans/2026-10-12-dynamic-administrative-doc-numbering/2026-10-12-dynamic-administrative-doc-numbering-plan.md`
Companion evidence: `docs/plans/2026-10-12-dynamic-administrative-doc-numbering/2026-10-12-dynamic-administrative-doc-numbering-evidence.md`
Companion benchmark: `docs/plans/2026-10-12-dynamic-administrative-doc-numbering/2026-10-12-dynamic-administrative-doc-numbering-benchmark.md`

## Purpose

Tài liệu này ghi nhận hiện trạng trước và sau khi thực hiện chuẩn hóa số ký hiệu văn bản hành chính theo cấp đơn vị:
1. Số văn bản trong modal thống kê địa bàn đã được động hóa hoàn toàn.
2. Số văn bản trong file Word báo cáo thống kê đã được đồng bộ chuẩn hóa.
3. Toàn bộ 8 nhóm cấp bậc và lực lượng theo yêu cầu của người dùng đã được bao phủ chính xác 100%.

## Scope

Target scope:
- `dispatcher.html`: Thẻ hiển thị số ký hiệu văn bản trong `territoryStatsModal` (`#printDocNumber`).
- `js/dispatcher.js`: Hàm `getAdministrativeDocNumber`, `openTerritoryStatsModal`, `renderTerritoryStatsTable`, và `downloadTerritoryWord`.

Out of scope:
- Các trường dữ liệu bản đồ và thuật toán điều phối.

## Current Status Matrix

| Unit | Current State | Required State | Status | Relationship Count | Evidence | Next Plan Decision |
|------|---------------|----------------|--------|--------------------|----------|--------------------|
| Modal Print Doc Number (`#printDocNumber`) | Tự động đổi theo cấp và địa phương: `/BC-TTCH`, `/BC-CATP [TÊN TP]`, `/BC-CAT [TÊN TỈNH]`, `/BC-CAP [TÊN PHƯỜNG]`, `/BC-CAX [TÊN XÃ]`, `/BC-CSGT`, `/BC-PCCC`, `/BC-BYT` | Tự động đổi theo cấp và địa phương | `resolved` | 2 related files | E1-P1C-PLAYWRIGHT, E1-P1C-SCREENSHOT | completed |
| Word Export Doc Number | Tự động đồng bộ với số ký hiệu động chuẩn thể thức của đơn vị qua `getAdministrativeDocNumber(officer, filter)` | Tự động đồng bộ với số ký hiệu động chuẩn thể thức của đơn vị | `resolved` | 1 related file | E1-P1C-PLAYWRIGHT | completed |

## Status Refresh Log

| Refresh | Date | Repo Basis | Changed Scope | Status Changes | Evidence | Next Phase Update |
|---------|------|------------|----------------|----------------|----------|-------------------|
| R0 | 2026-10-12 | baseline before P0 | doc number trong HTML và Word export | initial classification | E0-P0A-SRC1..2, E0-P0A-USER1 | Tiến hành P1-A, P1-B, P1-C, P1-D |
| R1 | 2026-10-12 | after P1-A..D implementation | `dispatcher.html`, `js/dispatcher.js` | `wrong` -> `resolved` (100% PASS) | E1-P1C-PLAYWRIGHT, E1-P1C-SCREENSHOT | Hoàn tất slice |

## Detailed Findings

### Modal Print Doc Number
- File: `dispatcher.html` dòng 3339 (`<div style="font-size: 12pt; margin-top: 4px;" id="printDocNumber">Số: ...... /BC-CATB</div>`).
- Đã gán `id="printDocNumber"` và cập nhật động qua `openTerritoryStatsModal()` và `renderTerritoryStatsTable(agencyFilter)`.

### Word Export Doc Number
- File: `js/dispatcher.js` trong `downloadTerritoryWord()`:
- Đã thay thế chuỗi hardcoded bằng `${this.getAdministrativeDocNumber(officer, filter)}`.

## Final Decision

P1 complete. Tất cả 21/21 assertions kiểm thử Playwright tự động đạt 100% PASS. Sẵn sàng commit và đóng slice.
