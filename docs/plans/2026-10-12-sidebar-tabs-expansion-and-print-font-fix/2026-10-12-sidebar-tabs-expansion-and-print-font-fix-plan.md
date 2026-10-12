# Kế Hoạch Mở Rộng Thanh Tabs Sidebar & Sửa Phông Chữ In Times New Roman, Xóa Nút PDF Thừa Plan

## Metadata

- Date: `2026-10-12`
- Status: `completed`
- Plan: `docs/plans/2026-10-12-sidebar-tabs-expansion-and-print-font-fix/2026-10-12-sidebar-tabs-expansion-and-print-font-fix-plan.md`
- Evidence: `docs/plans/2026-10-12-sidebar-tabs-expansion-and-print-font-fix/2026-10-12-sidebar-tabs-expansion-and-print-font-fix-evidence.md`
- Benchmark: `docs/plans/2026-10-12-sidebar-tabs-expansion-and-print-font-fix/2026-10-12-sidebar-tabs-expansion-and-print-font-fix-benchmark.md`
- Actual status: `docs/plans/2026-10-12-sidebar-tabs-expansion-and-print-font-fix/2026-10-12-sidebar-tabs-expansion-and-print-font-fix-actual-status.md`

## Goal

1. **Mở rộng thanh nút tabs sidebar (`#sidebarTabsNav`)**: Điều chỉnh độ rộng cột hàng đợi sidebar và các nút tabs sao cho hiển thị đầy đủ cả 5 nút trên cùng một hàng ngang mà không bị che khuất/cắt xén, khớp chính xác 100% với Hình số 3 của người dùng:
   - `[⚠️ Sự Cố (98)]`
   - `[📄 Lịch Sử (10)]`
   - `[🏛️ Công An]`
   - `[🚗 Cứu Hộ]`
   - `[🏛️ Bệnh Viện]`
2. **Xóa nút "Tải File PDF" thừa (`#btnDownloadTerritoryPdf`)**: Vì "In Máy / In PDF" đã tích hợp đầy đủ tính năng in máy và lưu PDF của trình duyệt, loại bỏ nút đỏ thừa trong toolbar của `territoryStatsModal` và dọn dẹp mã JS tương ứng.
3. **Khắc phục triệt để phông chữ Times New Roman khi in trực tiếp**: Đảm bảo 100% hộp thoại in máy in và xuất PDF của trình duyệt hiển thị chuẩn phông có chân `Times New Roman` (TCVN 6909:2001) theo Nghị định 30/2020/NĐ-CP bằng cách nạp trực tiếp CSS quy tắc phông chữ vào thẻ style động khi gọi `printTerritoryStats()`, bổ sung inline style kiên cố, cập nhật `@media print` trong `style.css`, và nâng số phiên bản cache-buster `?v=20261012_tnr_fixed`.

## Rules

- Complete P0 actual status before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence as work completes.
- Record benchmarkable counts or measurements when they are taken.
- Run Anvien detect-changes before every implementation-slice commit.
- Validate real user-visible runtime with Playwright evidence.

## Problem

1. Sidebar đang bị giới hạn ở 270px - 280px trong chế độ `tac-three-zone`, khiến hàng 5 tabs (`#sidebarTabsNav`) bị tràn và nút số 4 ("Cứu Hộ"), số 5 ("Bệnh Viện") bị che mất. Người dùng yêu cầu mở rộng hiển thị đầy đủ cả 5 nút như Hình số 3.
2. Hộp thoại in trình duyệt của người dùng vẫn nhận diện phông `Hubot Sans` (không chân) do trình duyệt cache file CSS cũ và mã in động `printTerritoryStats()` chưa chèn tường minh quy tắc `font-family: 'Times New Roman' !important` vào thẻ style in tạm thời.
3. Tồn tại nút đỏ "Tải File PDF" dư thừa trong khi nút "In Máy / In PDF" đã đảm nhiệm cả hai chức năng.

## Scope

- In scope:
  - `dispatcher.html`: Xóa `#btnDownloadTerritoryPdf`, tăng version cache-busting các tệp CSS/JS, bổ sung font Times New Roman trực tiếp.
  - `css/tactical-responsive.css`: Điều chỉnh độ rộng cột sidebar hàng đợi trong grid layout (`tac-three-zone` và default) lên 400px - 420px để 5 nút hiển thị vừa vặn trên 1 hàng không bị che.
  - `css/style.css`: Đảm bảo quy tắc `@media print` áp dụng phông Times New Roman toàn diện cho bản in.
  - `js/dispatcher.js`: Bổ sung rule phông chữ Times New Roman trực tiếp vào `printStyle.textContent` khi gọi `printTerritoryStats()`, gỡ bỏ listener `btnDownloadTerritoryPdf`.
  - Kiểm thử tự động Playwright & sinh báo cáo bằng chứng QA.
