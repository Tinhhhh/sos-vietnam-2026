# Mở Rộng Thanh Tabs Sidebar & Sửa Phông Chữ In Times New Roman, Xóa Nút PDF Thừa Evidence Ledger

## Metadata

- Date: `2026-10-12`
- Plan: `docs/plans/2026-10-12-sidebar-tabs-expansion-and-print-font-fix/2026-10-12-sidebar-tabs-expansion-and-print-font-fix-plan.md`
- Evidence: `docs/plans/2026-10-12-sidebar-tabs-expansion-and-print-font-fix/2026-10-12-sidebar-tabs-expansion-and-print-font-fix-evidence.md`
- Benchmark: `docs/plans/2026-10-12-sidebar-tabs-expansion-and-print-font-fix/2026-10-12-sidebar-tabs-expansion-and-print-font-fix-benchmark.md`
- Actual status: `docs/plans/2026-10-12-sidebar-tabs-expansion-and-print-font-fix/2026-10-12-sidebar-tabs-expansion-and-print-font-fix-actual-status.md`

## Evidence Rules

- Ghi lại trung thực mọi bằng chứng trước và sau khi thay đổi mã nguồn.
- Đính kèm mã lỗi, hình ảnh cắt từ phía người dùng, và bằng chứng kiểm thử tự động Playwright.

## E0 - P0 Evidence

Matching plan item(s): `P0-A`

- `E0-P0A-USER1`: Người dùng gửi 3 ảnh:
  - Ảnh 1 (`media_1791815851967_c63eb003.png`): Thanh tabs bị che mất tab "Cứu Hộ" và "Bệnh Viện".
  - Ảnh 2 (`media_1791815909127_6bd20b18.png`): Khi cuộn ngang, tab "Bệnh Viện" vẫn bị che 1 nửa.
  - Ảnh 3 (`media_1791815933737_4ee7f2d5.png`): Mong muốn hiển thị đầy đủ 5 nút: `[⚠️ Sự Cố (98)]`, `[📄 Lịch Sử (10)]`, `[🏛️ Công An]`, `[🚗 Cứu Hộ]`, `[🏛️ Bệnh Viện]`.
- `E0-P0A-USER2`: Ảnh `media_1791815605722_4a29d387.png` hiển thị nút "Tải File PDF" màu đỏ dư thừa.
- `E0-P0A-USER3`: Ảnh `media_1791815636810_27339fc3.png` cho thấy hộp thoại in thực tế trên máy in Brother MFC-L2700DV đang hiển thị phông sans-serif (`Hubot Sans`), chưa ăn phông `Times New Roman`.
- `E0-P0A-USER4`: Ảnh `media_1791816806857_359ed223.png` cho thấy dòng đơn vị cấp trên hiển thị `'BỘ CÔNG AN / TTCH QUỐC GIA'` bị thừa sai thể thức, người dùng yêu cầu sửa thành `'BỘ CÔNG AN'`.
- `E0-P0A-SRC1`: `css/tactical-responsive.css` dòng 697 và 706 giới hạn cột hàng đợi ở 280px / 270px.
- `E0-P0A-SRC2`: `dispatcher.html` dòng 3304 chứa `<button id="btnDownloadTerritoryPdf">`.
- `E0-P0A-SRC3`: `js/dispatcher.js` hàm `printTerritoryStats()` tạo style động `#territoryStatsPrintPageStyle` nhưng chỉ chứa size và margin, thiếu rule `font-family: 'Times New Roman' !important;`.
- `E0-P0A-SRC4`: `js/dispatcher.js` dòng 14534 gán `upperTitle.textContent = ... 'BỘ CÔNG AN / TTCH QUỐC GIA'`.

## E1 - P1 Evidence

Matching plan item(s): `P1-A`, `P1-B`, `P1-C`, `P1-D`, `P1-E`

- `E1-P1A-QA1`: Xác nhận nút `#btnDownloadTerritoryPdf` không còn tồn tại trong DOM (`pdfBtnExists: false`), các nút In Máy/PDF, Word, Excel hoạt động tốt (`PRINT_AND_OTHER_BUTTONS_RETAINED: PASS`).
- `E1-P1B-QA1`: Xác nhận độ rộng sidebar đạt 420px (`SIDEBAR_WIDTH_EXPANDED: PASS`), 5 nút tabs hiển thị trọn vẹn không tràn (`allTabsFullyVisible: true`, `isOverflowing: false`). Ảnh chụp: `Reports/qa/playwright/screenshots/sidebar-tabs-5-buttons-expanded-verified.png`.
- `E1-P1C-QA1`: Xác nhận 100% computed `font-family` của Header, Bảng biểu và Chữ ký in ấn đều là `"Times New Roman", Times, serif`. File PDF kiểm chứng: `Reports/qa/playwright/screenshots/Bao_Cao_Thong_Ke_Su_Co_Times_New_Roman_Fixed.pdf`, ảnh trang 1: `Reports/qa/playwright/screenshots/pdf_page1_preview_verified.png`.
- `E1-P1C-QA2`: Xác nhận dòng đơn vị cấp trên hiển thị chuẩn xác `'BỘ CÔNG AN'`, dòng dưới là `'TRUNG TÂM CHỈ HUY TÁC CHIẾN QUỐC GIA'` (`UPPER_AGENCY_TITLE_STANDARDIZED: PASS`). Ảnh chụp cận cảnh: `Reports/qa/playwright/screenshots/bo_cong_an_header_verified.png`.
- `E1-P1D-QA1`: Báo cáo tự động Playwright chính thức:
  - `Reports/qa/playwright/2026-10-12-sidebar-tabs-and-print-font-fixed.json`
  - `Reports/qa/playwright/2026-10-12-sidebar-tabs-and-print-font-fixed.md` (8/8 assertions PASS).
