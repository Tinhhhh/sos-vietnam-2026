# QA Report: OSINT Administrative Record, Intake Print/PDF & 2-Way WebRTC Voice/Video Calls

- **Timestamp**: `2026-10-13T04:12:43.355Z`
- **Suite**: `verify-osint-print-and-webrtc-calls`
- **Passed**: `8` / `8`
- **Failed**: `0`
- **Total Duration**: `10449 ms`

## Test Results

| # | Test Case | Status | Details |
|---|-----------|--------|---------|
| 1 | [Gọi Thường: Trực ban -> Công dân] Kết nối WebRTC 2 chiều thành công và gắn luồng âm thanh hai bên | **PASS** | `{"citizen":{"iceState":"connected","hasRemoteStream":true,"statusText":""},"dispatcher":{"iceState":"connected","hasRemoteStream":true,"statusText":""},"setupMs":576}` |
| 2 | [Gọi Thường: Công dân -> Trực ban] Công dân gọi đến Trực ban đổ chuông, bắt máy và kết nối WebRTC 2 chiều thành công | **PASS** | `{"citizen":{"iceState":"connected","hasRemoteStream":true},"dispatcher":{"iceState":"connected","hasRemoteStream":true},"setupMs":341}` |
| 3 | [Gọi Video: Trực ban -> Công dân] Kết nối WebRTC Video 2 chiều thành công, truyền hình ảnh camera hai bên | **PASS** | `{"citizen":{"iceState":"connected","remoteTracks":2,"localVideoTracks":1},"dispatcher":{"iceState":"connected","remoteVideoTracks":1},"setupMs":191}` |
| 4 | [Gọi Video: Công dân -> Trực ban] Công dân gọi Video đến Trực ban, bắt máy và truyền luồng hình ảnh 2 chiều thành công | **PASS** | `{"citizen":{"iceState":"connected","remoteTracks":2},"dispatcher":{"iceState":"connected","remoteVideoTracks":1},"setupMs":445}` |
| 5 | [Phiếu Tiếp Nhận Tin: In / Xuất PDF] Chế độ @media print hiển thị đầy đủ #reportSheetContainer trên khổ A4 và ẩn hoàn toàn #territoryStatsModal (không bị 3 trang trắng) | **PASS** | `{"modalDisplay":"block","modalVisibility":"visible","sheetVisibility":"visible","sheetWidth":820,"sheetHeight":1098,"territoryStatsDisplay":"none"}` |
| 6 | [Phiếu Tiếp Nhận Tin: Xuất Word (.docx)] Tải xuống thành công file Word NĐ30/2020/NĐ-CP từ /api/export/docx | **PASS** | `{"filename":"Phieu_TiepNhan_UPSC_SOS-MV660M35-947.docx","sizeBytes":38861,"exportMs":530}` |
| 7 | [Báo khống & OSINT Forensic Modal] Hộp thoại #osintForensicModal không bị cắt tiêu đề trên đỉnh và hiển thị đúng mã hồ sơ thực | **PASS** | `{"dossierIdText":"SOS-MV660M35-947","boxTop":20,"boxBottom":888,"boxHeight":868,"viewportHeight":900}` |
| 8 | [Lập biên bản vi phạm hành chính (Word)] Nút #btnDraftAdministrativeRecord xuất thành công file .docx chuẩn Mẫu 08/BB-XM (NĐ30/2020/NĐ-CP) | **PASS** | `{"filename":"DuThao_BienBan_XacMinh_SOS-MV660M35-947.docx","sizeBytes":38620,"exportMs":381}` |

## Empirical Benchmarks

- **Voice Call (Dispatcher -> Citizen) Setup**: `576 ms`
- **Voice Call (Citizen -> Dispatcher) Setup**: `341 ms`
- **Video Call (Dispatcher -> Citizen) Setup**: `191 ms`
- **Video Call (Citizen -> Dispatcher) Setup**: `445 ms`
- **Intake Report Word (.docx) Export**: `530 ms` (`38861 bytes`)
- **OSINT Administrative Record (.docx) Export**: `381 ms` (`38620 bytes`)