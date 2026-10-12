# Hiện Trạng Hệ Thống Themes & Glassmorphism Trước Khi Nâng Cấp (Actual Status Baseline)

## Metadata
- Date: `2026-10-12`
- Scope: `css/style.css`, `css/tactical-responsive.css`, `dispatcher.html`, `index.html`, `js/dispatcher.js`
- Baseline Audit Time: 19:55:00+07:00
- Plan Ref: `docs/plans/2026-10-12-ui-glassmorphism-theme-upgrade/2026-10-12-ui-glassmorphism-theme-upgrade-plan.md`

---

## 1. Khảo Sát Hiện Trạng CSS 5 Themes Trong `css/style.css`

| Lực Lượng | Selector CSS | Trạng Thái Hiện Tại | Tồn Tại / Thiếu Sót |
|---|---|---|---|
| **Công An Nhân Dân (113)** | `body.theme-police` | Đã có tại dòng 2922 (`--theme-primary: #0088ff`) | Chỉ đổi 3 thuộc tính căn bản, chưa có hào quang ambient xanh thấu kính (#00669A + #00ECF3), chưa có border gradient. |
| **Cảnh Sát Giao Thông (CSGT)** | `body.theme-csgt` | **HOÀN TOÀN CHƯA CÓ** | `js/dispatcher.js` gán class `theme-csgt` khi CSGT đăng nhập nhưng CSS không có định nghĩa nào -> rơi vào fallback mặc định, thiếu nhận diện màu vàng hổ phách hoàng gia (#DFB077, #F59E0B). |
| **PCCC & CNCH (114)** | `body.theme-rescue` | Đã có tại dòng 2962 (`--theme-primary: #ff9100`) | Đang sử dụng màu cam generic `#ff9100` thay vì sắc đỏ thẫm Mahogany `#AC0015` chính quy của Cảnh sát PCCC Việt Nam. |
| **Cấp Cứu Y Tế (115)** | `body.theme-hospital` | Đã có tại dòng 2942 (`--theme-primary: #10b981`) | Thiếu dải chuyển sắc Emerald Mint & Aqua (#10B981, #00ECF3), ánh sáng phản xạ mờ nhạt. |
| **Chỉ Huy Tổng Hợp (Admin)** | `body.theme-admin` | Đã có tại dòng 2982 (`--theme-primary: #8b5cf6`) | Mới có badge gradient tím, chưa phủ sáng toàn bộ layout và các thẻ kính. |

---

## 2. Khảo Sát Hiệu Ứng Glassmorphism Hiện Tại

1. **Độ sâu và độ bão hòa (Blur & Saturation)**:
   - Các class `.liquid-glass` hiện tại dùng `blur(24px)` hoặc `blur(16px)` đơn thuần.
   - Thiếu lớp `saturate(190%)` và chưa có `will-change: transform` khiến khi cuộn trang hoặc mở modal trên thiết bị yếu có nguy cơ rung giật.
2. **Viền khúc xạ ánh sáng (Specular Rim Lighting)**:
   - Một số thành phần có `inset 0 1px 1px rgba(...)` mỏng, thiếu độ nổi 3D của thiết kế Figma chuẩn Liquid Glass.
3. **Chromatic Ambient Shadow**:
   - Chưa tự động đổi màu bóng đổ ngoại vi theo biến `--theme-glow` và `--theme-primary` của lực lượng tác chiến hiện tại.
4. **Bộ Chuyển Theme Trực Quan**:
   - `dispatcher.html` và `index.html` chưa có nút/thanh chuyển đổi nhanh giữa 5 themes lực lượng để người kiểm tra nghiệm thu giao diện.

---

## 3. Stitch MCP Integration Baseline

- Project ID: `projects/2882282938885563672` (đã khởi tạo thành công trên Stitch MCP).
- Đang cần: Tạo `DESIGN.md` theo chuẩn semantic tokens & typography rồi tải lên dự án Stitch MCP qua lệnh `upload_design_md`.
