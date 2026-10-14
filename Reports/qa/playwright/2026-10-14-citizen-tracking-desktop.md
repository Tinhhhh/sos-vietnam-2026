# BÁO CÁO KIỂM THỬ PLAYWRIGHT — MÀN HÌNH GIÁM SÁT TIẾN ĐỘ CỨU HỘ DESKTOP

> **Thời điểm thực hiện**: 2026-10-14T07:53:05.938Z  
> **Bộ kiểm thử**: `capture-citizen-tracking-desktop`  
> **Môi trường**: Node.js All-in-one (http://localhost:3000)  
> **Kết quả**: **6/6 BÀI KIỂM TRA ĐẠT (100% PASS)**

---

## 1. Mục Tiêu Kiểm Thử
- Khắc phục triệt để lỗi `SĐT: undefined (5p)` trên Màn hình Giám sát Tiến độ Ứng cứu phía Người Dân trên Desktop.
- Xác thực thông tin đơn vị tiếp nhận: Hiển thị đầy đủ Sĩ quan chỉ huy, SĐT trực ban, Trụ sở cơ sở cụ thể thay vì chuỗi chung chung.
- Xuất ảnh chụp thực tế phân giải cao sắc nét, không bị cắt mép, không có hình vẽ mũi tên lỗi phục vụ thay thế tài liệu đề xuất.

## 2. Danh Sách Kiểm Tra Chi Tiết

| # | Hạng Mục Kiểm Tra | Trạng Thái | Dữ Liệu Thực Tế Ghi Nhận |
|---|---|:---:|---|
| 1 | Tracking View (#sosTrackingView) is visible | **PASS** | `{"isVisible":true,"unitSub":"Chỉ huy: Trung tá Lê Hoàng Quân · SĐT: 0988 113 113 (5p)","unitStationAddress":"Số 02 Nguyễn Trãi, Phường Tân An, Q. Ninh Kiều, TP. Cần Thơ","unitStationPhone":"0292 382 2113","unitStationSms":"0988 113 113","unitStationEmail":"trucban@sos.gov.vn","btnVisible":true,"hasUndefined":false}` |
| 2 | Zero "undefined" tokens in unit header, phone, or address | **PASS** | `{"isVisible":true,"unitSub":"Chỉ huy: Trung tá Lê Hoàng Quân · SĐT: 0988 113 113 (5p)","unitStationAddress":"Số 02 Nguyễn Trãi, Phường Tân An, Q. Ninh Kiều, TP. Cần Thơ","unitStationPhone":"0292 382 2113","unitStationSms":"0988 113 113","unitStationEmail":"trucban@sos.gov.vn","btnVisible":true,"hasUndefined":false}` |
| 3 | Officer full title rendered correctly | **PASS** | `{"unitSub":"Chỉ huy: Trung tá Lê Hoàng Quân · SĐT: 0988 113 113 (5p)"}` |
| 4 | Officer phone rendered with valid digits | **PASS** | `{"unitSub":"Chỉ huy: Trung tá Lê Hoàng Quân · SĐT: 0988 113 113 (5p)"}` |
| 5 | Station real address rendered instead of generic placeholder | **PASS** | `{"address":"Số 02 Nguyễn Trãi, Phường Tân An, Q. Ninh Kiều, TP. Cần Thơ"}` |
| 6 | Call button (#btnCallUnit) is fully visible and rendered | **PASS** | `{"btnVisible":true}` |

## 3. Ảnh Chụp Thực Tế
- File: `C:\Users\dienv\Desktop\sos_vietnam_2026_web_hosting\Reports\qa\playwright\2026-10-14-citizen-tracking-desktop.png`
