# Actual Status - Bộ Giọng Nữ 4 Vùng Miền & Điều Hướng Theo 34 Tỉnh Thành

## Metadata

- Date: `2026-10-12`
- Plan: `docs/plans/2026-10-12-four-regional-voices-and-34-provinces-routing/2026-10-12-four-regional-voices-and-34-provinces-routing-plan.md`

## Baseline Inspection Findings

1. **Regional Voice Coverage in Codebase**:
   - Hiện trạng: Hệ thống mới tạo các file giọng đọc đơn lẻ (`thuy_dung`, `mai_anh`, `truc_ly`, `ngoc_huyen`), chưa phân chia rõ ràng theo 4 miền địa lý văn hóa:
     * Tây Nam Bộ (Đồng bằng sông Cửu Long / Cần Thơ)
     * Miền Nam (Đông Nam Bộ / Sài Gòn)
     * Miền Trung (Đà Nẵng, Huế...)
     * Miền Bắc (Hà Nội...)
   - Trạng thái: **CONFIRMED GAP**. Cần tạo bộ 4 file âm thanh đại diện 4 miền độc lập chuẩn 48kHz, tốc độ 1.2x.

2. **34 Provinces Geographic Classification**:
   - Dữ liệu quy hoạch trọng điểm của hệ thống quản lý 34 tỉnh/thành phố và 3.321 xã/phường sau sáp nhập (bando-sync-meta.json & vn-stations-directory.json).
   - Chưa có bộ ánh xạ (mapping) tự động từ 34 tỉnh thành hoặc tọa độ GPS sang 4 vùng miền để tự động phát giọng đọc tương ứng của vùng miền đó khi người dân bấm SOS.
   - Trạng thái: **CONFIRMED GAP**. Cần xây dựng hàm `detectVoiceRegion(province, coords)` trong `js/app.js`.
