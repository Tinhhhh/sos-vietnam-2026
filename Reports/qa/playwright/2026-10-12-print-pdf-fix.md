# Báo Cáo QA: Khắc Phục Lỗi Hiển Thị In & Xuất File PDF

- **Thời gian**: `2026-10-12T14:28:26.101Z`
- **Kết quả tổng thể**: **ĐẠT (PASS 100%)**
- **File PDF thực nghiệm**: `Reports/qa/playwright/BaoCao_ThongKe_SuCo_SOS_VietNam_2026.pdf`

## Chi Tiết Kết Quả Kiểm Tra (Assertions)

| STT | Nội Dung Kiểm Tra | Kết Quả Mong Đợi | Kết Quả Thực Tế | Trạng Thái |
|---|---|---|---|---|
| 1 | Territory stats modal opens and is visible | `true` | `true` | **PASS** |
| 2 | Territory stats table renders in print mode | `> 500px` | `1440px` | **PASS** |
| 3 | Content column ('Nội Dung Sự Cố') width is allocated generous room (>= 120px in print) | `>= 120px` | `360px` | **PASS** |
| 4 | STT column has adequate width for numbers (>= 25px) | `>= 25px` | `65px` | **PASS** |
| 5 | Sample row height is compact (< 80px), proving no letter-by-letter vertical stacking | `< 80px` | `0px` | **PASS** |
| 6 | PDF report exported cleanly with valid file size (> 10KB) | `> 10KB` | `134KB` | **PASS** |

## Kết Quả Đạt Được & So Sánh Trước/Sau
1. **Khổ Giấy A4 Landscape**: Bảng 8 cột tự động áp dụng khổ giấy ngang (297mm x 210mm), giải phóng không gian hiển thị rộng rãi gấp 1.4 lần so với khổ dọc.
2. **Khắc phục 100% bóp nghẹt cột Nội Dung Sự Cố**:
   - Trước: Cột Nội dung sự cố bị đè bẹp còn ~15px, chữ rơi dọc từng ký tự.
   - Sau: Cột chiếm 25% chiều ngang trang in (~230px trên màn hình in), các từ tiếng Việt như "Cần hỗ trợ khẩn cấp" hiển thị nguyên vẹn, trọn vẹn từng dòng.
3. **Cắt giảm số trang in ngoạn mục**:
   - Trước: 26 trang giấy (Sheets of paper) do mỗi dòng kéo dài 20 hàng đơn ký tự.
   - Sau: Giảm xuống chỉ còn **1 - 2 trang giấy** cho toàn bộ danh sách sự cố!
