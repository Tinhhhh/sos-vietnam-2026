# Kế Hoạch Chuẩn Hóa Số Ký Hiệu Văn Bản Hành Chính Động Theo Từng Cấp Đơn Vị Plan

## Metadata

- Date: `2026-10-12`
- Status: `completed`
- Plan: `docs/plans/2026-10-12-dynamic-administrative-doc-numbering/2026-10-12-dynamic-administrative-doc-numbering-plan.md`
- Evidence: `docs/plans/2026-10-12-dynamic-administrative-doc-numbering/2026-10-12-dynamic-administrative-doc-numbering-evidence.md`
- Benchmark: `docs/plans/2026-10-12-dynamic-administrative-doc-numbering/2026-10-12-dynamic-administrative-doc-numbering-benchmark.md`
- Actual status: `docs/plans/2026-10-12-dynamic-administrative-doc-numbering/2026-10-12-dynamic-administrative-doc-numbering-actual-status.md`

## Goal

Chuẩn hóa động số ký hiệu văn bản hành chính (`Số: ...... /BC-...`) theo đúng quy chuẩn thể thức ngành Công An và Nghị định 30/2020/NĐ-CP, tự động tương ứng theo cấp và địa phương của cán bộ trực ban đang đăng nhập:
1. **Cấp Quốc Gia (Trung ương)**: `Số: ...... /BC-TTCH` (hoặc `/BC-TTCHTC` - Trung Tâm Chỉ Huy).
2. **Cấp Tỉnh / TP Trực thuộc TW**:
   - Công An Thành Phố (Cần Thơ, Hà Nội, TP.HCM...): `Số: ...... /BC-CATP [TÊN TP]` (Ví dụ: `Số: ...... /BC-CATP CẦN THƠ`).
   - Công An Tỉnh (Đồng Nai, An Giang...): `Số: ...... /BC-CAT [TÊN TỈNH]` (Ví dụ: `Số: ...... /BC-CAT ĐỒNG NAI`).
   - Lực lượng CSGT: `Số: ...... /BC-CSGT [TÊN ĐỊA PHƯƠNG]` (Ví dụ: `Số: ...... /BC-CSGT CẦN THƠ`).
   - Lực lượng PCCC: `Số: ...... /BC-PCCC [TÊN ĐỊA PHƯƠNG]` (Ví dụ: `Số: ...... /BC-PCCC CẦN THƠ`).
   - Lực lượng Y tế / Cấp cứu: `Số: ...... /BC-BYT` (BYT = Bộ Y Tế).
3. **Cấp Phường**: `Số: ...... /BC-CAP [TÊN PHƯỜNG]` (Ví dụ: `Số: ...... /BC-CAP TÂN AN`).
4. **Cấp Xã**: `Số: ...... /BC-CAX [TÊN XÃ]` (Ví dụ: `Số: ...... /BC-CAX PHÚ TÂM`, `Số: ...... /BC-CAX THUẬN HÒA`).
5. **Cấp Thị Trấn**: `Số: ...... /BC-CATT [TÊN THỊ TRẤN]` (Ví dụ: `Số: ...... /BC-CATT PHONG ĐIỀN`).

Áp dụng đồng bộ cho toàn bộ các điểm hiển thị và xuất báo cáo:
- Header bản in trực tiếp và modal thống kê địa bàn (`#printDocNumber`).
- Xuất file Word báo cáo thống kê (`downloadTerritoryWord`).
- Phiếu tiếp nhận sự cố cá nhân khi in và xuất văn bản.

## Rules

- Complete P0 actual status before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence as work completes.
- Record benchmarkable counts or measurements when they are taken.
- Run Anvien detect-changes before every implementation-slice commit.
- Validate real user-visible runtime with Playwright evidence.

## Problem

1. Trong `dispatcher.html` dòng 3339, số ký hiệu văn bản đang bị ghi cứng (hardcoded) là `Số: ...... /BC-CATB`, không phản ánh đúng cấp đơn vị (Quốc gia, Tỉnh/TP, Xã/Phường, CSGT, PCCC, Y tế) và không gắn kèm tên địa phương như yêu cầu.
2. Trong hàm xuất Word `downloadTerritoryWord()` tại `js/dispatcher.js` dòng 14967, số văn bản cũng bị gán tĩnh `Số: ......./BC-CA`.
3. Khi cán bộ thuộc các đơn vị khác nhau (ví dụ Công an Xã Thuận Hòa, hay Công an TP Cần Thơ, hay Trung tâm chỉ huy Quốc gia) in báo cáo hoặc tải file, số ký hiệu không khớp với đơn vị quản lý.

## Scope

- In scope:
  - `dispatcher.html`: Thêm ID `#printDocNumber` cho thẻ số ký hiệu báo cáo trong `territoryStatsModal`.
  - `js/dispatcher.js`:
    - Xây dựng hàm `getAdministrativeDocNumber(officer, filter)` chuẩn hóa đầy đủ tất cả các trường hợp theo quy định.
    - Cập nhật hàm `openTerritoryStatsModal()` để gán động `#printDocNumber`.
    - Cập nhật hàm `downloadTerritoryWord()` để áp dụng số ký hiệu động.
  - Viết script kiểm thử tự động Playwright `playwright/verify-dynamic-doc-numbering.cjs` và sinh báo cáo QA chính thức.
