# Actual Status - Chuẩn Hóa Khẩu Lệnh Giọng Đọc Nữ SOS Theo Quy Trình Điều Phối

## Metadata

- Date: `2026-10-12`
- Plan: `docs/plans/2026-10-12-fix-sos-prompt-audio/2026-10-12-fix-sos-prompt-audio-plan.md`

## Baseline Inspection Findings

1. **Current Prompt Wording Inaccuracy**:
   - Vị trí: `scripts/generate_sos_prompt_voices.py` dòng 23 và `js/app.js` dòng 4456.
   - Hiện trạng:
     *"Hệ thống khẩn cấp ét-ô-ét đã ghi nhận. Xin giữ bình tĩnh, chọn ngay loại sự cố trên màn hình. Tọa độ của bạn đang được chuyển trực tiếp tới trực ban và lực lượng cứu hộ gần nhất."*
   - Vấn đề nghiệp vụ người dùng chỉ rõ:
     Khi người dân bấm nút SOS, họ chưa gửi tọa độ ngay lập tức mà hệ thống hiển thị modal để người dân chọn lực lượng/đơn vị muốn báo (Công an, Cứu thương 115, PCCC & CNCH 114, CSGT, Cứu hộ giao thông) và chi tiết sự cố.
     Chỉ SAU KHI chọn xong và bấm xác nhận thì phiếu SOS mới được chuyển tiếp đến trực ban của đơn vị đã chọn để điều phối lực lượng.
   - Trạng thái: **RESOLVED & VERIFIED**. Đã cập nhật khẩu lệnh chuẩn xác theo quy trình:
     *"Hệ thống khẩn cấp ét-ô-ét đã kích hoạt. Xin giữ bình tĩnh, vui lòng chọn đơn vị bạn muốn báo trên màn hình. Sau đó, thông tin sẽ được chuyển tiếp ngay đến trực ban của đơn vị để điều phối lực lượng cứu hộ."*

2. **Audio Assets & Cache-Buster**:
   - File âm thanh: `assets/sounds/sos_prompt_{thuy_dung,mai_anh,truc_ly,ngoc_huyen}.{mp3,wav}` đã được xuất mới chuẩn 48kHz kèm 420ms padding.
   - Cache-buster: Đã cập nhật `?v=20261012_agency_dispatch_flow` trong `js/app.js`.
   - Trạng thái: **RESOLVED & VERIFIED**. Đã kiểm chứng tự động qua Playwright 5/5 PASS.
