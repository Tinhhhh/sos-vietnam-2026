# Minh Chứng Kiểm Thử Chuẩn Hóa Phông Chữ Times New Roman & Kích Cỡ Thể Thức Theo Nghị Định 30/2020/NĐ-CP

## Metadata
- Date: `2026-10-12`
- Status: `completed`

## Bảng Đối Chiếu Quy Chuẩn Nghị Định 30/2020/NĐ-CP & Kết Quả Áp Dụng

| Thành Phần Thể Thức | Quy Định Nghị Định 30/2020 | Trước Khi Sửa | Sau Khi Chuẩn Hóa | Kết Quả Xác Minh |
|---|---|---|---|---|
| **Phông chữ toàn bộ** | Times New Roman (TCVN 6909:2001) | Hỗn hợp / thiếu đồng bộ | 100% `Times New Roman` | ✅ **PASS** (100% các thành phần) |
| **Quốc hiệu** | 12 - 13pt, in hoa, đứng, đậm | 12pt - 13pt | 12.5pt in hoa đậm | ✅ **PASS** (16.6px ~ 12.5pt) |
| **Tiêu ngữ** | 13 - 14pt (lớn hơn Quốc hiệu 1 cỡ), đậm, gạch dưới | 12.5pt - 13pt | 13.5pt đậm có gạch ngang | ✅ **PASS** (18px ~ 13.5pt) |
| **Cơ quan cấp trên** | 12 - 13pt, in hoa, đứng | 10.5 - 11pt | 12pt in hoa đứng | ✅ **PASS** (16px ~ 12pt) |
| **Cơ quan ban hành** | 12 - 13pt, in hoa, đứng, đậm, có gạch ngang 1/3-1/2 | 11.5 - 13pt | 12.5pt in hoa đứng đậm | ✅ **PASS** (16.6px ~ 12.5pt) |
| **Số, ký hiệu** | 12 - 13pt, đứng | 11pt | 12pt đứng | ✅ **PASS** (16px ~ 12pt) |
| **Địa danh, ngày tháng** | 13 - 14pt, chữ thường, nghiêng | 10.5 - 11pt | 13pt - 13.5pt nghiêng | ✅ **PASS** (17.3px ~ 13pt) |
| **Tiêu đề văn bản** | 14 - 15pt, in hoa, đứng, đậm | 16pt đậm | 14.5pt in hoa đậm | ✅ **PASS** (19.3px ~ 14.5pt) |
| **Trích yếu / Phạm vi** | 12.5 - 13.5pt, chữ thường, nghiêng | 11 - 12pt | 13pt nghiêng | ✅ **PASS** (17.3px ~ 13pt) |
| **Tiêu đề cột bảng** | 10 - 11pt, đậm | 10 - 12px | 10.5pt đậm | ✅ **PASS** (14px ~ 10.5pt) |
| **Dữ liệu ô bảng** | 9.5 - 10.5pt, đứng | 11 - 12px | 10pt đứng | ✅ **PASS** (13.3px ~ 10pt) |
| **Chức danh người ký** | 13 - 14pt, in hoa, đứng, đậm | 11.5pt | 13pt in hoa đậm | ✅ **PASS** (17.3px ~ 13pt) |
| **Chú thích ký** | 10.5 - 11pt, nghiêng | 10.5pt | 11pt nghiêng | ✅ **PASS** (14.6px ~ 11pt) |
| **Họ tên người ký** | 13 - 14pt, đứng, đậm | 11.5pt | 13pt đậm | ✅ **PASS** (17.3px ~ 13pt) |
| **Nơi nhận** | "Nơi nhận:" 12pt nghiêng đậm; danh sách 10.5-11pt | 11pt | "Nơi nhận:" 12pt nghiêng đậm, DS 10.5pt | ✅ **PASS** (16px / 14px) |

## Bằng Chứng Chạy Playwright E2E & Tự Động Hóa

Script kiểm thử: `playwright/verify-decree-30-times-new-roman-standardization.cjs`
Báo cáo QA: `Reports/qa/playwright/2026-10-12-decree-30-times-new-roman-standardization.json` & `.md`

### Kết Quả Chi Tiết 4 Nhóm Tiêu Chí:
1. `PRINT_PDF_FONT_TIMES_NEW_ROMAN`: **PASS** — 100% thành phần in & xuất PDF đều hiển thị phông chữ Times New Roman.
2. `PRINT_PDF_DECREE30_SIZING`: **PASS** — Tiêu đề 19.3px (14.5pt), Chức danh ký 17.3px (13pt), Địa danh 17.3px (13pt).
3. `REPORT_SHEET_FONT_TIMES_NEW_ROMAN`: **PASS** — Phiếu tiếp nhận, các heading, body items và chữ ký đều là Times New Roman.
4. `DOCX_TIMES_NEW_ROMAN_AND_DECREE30`: **PASS** — File Word (.docx): `NORMAL_FONT:Times New Roman|NORMAL_SIZE:13.0|NON_TIMES_COUNT:0`.
5. `EXCEL_TIMES_NEW_ROMAN_AND_DECREE30`: **PASS** — File Excel (.xlsx): `EXCEL_FONT:Times New Roman|A1_SIZE:12.0|A2_SIZE:13.0|A4_SIZE:14.5|NON_TIMES:0|HAS_SIGN:True|HAS_RECIP:True`.

### Danh Mục Artifacts Minh Chứng Đã Sinh Ra:
- `Reports/qa/playwright/screenshots/Bao_Cao_Thong_Ke_Su_Co_Decree30.pdf`
- `Reports/qa/playwright/screenshots/test_output_decree30.docx`
- `Reports/qa/playwright/screenshots/test_output_decree30.xlsx`
- `Reports/qa/playwright/screenshots/territory_stats_print_decree30.png`
- `Reports/qa/playwright/screenshots/report_sheet_decree30.png`
