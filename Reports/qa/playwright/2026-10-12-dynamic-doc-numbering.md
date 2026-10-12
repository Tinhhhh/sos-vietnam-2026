# BÁO CÁO KIỂM THỬ E2E: CHUẨN HÓA ĐỘNG SỐ KÝ HIỆU VĂN BẢN HÀNH CHÍNH
**Thời gian thực hiện**: 2026-10-12T15:26:16.127Z
**Trạng thái tổng thể**: ✅ 100% PASS
**Tỷ lệ đạt**: 100.0% (21/21 kiểm tra đạt)

---

## 1. MỤC TIÊU KIỂM THỬ
Kiểm chứng tính chuẩn hóa động của ký hiệu văn bản hành chính theo đúng thể thức Công an nhân dân (Nghị định 30/2020/NĐ-CP và hướng dẫn Bộ Công An):
1. **Cấp Quốc Gia (Trung ương)**: `Số: ...... /BC-TTCH` (Trung Tâm Chỉ Huy Tác Chiến Quốc Gia).
2. **Cấp Tỉnh / TP trực thuộc TW**: 
   - TP trực thuộc TW (Cần Thơ, Hà Nội, TP.HCM...): `Số: ...... /BC-CATP [TÊN TP]`.
   - Các Tỉnh (Đồng Nai, An Giang...): `Số: ...... /BC-CAT [TÊN TỈNH]`.
3. **Cấp Xã**: `Số: ...... /BC-CAX [TÊN XÃ]` (Ví dụ: `Số: ...... /BC-CAX PHÚ TÂM`, `Số: ...... /BC-CAX THUẬN HÒA`).
4. **Cấp Phường**: `Số: ...... /BC-CAP [TÊN PHƯỜNG]` (Ví dụ: `Số: ...... /BC-CAP TÂN AN`, `Số: ...... /BC-CAP AN KHÁNH`).
5. **Cấp Thị Trấn**: `Số: ...... /BC-CATT [TÊN THỊ TRẤN]` (Ví dụ: `Số: ...... /BC-CATT PHONG ĐIỀN`).
6. **Lực lượng CSGT**: `Số: ...... /BC-CSGT [TÊN TỈNH/TP]` (Ví dụ: `Số: ...... /BC-CSGT CẦN THƠ`).
7. **Lực lượng PCCC**: `Số: ...... /BC-PCCC [TÊN TỈNH/TP]` (Ví dụ: `Số: ...... /BC-PCCC CẦN THƠ`).
8. **Lực lượng Y tế / 115**: `Số: ...... /BC-BYT` (Bộ Y Tế).
9. **Tương tác động UI**: Chuyển đổi tab trên modal thống kê địa bàn cập nhật tức thì trên DOM (`#printDocNumber`) và file Word tải về.

---

## 2. KẾT QUẢ KIỂM THỬ CHI TIẾT

