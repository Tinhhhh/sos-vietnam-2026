# Chuẩn Hóa Khẩu Lệnh Giọng Đọc Nữ SOS Theo Quy Trình Điều Phối Plan

## Metadata

- Date: `2026-10-12`
- Status: `completed`
- Plan: `docs/plans/2026-10-12-fix-sos-prompt-audio/2026-10-12-fix-sos-prompt-audio-plan.md`
- Evidence: `docs/plans/2026-10-12-fix-sos-prompt-audio/2026-10-12-fix-sos-prompt-audio-evidence.md`
- Benchmark: `docs/plans/2026-10-12-fix-sos-prompt-audio/2026-10-12-fix-sos-prompt-audio-benchmark.md`
- Actual status: `docs/plans/2026-10-12-fix-sos-prompt-audio/2026-10-12-fix-sos-prompt-audio-actual-status.md`

## Goal

Chuẩn hóa toàn bộ nội dung khẩu lệnh giọng đọc AI nữ (VieNeu-TTS Studio 48kHz) khi người dân bấm nút SOS, bám sát 100% logic thực tế của luồng người dùng:
1. Thông báo hệ thống khẩn cấp đã kích hoạt.
2. Trấn an và hướng dẫn người dân chọn đơn vị/lực lượng muốn báo trên màn hình (Công an, CSGT, PCCC & CNCH, Dịch vụ Cứu hộ, Cấp cứu 115).
3. Thông báo rõ ràng: sau khi chọn xong, thông tin sẽ được chuyển tiếp ngay đến trực ban của đơn vị để điều phối ứng cứu kịp thời.

## Rules

- Complete P0 actual status before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence as work completes.
- Record benchmarkable counts or measurements when they are taken.
- Run Anvien detect-changes before every implementation-slice commit.
- For UI behavior changes, open the real user-visible runtime first and capture Playwright evidence.
- Playwright scripts must be reusable under `playwright/`, official QA evidence in `Reports/qa/playwright/...` as both `.json` and `.md`.

## Problem

Khẩu lệnh âm thanh hiện tại đọc: *"Hệ thống khẩn cấp ét-ô-ét đã ghi nhận. Xin giữ bình tĩnh, chọn ngay loại sự cố trên màn hình. Tọa độ của bạn đang được chuyển trực tiếp tới trực ban và lực lượng cứu hộ gần nhất."*
Điểm sai lệch thực tế:
- Khi bấm SOS, tọa độ và phiếu cứu nạn chưa chuyển tới trực ban ngay.
- Người dân cần thao tác chọn đơn vị cứu nạn muốn báo và xác nhận thông tin.
- Chỉ sau bước này, hệ thống mới chuyển tiếp thông tin tới trực ban của đơn vị tương ứng để trực ban điều phối lực lượng.

## Scope

- In scope:
  - `scripts/generate_sos_prompt_voices.py`: Cập nhật văn bản khẩu lệnh mới, sinh lại toàn bộ file âm thanh studio 48kHz (Thùy Dung, Mai Anh, Trúc Ly, Ngọc Huyền) kèm 420ms padding.
  - `assets/sounds/`: Xuất các file `.mp3` và `.wav` mới với chất lượng cao nhất.
  - `js/app.js`: Cập nhật cache-buster mới `?v=20261012_agency_dispatch_flow` và đồng bộ nội dung văn bản trong hàm `fallbackSpeechSynthesis()`.
  - `playwright/verify-sos-prompt-audio-flow.mjs`: Bộ kiểm thử tự động xác minh nội dung audio, thời lượng, và hành vi kích hoạt khi người dân bấm nút SOS.
  - `Reports/qa/playwright/2026-10-12-fix-sos-prompt-audio/`: Báo cáo QA kèm bằng chứng.
- Out of scope:
  - Thay đổi giao thức WebRTC hay bản đồ điều phối.

## Acceptance Criteria

1. Khẩu lệnh mới phản ánh chính xác 100% quy trình nghiệp vụ: *"Hệ thống khẩn cấp ét-ô-ét đã kích hoạt. Xin giữ bình tĩnh, vui lòng chọn đơn vị bạn muốn báo trên màn hình. Sau đó, thông tin sẽ được chuyển tiếp ngay đến trực ban của đơn vị để điều phối lực lượng cứu hộ."*
2. 4 giọng đọc nữ VieNeu-TTS (Thùy Dung - Nữ Nam Bộ truyền cảm mặc định, Mai Anh, Trúc Ly, Ngọc Huyền) được tạo đầy đủ định dạng MP3 và WAV 48kHz, có 420ms đệm digital silence chống nuốt âm.
3. Trình duyệt client tự động tải file âm thanh mới qua cache-buster mà không bị dính cache cũ.
4. Fallback Web Speech API có cùng nội dung văn bản chuẩn hóa.
5. Kiểm thử tự động Playwright xác nhận âm thanh phát mượt mà khi bấm nút SOS trên giao diện người dân.

## Checklist

- [x] P0: Complete actual status baseline.
- [x] P1: Update prompt script & synthesize 48kHz VieNeu-TTS studio female voices (`scripts/generate_sos_prompt_voices.py` & `assets/sounds/`).
- [x] P2: Update audio player source, cache-buster & fallback speech in `js/app.js`.
- [x] P3: Playwright Automated Verification & Evidence Capture (`playwright/` & `Reports/qa/playwright/`).
- [x] P4: Anvien detect-changes & Commit.
