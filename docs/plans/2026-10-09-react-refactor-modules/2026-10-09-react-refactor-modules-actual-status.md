# Tái Cấu Trúc Frontend sos-vietnam-2026 Sang ReactJS Actual Status

Title: Tái Cấu Trúc Frontend sos-vietnam-2026 Sang ReactJS
Date: 2026-10-09
Status: P0 Complete
Companion plan: `docs/plans/2026-10-09-react-refactor-modules/2026-10-09-react-refactor-modules-plan.md`
Companion evidence: `docs/plans/2026-10-09-react-refactor-modules/2026-10-09-react-refactor-modules-evidence.md`
Companion benchmark: `docs/plans/2026-10-09-react-refactor-modules/2026-10-09-react-refactor-modules-benchmark.md`

## Purpose

Tài liệu ghi nhận hiện trạng chi tiết của mã nguồn Frontend hiện tại trước khi thực hiện chuyển đổi sang ReactJS.

## Scope

Target scope:
- Toàn bộ giao diện người dùng: Cổng Người Dân (`public/index.html`) và Cổng Trực Ban (`public/dispatcher.html`).
- Toàn bộ logic frontend trong `public/js/` và stylesheet trong `public/css/`.

Out of scope:
- Logic API server và dữ liệu nền tảng trong `server.js` và `services/` (giữ nguyên để cung cấp API cho React).

## Current Status Matrix

| Module / Tệp nguồn | Loại tệp | Kích thước | Trạng thái hiện tại | Kế hoạch chuyển đổi sang React |
|:---|:---:|:---:|:---|:---|
| `public/index.html` | HTML | 123 KB | Monolith HTML chứa Cổng Người Dân | Chia thành `CitizenLayout`, `citizen-sos`, `rescue-directory` |
| `public/dispatcher.html` | HTML | 287 KB | Monolith HTML chứa Cổng Trực Ban | Chia thành `TacticalLayout`, `auth`, `tactical-map`, `dispatcher-feed` |
| `public/js/app.js` | Vanilla JS | 205 KB | Logic tiếp nhận sự cố, cứu hộ | Tách thành React hooks & feature services |
| `public/js/dispatcher.js` | Vanilla JS | 647 KB | Logic trực ban, audio, xuất file | Tách thành các feature components & custom hooks |
| `public/js/map-controller.js` | Vanilla JS | 63 KB | Điều khiển MapLibre GL | Chuyển thành `tactical-map` component + hook MapLibre |
| `public/css/style.css` | CSS | 215 KB | CSS giao diện chính | Chuyển các token CSS variables vào `index.css` và CSS Modules |
| `public/css/tactical-responsive.css`| CSS | 105 KB | Responsive 3 phân khu tác chiến | Chuyển vào layout component của Dispatcher |
