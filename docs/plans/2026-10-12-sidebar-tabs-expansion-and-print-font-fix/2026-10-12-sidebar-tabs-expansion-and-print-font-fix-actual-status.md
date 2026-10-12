# Mở Rộng Thanh Tabs Sidebar & Sửa Phông Chữ In Times New Roman, Xóa Nút PDF Thừa Actual Status

Title: Mở Rộng Thanh Tabs Sidebar & Sửa Phông Chữ In Times New Roman, Xóa Nút PDF Thừa
Date: 2026-10-12
Status: P0 Complete
Companion plan: `docs/plans/2026-10-12-sidebar-tabs-expansion-and-print-font-fix/2026-10-12-sidebar-tabs-expansion-and-print-font-fix-plan.md`
Companion evidence: `docs/plans/2026-10-12-sidebar-tabs-expansion-and-print-font-fix/2026-10-12-sidebar-tabs-expansion-and-print-font-fix-evidence.md`
Companion benchmark: `docs/plans/2026-10-12-sidebar-tabs-expansion-and-print-font-fix/2026-10-12-sidebar-tabs-expansion-and-print-font-fix-benchmark.md`

## Purpose

Tài liệu này ghi nhận hiện trạng trước khi thực hiện thay đổi:
1. Chiều rộng sidebar và sự cố bị che nút trên `#sidebarTabsNav`.
2. Sự tồn tại của nút thừa `#btnDownloadTerritoryPdf`.
3. Phông chữ in ấn khi gọi lệnh `window.print()` từ `printTerritoryStats()`.

## Scope

Target scope:
- `dispatcher.html`: Khung nút sidebar tabs, thanh toolbar của modal thống kê địa phương, các thẻ liên kết stylesheet cache-busting.
- `css/tactical-responsive.css`: Grid columns của layout `tac-three-zone` và kích thước `.dispatcher-sidebar`.
- `css/style.css`: Quy tắc in ấn `@media print` và styles phông chữ.
- `js/dispatcher.js`: Hàm `printTerritoryStats()`.

Out of scope:
- Toàn bộ backend và map logic.

## Current Status Matrix

| Unit | Current State | Required State | Status | Relationship Count | Evidence | Next Plan Decision |
|------|---------------|----------------|--------|--------------------|----------|--------------------|
| Sidebar Tabs Navigation (`#sidebarTabsNav`) | Chiều rộng sidebar chỉ 270px - 280px trong chế độ `tac-three-zone`, khiến tab 4 ("Cứu Hộ") và tab 5 ("Bệnh Viện") bị tràn, che khuất | Cột sidebar được nới rộng (410px - 420px), toàn bộ 5 nút hiển thị trọn vẹn 1 hàng không che | `fixed` | 3 related files | E0-P0A-USER1, E1-P1B-QA1 | Done in P1-B |
| Redundant PDF Download Button (`#btnDownloadTerritoryPdf`) | Nút đỏ "Tải File PDF" xuất hiện trong toolbar cạnh "In Máy / In PDF" | Xóa hoàn toàn nút này vì in máy và PDF đã tích hợp chung | `fixed` | 2 related files | E0-P0A-USER2, E1-P1A-QA1 | Done in P1-A |
| Print Font Family (`printTerritoryStats`) | Hộp thoại in trình duyệt dùng phông cached `Hubot Sans` do `printStyle` động thiếu rule áp đặt font | Luôn ép buộc `Times New Roman` cho mọi phần tử trong hộp thoại in | `fixed` | 3 related files | E0-P0A-USER3, E1-P1C-QA1 | Done in P1-C |
| Upper Agency Header (`#printUpperAgency`) | Dòng đơn vị cấp trên bị gán `'BỘ CÔNG AN / TTCH QUỐC GIA'` bị thừa ghép sai thể thức | Hiển thị chuẩn xác `'BỘ CÔNG AN'` ở dòng trên, dòng dưới là `'TRUNG TÂM CHỈ HUY TÁC CHIẾN QUỐC GIA'` | `fixed` | 2 related files | E0-P0A-USER4, E1-P1C-QA2 | Done in P1-C |

## Status Refresh Log

| Refresh | Date | Repo Basis | Changed Scope | Status Changes | Evidence | Next Phase Update |
|---------|------|------------|----------------|----------------|----------|-------------------|
| R0 | 2026-10-12 | baseline before P0 | sidebar tabs, print modal toolbar, print dynamic styles | initial classification | E0-P0A-USER1..3 | Tiến hành thực hiện P1-A, P1-B, P1-C |
| R1 | 2026-10-12 | post-implementation P1 | sidebar tabs, print modal, header đơn vị, cache buster | `wrong` -> `fixed` (100% PASS) | E1-P1A..D | Tiến hành P1-E (detect-changes & commit) |

## Detailed Findings

### Sidebar Tabs Truncation
- File: `css/tactical-responsive.css` (đã nâng grid-template-columns lên 410px - 420px).
- Kết quả: Chiều rộng sidebar đạt 420px, toàn bộ 5 tabs hiển thị trên cùng 1 hàng không bị đè, không cuộn ngang.

### Redundant PDF Download Button
- File: `dispatcher.html` & `js/dispatcher.js`.
- Kết quả: Đã xóa nút `#btnDownloadTerritoryPdf`, các nút In Máy/PDF, Word, Excel hoạt động tốt.

### Print Font Style Override
- File: `js/dispatcher.js` hàm `printTerritoryStats()`.
- Kết quả: Đã chèn trực tiếp quy tắc `@media print` phông `Times New Roman` vào style động `#territoryStatsPrintPageStyle` và inline style các ô bảng.

### Upper Agency Header Standardization
- File: `js/dispatcher.js` hàm `openTerritoryStatsModal()`.
- Nguyên nhân: Trước đó gán chuỗi `BỘ CÔNG AN / TTCH QUỐC GIA`.
- Kết quả: Đã chuẩn hóa thành `BỘ CÔNG AN` theo Nghị định 30/2020/NĐ-CP và đúng cơ cấu tổ chức của Bộ Công An.

## Final Decision

P1 hoàn thành 100%. Sẵn sàng thực hiện detect-changes và commit git.