| STT | Mã Kiểm Tra | Nội Dung Kiểm Tra | Kết Quả | Chi Tiết Thực Tế |
|:---:|:---|:---|:---:|:---|
| 1 | `DOC-NUM-01` | Cấp Quốc Gia (Trung ương) - All -> Kỳ vọng "Số: ...... /BC-TTCH" | ✅ PASS | `{"expected":"Số: ...... /BC-TTCH","actual":"Số: ...... /BC-TTCH"}` |
| 2 | `DOC-NUM-02` | Cấp Quốc Gia (Trung ương) - Police -> Kỳ vọng "Số: ...... /BC-TTCH" | ✅ PASS | `{"expected":"Số: ...... /BC-TTCH","actual":"Số: ...... /BC-TTCH"}` |
| 3 | `DOC-NUM-03` | Cấp TP trực thuộc TW (Cần Thơ) - All -> Kỳ vọng "Số: ...... /BC-CATP CẦN THƠ" | ✅ PASS | `{"expected":"Số: ...... /BC-CATP CẦN THƠ","actual":"Số: ...... /BC-CATP CẦN THƠ"}` |
| 4 | `DOC-NUM-04` | Cấp TP trực thuộc TW (Hà Nội có tiền tố TP.) - All -> Kỳ vọng "Số: ...... /BC-CATP HÀ NỘI" | ✅ PASS | `{"expected":"Số: ...... /BC-CATP HÀ NỘI","actual":"Số: ...... /BC-CATP HÀ NỘI"}` |
| 5 | `DOC-NUM-05` | Cấp Tỉnh (Đồng Nai) - All -> Kỳ vọng "Số: ...... /BC-CAT ĐỒNG NAI" | ✅ PASS | `{"expected":"Số: ...... /BC-CAT ĐỒNG NAI","actual":"Số: ...... /BC-CAT ĐỒNG NAI"}` |
| 6 | `DOC-NUM-06` | Cấp Tỉnh (Tỉnh An Giang có tiền tố Tỉnh) - All -> Kỳ vọng "Số: ...... /BC-CAT AN GIANG" | ✅ PASS | `{"expected":"Số: ...... /BC-CAT AN GIANG","actual":"Số: ...... /BC-CAT AN GIANG"}` |
| 7 | `DOC-NUM-07` | Cấp Xã (Xã Phú Tâm) - All -> Kỳ vọng "Số: ...... /BC-CAX PHÚ TÂM" | ✅ PASS | `{"expected":"Số: ...... /BC-CAX PHÚ TÂM","actual":"Số: ...... /BC-CAX PHÚ TÂM"}` |
| 8 | `DOC-NUM-08` | Cấp Xã (Thuận Hòa) - All -> Kỳ vọng "Số: ...... /BC-CAX THUẬN HÒA" | ✅ PASS | `{"expected":"Số: ...... /BC-CAX THUẬN HÒA","actual":"Số: ...... /BC-CAX THUẬN HÒA"}` |
| 9 | `DOC-NUM-09` | Cấp Phường (Phường Tân An) - All -> Kỳ vọng "Số: ...... /BC-CAP TÂN AN" | ✅ PASS | `{"expected":"Số: ...... /BC-CAP TÂN AN","actual":"Số: ...... /BC-CAP TÂN AN"}` |
| 10 | `DOC-NUM-010` | Cấp Phường (An Khánh) - All -> Kỳ vọng "Số: ...... /BC-CAP AN KHÁNH" | ✅ PASS | `{"expected":"Số: ...... /BC-CAP AN KHÁNH","actual":"Số: ...... /BC-CAP AN KHÁNH"}` |
| 11 | `DOC-NUM-011` | Cấp Thị Trấn (Thị trấn Phong Điền) - All -> Kỳ vọng "Số: ...... /BC-CATT PHONG ĐIỀN" | ✅ PASS | `{"expected":"Số: ...... /BC-CATT PHONG ĐIỀN","actual":"Số: ...... /BC-CATT PHONG ĐIỀN"}` |
| 12 | `DOC-NUM-012` | Lực lượng CSGT (Cần Thơ) - Filter CSGT -> Kỳ vọng "Số: ...... /BC-CSGT CẦN THƠ" | ✅ PASS | `{"expected":"Số: ...... /BC-CSGT CẦN THƠ","actual":"Số: ...... /BC-CSGT CẦN THƠ"}` |
| 13 | `DOC-NUM-013` | Lực lượng PCCC (Cần Thơ) - Filter Fire -> Kỳ vọng "Số: ...... /BC-PCCC CẦN THƠ" | ✅ PASS | `{"expected":"Số: ...... /BC-PCCC CẦN THƠ","actual":"Số: ...... /BC-PCCC CẦN THƠ"}` |
| 14 | `DOC-NUM-014` | Lực lượng Y tế (Cấp Cứu 115 / Bệnh Viện) - Filter Hospital -> Kỳ vọng "Số: ...... /BC-BYT" | ✅ PASS | `{"expected":"Số: ...... /BC-BYT","actual":"Số: ...... /BC-BYT"}` |
| 15 | `DOC-NUM-015` | Lực lượng Cứu Hộ Giao Thông - Filter Traffic-Rescue -> Kỳ vọng "Số: ...... /BC-CHGT CẦN THƠ" | ✅ PASS | `{"expected":"Số: ...... /BC-CHGT CẦN THƠ","actual":"Số: ...... /BC-CHGT CẦN THƠ"}` |
| 16 | `UI-MODAL-INITIAL` | Modal mở lần đầu hiển thị số ký hiệu cấp TP: "Số: ...... /BC-CATP CẦN THƠ" | ✅ PASS | `{"actual":"Số: ...... /BC-CATP CẦN THƠ"}` |
| 17 | `UI-TAB-CSGT` | Chuyển tab CSGT cập nhật số ký hiệu: "Số: ...... /BC-CSGT CẦN THƠ" | ✅ PASS | `{"actual":"Số: ...... /BC-CSGT CẦN THƠ"}` |
| 18 | `UI-TAB-PCCC` | Chuyển tab PCCC cập nhật số ký hiệu: "Số: ...... /BC-PCCC CẦN THƠ" | ✅ PASS | `{"actual":"Số: ...... /BC-PCCC CẦN THƠ"}` |
| 19 | `UI-TAB-HOSPITAL` | Chuyển tab Y Tế cập nhật số ký hiệu: "Số: ...... /BC-BYT" | ✅ PASS | `{"actual":"Số: ...... /BC-BYT"}` |
| 20 | `UI-WARD-THUANHOA` | Cấp Xã Thuận Hòa hiển thị chuẩn thể thức: "Số: ...... /BC-CAX THUẬN HÒA" | ✅ PASS | `{"actual":"Số: ...... /BC-CAX THUẬN HÒA"}` |
| 21 | `WORD-EXPORT-NUM` | Hàm xuất Word liên kết đúng getAdministrativeDocNumber | ✅ PASS | `{"filter":"all","docNum":"Số: ...... /BC-CAX THUẬN HÒA","hasStandardDocNum":true}` |

---

## 3. BẰNG CHỨNG HÌNH ẢNH (SCREENSHOTS)
- **Modal Chuyển Tab Động**: `Reports/qa/playwright/screenshots/dynamic-doc-number-modal.png`
- **Modal Cấp Xã Thuận Hòa**: `Reports/qa/playwright/screenshots/dynamic-doc-number-ward.png`

---

## 4. KẾT LUẬN
Toàn bộ logic định dạng và hiển thị số ký hiệu văn bản hành chính đã hoạt động chính xác tuyệt đối 100%, đáp ứng đầy đủ yêu cầu thể thức hành chính của người dùng và sẵn sàng đưa vào vận hành.