- Out of scope:
  - Không thay đổi nghiệp vụ phân công hay cơ sở dữ liệu bản đồ.

## Non-Goals

- Không làm xáo trộn các trường thông tin khác trong header (Quốc hiệu, Tiêu ngữ, Cơ quan cấp trên, Cơ quan ban hành).

## Requirements

1. Hàm `getAdministrativeDocNumber(officer, filter)` phải phân loại chính xác các trường hợp:
   - Cấp Quốc gia -> `/BC-TTCH`
   - Cấp Tỉnh/TP:
     - 5 TP trực thuộc TW (Hà Nội, TP.HCM, Hải Phòng, Đà Nẵng, Cần Thơ) -> `/BC-CATP [TÊN TP]`
     - Các tỉnh còn lại -> `/BC-CAT [TÊN TỈNH]`
   - Cấp Xã / Phường / Thị trấn:
     - Phường -> `/BC-CAP [TÊN PHƯỜNG]`
     - Xã -> `/BC-CAX [TÊN XÃ]`
     - Thị trấn -> `/BC-CATT [TÊN THỊ TRẤN]`
   - Lực lượng chuyên trách:
     - CSGT -> `/BC-CSGT [TÊN TỈNH/TP]`
     - PCCC -> `/BC-PCCC [TÊN TỈNH/TP]`
     - Hospital / Cấp cứu -> `/BC-BYT`
2. Bản in và file Word xuất ra phải chứa đúng số ký hiệu tương ứng với ca trực.

## Acceptance Criteria

1. Khi tài khoản Quốc Gia (admin) mở modal, hiển thị: `Số: ...... /BC-TTCH`.
2. Khi tài khoản TP Cần Thơ mở modal, hiển thị: `Số: ...... /BC-CATP CẦN THƠ`.
3. Khi tài khoản Xã Phú Tâm mở modal, hiển thị: `Số: ...... /BC-CAX PHÚ TÂM`.
4. Khi tài khoản Phường Tân An mở modal, hiển thị: `Số: ...... /BC-CAP TÂN AN`.
5. Khi lọc/đơn vị CSGT Cần Thơ, hiển thị: `Số: ...... /BC-CSGT CẦN THƠ`.
6. Khi lọc/đơn vị PCCC Cần Thơ, hiển thị: `Số: ...... /BC-PCCC CẦN THƠ`.
7. Khi lọc/đơn vị Y tế, hiển thị: `Số: ...... /BC-BYT`.
8. Kiểm thử tự động Playwright đạt 100% PASS cho toàn bộ các tình huống.

## Checklist

- [x] P0-A: Khảo sát hiện trạng thực tế và lập hồ sơ P0 Actual Status.
  - Goal: Xác định các vị trí hiển thị số ký hiệu văn bản trong HTML và JS.
  - Implementation Gate: Hoàn thành ghi nhận `actual-status.md`.
  - Acceptance: Đã xác định rõ các selector và hàm xử lý liên quan.

### P1: Triển Khai Hàm Ký Hiệu Động & Tích Hợp Vào Modal Thống Kê & Xuất File

- [x] P1-A: Xây dựng hàm `getAdministrativeDocNumber(officer, filter)` trong `js/dispatcher.js` và gán ID `#printDocNumber` trong `dispatcher.html`.
  - Goal: Xử lý logic ánh xạ toàn bộ các cấp đơn vị và lực lượng sang số ký hiệu chuẩn thể thức.
  - Implementation Gate: Hoàn thành hàm với đầy đủ các case.
  - Acceptance: Hàm trả về chuỗi chính xác cho mọi đối tượng officer và bộ lọc.

- [x] P1-B: Tích hợp số ký hiệu động vào `openTerritoryStatsModal()` và `downloadTerritoryWord()`.
  - Goal: Kết nối hàm logic với giao diện hiển thị màn hình, bản in và file Word kết xuất.
  - Implementation Gate: Đảm bảo khi đổi bộ lọc hoặc mở modal theo đơn vị, số ký hiệu tự động cập nhật tương ứng.
  - Acceptance: Số ký hiệu trên DOM và trong nội dung Word xuất ra khớp chuẩn xác.

- [x] P1-C: Viết kịch bản kiểm thử tự động Playwright, chụp ảnh minh chứng và lập báo cáo QA.
  - Goal: Tự động hóa kiểm thử cho tất cả các cấp đơn vị: Quốc Gia, CATP Cần Thơ, CAX Phú Tâm, CAP Tân An, CSGT, PCCC, Y tế.
  - Implementation Gate: 100% assertions đạt PASS.
  - Acceptance: Sinh file báo cáo `.json`, `.md` và ảnh chụp màn hình đạt chuẩn.

- [x] P1-D: Rà soát Anvien detect-changes, cập nhật tài liệu và Commit.
  - Goal: Hoàn tất đóng slice theo quy trình chuẩn.
  - Implementation Gate: Detect-changes không có lỗi hồi quy nghiêm trọng.
  - Acceptance: Commit git sạch sẽ với message chuẩn.