- Out of scope:
  - Không thay đổi logic xử lý sự cố hoặc bản đồ.
  - Không thay đổi backend API.

## Non-Goals

- Không viết lại toàn bộ CSS grid của hệ thống, chỉ nới rộng cột hàng đợi sidebar để chứa đủ 5 tabs theo hình 3.

## Requirements

1. 5 nút tabs sidebar phải hiển thị trọn vẹn, không bị scroll ngang hay che khuất ở các độ phân giải tiêu chuẩn (≥ 1280px).
2. Nút "Tải File PDF" bị xóa hoàn toàn khỏi giao diện modal thống kê.
3. Khi in (`window.print()`), toàn bộ bảng và tiêu đề phải áp dụng phông chữ `Times New Roman`.

## Acceptance Criteria

1. Playwright chụp màn hình sidebar xác nhận thấy đủ 5 tabs: `tabBtnIncidents`, `tabBtnHistory`, `tabBtnStations`, `tabBtnEnterprises`, `tabBtnHospitals` cùng hiển thị không bị cắt chữ.
2. Nút `#btnDownloadTerritoryPdf` không còn tồn tại trên DOM.
3. Trình duyệt render in ấn hiển thị phông chữ `Times New Roman`.

## Checklist

- [x] P0-A: Khảo sát hiện trạng thực tế và lập hồ sơ P0 Actual Status.
  - Goal: Xác định chính xác kích thước sidebar hiện tại, vị trí nút PDF thừa, và nguyên nhân phông in chưa đổi.
  - Implementation Gate: Hoàn thành ghi nhận `actual-status.md`.
  - Acceptance: Đã xác định rõ các selector và thông số cần sửa đổi.

### P1: Mở Rộng Sidebar Tabs & Xóa Nút PDF Thừa & Ép Phông Times New Roman Cho Bản In & Chuẩn Hóa Header 'BỘ CÔNG AN'

- [x] P1-A: Xóa nút "Tải File PDF" thừa và cập nhật cache buster trong `dispatcher.html` & `js/dispatcher.js`.
  - Goal: Xóa `#btnDownloadTerritoryPdf`, dọn event listener, cập nhật query param `?v=20261012_decree30_fixed`.
  - Implementation Gate: Kiểm tra không làm vỡ các nút còn lại trong toolbar.
  - Acceptance: Nút `#btnDownloadTerritoryPdf` biến mất, các nút In Máy/PDF, Word, Excel hoạt động hoàn hảo.

- [x] P1-B: Mở rộng thanh tabs sidebar hiển thị đủ 5 nút như Hình số 3 trong `css/tactical-responsive.css` & `css/style.css`.
  - Goal: Điều chỉnh grid-template-columns cột queue lên 410px - 420px, padding tabs vừa vặn để 5 nút hiển thị trọn vẹn trong 1 dòng.
  - Implementation Gate: Kiểm tra không làm vỡ bố cục bản đồ trung tâm.
  - Acceptance: Cả 5 nút tabs nằm trọn vẹn trên 1 hàng không bị đè hay cắt chữ (`allTabsFullyVisible: true`, `isOverflowing: false`).

- [x] P1-C: Củng cố phông chữ Times New Roman khi in trực tiếp trong `js/dispatcher.js` và `css/style.css` & Chuẩn hóa Header 'BỘ CÔNG AN'.
  - Goal: Thêm rule `@media print` phông `Times New Roman` trực tiếp vào `printStyle.textContent` của `printTerritoryStats()`, inline styles, và sửa dòng đơn vị cấp trên thành `'BỘ CÔNG AN'` (loại bỏ `'/ TTCH QUỐC GIA'` bị thừa).
  - Implementation Gate: Kiểm tra tính tương thích khi in và xuất file.
  - Acceptance: Hộp thoại in và kết xuất in ấn luôn hiển thị phông `Times New Roman`, dòng trên chuẩn xác là `BỘ CÔNG AN`.

- [x] P1-D: Chạy kiểm thử tự động Playwright, xuất ảnh bằng chứng và báo cáo QA.
  - Goal: Kiểm thử tự động Playwright xác nhận 5 nút tabs hiển thị đầy đủ, nút PDF đã xóa, phông in là Times New Roman, Header là BỘ CÔNG AN.
  - Implementation Gate: Đầy đủ 8/8 assertions đạt PASS.
  - Acceptance: Sinh file báo cáo `.json`, `.md` và ảnh chụp màn hình đạt chuẩn.

- [x] P1-E: Rà soát Anvien detect-changes, cập nhật tài liệu và Commit.
  - Goal: Hoàn tất đóng slice theo quy trình chuẩn.
  - Implementation Gate: Detect-changes không có lỗi hồi quy nghiêm trọng (Risk level: low).
  - Acceptance: Commit git sạch sẽ với message chuẩn.
