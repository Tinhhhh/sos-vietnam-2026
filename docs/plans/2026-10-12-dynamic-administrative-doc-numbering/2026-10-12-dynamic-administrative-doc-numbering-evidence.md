# Chuẩn Hóa Số Ký Hiệu Văn Bản Hành Chính Động Theo Từng Cấp Đơn Vị Evidence Ledger

## Metadata

- Date: `2026-10-12`
- Plan: `docs/plans/2026-10-12-dynamic-administrative-doc-numbering/2026-10-12-dynamic-administrative-doc-numbering-plan.md`
- Evidence: `docs/plans/2026-10-12-dynamic-administrative-doc-numbering/2026-10-12-dynamic-administrative-doc-numbering-evidence.md`
- Benchmark: `docs/plans/2026-10-12-dynamic-administrative-doc-numbering/2026-10-12-dynamic-administrative-doc-numbering-benchmark.md`
- Actual status: `docs/plans/2026-10-12-dynamic-administrative-doc-numbering/2026-10-12-dynamic-administrative-doc-numbering-actual-status.md`

## Evidence Rules

- Ghi lại các phát hiện thực tế trước khi sửa đổi và bằng chứng kiểm thử sau khi hoàn thành.
- Đối chiếu chi tiết với bảng phân loại của người dùng.

## E0 - P0 Evidence

Matching plan item(s): `P0-A`

- `E0-P0A-USER1`: Người dùng gửi bảng chuẩn hóa và yêu cầu chi tiết:
  - Cấp Quốc Gia -> `Số: ...... /BC-TTCH` (hoặc `/BC-TTCHTC`)
  - Cấp Tỉnh/TP -> `Số: ...... /BC-CATP CẦN THƠ` (với TP) hoặc `Số: ...... /BC-CAT [TỈNH]` (với tỉnh)
  - Cấp Xã -> `Số: ...... /BC-CAX PHÚ TÂM` (hoặc `/BC-CAX THUẬN HÒA`)
  - Cấp Phường -> `Số: ...... /BC-CAP TÂN AN`
  - Cấp Thị Trấn -> `Số: ...... /BC-CATT`
  - CSGT -> `Số: ...... /BC-CSGT CẦN THƠ`
  - PCCC -> `Số: ...... /BC-PCCC CẦN THƠ`
  - Y tế -> `Số: ...... /BC-BYT`
- `E0-P0A-SRC1`: `dispatcher.html` dòng 3339 chứa thẻ hardcoded: `Số: ...... /BC-CATB`.
- `E0-P0A-SRC2`: `js/dispatcher.js` dòng 14967 chứa mã hardcoded: `Số: ......./BC-CA`.

## E1 - P1 Evidence

Matching plan item(s): `P1-A`, `P1-B`, `P1-C`, `P1-D`

- `E1-P1A-SRC`: Hàm `getAdministrativeDocNumber(officer, filter)` được triển khai tại `js/dispatcher.js` dòng 14517, chuẩn hóa đầy đủ tất cả các trường hợp theo quy định thể thức ngành Công an:
  - Cấp Quốc gia -> `Số: ...... /BC-TTCH`
  - Cấp TP trực thuộc TW -> `Số: ...... /BC-CATP [TÊN TP]` (Ví dụ: `Số: ...... /BC-CATP CẦN THƠ`, `Số: ...... /BC-CATP HÀ NỘI`)
  - Cấp Tỉnh -> `Số: ...... /BC-CAT [TÊN TỈNH]` (Ví dụ: `Số: ...... /BC-CAT ĐỒNG NAI`, `Số: ...... /BC-CAT AN GIANG`)
  - Cấp Xã -> `Số: ...... /BC-CAX [TÊN XÃ]` (Ví dụ: `Số: ...... /BC-CAX PHÚ TÂM`, `Số: ...... /BC-CAX THUẬN HÒA`)
  - Cấp Phường -> `Số: ...... /BC-CAP [TÊN PHƯỜNG]` (Ví dụ: `Số: ...... /BC-CAP TÂN AN`, `Số: ...... /BC-CAP AN KHÁNH`)
  - Cấp Thị Trấn -> `Số: ...... /BC-CATT [TÊN THỊ TRẤN]` (Ví dụ: `Số: ...... /BC-CATT PHONG ĐIỀN`)
  - Lực lượng CSGT -> `Số: ...... /BC-CSGT [TÊN TỈNH/TP]`
  - Lực lượng PCCC -> `Số: ...... /BC-PCCC [TÊN TỈNH/TP]`
  - Lực lượng Y tế / 115 -> `Số: ...... /BC-BYT`
  - Cứu hộ giao thông -> `Số: ...... /BC-CHGT [TÊN TỈNH/TP]`
- `E1-P1B-UI`: Đã kết nối cập nhật DOM `#printDocNumber` tại `openTerritoryStatsModal()` và `renderTerritoryStatsTable(agencyFilter)`, và liên kết trong `downloadTerritoryWord()`.
- `E1-P1C-PLAYWRIGHT`: Báo cáo QA chính thức tại:
  - File JSON: `Reports/qa/playwright/2026-10-12-dynamic-doc-numbering.json`
  - File Markdown: `Reports/qa/playwright/2026-10-12-dynamic-doc-numbering.md`
  - Tỷ lệ đạt: **21/21 assertions PASS (100%)**
- `E1-P1C-SCREENSHOT`: Bằng chứng ảnh chụp màn hình:
  - `Reports/qa/playwright/screenshots/dynamic-doc-number-modal.png`: Giao diện modal khi chuyển tab CSGT, PCCC, Y tế.
  - `Reports/qa/playwright/screenshots/dynamic-doc-number-ward.png`: Giao diện modal cấp Xã Thuận Hòa (`Số: ...... /BC-CAX THUẬN HÒA`).

