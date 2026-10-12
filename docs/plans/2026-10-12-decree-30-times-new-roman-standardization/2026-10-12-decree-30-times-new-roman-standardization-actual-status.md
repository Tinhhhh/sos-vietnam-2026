# Hiện Trạng Sau Khi Chuẩn Hóa Phông Chữ Times New Roman & Kích Cỡ Thể Thức Theo Nghị Định 30/2020/NĐ-CP

## Metadata
- Date: `2026-10-12`
- Status: `completed`

## Kết Quả Thực Hiện Thực Tế

1. **Bản In & File PDF (`dispatcher.html`, `css/style.css`)**:
   - `print-official-header`:
     - Quốc hiệu: 12.5pt, in hoa, đứng, đậm.
     - Tiêu ngữ: 13.5pt, đứng, đậm, có đường kẻ liền thanh bên dưới (chênh hơn Quốc hiệu đúng 1 cỡ).
     - Cơ quan cấp trên: 12pt in hoa đứng.
     - Cơ quan trực tiếp: 12.5pt in hoa đứng đậm.
     - Số văn bản: 12pt đứng.
     - Địa danh ngày tháng (`#printDatePlace`): 13pt nghiêng (được padStart 2 số 0 cho ngày và tháng).
     - Tiêu đề văn bản: 14.5pt in hoa đứng đậm.
     - Phân loại / Phạm vi: 13pt nghiêng.
   - `print-official-footer`:
     - Nơi nhận: Từ "Nơi nhận:" 12pt nghiêng đậm; danh sách đơn vị nhận 10.5pt đứng. Căn sát lề trái.
     - Địa danh ngày tháng chân trang: 13pt nghiêng.
     - Chức danh ký (`.print-official-footer-sign-title`): 13pt in hoa đậm, không rớt dòng.
     - Chú thích ký: 11pt nghiêng.
     - Họ tên cán bộ ký: 13pt đậm. Căn sát lề phải.
   - `territoryStatsPrintArea`: 100% phần tử con kế thừa `font-family: 'Times New Roman', Times, serif !important;`.
   - `reportSheetContainer` (Phiếu tiếp nhận sự cố khẩn cấp): Toàn bộ tiêu đề, các mục A, B, C, inputs, labels, signatures chuyển sang Times New Roman và kích cỡ Pt chuẩn NĐ 30.

2. **File Word (.doc & .docx)**:
   - `downloadTerritoryWord()` trong `js/dispatcher.js`: Xuất HTML Word `.doc` theo đúng cỡ Pt NĐ 30: Quốc hiệu 12.5pt, Tiêu ngữ 13.5pt, Tiêu đề 14.5pt, Bảng 10-10.5pt, Khối chữ ký 13pt, Nơi nhận 10.5-12pt.
   - `scripts/generate_report_docx.py`: Cập nhật Normal style 13pt, Quốc hiệu 12.5pt, Tiêu ngữ 13.5pt, Tiêu đề 14.5pt, Headings 13.5pt, Chữ ký 13pt/11pt. Kiểm tra 100% runs có `font.name = 'Times New Roman'`.

3. **File Excel (.xlsx / .csv)**:
   - `scripts/generate_history_excel.py`: Quốc hiệu 12pt đậm, Tiêu ngữ 13pt đậm, Tiêu đề 14.5pt đậm, Bảng 10-10.5pt, bổ sung Khối chữ ký Cán bộ lập biểu & Nơi nhận chuẩn thể thức ở chân bảng.
   - `exportTerritoryStatsCsv()`: Tối ưu UTF-8 BOM chuẩn tiếng Việt có dấu.

4. **Bản Ảnh Xuất (.png)**:
   - `downloadReportImage()` trong `js/dispatcher.js`: Áp dụng 100% `Times New Roman` cho tất cả các đoạn text vẽ trên Canvas.
   - Chụp snapshot watermark camera hiện trường: Đã chuyển từ Arial sang `Times New Roman`.
