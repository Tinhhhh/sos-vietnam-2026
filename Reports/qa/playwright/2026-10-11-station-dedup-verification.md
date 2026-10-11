# Báo Cáo Kiểm Thử Tự Động: Rà Soát & Khử Trùng Lặp Đồn Công An Phường Ninh Kiều (Cần Thơ)

## Thông Tin Tổng Quan
- **Thời gian thực hiện**: `2026-10-11T07:29:50.798Z`
- **Kết quả tổng thể**: **PASSED ✅**
- **Trang kiểm thử**: `http://localhost:3000/dispatcher.html`
- **Ảnh chụp màn hình**: [2026-10-11-ninh-kieu-station-dedup.png](./2026-10-11-ninh-kieu-station-dedup.png)

## Các Bước Thực Hiện
- **1. Tải trang dispatcher.html & Đăng nhập thành công**: `SUCCESS`
- **2. Chọn và khoanh vùng Phường Ninh Kiều (Cần Thơ)**: `SUCCESS`
- **4. Kiểm tra HUD & Xác nhận 10/10 assertions đạt chuẩn**: `SUCCESS`

## Kết Quả Kiểm Tra Dữ Liệu Thực Tế (Assertions)
| Tiêu Chí Kiểm Tra | Kết Quả Mong Đợi | Kết Quả Thực Tế | Trạng Thái |
|-------------------|------------------|-----------------|------------|
| Tên đơn vị trên HUD | Chứa "Ninh Kiều" | "Phường Ninh Kiều" | ✅ ĐẠT |
| Địa chỉ trụ sở | Số 72, đường Phan Đình Phùng | "Số 72, đường Phan Đình Phùng, phường Ninh Kiều, thành phố Cần Thơ" | ✅ ĐẠT |
| Số điện thoại trực ban | 02923820938 | "02923820938" | ✅ ĐẠT |
| Trưởng Công An Phường | Thượng tá Phạm Hiền Tài | "Thượng tá Phạm Hiền Tài (SĐT: 0918357555)" | ✅ ĐẠT |
| Không còn ghim giải thể An Cư | Không tồn tại | Đã loại bỏ hoàn toàn | ✅ ĐẠT |
| Không còn ghim giải thể Thới Bình | Không tồn tại | Đã loại bỏ hoàn toàn | ✅ ĐẠT |
| Không còn ghim giải thể Xuân Khánh | Không tồn tại | Đã loại bỏ hoàn toàn | ✅ ĐẠT |
| Không còn ghim giả định Khu Vực Sở Tại | Không tồn tại | Đã loại bỏ hoàn toàn | ✅ ĐẠT |
| Khử trùng tọa độ CATP 10.033333 | Di dời về 9A Trần Phú Cái Khế | Tọa độ chuẩn 10.045250, 105.781820 | ✅ ĐẠT |
| Duy nhất 1 đồn CA phường tại Ninh Kiều | Đúng 1 đồn | 1 đồn (Công An Phường Ninh Kiều) | ✅ ĐẠT |

## Dữ Liệu HUD Thu Thập Được
```json
{
  "unitTitle": "Phường Ninh Kiều",
  "address": "Số 72, đường Phan Đình Phùng, phường Ninh Kiều, thành phố Cần Thơ",
  "phone": "02923820938",
  "officer": "Thượng tá Phạm Hiền Tài (SĐT: 0918357555)",
  "email": "phuongninhkieu@cantho.gov.vn",
  "sapNhap": "Tân An, Thới Bình, Xuân Khánh",
  "dienTich": "5,42 (km²)",
  "danSo": "119.547 (người)",
  "maDVHC": "31135"
}
```
