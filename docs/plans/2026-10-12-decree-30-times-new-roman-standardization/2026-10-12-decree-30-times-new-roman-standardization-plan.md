# Kế Hoạch Chuẩn Hóa Phông Chữ Times New Roman & Kích Cỡ Văn Bản Hành Chính Theo Nghị Định 30/2020/NĐ-CP Cho Tất Cả Các Tài Liệu Xuất Bản (PDF, In, Word, Excel, Hình Ảnh)

## Metadata
- Date: `2026-10-12`
- Status: `completed`
- Plan: `docs/plans/2026-10-12-decree-30-times-new-roman-standardization/2026-10-12-decree-30-times-new-roman-standardization-plan.md`
- Evidence: `docs/plans/2026-10-12-decree-30-times-new-roman-standardization/2026-10-12-decree-30-times-new-roman-standardization-evidence.md`
- Benchmark: `docs/plans/2026-10-12-decree-30-times-new-roman-standardization/2026-10-12-decree-30-times-new-roman-standardization-benchmark.md`
- Actual status: `docs/plans/2026-10-12-decree-30-times-new-roman-standardization/2026-10-12-decree-30-times-new-roman-standardization-actual-status.md`

## Mục Tiêu Cốt Lõi (Core Goals)

1. **Chuẩn hóa 100% Phông chữ Times New Roman**:
   - Áp dụng triệt để phông chữ `Times New Roman` (Unicode TCVN 6909:2001) cho mọi định dạng xuất văn bản: Bản In trực tiếp, Bản xuất PDF, File Word (.docx / .doc), File Excel (.xlsx), và Bản ảnh xuất (.png).
   - Tuyệt đối không để lẫn phông không chân (Arial, Roboto, Segoe UI, sans-serif) trong các tài liệu thể thức hành chính ban hành.

2. **Chuẩn hóa Kích cỡ & Kiểu chữ theo Thể thức Hành chính Việt Nam (Nghị định số 30/2020/NĐ-CP)**:
   - **Quốc hiệu**: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM" — cỡ 12 - 13pt, chữ in hoa, đứng, đậm.
   - **Tiêu ngữ**: "Độc lập - Tự do - Hạnh phúc" — cỡ 13 - 14pt (lớn hơn Quốc hiệu 1 cỡ), chữ in thường viết hoa chữ đầu, đứng, đậm, có đường kẻ ngang liền thanh bên dưới.
   - **Tên cơ quan, tổ chức ban hành**: Cơ quan cấp trên cỡ 12 - 13pt in hoa đứng; Cơ quan trực tiếp ban hành cỡ 12 - 13pt in hoa đứng đậm, có nét kẻ ngang từ 1/3 đến 1/2 độ dài dòng chữ.
   - **Số, ký hiệu văn bản**: cỡ 12 - 13pt, đứng.
   - **Địa danh, ngày tháng năm**: cỡ 13 - 14pt, chữ in thường, nghiêng (ví dụ: *Cần Thơ, ngày 12 tháng 10 năm 2026*).
   - **Tiêu đề văn bản (Tên loại văn bản)**: cỡ 14 - 15pt, in hoa, đứng, đậm.
   - **Trích yếu / Phạm vi thống kê**: cỡ 12.5 - 13.5pt, chữ thường, nghiêng.
   - **Bảng biểu**: Tiêu đề cột cỡ 10 - 11pt đậm; nội dung ô dữ liệu cỡ 9.5 - 10.5pt đứng; mã SOS và trạng thái in đậm.
   - **Khối chữ ký**:
     - Quyền hạn, chức vụ (CÁN BỘ LẬP BIỂU, TRỰC BAN TÁC CHIẾN): cỡ 13 - 14pt, in hoa, đứng, đậm. Căn sát lề phải.
     - Lời dẫn chú thích: *(Ký, ghi rõ họ tên và cấp bậc)*: cỡ 10.5 - 11pt, nghiêng.
     - Họ và tên người ký: cỡ 13 - 14pt, đứng, đậm.
   - **Nơi nhận**: Từ "Nơi nhận:" cỡ 12pt, nghiêng, đậm; danh sách đơn vị nhận cỡ 10.5 - 11pt đứng. Căn lề trái.

3. **Phạm vi Files cập nhật**:
   - `dispatcher.html`: Chuẩn hóa HTML `#printOfficialHeader`, `#printOfficialFooter`, `#territoryStatsPrintArea`, `#reportSheetContainer`.
   - `css/style.css`: Chuẩn hóa toàn bộ CSS `@media print` và styles hiển thị văn bản in, xuất ảnh.
   - `js/dispatcher.js`:
     - Hàm `downloadTerritoryWord()`: Chuẩn hóa HTML xuất file Word `.doc` theo đúng tỷ lệ NĐ 30.
     - Hàm `openTerritoryStatsModal()`: Gán text và kiểu hiển thị địa danh ngày tháng chuẩn NĐ 30.
     - Hàm `downloadReportImage()`: Chuẩn hóa font chữ và tỷ lệ size trên Canvas.
   - `scripts/generate_report_docx.py`: Chuẩn hóa font chữ `Times New Roman` và các Pt font size cho tất cả các paragraphs, runs, header cells, table cells, signatures theo NĐ 30.
   - `scripts/generate_history_excel.py`: Chuẩn hóa Font `Times New Roman`, các size 12-13pt tiêu ngữ, 14pt tiêu đề, 10-10.5pt bảng dữ liệu, và bổ sung khối chữ ký Người lập biểu / Nơi nhận ở chân bảng Excel.

## Checklist Công Việc

- [x] P0: Khởi tạo Plan, Actual Status, Evidence, Benchmark.
- [x] P1: Chuẩn hóa HTML & CSS Bản In / PDF trong `dispatcher.html` và `css/style.css`.
- [x] P2: Chuẩn hóa hàm xuất Word `downloadTerritoryWord()` và xuất Ảnh `downloadReportImage()` trong `js/dispatcher.js`.
- [x] P3: Chuẩn hóa Python Word Generator `scripts/generate_report_docx.py` theo đúng phân cấp Pt của Nghị định 30/2020/NĐ-CP.
- [x] P4: Chuẩn hóa Python Excel Generator `scripts/generate_history_excel.py` (font Times New Roman, cỡ chữ, và bổ sung khối chữ ký hành chính).
- [x] P5: Xây dựng Playwright Test `playwright/verify-decree-30-times-new-roman-standardization.cjs` kiểm tra tự động computed fonts, font sizes, xuất PDF, Word, Excel, Ảnh.
- [x] P6: Cập nhật tài liệu Evidence & Benchmark, kiểm tra Anvien detect-changes và Commit.
