# Bộ Giọng Nữ 4 Vùng Miền & Điều Hướng Theo 34 Tỉnh Thành Plan

## Metadata

- Date: `2026-10-12`
- Status: `in_progress`
- Plan: `docs/plans/2026-10-12-four-regional-voices-and-34-provinces-routing/2026-10-12-four-regional-voices-and-34-provinces-routing-plan.md`
- Evidence: `docs/plans/2026-10-12-four-regional-voices-and-34-provinces-routing/2026-10-12-four-regional-voices-and-34-provinces-routing-evidence.md`
- Benchmark: `docs/plans/2026-10-12-four-regional-voices-and-34-provinces-routing/2026-10-12-four-regional-voices-and-34-provinces-routing-benchmark.md`
- Actual status: `docs/plans/2026-10-12-four-regional-voices-and-34-provinces-routing/2026-10-12-four-regional-voices-and-34-provinces-routing-actual-status.md`

## Goal

Thiết lập trọn bộ hệ thống giọng đọc nữ 4 vùng miền cho SOS Việt Nam:
1. **Tây Nam Bộ (Đồng bằng sông Cửu Long / Cần Thơ)**: Giọng Mỹ Duyên / Kim Thanh — ngọt ngào, chất phác, mộc mạc, gần gũi.
2. **Miền Nam (Đông Nam Bộ / Sài Gòn)**: Giọng Thùy Dung — hiện đại, dứt khoát, thanh thoát.
3. **Miền Trung (Đà Nẵng, Huế, Quảng Nam, Quảng Trị...)**: Giọng Ngọc Trân — nồng ấm, chân phương, chuẩn ngữ điệu Trung Bộ.
4. **Miền Bắc (Hà Nội và các tỉnh phía Bắc)**: Giọng Mai Anh — chuẩn phát thanh viên truyền hình, rõ ràng, dõng dạc.

Tất cả 4 giọng đọc được sinh từ VieNeu-TTS Studio 48kHz, tốc độ 1.2x (nhanh thêm 0.2x), đệm 420ms silence.
Hệ thống tự động phân loại 34 tỉnh/thành phố hoặc tọa độ GPS thành 4 vùng miền để tự động phát giọng đọc bản địa thân thương cho người dân khi bấm nút SOS.

## Rules

- Complete P0 actual status before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence as work completes.
- Record benchmarkable counts or measurements when they are taken.
- Run Anvien detect-changes before every implementation-slice commit.
- For UI behavior changes, open the real user-visible runtime first and capture Playwright mobile viewport evidence.
- Playwright scripts must be reusable under `playwright/`, official QA evidence in `Reports/qa/playwright/...` as both `.json` and `.md`.

## Problem

Việt Nam có bản sắc ngữ âm phong phú và việc gộp chung Tây Nam Bộ vào Miền Nam làm mất đi sắc thái thân thương, ấm áp của người dân miền Tây (đặc biệt tại Cần Thơ và 13 tỉnh ĐBSCL). Người dân khi gặp nạn ở Cần Thơ cần được an ủi và hướng dẫn bằng giọng miền Tây quen thuộc. Tương tự, người dân ở Đà Nẵng/Huế cần giọng miền Trung, ở Sài Gòn cần giọng Nam Bộ, ở Hà Nội cần giọng Bắc Bộ.

## Scope

- In scope:
  - `scripts/generate_sos_prompt_voices.py`: Thêm cấu hình sinh 4 giọng đại diện 4 miền (`tay_nam_bo`, `mien_nam`, `mien_trung`, `mien_bac`) ở tốc độ 1.2x với VieNeu-TTS.
  - `assets/sounds/`: Xuất các file `sos_prompt_tay_nam_bo.*`, `sos_prompt_mien_nam.*`, `sos_prompt_mien_trung.*`, `sos_prompt_mien_bac.*`.
  - `js/app.js`: Xây dựng bảng ánh xạ 34 tỉnh/thành sang 4 vùng miền và hàm tự động phát hiện `detectVoiceRegion(province, lat, lng)` trong `speakSosPrompt()`.
  - `playwright/verify-four-regional-voices.mjs`: Bộ kiểm thử Playwright giả lập vị trí tại Cần Thơ (Tây Nam Bộ), TP.HCM (Miền Nam), Đà Nẵng (Miền Trung), Hà Nội (Miền Bắc) và xác nhận giọng đọc tương ứng được kích hoạt tự động.
  - `Reports/qa/playwright/2026-10-12-four-regional-voices-and-34-provinces-routing/`: Báo cáo QA kèm bằng chứng.
- Out of scope:
  - Thay đổi bản đồ PostGIS hay cấu trúc cơ sở dữ liệu.

## Acceptance Criteria

1. 4 file âm thanh 4 miền đại diện tồn tại đầy đủ ở `assets/sounds/` (`sos_prompt_tay_nam_bo.*`, `sos_prompt_mien_nam.*`, `sos_prompt_mien_trung.*`, `sos_prompt_mien_bac.*`) đạt chuẩn 48kHz, tốc độ 1.2x.
2. Tại Cần Thơ / ĐBSCL, hệ thống tự động phát giọng Tây Nam Bộ.
3. Tại TP.HCM / Đông Nam Bộ, hệ thống tự động phát giọng Miền Nam.
4. Tại Đà Nẵng / Huế / Miền Trung, hệ thống tự động phát giọng Miền Trung.
5. Tại Hà Nội / Miền Bắc, hệ thống tự động phát giọng Miền Bắc.
6. Toàn bộ 34 tỉnh thành trong hệ thống được phân vùng chính xác 100%.

## Checklist

- [x] P0: Complete actual status baseline.
- [x] P1: Update generator script & synthesize 4 regional voices (`scripts/generate_sos_prompt_voices.py` & `assets/sounds/`).
- [x] P2: Implement 34 provinces & GPS regional auto-routing in `js/app.js`.
- [x] P3: Playwright Automated Verification across 4 regions (`playwright/` & `Reports/qa/playwright/`).
- [x] P4: Anvien detect-changes & Commit.
