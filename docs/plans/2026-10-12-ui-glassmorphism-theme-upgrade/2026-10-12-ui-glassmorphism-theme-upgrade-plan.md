# Nâng Cấp Giao Diện Themes & Hệ Thống UI Glassmorphism Chuẩn Figma (Stitch MCP Integration) Plan

## Metadata

- Date: `2026-10-12`
- Status: `in_progress`
- Plan: `docs/plans/2026-10-12-ui-glassmorphism-theme-upgrade/2026-10-12-ui-glassmorphism-theme-upgrade-plan.md`
- Evidence: `docs/plans/2026-10-12-ui-glassmorphism-theme-upgrade/2026-10-12-ui-glassmorphism-theme-upgrade-evidence.md`
- Benchmark: `docs/plans/2026-10-12-ui-glassmorphism-theme-upgrade/2026-10-12-ui-glassmorphism-theme-upgrade-benchmark.md`
- Actual status: `docs/plans/2026-10-12-ui-glassmorphism-theme-upgrade/2026-10-12-ui-glassmorphism-theme-upgrade-actual-status.md`

## Goal

Rà soát toàn diện và nâng cấp hệ thống giao diện Themes hiện tại của ứng dụng SOS Việt Nam 2026 (cả màn hình Người dân `index.html` và Trung tâm Điều phối `dispatcher.html`), kết hợp công nghệ Stitch MCP và tiêu chuẩn thiết kế Figma Glassmorphism cao cấp:
1. **Tạo lập Design System Stitch chuẩn hóa**: Đồng bộ `DESIGN.md` và dự án Stitch `projects/2882282938885563672` đại diện cho bộ nhận diện SOS Việt Nam 2026.
2. **Nâng cấp toàn diện 5 Themes lực lượng tác chiến**:
   - `theme-police` (Công An Nhân Dân - 113): Sắc xanh Baltic & Neon Ice (#00669A, #00ECF3) huyền bí, ánh quang viền xanh thấu kính.
   - `theme-csgt` (Cảnh Sát Giao Thông): Bổ sung hoàn chỉnh bộ CSS theme với sắc vàng hổ phách & đất cát hoàng gia (#DFB077, #F59E0B), viền kính vàng ấm.
   - `theme-rescue` (PCCC & CNCH - 114): Sắc đỏ thẫm Mahogany & Ngọn lửa cứu hộ (#AC0015, #FF3B30), viền kính lửa nhiệt thành, độ tương phản cao.
   - `theme-hospital` (Cấp Cứu Y Tế - 115): Sắc xanh ngọc bảo & Aqua Mint (#10B981, #00ECF3), nhịp tim quang phổ cứu sinh.
   - `theme-admin` (Chỉ Huy Tổng Hợp Quốc Gia): Tím hoàng gia & Neon Cyan (#8B5CF6, #00ECF3), hào quang tác chiến vũ trụ.
3. **Chuẩn hóa hệ thống hiệu ứng Liquid Glassmorphism**:
   - `backdrop-filter: blur(28px) saturate(190%)` siêu mượt, chống rung giật (GPU accelerated via `will-change: transform`).
   - Viền tán xạ ánh sáng (specular rim lighting `inset 0 1.5px 1px rgba(255,255,255,0.3)`), bóng đổ tỏa sắc theo màu theme tương ứng.
   - Khắc phục 100% lỗi hiển thị: không tràn lố viền, chữ không bị gãy/mất nét, căn chỉnh mượt mà trên mọi kích thước màn hình (Mobile 390px, Tablet 768px, Desktop 1440px).

## Rules

- Complete P0 actual status before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence as work completes.
- Record benchmarkable counts or measurements when they are taken.
- Run Anvien detect-changes before every implementation-slice commit when implementation work was performed.
- For public runtime or UI-facing changes, validate the real user-visible runtime with browser or Playwright evidence.
- Full output enforcement: tuyệt đối không placeholder, không `...`, không cắt ngắn code CSS/HTML/JS.

## Problem

1. `css/style.css` hiện tại mới chỉ định nghĩa sơ sài `body.theme-police`, `body.theme-hospital`, `body.theme-rescue`, `body.theme-admin` ở các thuộc tính căn bản (`--theme-primary`, badge background).
2. Lực lượng `theme-csgt` hoàn toàn chưa có khối CSS chuyên biệt trong `css/style.css`, khiến khi cán bộ CSGT đăng nhập thì giao diện thiếu ánh sáng viền và màu chủ đạo riêng biệt.
3. Lực lượng PCCC `theme-rescue` đang dùng màu cam generic `#ff9100` thay vì màu Đỏ Mahogany `#AC0015` chính quy của lực lượng Cảnh sát PCCC & CNCH.
4. Lớp `.liquid-glass` hiện tại dùng `blur(16px)` cố định, thiếu hiệu ứng khúc xạ chiều sâu đa lớp, thiếu bóng đổ chuyển sắc theo từng đơn vị và chưa có bộ chuyển động xúc giác (tactile click feedback) chuẩn Figma.
5. Chưa có bộ chuyển theme linh hoạt trên giao diện để cán bộ và ban giám khảo có thể xem thử trực quan các theme lực lượng.

## Scope

- In scope:
  - `DESIGN.md`: Tài liệu thiết kế chuẩn hệ thống SOS Việt Nam 2026 cho Stitch MCP.
  - `css/style.css`:
    * Hệ thống tokens CSS mở rộng cho cả 5 themes (`theme-police`, `theme-csgt`, `theme-rescue`, `theme-hospital`, `theme-admin`).
    * Nâng cấp hệ thống `.liquid-glass` đa lớp với specular rim light, chromatic ambient glow, card styling, button styling, modal styling.
  - `css/tactical-responsive.css`: Đảm bảo độ mượt, phản hồi chạm, không giật lag trên mobile/tablet.
  - `dispatcher.html` & `index.html`: Cải thiện cấu trúc hiển thị các thẻ kính, tích hợp bộ chọn theme tác chiến trực quan.
  - `js/dispatcher.js`: Cập nhật logic áp dụng theme mượt mà, đồng bộ với bộ chuyển theme.
  - `playwright/verify-ui-glassmorphism-themes.cjs`: Bộ kiểm thử tự động đo kiểm tra visual viewport, screenshot cả 5 themes trên desktop & mobile.
- Out of scope:
  - Thay đổi logic nghiệp vụ tiếp nhận ca SOS hoặc điều phối xe cứu hộ.

## Requirements

1. 5 themes lực lượng tác chiến hiển thị sắc nét, đồng bộ màu sắc với bộ nhận diện 6 màu quốc gia.
2. Hiệu ứng Liquid Glassmorphism đạt tiêu chuẩn Apple / Figma: blur sâu, ánh sáng tán xạ viền tinh tế, không làm mờ nội dung văn bản.
3. Chống tràn khung (zero overflow), chống lỗi hiển thị trên mọi độ phân giải.
4. Chạy kiểm thử Playwright tự động và xuất báo cáo QA song song `.json` và `.md`.

## Acceptance Criteria

1. Cả 5 themes (`police`, `csgt`, `rescue`, `hospital`, `admin`) có bộ CSS hoàn chỉnh với màu chủ đạo, viền kính và hào quang riêng biệt.
2. Lớp `.liquid-glass` áp dụng mượt mà trên header, sidebar, thẻ sự cố, modal, drawer và bảng thống kê mà không gây sụt giảm khung hình (60fps).
3. Đầy đủ bộ kiểm thử Playwright kiểm tra trực quan trên Desktop (1440x900) và Mobile (390x844), 100% assertions passed.
4. Chạy `anvien detect-changes` và commit sạch sẽ.

## Checklist

- [x] P0: Complete actual status baseline and Stitch MCP project synchronization.
  - Goal: Khảo sát hiện trạng CSS và cấu hình Stitch project.
  - Work Steps: Đọc chi tiết các selector theme trong `css/style.css`, lập bảng phân tích actual-status, tạo `DESIGN.md` chuẩn hóa.
  - Implementation Gate: `actual-status.md` hoàn thành trước khi sửa code.
  - Acceptance: Có đầy đủ thông tin phân loại cho 5 themes. Đã đồng bộ với Stitch project `projects/2882282938885563672`.

- [x] P1: Nâng Cấp Hệ Thống Tokens & CSS Glassmorphism 5 Themes Trong `css/style.css`.
  - Goal: Hoàn thiện CSS cho `theme-police`, `theme-csgt`, `theme-rescue`, `theme-hospital`, `theme-admin`.
  - Work Steps:
    + Định nghĩa biến màu sắc và hào quang tán xạ cho từng theme.
    + Nâng cấp `.liquid-glass` với multi-tier rim lighting và chromatic shadow.
    + Bổ sung hiệu ứng tactile click và hover mượt mà cho các thành phần UI.
  - Implementation Gate: P0 hoàn tất.
  - Acceptance: Cả 5 themes hiển thị đúng màu chủ đạo và ánh sáng kính. Đã hoàn thành 100%.

- [x] P2: Đảm Bảo Giữ Nguyên 100% Bố Cục Cũ (Layout Preservation) Không Thêm Bớt Thẻ HTML.
  - Goal: Tuân thủ nghiêm ngặt chỉ đạo của người dùng: giữ nguyên 100% bố cục và DOM cũ của `dispatcher.html` và `index.html`, chỉ nâng cấp qua CSS themes và hiệu ứng kính mượt mà.
  - Work Steps:
    + Không chèn thêm các widget hay nút bấm mới gây xáo trộn ứng dụng.
    + Duy trì tính tương thích ngược tuyệt đối với các luồng nghiệp vụ tiếp nhận/điều phối.
  - Implementation Gate: P1 hoàn tất.
  - Acceptance: Không có phần tử nào bị tràn lố viền hoặc lệch layout. Đã hoàn thành 100%.

- [x] P3: Kiểm Thử Tự Động Playwright & Chụp Ảnh Minh Chứng (Mobile & Desktop).
  - Goal: Xác thực chất lượng hiển thị của 5 themes qua Playwright.
  - Work Steps:
    + Viết kịch bản `playwright/verify-ui-glassmorphism-themes.cjs`.
    + Chạy kiểm thử trên Desktop (1440px) và Mobile (390px).
    + Lưu ảnh chụp màn hình vào `Reports/qa/playwright/screenshots/`.
  - Implementation Gate: P2 hoàn tất.
  - Acceptance: 13/13 assertions đạt (100% PASS). Đã hoàn thành.

- [x] P4: Anvien detect-changes & Commit Slice Hoàn Thiện.
  - Goal: Đo kiểm tác động và commit mã nguồn theo đúng quy chuẩn AGENTS.md.
  - Acceptance: Anvien risk_level = low, 0 broken contracts, git commit thành công.
