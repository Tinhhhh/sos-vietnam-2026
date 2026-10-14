# Tái Cấu Trúc Frontend sos-vietnam-2026 Sang ReactJS Modular Plan

## Metadata

- Date: `2026-10-09`
- Status: `draft`
- Plan: `docs/plans/2026-10-09-react-refactor-modules/2026-10-09-react-refactor-modules-plan.md`
- Evidence: `docs/plans/2026-10-09-react-refactor-modules/2026-10-09-react-refactor-modules-evidence.md`
- Benchmark: `docs/plans/2026-10-09-react-refactor-modules/2026-10-09-react-refactor-modules-benchmark.md`
- Actual status: `docs/plans/2026-10-09-react-refactor-modules/2026-10-09-react-refactor-modules-actual-status.md`

## Goal

Từng bước refactor toàn bộ giao diện và logic Frontend từ mã nguồn Vanilla JS monolith (`public/index.html`, `public/dispatcher.html`, `public/js/app.js`, `public/js/dispatcher.js`, `public/js/map-controller.js`) sang ứng dụng **ReactJS hiện đại theo mô hình Feature-based Architecture (Modular Pattern)**.
Quá trình được chia nhỏ thành từng module độc lập; tiêu chí bắt buộc là **hoàn thành mỗi module thì phải chạy được local và hiển thị giao diện trực quan hoàn chỉnh** để người dùng nghiệm thu từng giai đoạn trước khi làm tiếp.

## Rules

- Cập nhật checklist ngay khi hoàn thành từng phần việc.
- Ghi nhận evidence vào evidence ledger tương ứng.
- Đảm bảo tính toàn vẹn (backward compatibility) của các API backend trong `server.js`.
- Mỗi module sau khi hoàn thành phải kiểm tra hiển thị giao diện local (`npm run dev` hoặc `node server.js`).
- Không làm gãy luồng kết nối giữa frontend và các service backend hiện hữu (Nghị định 30 docx, API cứu hộ, Gatekeeper).

## Problem

1. Mã nguồn Frontend hiện tại đang là Vanilla HTML/CSS/JS thuần kích thước rất lớn:
   - `public/index.html` (123 KB) và `public/dispatcher.html` (287 KB) chứa hàng nghìn dòng markup lẫn inline scripts.
   - `public/js/dispatcher.js` (647 KB) và `public/js/app.js` (205 KB) chứa logic tác chiến, bản đồ, âm thanh, điều phối trộn lẫn, khó bảo trì và mở rộng.
2. Quản lý trạng thái (state management) hiện tại dựa trên biến toàn cục (`window.*`, DOM querying) dễ gây race conditions hoặc lỗi giao diện khi thêm tính năng mới.
3. Cần chuyển đổi sang ReactJS có cấu trúc chuẩn mực nhất của ngành (Feature-based), chia theo domain nghiệp vụ để code sạch, dễ test và dễ phát triển tiếp.

## Architecture: Feature-based / Modular React

Cấu trúc chuẩn áp dụng cho dự án:
```text
client/ (React + Vite)
├── src/
│   ├── assets/               # Hình ảnh, icons, audio, textures 3D
│   ├── components/           # UI components dùng chung (Button, Modal, GlassCard, Badge,...)
│   ├── config/               # Constants, API endpoints, Map config
│   ├── context/ / stores/    # Global State (Auth, Theme, Audio, Alert)
│   ├── features/             # === CÁC MODULE NGHIỆP VỤ (CHIA THEO PHASE) ===
│   │   ├── auth/             # Module Gatekeeper & Đăng nhập trực ban
│   │   ├── citizen-sos/      # Module Cổng Dân: SOS Button, 113/114/115, Báo sự cố
│   │   ├── rescue-directory/ # Module Doanh nghiệp cứu hộ & Đánh giá
│   │   ├── tactical-map/     # Module Bản đồ C4ISR, Geofence xã/phường, Trạm công an
│   │   ├── dispatcher-feed/  # Module Hàng đợi sự cố tác chiến, Kíp trực
│   │   └── decree30-export/  # Module Xuất biên bản & Báo cáo Nghị định 30
│   ├── hooks/                # Custom hooks (useGeolocation, useAudioRecorder,...)
│   ├── layouts/              # Bố cục Cổng Dân & Bàn tác chiến 3 phân khu
│   ├── services/             # API client kết nối backend Node.js (cổng 3000)
│   ├── utils/                # Helpers (haversine, date format, storage)
│   ├── App.jsx               # Router & Điều phối Cổng Dân / Cổng Trực Ban
│   ├── main.jsx              # Entry point
│   └── index.css             # Design System tokens, Liquid Glass, Tactical Theme
```

## Phase Checklist

- [ ] `P0`: Khảo sát hiện trạng, lập Actual Status và xác định dependency tương thích (Node 16.17, Vite 4, React 18).
- [ ] `P1` (Module 0): Khởi tạo nền tảng React Vite + Cấu trúc Feature-based + Layout Shell & Router điều hướng Cổng Dân / Trực Ban.
  - *Tiêu chuẩn nghiệm thu*: Chạy `npm run dev` lên ngay giao diện khung shell chuẩn Liquid Glass, chuyển đổi tab mượt mà.
- [ ] `P2` (Module 1): Cổng Người Dân - Quả Cầu Pha Lê SOS 3D, 3 Nút Khẩn Cấp (113/114/115) & Form Tiếp Nhận Sự Cố.
  - *Tiêu chuẩn nghiệm thu*: Lên giao diện Cổng Dân, tương tác SOS, định vị GPS, form báo cáo sự cố hoạt động.
- [ ] `P3` (Module 2): Cổng Người Dân - Danh Bạ Doanh Nghiệp Cứu Hộ & Modal Đánh Giá.
  - *Tiêu chuẩn nghiệm thu*: Lên danh sách doanh nghiệp cứu hộ theo bán kính km, bộ lọc, modal xem chi tiết & gửi đánh giá sao.
- [ ] `P4` (Module 3): Cổng Trực Ban - Xác Thực Gatekeeper & 4 Quả Cầu Vũ Trụ Phân Quyền Lực Lượng.
  - *Tiêu chuẩn nghiệm thu*: Lên giao diện đăng nhập an ninh trực ban, chọn lực lượng (Công an, CSGT, PCCC, Y tế), kiểm tra lockout.
- [ ] `P5` (Module 4): Cổng Trực Ban - Bàn Tác Chiến C4ISR & Bản Đồ Số MapLibre GL.
  - *Tiêu chuẩn nghiệm thu*: Lên giao diện 3 phân khu tác chiến (>=1280px), bản đồ số MapLibre hiển thị trạm công an và geofence.
- [ ] `P6` (Module 5): Cổng Trực Ban - Hàng Đợi Sự Cố Realtime, Trực Thoại & Xuất Tài Liệu Nghị Định 30.
  - *Tiêu chuẩn nghiệm thu*: Hiển thị danh sách sự cố realtime, xử lý cuộc gọi thoại, xuất file Word/Excel chuẩn Nghị định 30.
- [ ] `P7`: Tích hợp toàn diện & Build Production bundle kết nối server Node.js.
